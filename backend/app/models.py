import uuid
from datetime import date, datetime, timezone

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    projects: list["Project"] = Relationship(back_populates="owner", cascade_delete=True)
    time_entries: list["TimeEntry"] = Relationship(
        back_populates="owner", cascade_delete=True
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Shared properties
class ProjectBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    client: str | None = Field(default=None, max_length=255)


# Properties to receive on project creation
class ProjectCreate(ProjectBase):
    pass


# Properties to receive on project update
class ProjectUpdate(ProjectBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]
    status: str | None = Field(default=None, max_length=50)


# Database model, database table inferred from class name
class Project(ProjectBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    status: str = Field(default="active", max_length=50)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="projects")
    time_entries: list["TimeEntry"] = Relationship(
        back_populates="project", cascade_delete=True
    )


# Properties to return via API, id is always required
class ProjectPublic(ProjectBase):
    id: uuid.UUID
    status: str
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ProjectsPublic(SQLModel):
    data: list[ProjectPublic]
    count: int


# Shared properties
class TimeEntryBase(SQLModel):
    project_id: uuid.UUID = Field(foreign_key="project.id", ondelete="CASCADE")
    entry_date: date
    hours: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=255)
    billable: bool = True


# Properties to receive on time entry creation
class TimeEntryCreate(TimeEntryBase):
    pass


# Properties to receive on time entry update
class TimeEntryUpdate(SQLModel):
    project_id: uuid.UUID | None = None
    entry_date: date | None = None
    hours: float | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=255)
    billable: bool | None = None


# Database model, database table name explicitly set to match the
# hand-written migration (SQLModel would otherwise default to
# "timeentry", not "time_entry")
class TimeEntry(TimeEntryBase, table=True):
    __tablename__ = "time_entry"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    project: Project | None = Relationship(back_populates="time_entries")
    owner: User | None = Relationship(back_populates="time_entries")


# Properties to return via API, id is always required
class TimeEntryPublic(TimeEntryBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class TimeEntriesPublic(SQLModel):
    data: list[TimeEntryPublic]
    count: int


# Per-project breakdown row within an hours summary
class ProjectHoursSummary(SQLModel):
    project_id: uuid.UUID
    project_name: str
    total_hours: float


# Response for GET /time-entries/summary
class HoursSummary(SQLModel):
    total_hours: float
    billable_hours: float
    non_billable_hours: float
    entries_count: int
    hours_by_project: list[ProjectHoursSummary]


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
