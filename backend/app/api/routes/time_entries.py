import calendar
import uuid
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    DaySummary,
    HoursSummary,
    Message,
    Project,
    ProjectStatus,
    ProjectSummary,
    SummaryPeriod,
    TimeEntriesPublic,
    TimeEntry,
    TimeEntryCreate,
    TimeEntryPublic,
    TimeEntryUpdate,
)

router = APIRouter(prefix="/time-entries", tags=["time-entries"])


def _period_range(period: SummaryPeriod, today: date) -> tuple[date, date]:
    """Return the (start, end) inclusive date range for the given period."""
    if period == SummaryPeriod.week:
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif period == SummaryPeriod.month:
        start = today.replace(day=1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        end = today.replace(day=last_day)
    else:  # quarter
        quarter_index = (today.month - 1) // 3
        start_month = quarter_index * 3 + 1
        end_month = start_month + 2
        start = date(today.year, start_month, 1)
        last_day = calendar.monthrange(today.year, end_month)[1]
        end = date(today.year, end_month, last_day)
    return start, end


@router.get("/summary", response_model=HoursSummary)
def read_time_entries_summary(
    session: SessionDep,
    current_user: CurrentUser,
    period: SummaryPeriod = SummaryPeriod.week,
) -> Any:
    """
    Aggregate hours for the Hours Dashboard over the selected period.
    """
    start, end = _period_range(period, date.today())

    entries_statement = select(TimeEntry).where(
        TimeEntry.entry_date >= start, TimeEntry.entry_date <= end
    )
    projects_statement = select(Project)
    if not current_user.is_superuser:
        entries_statement = entries_statement.where(
            TimeEntry.owner_id == current_user.id
        )
        projects_statement = projects_statement.where(
            Project.owner_id == current_user.id
        )

    entries = session.exec(entries_statement).all()
    projects = {project.id: project for project in session.exec(projects_statement).all()}

    total_hours = sum((entry.hours for entry in entries), Decimal("0"))
    billable_hours = sum(
        (entry.hours for entry in entries if entry.is_billable), Decimal("0")
    )
    non_billable_hours = total_hours - billable_hours

    active_project_count = sum(
        1 for project in projects.values() if project.status == ProjectStatus.active
    )
    total_project_count = len(projects)

    by_day_map: dict[date, dict[str, Decimal]] = {}
    by_project_map: dict[uuid.UUID, dict[str, Any]] = {}

    for entry in entries:
        day_bucket = by_day_map.setdefault(
            entry.entry_date, {"total": Decimal("0"), "billable": Decimal("0")}
        )
        day_bucket["total"] += entry.hours
        if entry.is_billable:
            day_bucket["billable"] += entry.hours

        project = projects.get(entry.project_id)
        project_name = project.name if project else "Unknown project"
        project_bucket = by_project_map.setdefault(
            entry.project_id,
            {"name": project_name, "total": Decimal("0"), "billable": Decimal("0")},
        )
        project_bucket["total"] += entry.hours
        if entry.is_billable:
            project_bucket["billable"] += entry.hours

    by_day = [
        DaySummary(
            entry_date=day,
            total_hours=values["total"],
            billable_hours=values["billable"],
        )
        for day, values in sorted(by_day_map.items())
    ]

    by_project = [
        ProjectSummary(
            project_id=project_id,
            project_name=values["name"],
            total_hours=values["total"],
            billable_hours=values["billable"],
            percent_billable=(
                float(values["billable"] / values["total"] * 100)
                if values["total"] > 0
                else 0.0
            ),
        )
        for project_id, values in by_project_map.items()
    ]

    return HoursSummary(
        period=period,
        total_hours=total_hours,
        billable_hours=billable_hours,
        non_billable_hours=non_billable_hours,
        active_project_count=active_project_count,
        total_project_count=total_project_count,
        by_day=by_day,
        by_project=by_project,
    )


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
