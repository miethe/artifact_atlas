"""Project models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import ProjectStatus


class Project(BaseModel):
    """Full project record (GET /api/projects/{projectId})."""

    model_config = ConfigDict(extra="allow")

    id: str
    workspace_id: str | None = None
    name: str
    slug: str
    description: str | None = None
    status: ProjectStatus
    meatywiki_page_ref: str | None = None
    intent_id: str | None = None
    root_intenttree_node_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProjectCreate(BaseModel):
    """Request body for POST /api/projects."""

    model_config = ConfigDict(extra="allow")

    name: str
    slug: str
    description: str | None = None
    status: ProjectStatus = ProjectStatus.active
    meatywiki_page_ref: str | None = None
    intent_id: str | None = None
    root_intenttree_node_id: str | None = None


class ProjectUpdate(BaseModel):
    """Request body for PATCH /api/projects/{projectId}."""

    model_config = ConfigDict(extra="allow")

    name: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    meatywiki_page_ref: str | None = None
    intent_id: str | None = None
    root_intenttree_node_id: str | None = None
