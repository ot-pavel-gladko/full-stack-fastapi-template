import datetime
from decimal import Decimal

from sqlmodel import Session

from app import crud
from app.models import Project, TimeEntry, TimeEntryCreate
from tests.utils.project import create_random_project
from tests.utils.utils import random_lower_string


def create_random_time_entry(db: Session, *, project: Project | None = None) -> TimeEntry:
    if project is None:
        project = create_random_project(db)
    time_entry_in = TimeEntryCreate(
        project_id=project.id,
        entry_date=datetime.date.today(),
        hours=Decimal("2.50"),
        description=random_lower_string(),
    )
    return crud.create_time_entry(
        session=db, time_entry_in=time_entry_in, owner_id=project.owner_id
    )
