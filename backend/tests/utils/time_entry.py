from datetime import date

from sqlmodel import Session

from app import crud
from app.models import TimeEntry, TimeEntryCreate
from tests.utils.project import create_random_project


def create_random_time_entry(db: Session) -> TimeEntry:
    project = create_random_project(db)
    owner_id = project.owner_id
    assert owner_id is not None
    time_entry_in = TimeEntryCreate(
        project_id=project.id,
        entry_date=date.today(),
        hours=2.5,
        description="Worked on it",
        billable=True,
    )
    return crud.create_time_entry(
        session=db, time_entry_in=time_entry_in, owner_id=owner_id
    )
