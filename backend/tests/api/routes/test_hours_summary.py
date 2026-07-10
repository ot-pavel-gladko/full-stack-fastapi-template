import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import ProjectCreate, TimeEntryCreate
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import random_email


def _new_user_headers(client: TestClient, db: Session) -> tuple[dict[str, str], uuid.UUID]:
    """Create a brand-new, isolated user + auth headers for a test."""
    email = random_email()
    headers = authentication_token_from_email(client=client, email=email, db=db)
    user = crud.get_user_by_email(session=db, email=email)
    assert user is not None
    return headers, user.id


def test_hours_summary_math(client: TestClient, db: Session) -> None:
    headers, owner_id = _new_user_headers(client, db)
    project = crud.create_project(
        session=db, project_in=ProjectCreate(name="P1"), owner_id=owner_id
    )
    today = date.today()
    for hours, billable in [(3.5, True), (1.0, False), (2.0, True)]:
        crud.create_time_entry(
            session=db,
            time_entry_in=TimeEntryCreate(
                project_id=project.id, entry_date=today, hours=hours, billable=billable
            ),
            owner_id=owner_id,
        )

    response = client.get(f"{settings.API_V1_STR}/time-entries/summary", headers=headers)
    assert response.status_code == 200
    content = response.json()
    assert content["total_hours"] == 6.5
    assert content["billable_hours"] == 5.5
    assert content["non_billable_hours"] == 1.0
    assert content["entries_count"] == 3


def test_hours_summary_hours_by_project_breakdown(
    client: TestClient, db: Session
) -> None:
    headers, owner_id = _new_user_headers(client, db)
    project_a = crud.create_project(
        session=db, project_in=ProjectCreate(name="Project A"), owner_id=owner_id
    )
    project_b = crud.create_project(
        session=db, project_in=ProjectCreate(name="Project B"), owner_id=owner_id
    )
    today = date.today()
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(project_id=project_a.id, entry_date=today, hours=4.0),
        owner_id=owner_id,
    )
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(project_id=project_a.id, entry_date=today, hours=1.5),
        owner_id=owner_id,
    )
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(project_id=project_b.id, entry_date=today, hours=2.0),
        owner_id=owner_id,
    )

    response = client.get(f"{settings.API_V1_STR}/time-entries/summary", headers=headers)
    assert response.status_code == 200
    content = response.json()

    by_project = {row["project_id"]: row for row in content["hours_by_project"]}
    assert len(by_project) == 2
    assert by_project[str(project_a.id)]["total_hours"] == 5.5
    assert by_project[str(project_a.id)]["project_name"] == "Project A"
    assert by_project[str(project_b.id)]["total_hours"] == 2.0
    assert by_project[str(project_b.id)]["project_name"] == "Project B"


def test_hours_summary_period_filter_excludes_out_of_window_entries(
    client: TestClient, db: Session
) -> None:
    headers, owner_id = _new_user_headers(client, db)
    project = crud.create_project(
        session=db, project_in=ProjectCreate(name="P1"), owner_id=owner_id
    )
    today = date.today()
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(project_id=project.id, entry_date=today, hours=3.0),
        owner_id=owner_id,
    )
    # far outside any week/month/quarter window anchored to today
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(
            project_id=project.id,
            entry_date=today - timedelta(days=400),
            hours=100.0,
        ),
        owner_id=owner_id,
    )

    for period in ("week", "month", "quarter"):
        response = client.get(
            f"{settings.API_V1_STR}/time-entries/summary",
            headers=headers,
            params={"period": period},
        )
        assert response.status_code == 200
        content = response.json()
        assert content["total_hours"] == 3.0, period
        assert content["entries_count"] == 1, period


def test_hours_summary_default_period_is_month(client: TestClient, db: Session) -> None:
    headers, owner_id = _new_user_headers(client, db)
    project = crud.create_project(
        session=db, project_in=ProjectCreate(name="P1"), owner_id=owner_id
    )
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(
            project_id=project.id, entry_date=date.today(), hours=1.25
        ),
        owner_id=owner_id,
    )

    default_response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary", headers=headers
    )
    month_response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary",
        headers=headers,
        params={"period": "month"},
    )
    assert default_response.status_code == 200
    assert month_response.status_code == 200
    assert default_response.json() == month_response.json()


def test_hours_summary_invalid_period_returns_422(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary",
        headers=superuser_token_headers,
        params={"period": "year"},
    )
    assert response.status_code == 422


def test_hours_summary_scoping_excludes_other_users(
    client: TestClient, db: Session
) -> None:
    headers_a, owner_a = _new_user_headers(client, db)
    _headers_b, owner_b = _new_user_headers(client, db)

    project_a = crud.create_project(
        session=db, project_in=ProjectCreate(name="A"), owner_id=owner_a
    )
    project_b = crud.create_project(
        session=db, project_in=ProjectCreate(name="B"), owner_id=owner_b
    )
    today = date.today()
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(project_id=project_a.id, entry_date=today, hours=2.0),
        owner_id=owner_a,
    )
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(project_id=project_b.id, entry_date=today, hours=99.0),
        owner_id=owner_b,
    )

    response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary", headers=headers_a
    )
    assert response.status_code == 200
    content = response.json()
    assert content["total_hours"] == 2.0
    assert content["entries_count"] == 1


def test_hours_summary_superuser_sees_all_users(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    headers_a, owner_a = _new_user_headers(client, db)
    project_a = crud.create_project(
        session=db, project_in=ProjectCreate(name="Superuser-visible"), owner_id=owner_a
    )
    today = date.today()
    crud.create_time_entry(
        session=db,
        time_entry_in=TimeEntryCreate(project_id=project_a.id, entry_date=today, hours=7.0),
        owner_id=owner_a,
    )

    own_response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary", headers=headers_a
    )
    superuser_response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary", headers=superuser_token_headers
    )
    assert own_response.status_code == 200
    assert superuser_response.status_code == 200
    # superuser's total should be at least what this one user logged
    assert superuser_response.json()["total_hours"] >= own_response.json()["total_hours"]
