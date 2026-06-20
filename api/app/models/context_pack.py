"""ContextPack, ContextPackItem, ContextPackPolicy, and related models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.vocabulary import (
    ContextPackAudience,
    ContextPackItemType,
    ContextPackPublishDestination,
    ContextPackStatus,
    ContextPackTargetType,
    IncludeMode,
    Sensitivity,
)


class ContextPackPolicy(BaseModel):
    """Policy envelope attached to a context pack."""

    model_config = ConfigDict(extra="allow")

    allow_external_data: bool = False
    allow_code_execution: bool = False
    network_access: str = "none"  # none | restricted | allowed
    agent_access: str | None = None


class ContextPackItem(BaseModel):
    """A single item entry inside a context pack."""

    model_config = ConfigDict(extra="allow")

    id: str
    context_pack_id: str
    item_type: ContextPackItemType
    item_id: str
    include_mode: IncludeMode
    display_order: int
    required: bool
    token_estimate: int | None = None


class ContextPack(BaseModel):
    """Context pack header."""

    model_config = ConfigDict(extra="allow")

    id: str
    workspace_id: str | None = None
    project_id: str
    title: str
    description: str | None = None
    target_type: ContextPackTargetType
    target_id: str | None = None
    status: ContextPackStatus
    audience: ContextPackAudience
    sensitivity: Sensitivity
    token_estimate: int | None = None
    expires_at: datetime | None = None
    created_by: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    policy: ContextPackPolicy | None = None
    instructions: str | None = None


class ContextPackDetail(ContextPack):
    """ContextPack with embedded items."""

    items: list[ContextPackItem] | None = None


class ContextPackItemCreate(BaseModel):
    """Item entry within a ContextPackCreate or ContextPackUpdate request."""

    model_config = ConfigDict(extra="allow")

    item_type: ContextPackItemType
    item_id: str
    include_mode: IncludeMode
    display_order: int | None = None
    required: bool = False


class ContextPackCreate(BaseModel):
    """Request body for POST /api/projects/{projectId}/context-packs."""

    model_config = ConfigDict(extra="allow")

    title: str
    description: str | None = None
    target_type: ContextPackTargetType
    target_id: str | None = None
    audience: ContextPackAudience
    sensitivity: Sensitivity
    instructions: str | None = None
    expires_at: datetime | None = None
    policy: ContextPackPolicy | None = None
    items: list[ContextPackItemCreate] | None = None


class ContextPackUpdate(BaseModel):
    """Request body for PATCH /api/context-packs/{packId}."""

    model_config = ConfigDict(extra="allow")

    title: str | None = None
    description: str | None = None
    audience: ContextPackAudience | None = None
    sensitivity: Sensitivity | None = None
    instructions: str | None = None
    expires_at: datetime | None = None
    policy: ContextPackPolicy | None = None
    items: list[ContextPackItemCreate] | None = None


class ContextPackPreview(BaseModel):
    """Preview of a context pack payload."""

    model_config = ConfigDict(extra="allow")

    pack_id: str
    token_estimate: int
    manifest_yaml: str
    sensitive_item_count: int | None = None
    warnings: list[str] | None = None


class ContextPackPublishRequest(BaseModel):
    """Request body for POST /api/context-packs/{packId}/publish."""

    model_config = ConfigDict(extra="allow")

    destination: ContextPackPublishDestination
    output_path: str | None = None


class ContextPackFromNodeRequest(BaseModel):
    """Request body for POST /api/context-packs/from-node/{nodeId}."""

    model_config = ConfigDict(extra="allow")

    project_id: str
    title: str | None = None
    audience: ContextPackAudience = ContextPackAudience.agent
    sensitivity: Sensitivity = Sensitivity.personal
    include_assets: bool = True
    include_bom_slots: bool = True
    include_meatywiki_pages: bool = True
    asset_statuses: list[str] = Field(
        default_factory=lambda: ["candidate", "selected", "canonical"]
    )
    instructions: str | None = None
