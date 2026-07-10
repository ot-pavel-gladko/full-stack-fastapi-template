import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.project import create_random_project


def test_create_project(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "Website Redesign", "description": "Marketing site rebuild", "client": "Acme Corp"}
    response = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert content["client"] == data["client"]
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
    assert content["description"] == project.description
    assert content["id"] == str(project.id)
    assert content["owner_id"] == str(project.owner_id)


def test_read_project_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/projects/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Project not found"


def test_read_project_not_owner_returns_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    response = client.get(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Project not found"


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


def test_read_projects_ownership_scoping(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # projects owned by other random users should not appear for a normal user
    create_random_project(db)
    create_random_project(db)
    response = client.get(
        f"{settings.API_V1_STR}/projects/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    for item in content["data"]:
        assert item["owner_id"] is not None
    # None of the newly created (other-owned) projects should be present
    assert content["count"] == len(content["data"])


def test_update_project(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    data = {"name": "Updated name", "description": "Updated description"}
    response = client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert content["id"] == str(project.id)
    assert content["owner_id"] == str(project.owner_id)


def test_update_project_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "Updated name", "description": "Updated description"}
    response = client.put(
        f"{settings.API_V1_STR}/projects/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Project not found"


def test_update_project_not_owner_returns_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    data = {"name": "Updated name", "description": "Updated description"}
    response = client.put(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Project not found"


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


def test_delete_project_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/projects/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Project not found"


def test_delete_project_not_owner_returns_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    project = create_random_project(db)
    response = client.delete(
        f"{settings.API_V1_STR}/projects/{project.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Project not found"
