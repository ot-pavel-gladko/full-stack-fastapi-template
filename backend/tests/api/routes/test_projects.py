import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.project import create_random_project
from tests.utils.utils import random_lower_string


def test_create_project(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    data = {"name": random_lower_string(), "client": "Acme Corp"}
    response = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["status"] == "active"
    assert "id" in content


def test_read_projects_own_only(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    # a project belonging to someone else (random user)
    create_random_project(db)
    # a project belonging to the normal test user
    data = {"name": random_lower_string()}
    client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=normal_user_token_headers,
        json=data,
    )

    response = client.get(
        f"{settings.API_V1_STR}/projects/", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content and "count" in content
    assert all(p["name"] != "" for p in content["data"])

    superuser_response = client.get(
        f"{settings.API_V1_STR}/projects/", headers=superuser_token_headers
    )
    assert superuser_response.status_code == 200
    superuser_content = superuser_response.json()
    assert superuser_content["count"] >= content["count"]


def test_update_project_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    data = {"name": "Updated name"}
    response = client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_project_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    response = client.delete(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_update_delete_project_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    missing_id = uuid.uuid4()
    put_response = client.put(
        f"{settings.API_V1_STR}/projects/{missing_id}",
        headers=superuser_token_headers,
        json={"name": "Whatever"},
    )
    assert put_response.status_code == 404

    delete_response = client.delete(
        f"{settings.API_V1_STR}/projects/{missing_id}",
        headers=superuser_token_headers,
    )
    assert delete_response.status_code == 404


def test_update_project_status_to_archived(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    response = client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=superuser_token_headers,
        json={"status": "archived"},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == "archived"
    assert content["id"] == str(project.id)
