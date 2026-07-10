"""Template, TemplateDomain, and TemplateSlot models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import SlotPhase, TemplateStatus, TemplateType


class TemplateSlot(BaseModel):
    """A single artifact slot within a template domain."""

    model_config = ConfigDict(extra="allow")

    id: str
    template_id: str
    domain_id: str
    artifact_type_id: str
    phase: SlotPhase | None = None
    required: bool
    min_assets: int = 1
    max_assets: int | None = None
    staleness_days: int | None = None
    linked_intenttree_node_pattern: str | None = None
    display_order: int
    rule_config: dict[str, Any] | None = None
    # BOM Builder canvas fields (additive, WS-5)
    accepted_file_types: list[str] | None = None
    max_file_size_mb: int | None = None
    naming_convention: str | None = None
    guidance: str | None = None


class TemplateDomain(BaseModel):
    """A logical grouping of slots within a template."""

    model_config = ConfigDict(extra="allow")

    id: str
    template_id: str
    name: str
    slug: str
    description: str | None = None
    display_order: int
    slots: list[TemplateSlot] | None = None


class Template(BaseModel):
    """Artifact template header (without domain/slot details)."""

    model_config = ConfigDict(extra="allow")

    id: str
    workspace_id: str | None = None
    name: str
    slug: str
    description: str | None = None
    template_type: TemplateType
    status: TemplateStatus
    version: str
    created_by: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    metadata: dict[str, Any] | None = None


class TemplateDetail(Template):
    """Template with embedded domains and slots."""

    domains: list[TemplateDomain] | None = None


class TemplatePreview(BaseModel):
    """Slot structure preview for a template (no project application)."""

    model_config = ConfigDict(extra="allow")

    template_id: str
    domains: list[TemplateDomain]
    total_slots: int | None = None
    required_slots: int | None = None


class TemplateSlotInput(BaseModel):
    """Slot payload inside a domain when creating/updating a template.

    Accepts either ``artifact_type_id`` (slug-style ID) or the human-readable
    ``artifact_type`` label (slugified on persist), matching the YAML template
    format.
    """

    model_config = ConfigDict(extra="allow")

    artifact_type_id: str | None = None
    artifact_type: str | None = None
    phase: SlotPhase | None = None
    required: bool = True
    min_assets: int = 1
    max_assets: int | None = None
    staleness_days: int | None = None
    linked_intenttree_node_pattern: str | None = None
    display_order: int | None = None
    rule_config: dict[str, Any] | None = None
    accepted_file_types: list[str] | None = None
    max_file_size_mb: int | None = None
    naming_convention: str | None = None
    guidance: str | None = None


class TemplateDomainInput(BaseModel):
    """Domain payload when creating/updating a template."""

    model_config = ConfigDict(extra="allow")

    name: str
    slug: str | None = None
    description: str | None = None
    display_order: int | None = None
    slots: list[TemplateSlotInput] | None = None


class TemplateCreate(BaseModel):
    """Request body for POST /api/templates."""

    model_config = ConfigDict(extra="allow")

    name: str
    slug: str
    description: str | None = None
    template_type: TemplateType
    status: TemplateStatus = TemplateStatus.experimental
    version: str = "1.0.0"
    metadata: dict[str, Any] | None = None
    domains: list[TemplateDomainInput] | None = None


class TemplateUpdate(BaseModel):
    """Request body for PATCH /api/templates/{templateId}."""

    model_config = ConfigDict(extra="allow")

    name: str | None = None
    description: str | None = None
    status: TemplateStatus | None = None
    version: str | None = None
    metadata: dict[str, Any] | None = None
    domains: list[TemplateDomainInput] | None = None
