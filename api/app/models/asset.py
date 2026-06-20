"""Asset models including links, relationships, and mutation requests."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import (
    AgentAccess,
    AssetLinkRelationship,
    AssetLinkTargetType,
    AssetRelationshipType,
    AssetStatus,
    GeneratedBy,
    Sensitivity,
    SourceKind,
)


# ---------------------------------------------------------------------------
# Core asset record
# ---------------------------------------------------------------------------


class Asset(BaseModel):
    """Full asset record."""

    model_config = ConfigDict(extra="allow")

    id: str
    workspace_id: str | None = None
    project_id: str | None = None
    title: str
    description: str | None = None
    artifact_type_id: str | None = None
    source_id: str | None = None
    source_kind: SourceKind
    uri: str
    original_uri: str | None = None
    storage_uri: str | None = None
    mime_type: str | None = None
    size_bytes: int | None = None
    hash_sha256: str | None = None
    thumbnail_uri: str | None = None
    preview_text_uri: str | None = None
    status: AssetStatus
    sensitivity: Sensitivity
    agent_access: AgentAccess
    created_by: str | None = None
    generated_by: GeneratedBy | None = None
    captured_at: datetime | None = None
    source_created_at: datetime | None = None
    source_updated_at: datetime | None = None
    last_indexed_at: datetime | None = None
    metadata: dict[str, Any] | None = None


class AssetCreate(BaseModel):
    """Request body for POST /api/projects/{projectId}/assets."""

    model_config = ConfigDict(extra="allow")

    title: str
    description: str | None = None
    artifact_type_id: str | None = None
    source_kind: SourceKind
    uri: str
    original_uri: str | None = None
    mime_type: str | None = None
    size_bytes: int | None = None
    status: AssetStatus = AssetStatus.inbox
    sensitivity: Sensitivity
    agent_access: AgentAccess = AgentAccess.metadata_only
    generated_by: GeneratedBy | None = None
    metadata: dict[str, Any] | None = None


class AssetUpdate(BaseModel):
    """Request body for PATCH /api/assets/{assetId}."""

    model_config = ConfigDict(extra="allow")

    title: str | None = None
    description: str | None = None
    artifact_type_id: str | None = None
    status: AssetStatus | None = None
    sensitivity: Sensitivity | None = None
    agent_access: AgentAccess | None = None
    metadata: dict[str, Any] | None = None


class AssetPromoteRequest(BaseModel):
    """Request body for POST /api/assets/{assetId}/promote."""

    model_config = ConfigDict(extra="allow")

    target_status: AssetStatus
    review_notes: str | None = None
    supersedes_asset_id: str | None = None


# ---------------------------------------------------------------------------
# Asset links and relationships
# ---------------------------------------------------------------------------


class AssetLink(BaseModel):
    """Relationship between an asset and another entity."""

    model_config = ConfigDict(extra="allow")

    id: str
    asset_id: str
    target_type: AssetLinkTargetType
    target_id: str
    relationship: AssetLinkRelationship
    created_at: datetime | None = None


class AssetLinkCreate(BaseModel):
    """Request body for POST /api/assets/{assetId}/link."""

    model_config = ConfigDict(extra="allow")

    target_type: AssetLinkTargetType
    target_id: str
    relationship: AssetLinkRelationship


class AssetRelationship(BaseModel):
    """Typed relationship between two assets."""

    model_config = ConfigDict(extra="allow")

    id: str
    source_asset_id: str
    target_asset_id: str
    relationship_type: AssetRelationshipType
    created_at: datetime | None = None
    metadata: dict[str, Any] | None = None
