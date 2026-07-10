import uuid
from datetime import date

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.project import create_random_project
from tests.utils.time_entry import create_random_time_entry


def test_create_time_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    data = {
        "project_id": str(project.id),
        "entry_date": str(date.today()),
        "hours": 3.5,
        "description": "Responsive nav + header",
        "billable": True,
    }
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["project_id"] == data["project_id"]
    assert content["hours"] == data["hours"]
    assert content["billable"] is True
    assert "id" in content
    assert "owner_id" in content


def test_create_time_entry_hours_not_positive(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    data = {
        "project_id": str(project.id),
        "entry_date": str(date.today()),
        "hours": 0,
    }
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 422


def test_create_time_entry_missing_required(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    data = {"project_id": str(project.id)}
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 422


def test_create_time_entry_project_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "project_id": str(uuid.uuid4()),
        "entry_date": str(date.today()),
        "hours": 1,
    }
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Project not found"


def test_create_time_entry_project_not_owned(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # project owned by a different (randomly created) user
    project = create_random_project(db)
    data = {
        "project_id": str(project.id),
        "entry_date": str(date.today()),
        "hours": 1,
    }
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Project not found"


def test_read_time_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    response = client.get(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(time_entry.id)
    assert content["owner_id"] == str(time_entry.owner_id)
    assert content["project_id"] == str(time_entry.project_id)


def test_read_time_entry_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/time-entries/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Time entry not found"


def test_read_time_entry_not_owner_returns_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    response = client.get(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Time entry not found"


def test_read_time_entries(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_time_entry(db)
    create_random_time_entry(db)
    response = client.get(
        f"{settings.API_V1_STR}/time-entries/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_read_time_entries_ownership_scoping(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # time entries owned by other random users should not appear
    create_random_time_entry(db)
    create_random_time_entry(db)
    response = client.get(
        f"{settings.API_V1_STR}/time-entries/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["count"] == len(content["data"])


def test_read_time_entries_filter_by_project(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    create_random_time_entry(db)
    response = client.get(
        f"{settings.API_V1_STR}/time-entries/",
        headers=superuser_token_headers,
        params={"project_id": str(time_entry.project_id)},
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 1
    for entry in content["data"]:
        assert entry["project_id"] == str(time_entry.project_id)


def test_update_time_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    data = {"hours": 6.25, "description": "Updated description"}
    response = client.put(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["hours"] == data["hours"]
    assert content["description"] == data["description"]
    assert content["id"] == str(time_entry.id)


def test_update_time_entry_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"hours": 2}
    response = client.put(
        f"{settings.API_V1_STR}/time-entries/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Time entry not found"


def test_update_time_entry_not_owner_returns_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    data = {"hours": 2}
    response = client.put(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Time entry not found"


def test_delete_time_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    response = client.delete(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Time entry deleted successfully"


def test_delete_time_entry_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/time-entries/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Time entry not found"


def test_delete_time_entry_not_owner_returns_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    time_entry = create_random_time_entry(db)
    response = client.delete(
        f"{settings.API_V1_STR}/time-entries/{time_entry.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Time entry not found"
