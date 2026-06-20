"""Search request and result models."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import (
    AgentAccess,
    AssetStatus,
    Sensitivity,
    SourceKind,
)


class SearchFilters(BaseModel):
    """Optional filter bag for POST /api/search/semantic."""

    model_config = ConfigDict(extra="allow")

    source_kind: list[SourceKind] | None = None
    status: list[AssetStatus] | None = None
    artifact_type: list[str] | None = None
    intenttree_node_id: str | None = None
    bom_slot_id: str | None = None
    sensitivity: list[Sensitivity] | None = None


class SearchRequest(BaseModel):
    """Request body for POST semantic/similar search endpoints."""

    model_config = ConfigDict(extra="allow")

    query: str | None = None
    project_id: str | None = None
    filters: SearchFilters | None = None
    include: list[str] | None = None
    limit: int = 50


class SearchResult(BaseModel):
    """A single search hit."""

    model_config = ConfigDict(extra="allow")

    asset_id: str
    title: str
    status: AssetStatus
    sensitivity: Sensitivity
    agent_access: AgentAccess | None = None
    source_kind: SourceKind | None = None
    artifact_type_id: str | None = None
    project_id: str | None = None
    thumbnail_uri: str | None = None
    bom_status: dict[str, Any] | None = None
    score: float
    matched_fields: list[str] | None = None
