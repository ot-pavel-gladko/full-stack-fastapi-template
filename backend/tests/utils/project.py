from sqlmodel import Session

from app.models import Project, ProjectCreate
from tests.utils.user import create_random_user
from tests.utils.utils import random_lower_string


def create_random_project(db: Session) -> Project:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    name = random_lower_string()
    client = random_lower_string()
    project_in = ProjectCreate(name=name, client=client)
    db_project = Project.model_validate(project_in, update={"owner_id": owner_id})
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project
