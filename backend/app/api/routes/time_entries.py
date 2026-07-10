import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Project,
    TimeEntry,
    TimeEntryCreate,
    TimeEntryPublic,
    TimeEntriesPublic,
    TimeEntryUpdate,
)

router = APIRouter(prefix="/time-entries", tags=["time-entries"])


def _get_owned_project_or_404(
    *, session: SessionDep, current_user: CurrentUser, project_id: uuid.UUID
) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and (project.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=TimeEntriesPublic)
def read_time_entries(
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve time entries.
    """

    if current_user.is_superuser:
        base_statement = select(TimeEntry)
        count_statement = select(func.count()).select_from(TimeEntry)
    else:
        base_statement = select(TimeEntry).where(
            TimeEntry.owner_id == current_user.id
        )
        count_statement = (
            select(func.count())
            .select_from(TimeEntry)
            .where(TimeEntry.owner_id == current_user.id)
        )

    if project_id is not None:
        base_statement = base_statement.where(TimeEntry.project_id == project_id)
        count_statement = count_statement.where(TimeEntry.project_id == project_id)

    count = session.exec(count_statement).one()
    statement = (
        base_statement.order_by(col(TimeEntry.entry_date).desc())
        .offset(skip)
        .limit(limit)
    )
    time_entries = session.exec(statement).all()

    time_entries_public = [
        TimeEntryPublic.model_validate(time_entry) for time_entry in time_entries
    ]
    return TimeEntriesPublic(data=time_entries_public, count=count)


@router.get("/{id}", response_model=TimeEntryPublic)
def read_time_entry(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get time entry by ID.
    """
    time_entry = session.get(TimeEntry, id)
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    if not current_user.is_superuser and (time_entry.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Time entry not found")
    return time_entry


@router.post("/", response_model=TimeEntryPublic)
def create_time_entry(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    time_entry_in: TimeEntryCreate,
) -> Any:
    """
    Create new time entry.
    """
    _get_owned_project_or_404(
        session=session, current_user=current_user, project_id=time_entry_in.project_id
    )
    time_entry = TimeEntry.model_validate(
        time_entry_in, update={"owner_id": current_user.id}
    )
    session.add(time_entry)
    session.commit()
    session.refresh(time_entry)
    return time_entry


@router.put("/{id}", response_model=TimeEntryPublic)
def update_time_entry(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    time_entry_in: TimeEntryUpdate,
) -> Any:
    """
    Update a time entry.
    """
    time_entry = session.get(TimeEntry, id)
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    if not current_user.is_superuser and (time_entry.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Time entry not found")

    update_dict = time_entry_in.model_dump(exclude_unset=True)
    if "project_id" in update_dict:
        _get_owned_project_or_404(
            session=session,
            current_user=current_user,
            project_id=update_dict["project_id"],
        )

    time_entry.sqlmodel_update(update_dict)
    session.add(time_entry)
    session.commit()
    session.refresh(time_entry)
    return time_entry


@router.delete("/{id}")
def delete_time_entry(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a time entry.
    """
    time_entry = session.get(TimeEntry, id)
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    if not current_user.is_superuser and (time_entry.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Time entry not found")
    session.delete(time_entry)
    session.commit()
    return Message(message="Time entry deleted successfully")
