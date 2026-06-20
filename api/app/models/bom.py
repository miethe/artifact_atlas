"""BOM, BomSlot, BomAssignment, CoverageSummary, and GapRecommendation models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import (
    AssignedBy,
    AssignmentStatus,
    BomMergeStrategy,
    BomSlotStatus,
    BomStatus,
    SlotPhase,
)


# ---------------------------------------------------------------------------
# BOM slot assignment
# ---------------------------------------------------------------------------


class BomAssignment(BaseModel):
    """A single asset-to-slot assignment record."""

    model_config = ConfigDict(extra="allow")

    id: str
    slot_id: str
    asset_id: str
    assignment_status: AssignmentStatus
    confidence: float | None = None
    assigned_by: AssignedBy
    assigned_at: datetime | None = None
    notes: str | None = None


# ---------------------------------------------------------------------------
# BOM slot
# ---------------------------------------------------------------------------


class BomSlot(BaseModel):
    """A slot in an Artifact BOM."""

    model_config = ConfigDict(extra="allow")

    id: str
    bom_id: str
    artifact_type_id: str
    domain: str
    phase: SlotPhase | None = None
    required: bool
    status: BomSlotStatus
    linked_intenttree_node_id: str | None = None
    min_assets: int = 1
    max_assets: int | None = None
    staleness_days: int | None = None
    guidance: str | None = None
    assignment_count: int | None = None
    accepted_assignment_count: int | None = None


# ---------------------------------------------------------------------------
# BOM
# ---------------------------------------------------------------------------


class Bom(BaseModel):
    """Project Artifact BOM header with optional embedded slots."""

    model_config = ConfigDict(extra="allow")

    id: str
    project_id: str
    name: str
    status: BomStatus
    source_templates: list[str] | None = None
    merge_strategy: BomMergeStrategy = BomMergeStrategy.merge_existing
    coverage_score: float = 0.0
    created_at: datetime | None = None
    updated_at: datetime | None = None
    slots: list[BomSlot] | None = None


class BomUpdate(BaseModel):
    """Request body for PATCH /api/bom/{bomId}."""

    model_config = ConfigDict(extra="allow")

    name: str | None = None
    status: BomStatus | None = None


class BomApplyTemplateRequest(BaseModel):
    """Request body for POST /api/projects/{projectId}/bom/apply-template."""

    model_config = ConfigDict(extra="allow")

    template_id: str
    merge_strategy: BomMergeStrategy = BomMergeStrategy.merge_existing
    intenttree_node_id: str | None = None


class SlotAssignRequest(BaseModel):
    """Request body for POST /api/bom/slots/{slotId}/assign."""

    model_config = ConfigDict(extra="allow")

    asset_id: str
    slot_id: str | None = None
    assignment_status: AssignmentStatus = AssignmentStatus.suggested
    confidence: float | None = None
    notes: str | None = None


# ---------------------------------------------------------------------------
# Coverage summary
# ---------------------------------------------------------------------------


class CoverageGroup(BaseModel):
    """Per-group breakdown row inside CoverageSummary."""

    model_config = ConfigDict(extra="allow")

    group_key: str
    coverage_score: float
    total_slots: int
    filled_slots: int
    missing_slots: int


class CoverageSummary(BaseModel):
    """Coverage summary for a BOM (GET /api/bom/{bomId}/coverage)."""

    model_config = ConfigDict(extra="allow")

    bom_id: str
    coverage_score: float
    total_slots: int
    required_slots: int | None = None
    optional_slots: int | None = None
    optional_complete: int | None = None
    optional_score: float | None = None
    filled_slots: int
    missing_slots: int
    partial_slots: int | None = None
    in_progress_slots: int | None = None
    stale_slots: int
    blocked_slots: int | None = None
    not_applicable_slots: int | None = None
    groups: list[CoverageGroup] | None = None


# ---------------------------------------------------------------------------
# Gap recommendations (BOM-BE-006)
# ---------------------------------------------------------------------------


class DraftTaskSuggestion(BaseModel):
    """A draft IntentTree task suggestion for a gap slot.

    NEVER auto-created. Always returned as a suggestion payload for the
    user/UI to accept explicitly.
    """

    model_config = ConfigDict(extra="allow")

    suggestion_only: bool = True  # Always True — this is never auto-created
    title: str
    description: str
    slot_id: str
    slot_domain: str
    artifact_type_id: str
    priority: str  # "high" | "medium" | "low"


class GapRecommendation(BaseModel):
    """Deterministic recommendation for a missing, stale, or partial BOM slot.

    gap_reason: why this slot is a gap (missing/stale/partial/blocked).
    action: suggested remediation action.
    draft_task_suggestion: optional draft task payload (never auto-created).
    """

    model_config = ConfigDict(extra="allow")

    slot_id: str
    slot_domain: str
    artifact_type_id: str
    gap_reason: str  # "missing" | "stale" | "partial" | "blocked"
    required: bool
    priority: str  # "high" | "medium" | "low"
    action: str
    guidance: str | None = None
    draft_task_suggestion: DraftTaskSuggestion | None = None
    metadata: dict[str, Any] | None = None


class GapRecommendationsResponse(BaseModel):
    """Response for GET /api/bom/{bomId}/gaps?include_recommendations=true."""

    model_config = ConfigDict(extra="allow")

    bom_id: str
    total_gaps: int
    critical_gaps: int
    recommendations: list[GapRecommendation]
