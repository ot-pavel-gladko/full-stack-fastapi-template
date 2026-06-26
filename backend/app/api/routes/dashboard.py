from typing import Any

from fastapi import APIRouter
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import DashboardSummary, Project, ProjectSummary, TimeEntry

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Aggregated hours summary for the current user (server-side SQL aggregation).
    active_projects excludes archived; archived hours still count in totals.
    """
    # Per-project aggregates: total hours and billable hours via SQL
    per_project_stmt = (
        select(
            Project.id,
            Project.name,
            Project.status,
            func.coalesce(func.sum(TimeEntry.hours), 0).label("total_hours"),
            func.coalesce(
                func.sum(
                    func.case(
                        (TimeEntry.is_billable == True, TimeEntry.hours),  # noqa: E712
                        else_=0,
                    )
                ),
                0,
            ).label("billable_hours"),
        )
        .outerjoin(TimeEntry, TimeEntry.project_id == Project.id)
        .where(Project.owner_id == current_user.id)
        .group_by(Project.id, Project.name, Project.status)
    )
    rows = session.exec(per_project_stmt).all()

    by_project: list[ProjectSummary] = []
    grand_total = 0.0
    grand_billable = 0.0

    for row in rows:
        total = float(row.total_hours)
        billable = float(row.billable_hours)
        non_billable = round(total - billable, 2)
        billable_pct = round((billable / total * 100) if total > 0 else 0.0, 1)

        grand_total += total
        grand_billable += billable

        by_project.append(
            ProjectSummary(
                project_id=row.id,
                project_name=row.name,
                status=row.status,
                total_hours=round(total, 1),
                billable_hours=round(billable, 1),
                non_billable_hours=round(non_billable, 1),
                billable_pct=billable_pct,
            )
        )

    grand_total = round(grand_total, 1)
    grand_billable = round(grand_billable, 1)
    grand_non_billable = round(grand_total - grand_billable, 1)
    grand_pct = round(
        (grand_billable / grand_total * 100) if grand_total > 0 else 0.0, 1
    )

    # Active project count (excludes archived)
    active_count_stmt = (
        select(func.count())
        .select_from(Project)
        .where(
            Project.owner_id == current_user.id,
            Project.status != "archived",
        )
    )
    active_projects = session.exec(active_count_stmt).one()

    return DashboardSummary(
        total_hours=grand_total,
        billable_hours=grand_billable,
        non_billable_hours=grand_non_billable,
        billable_pct=grand_pct,
        active_projects=active_projects,
        total_projects=len(rows),
        by_project=by_project,
    )
