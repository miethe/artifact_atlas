"""Inbox and classification models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import (
    AgentAccess,
    AssetStatus,
    Sensitivity,
    SourceKind,
)


class InboxItem(BaseModel):
    """An Asset in inbox or raw status awaiting classification."""

    model_config = ConfigDict(extra="allow")

    id: str
    title: str
    source_kind: SourceKind
    uri: str
    status: AssetStatus
    sensitivity: Sensitivity
    agent_access: AgentAccess
    mime_type: str | None = None
    thumbnail_uri: str | None = None
    captured_at: datetime | None = None
    suggested_artifact_type_id: str | None = None
    suggested_intenttree_node_id: str | None = None


class InboxImportRequest(BaseModel):
    """Import one or more items into the inbox."""

    model_config = ConfigDict(extra="allow")

    source_kind: SourceKind
    uris: list[str] | None = None
    sensitivity: Sensitivity = Sensitivity.personal
    agent_access: AgentAccess = AgentAccess.metadata_only
    metadata: dict[str, Any] | None = None


class ClassificationSuggestion(BaseModel):
    """AI/heuristic classification suggestion for an inbox item."""

    model_config = ConfigDict(extra="allow")

    asset_id: str
    artifact_type_id: str | None = None
    artifact_type_name: str | None = None
    intenttree_node_id: str | None = None
    bom_slot_id: str | None = None
    suggested_status: AssetStatus | None = None
    suggested_sensitivity: Sensitivity | None = None
    confidence: float
    rationale: str | None = None


class ClassificationItem(BaseModel):
    """Single asset classification override in an apply request."""

    model_config = ConfigDict(extra="allow")

    asset_id: str
    artifact_type_id: str | None = None
    status: AssetStatus | None = None
    sensitivity: Sensitivity | None = None
    intenttree_node_id: str | None = None
    bom_slot_id: str | None = None


class ApplyClassificationRequest(BaseModel):
    """Request body for POST /api/projects/{projectId}/inbox/apply-classification."""

    model_config = ConfigDict(extra="allow")

    classifications: list[ClassificationItem]
