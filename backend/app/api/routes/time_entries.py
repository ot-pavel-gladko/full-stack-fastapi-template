import uuid
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud import create_time_entry, get_time_entry
from app.models import (
    Message,
    Project,
    TimeEntriesPublic,
    TimeEntry,
    TimeEntryCreate,
    TimeEntryPublic,
)

router = APIRouter(prefix="/time-entries", tags=["time-entries"])

_MIN_HOURS = Decimal("0.25")
_MAX_HOURS = Decimal("24.00")
_STEP = Decimal("0.25")


def _validate_hours(hours: Decimal) -> None:
    if hours < _MIN_HOURS or hours > _MAX_HOURS:
        raise HTTPException(
            status_code=422,
            detail=f"hours must be between {_MIN_HOURS} and {_MAX_HOURS}",
        )
    # Validate step: hours must be a multiple of 0.25
    # Quantize to avoid floating point issues
    quantized = hours.quantize(Decimal("0.01"))
    remainder = quantized % _STEP
    if remainder != Decimal("0.00"):
        raise HTTPException(
            status_code=422,
            detail="hours must be a multiple of 0.25",
        )


def _get_project_for_user(
    session: Any, project_id: uuid.UUID, owner_id: uuid.UUID
) -> Project:
    project = session.get(Project, project_id)
    if not project or project.owner_id != owner_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=TimeEntriesPublic)
def read_time_entries(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve time entries for the current user.
    """
    count_statement = (
        select(func.count())
        .select_from(TimeEntry)
        .where(TimeEntry.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(TimeEntry)
        .where(TimeEntry.owner_id == current_user.id)
        .order_by(col(TimeEntry.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    entries = session.exec(statement).all()

    entries_public = [TimeEntryPublic.model_validate(e) for e in entries]
    return TimeEntriesPublic(data=entries_public, count=count)


@router.post("/", response_model=TimeEntryPublic)
def create_time_entry_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    entry_in: TimeEntryCreate,
) -> Any:
    """
    Create a new time entry.
    """
    _validate_hours(entry_in.hours)
    _get_project_for_user(session, entry_in.project_id, current_user.id)
    entry = create_time_entry(
        session=session, entry_in=entry_in, owner_id=current_user.id
    )
    return entry


@router.get("/{id}", response_model=TimeEntryPublic)
def read_time_entry(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """
    Get a time entry by ID (owner-scoped).
    """
    entry = get_time_entry(
        session=session, entry_id=id, owner_id=current_user.id
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return entry


@router.delete("/{id}", response_model=Message)
def delete_time_entry(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Message:
    """
    Delete a time entry.
    """
    entry = get_time_entry(
        session=session, entry_id=id, owner_id=current_user.id
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    session.delete(entry)
    session.commit()
    return Message(message="Time entry deleted successfully")
