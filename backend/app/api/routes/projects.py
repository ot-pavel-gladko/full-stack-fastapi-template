import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud import create_project, get_project, update_project
from app.models import (
    Message,
    Project,
    ProjectCreate,
    ProjectPublic,
    ProjectsPublic,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=ProjectsPublic)
def read_projects(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve projects for the current user.
    """
    count_statement = (
        select(func.count())
        .select_from(Project)
        .where(Project.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(Project)
        .where(Project.owner_id == current_user.id)
        .order_by(col(Project.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    projects = session.exec(statement).all()

    projects_public = [ProjectPublic.model_validate(p) for p in projects]
    return ProjectsPublic(data=projects_public, count=count)


@router.post("/", response_model=ProjectPublic)
def create_project_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_in: ProjectCreate,
) -> Any:
    """
    Create a new project.
    """
    project = create_project(
        session=session, project_in=project_in, owner_id=current_user.id
    )
    return project


@router.get("/{id}", response_model=ProjectPublic)
def read_project(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """
    Get project by ID (owner-scoped; 404 for cross-user access).
    """
    project = get_project(
        session=session, project_id=id, owner_id=current_user.id
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{id}", response_model=ProjectPublic)
def update_project_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    project_in: ProjectUpdate,
) -> Any:
    """
    Update a project (including status="archived").
    """
    project = get_project(
        session=session, project_id=id, owner_id=current_user.id
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project = update_project(
        session=session, db_project=project, project_in=project_in
    )
    return project
