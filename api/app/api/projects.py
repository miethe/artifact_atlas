"""Projects router — GET/POST /api/projects, GET/PATCH /api/projects/{projectId}."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import (
    apply_cursor_page,
    conflict,
    get_project_service,
    not_found,
)
from app.models.project import Project, ProjectCreate, ProjectUpdate
from app.models.vocabulary import ProjectStatus

router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/projects")
def list_projects(
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    status: Annotated[ProjectStatus | None, Query()] = None,
) -> dict:
    """List all projects with cursor pagination and optional status filter."""
    svc = get_project_service()
    projects = svc.list_projects()

    if status is not None:
        sv = status.value
        projects = [p for p in projects if p.status.value == sv]

    return apply_cursor_page(projects, cursor=cursor, limit=limit)


@router.post("/projects", status_code=201, response_model=Project)
def create_project(data: ProjectCreate) -> Project:
    """Create a new project."""
    svc = get_project_service()

    # Reject slug collisions
    if data.slug:
        existing = svc.get_project_by_slug(data.slug)
        if existing is not None:
            return conflict(f"Project with slug '{data.slug}' already exists.")  # type: ignore[return-value]

    return svc.create_project(data)


@router.get("/projects/{projectId}", response_model=Project)
def get_project(projectId: str) -> Project:
    """Get a single project by ID."""
    svc = get_project_service()
    project = svc.get_project(projectId)
    if project is None:
        return not_found(f"Project '{projectId}' not found.")  # type: ignore[return-value]
    return project


@router.patch("/projects/{projectId}", response_model=Project)
def update_project(projectId: str, data: ProjectUpdate) -> Project:
    """Partially update a project."""
    svc = get_project_service()
    updated = svc.update_project(projectId, data)
    if updated is None:
        return not_found(f"Project '{projectId}' not found.")  # type: ignore[return-value]
    return updated
