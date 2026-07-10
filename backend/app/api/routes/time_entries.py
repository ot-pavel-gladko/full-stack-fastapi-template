import calendar
import uuid
from datetime import date, timedelta
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    HoursSummary,
    Message,
    Project,
    ProjectHoursSummary,
    TimeEntry,
    TimeEntryCreate,
    TimeEntryPublic,
    TimeEntriesPublic,
    TimeEntryUpdate,
)

router = APIRouter(prefix="/time-entries", tags=["time-entries"])

Period = Literal["week", "month", "quarter"]


def _get_owned_project_or_404(
    *, session: SessionDep, current_user: CurrentUser, project_id: uuid.UUID
) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and (project.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _get_period_range(period: Period, today: date) -> tuple[date, date]:
    """
    Return the inclusive [start, end] date window for a given period,
    anchored to `today`.
    """
    if period == "week":
        # ISO week: Monday through Sunday.
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
        return start, end

    if period == "quarter":
        start_month = ((today.month - 1) // 3) * 3 + 1
        end_month = start_month + 2
        start = date(today.year, start_month, 1)
        end_day = calendar.monthrange(today.year, end_month)[1]
        end = date(today.year, end_month, end_day)
        return start, end

    # period == "month" (default)
    end_day = calendar.monthrange(today.year, today.month)[1]
    start = date(today.year, today.month, 1)
    end = date(today.year, today.month, end_day)
    return start, end


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


@router.get("/summary", response_model=HoursSummary)
def read_hours_summary(
    session: SessionDep,
    current_user: CurrentUser,
    period: Period = "month",
) -> Any:
    """
    Aggregate hours for the current user (superuser: all users) over the
    given period (week/month/quarter, default month).

    NOTE: this route must stay registered before GET /{id} — otherwise
    Starlette would match "/summary" against the "{id}: uuid.UUID" path
    param and fail with a 422 instead of running this handler.
    """
    start, end = _get_period_range(period, date.today())

    statement = select(TimeEntry).where(
        TimeEntry.entry_date >= start, TimeEntry.entry_date <= end
    )
    if not current_user.is_superuser:
        statement = statement.where(TimeEntry.owner_id == current_user.id)

    time_entries = session.exec(statement).all()

    total_hours = 0.0
    billable_hours = 0.0
    project_totals: dict[uuid.UUID, dict[str, Any]] = {}

    for entry in time_entries:
        total_hours += entry.hours
        if entry.billable:
            billable_hours += entry.hours

        bucket = project_totals.setdefault(
            entry.project_id,
            {
                "project_id": entry.project_id,
                "project_name": entry.project.name if entry.project else "Unknown",
                "total_hours": 0.0,
            },
        )
        bucket["total_hours"] += entry.hours

    non_billable_hours = total_hours - billable_hours

    return HoursSummary(
        total_hours=round(total_hours, 2),
        billable_hours=round(billable_hours, 2),
        non_billable_hours=round(non_billable_hours, 2),
        entries_count=len(time_entries),
        hours_by_project=[
            ProjectHoursSummary(**bucket) for bucket in project_totals.values()
        ],
    )


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
