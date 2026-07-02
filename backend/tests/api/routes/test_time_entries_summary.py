import datetime

from fastapi.testclient import TestClient

from app.core.config import settings
from tests.utils.utils import random_lower_string


def _create_project(client: TestClient, headers: dict[str, str], **overrides) -> dict:
    payload = {"name": random_lower_string()}
    payload.update(overrides)
    response = client.post(
        f"{settings.API_V1_STR}/projects/", headers=headers, json=payload
    )
    assert response.status_code == 200
    return response.json()


def _log_time(
    client: TestClient,
    headers: dict[str, str],
    project_id: str,
    entry_date: str,
    hours: str,
    is_billable: bool = True,
) -> dict:
    response = client.post(
        f"{settings.API_V1_STR}/time-entries/",
        headers=headers,
        json={
            "project_id": project_id,
            "entry_date": entry_date,
            "hours": hours,
            "is_billable": is_billable,
        },
    )
    assert response.status_code == 200
    return response.json()


def test_summary_totals_match_seeded_entries(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)

    project_a = _create_project(client, normal_user_token_headers)
    project_b = _create_project(client, normal_user_token_headers)

    _log_time(client, normal_user_token_headers, project_a["id"], str(today), "2.0")
    _log_time(
        client,
        normal_user_token_headers,
        project_b["id"],
        str(yesterday),
        "1.5",
        is_billable=False,
    )

    response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary",
        headers=normal_user_token_headers,
        params={"period": "week"},
    )
    assert response.status_code == 200
    content = response.json()
    total = float(content["total_hours"])
    billable = float(content["billable_hours"])
    non_billable = float(content["non_billable_hours"])
    assert total >= 3.5
    assert abs(billable + non_billable - total) < 1e-6


def test_summary_by_project_breakdown(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    today = datetime.date.today()
    project_a = _create_project(client, normal_user_token_headers)
    project_b = _create_project(client, normal_user_token_headers)
    _log_time(client, normal_user_token_headers, project_a["id"], str(today), "3.0")
    _log_time(client, normal_user_token_headers, project_b["id"], str(today), "1.0")

    response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary",
        headers=normal_user_token_headers,
        params={"period": "week"},
    )
    assert response.status_code == 200
    content = response.json()
    by_project_ids = {row["project_id"] for row in content["by_project"]}
    assert project_a["id"] in by_project_ids
    assert project_b["id"] in by_project_ids

    project_a_row = next(
        row for row in content["by_project"] if row["project_id"] == project_a["id"]
    )
    assert float(project_a_row["total_hours"]) >= 3.0


def test_summary_by_day_within_period(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    today = datetime.date.today()
    project = _create_project(client, normal_user_token_headers)
    _log_time(client, normal_user_token_headers, project["id"], str(today), "1.0")

    response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary",
        headers=normal_user_token_headers,
        params={"period": "week"},
    )
    assert response.status_code == 200
    content = response.json()

    week_start = today - datetime.timedelta(days=today.weekday())
    week_end = week_start + datetime.timedelta(days=6)
    for day_row in content["by_day"]:
        day = datetime.date.fromisoformat(day_row["entry_date"])
        assert week_start <= day <= week_end


def test_summary_scoped_to_caller_superuser_sees_combined(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    superuser_token_headers: dict[str, str],
) -> None:
    today = datetime.date.today()
    normal_project = _create_project(client, normal_user_token_headers)
    super_project = _create_project(client, superuser_token_headers)

    _log_time(
        client, normal_user_token_headers, normal_project["id"], str(today), "2.0"
    )
    _log_time(client, superuser_token_headers, super_project["id"], str(today), "4.0")

    normal_response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary",
        headers=normal_user_token_headers,
        params={"period": "week"},
    )
    super_response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary",
        headers=superuser_token_headers,
        params={"period": "week"},
    )
    assert normal_response.status_code == 200
    assert super_response.status_code == 200
    normal_total = float(normal_response.json()["total_hours"])
    super_total = float(super_response.json()["total_hours"])
    assert super_total >= normal_total + 4.0


def test_summary_invalid_period_returns_422(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/time-entries/summary",
        headers=normal_user_token_headers,
        params={"period": "decade"},
    )
    assert response.status_code == 422
