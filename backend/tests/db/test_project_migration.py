from sqlalchemy import inspect

from app.core.db import engine


def test_project_table_exists_with_expected_columns() -> None:
    inspector = inspect(engine)
    assert inspector.has_table("project")

    columns = {col["name"] for col in inspector.get_columns("project")}
    expected_columns = {
        "id",
        "name",
        "client",
        "description",
        "is_billable_default",
        "status",
        "owner_id",
        "created_at",
    }
    assert expected_columns.issubset(columns)
