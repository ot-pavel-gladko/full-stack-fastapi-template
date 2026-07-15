import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.project import create_random_project


def test_create_project(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "Website Redesign", "client": "Acme Corp", "description": "Rebuild"}
    response = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 201
    content = response.json()
    assert content["name"] == data["name"]
    assert content["client"] == data["client"]
    assert content["description"] == data["description"]
    assert content["status"] == "active"
    assert "id" in content
    assert "owner_id" in content


def test_read_project(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    response = client.get(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == project.name
    assert content["id"] == str(project.id)
    assert content["owner_id"] == str(project.owner_id)


def test_read_projects(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_project(db)
    create_random_project(db)
    response = client.get(
        f"{settings.API_V1_STR}/projects/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_project(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    data = {"name": "Updated name", "status": "archived"}
    response = client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["status"] == data["status"]
    assert content["id"] == str(project.id)
    assert content["owner_id"] == str(project.owner_id)


def test_delete_project(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    response = client.delete(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Project deleted successfully"


def test_non_owner_cannot_access_project(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)

    read_response = client.get(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
    )
    assert read_response.status_code == 403
    assert read_response.json()["detail"] == "Not enough permissions"

    update_response = client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
        json={"name": "Hijacked"},
    )
    assert update_response.status_code == 403
    assert update_response.json()["detail"] == "Not enough permissions"

    delete_response = client.delete(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
    )
    assert delete_response.status_code == 403
    assert delete_response.json()["detail"] == "Not enough permissions"

    not_found_response = client.get(
        f"{settings.API_V1_STR}/projects/{uuid.uuid4()}",
        headers=normal_user_token_headers,
    )
    assert not_found_response.status_code == 404
    assert not_found_response.json()["detail"] == "Project not found"
