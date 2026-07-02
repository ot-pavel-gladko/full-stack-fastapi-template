import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import Project, TimeEntry
from tests.utils.project import create_random_project
from tests.utils.time_entry import create_random_time_entry
from tests.utils.utils import random_lower_string


def _create_own_project(client: TestClient, headers: dict[str, str]) -> dict:
    response = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=headers,
        json={"name": random_lower_string()},
    )
    assert response.status_code == 200
    return response.json()


def test_create_time_entry(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    project = _create_own_project(client, normal_user_token_headers)
    data = {
        "project_id": project["id"],
        "entry_date": "2026-01-15",
        "hours": "3.5",
        "description": "Worked on feature",
        "is_billable": False,
    }
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["project_id"] == project["id"]
    assert content["entry_date"] == data["entry_date"]
    assert content["hours"] == "3.50" or float(content["hours"]) == 3.5
    assert content["description"] == data["description"]
    assert content["is_billable"] is False


def test_create_time_entry_project_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    data = {
        "project_id": str(uuid.uuid4()),
        "entry_date": "2026-01-15",
        "hours": "1.0",
    }
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 404


def test_create_time_entry_project_owned_by_another_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    other_users_project = create_random_project(db)
    data = {
        "project_id": str(other_users_project.id),
        "entry_date": "2026-01-15",
        "hours": "1.0",
    }
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_read_time_entries_own_only_ordered_by_date_desc(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    create_random_time_entry(db)  # belongs to a different random user

    project = _create_own_project(client, normal_user_token_headers)
    client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=normal_user_token_headers,
        json={"project_id": project["id"], "entry_date": "2026-01-10", "hours": "1.0"},
    )
    client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=normal_user_token_headers,
        json={"project_id": project["id"], "entry_date": "2026-01-20", "hours": "2.0"},
    )

    response = client.get(
        f"{settings.API_V1_STR}/time-entries/", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    assert content["count"] >= 2
    dates = [entry["entry_date"] for entry in content["data"]]
    assert dates == sorted(dates, reverse=True)

    superuser_response = client.get(
        f"{settings.API_V1_STR}/time-entries/", headers=superuser_token_headers
    )
    assert superuser_response.status_code == 200
    assert superuser_response.json()["count"] >= content["count"]


def test_update_time_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    data = {"hours": "5.0", "description": "Updated", "is_billable": False}
    response = client.put(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert float(content["hours"]) == 5.0
    assert content["description"] == "Updated"
    assert content["is_billable"] is False


def test_update_time_entry_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    response = client.put(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=normal_user_token_headers,
        json={"hours": "1.0"},
    )
    assert response.status_code == 403


def test_delete_time_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    response = client.delete(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    get_response = client.get(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=superuser_token_headers,
    )
    assert get_response.status_code == 404


def test_delete_project_cascades_to_time_entries(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    time_entry = create_random_time_entry(db, project=project)

    response = client.delete(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    statement = select(TimeEntry).where(TimeEntry.id == time_entry.id)
    remaining = db.exec(statement).first()
    assert remaining is None

    statement = select(Project).where(Project.id == project.id)
    remaining_project = db.exec(statement).first()
    assert remaining_project is None
