import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Project,
    TimeEntriesPublic,
    TimeEntry,
    TimeEntryCreate,
    TimeEntryPublic,
    TimeEntryUpdate,
)

router = APIRouter(prefix="/time-entries", tags=["time-entries"])


@router.get("/", response_model=TimeEntriesPublic)
def read_time_entries(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve time entries.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(TimeEntry)
        count = session.exec(count_statement).one()
        statement = (
            select(TimeEntry)
            .order_by(col(TimeEntry.entry_date).desc())
            .offset(skip)
            .limit(limit)
        )
        time_entries = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(TimeEntry)
            .where(TimeEntry.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(TimeEntry)
            .where(TimeEntry.owner_id == current_user.id)
            .order_by(col(TimeEntry.entry_date).desc())
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
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return time_entry


@router.post("/", response_model=TimeEntryPublic)
def create_time_entry(
    *, session: SessionDep, current_user: CurrentUser, time_entry_in: TimeEntryCreate
) -> Any:
    """
    Create new time entry.
    """
    project = session.get(Project, time_entry_in.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and (project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

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
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_dict = time_entry_in.model_dump(exclude_unset=True)
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
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(time_entry)
    session.commit()
    return Message(message="Time entry deleted successfully")
