from sqlmodel import Session

from app import crud
from app.models import Project, ProjectCreate
from tests.utils.user import create_random_user
from tests.utils.utils import random_lower_string


def create_random_project(db: Session) -> Project:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    name = random_lower_string()
    description = random_lower_string()
    client = random_lower_string()
    project_in = ProjectCreate(name=name, description=description, client=client)
    return crud.create_project(session=db, project_in=project_in, owner_id=owner_id)
