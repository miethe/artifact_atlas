"""BOM router (BOM-BE-003, BOM-BE-004, BOM-BE-005, BOM-BE-006).

Routes:
  GET  /api/projects/{projectId}/bom
  POST /api/projects/{projectId}/bom/apply-template
  PATCH /api/bom/{bomId}
  GET  /api/bom/{bomId}/coverage
  GET  /api/bom/{bomId}/gaps
  POST /api/bom/slots/{slotId}/assign
  DELETE /api/bom/assignments/{assignmentId}
  PATCH /api/bom/assignments/{assignmentId}/status
  POST /api/bom/slots/{slotId}/mark-not-applicable
  POST /api/bom/slots/{slotId}/request-asset

Apply-template is routed through BomService (BOM-BE-003): idempotency,
merge-conflict detection, and audit event emission.

Assign/unassign use BomService (BOM-BE-004): asset link creation, status
advancement, and audit emission.

Coverage uses the expanded coverage service (BOM-BE-005): deterministic
slot-status rules, optional subscores by domain/phase/template.

Gaps include deterministic GapRecommendations (BOM-BE-006): suggestion-only
draft task payloads — NEVER auto-created.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import not_found
from app.models.bom import (
    Bom,
    BomApplyTemplateRequest,
    BomAssignment,
    BomSlot,
    BomUpdate,
    CoverageSummary,
    GapRecommendationsResponse,
    SlotAssignRequest,
)
from app.models.vocabulary import AssignmentStatus, BomSlotStatus
from app.repositories.bom import BomRepository
from app.services.audit import AuditService
from app.services.bom_service import BomService
from app.services.coverage import calculate_coverage
from app.settings import get_settings

router = APIRouter(prefix="/api", tags=["bom"])


def _get_bom_repo() -> BomRepository:
    return BomRepository(get_settings().registry_dir)


def _get_bom_service() -> BomService:
    settings = get_settings()
    from pathlib import Path
    # api/app/api/bom.py -> parents[3] = repo root
    templates_dir = Path(__file__).resolve().parents[3] / "templates"
    return BomService(
        settings.registry_dir,
        templates_dir=templates_dir if templates_dir.exists() else None,
    )


# ---------------------------------------------------------------------------
# Project-scoped BOM
# ---------------------------------------------------------------------------


@router.get("/projects/{projectId}/bom", response_model=Bom)
def get_project_bom(projectId: str) -> Bom:
    """Get the Artifact BOM for a project with embedded slots and assignment counts."""
    svc = _get_bom_service()
    bom = svc.get_bom_for_project(projectId)
    if bom is None:
        return not_found(f"No BOM found for project '{projectId}'.")  # type: ignore[return-value]

    result = svc.get_bom_with_slots(bom.id)
    if result is None:  # pragma: no cover
        return not_found(f"No BOM found for project '{projectId}'.")  # type: ignore[return-value]
    return result


@router.post("/projects/{projectId}/bom/apply-template", response_model=Bom)
def apply_bom_template(projectId: str, data: BomApplyTemplateRequest) -> Bom:
    """Apply an artifact template to create or extend the project BOM.

    Idempotent: slots with the same (domain, artifact_type_id) key are not
    duplicated. Merge conflicts are reported in the response payload but do not
    cause an error — the caller can inspect the audit trail.

    Returns the updated BOM with embedded slots.
    """
    svc = _get_bom_service()
    try:
        result = svc.apply_template(
            projectId,
            data.template_id,
            merge_strategy=data.merge_strategy,
            intenttree_node_id=data.intenttree_node_id,
        )
    except ValueError as exc:
        return not_found(str(exc))  # type: ignore[return-value]

    bom_with_slots = svc.get_bom_with_slots(result.bom.id)
    if bom_with_slots is None:  # pragma: no cover
        return not_found("BOM not found after template application.")  # type: ignore[return-value]
    return bom_with_slots


# ---------------------------------------------------------------------------
# BOM by ID
# ---------------------------------------------------------------------------


@router.patch("/bom/{bomId}", response_model=Bom)
def update_bom(bomId: str, data: BomUpdate) -> Bom:
    """Update BOM metadata (name, status)."""
    repo = _get_bom_repo()
    updated = repo.update(bomId, data)
    if updated is None:
        return not_found(f"BOM '{bomId}' not found.")  # type: ignore[return-value]
    return updated


# ---------------------------------------------------------------------------
# Coverage (BOM-BE-005)
# ---------------------------------------------------------------------------


@router.get("/bom/{bomId}/coverage", response_model=CoverageSummary, tags=["coverage"])
def get_bom_coverage(
    bomId: str,
    group_by: Annotated[str, Query()] = "domain",
) -> CoverageSummary:
    """Get coverage summary for a BOM.

    Primary score = required_complete / required_active.
    not_applicable slots are excluded from the denominator.
    stale/blocked slots count as gaps even if an asset is assigned.
    Optional slots tracked separately (optional_score).
    Subscores by domain/phase/template via group_by.
    """
    repo = _get_bom_repo()
    bom = repo.get(bomId)
    if bom is None:
        return not_found(f"BOM '{bomId}' not found.")  # type: ignore[return-value]

    slots = repo.list_slots(bomId)
    # Pass group_by to the expanded coverage service
    group_by_param = group_by if group_by in ("domain", "phase", "template") else None
    summary = calculate_coverage(slots, group_by=group_by_param)
    return summary


# ---------------------------------------------------------------------------
# Gaps (BOM-BE-006)
# ---------------------------------------------------------------------------


@router.get("/bom/{bomId}/gaps", tags=["coverage"])
def get_bom_gaps(
    bomId: str,
    critical_only: Annotated[bool, Query()] = False,
    status: Annotated[list[BomSlotStatus] | None, Query()] = None,
    include_recommendations: Annotated[bool, Query()] = False,
) -> dict:
    """List unfilled or blocked BOM slots (gaps).

    Gaps include: missing, stale, blocked, partial.
    stale and blocked count as gaps even when an asset is assigned.

    When include_recommendations=true, each gap slot includes a deterministic
    GapRecommendation with a draft_task_suggestion payload.

    IntentTree task creation from gaps is EXPLICIT and suggestion-only — NEVER
    auto-created by this endpoint. draft_task_suggestion.suggestion_only is
    always True.
    """
    repo = _get_bom_repo()
    bom = repo.get(bomId)
    if bom is None:
        return not_found(f"BOM '{bomId}' not found.")  # type: ignore[return-value]

    gap_statuses = {
        BomSlotStatus.missing.value,
        BomSlotStatus.stale.value,
        BomSlotStatus.blocked.value,
        BomSlotStatus.partial.value,
    }

    slots = repo.list_slots(bomId)
    gaps = [
        s for s in slots
        if (s.status.value if hasattr(s.status, "value") else str(s.status)) in gap_statuses
    ]

    if critical_only:
        gaps = [s for s in gaps if s.required]

    if status:
        sv_set = {sv.value for sv in status}
        gaps = [
            s for s in gaps
            if (s.status.value if hasattr(s.status, "value") else str(s.status)) in sv_set
        ]

    result: dict = {"gaps": [s.model_dump(mode="json") for s in gaps]}

    if include_recommendations:
        svc = _get_bom_service()
        try:
            sv_filter = {sv.value for sv in status} if status else None
            recs = svc.get_gap_recommendations(
                bomId,
                critical_only=critical_only,
                statuses=sv_filter,
            )
            result["recommendations"] = recs.model_dump(mode="json")
        except ValueError:
            pass  # BOM already validated above

    return result


# ---------------------------------------------------------------------------
# Slot operations (BOM-BE-004)
# ---------------------------------------------------------------------------


@router.post("/bom/slots/{slotId}/assign", status_code=201, response_model=BomAssignment)
def assign_slot(slotId: str, data: SlotAssignRequest) -> BomAssignment:
    """Assign an asset to a BOM slot.

    Deterministic slot-status advancement:
        missing + suggested   -> partial
        missing + accepted    -> in_progress
        partial + accepted    -> in_progress

    Also creates an asset link (satisfies_slot) and emits a bom_slot_filled
    audit event.
    """
    svc = _get_bom_service()
    try:
        result = svc.assign_asset(
            slotId,
            data.asset_id,
            assignment_status=data.assignment_status,
            confidence=data.confidence,
            notes=data.notes,
            assigned_by="user",
        )
    except ValueError as exc:
        return not_found(str(exc))  # type: ignore[return-value]
    return result.assignment


@router.delete("/bom/assignments/{assignmentId}", status_code=204)
def unassign_slot(assignmentId: str, reason: Annotated[str | None, Query()] = None) -> None:
    """Unassign (remove) an asset assignment from a BOM slot.

    After removal, the slot status is recalculated (may revert to partial or
    missing if no other accepted assignments remain).
    Emits a bom_slot_filled audit event.
    """
    svc = _get_bom_service()
    removed = svc.unassign_asset(assignmentId, reason=reason)
    if not removed:
        not_found(f"Assignment '{assignmentId}' not found.")


@router.patch(
    "/bom/assignments/{assignmentId}/status",
    response_model=BomAssignment,
    tags=["bom"],
)
def update_assignment_status(
    assignmentId: str,
    body: dict,
) -> BomAssignment:
    """Update the assignment_status of an existing BOM slot assignment.

    Promotes a suggested assignment to accepted/canonical, or rejects it.
    Emits a bom_slot_filled audit event and advances slot status when
    upgrading from suggested -> accepted/canonical.
    """
    new_status_raw = body.get("assignment_status")
    if not new_status_raw:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="assignment_status is required.")
    try:
        new_status = AssignmentStatus(new_status_raw)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail=f"Invalid assignment_status '{new_status_raw}'.",
        )

    svc = _get_bom_service()
    updated = svc.update_assignment_status(assignmentId, new_status)
    if updated is None:
        return not_found(f"Assignment '{assignmentId}' not found.")  # type: ignore[return-value]
    return updated


@router.post("/bom/slots/{slotId}/mark-not-applicable", response_model=BomSlot)
def mark_slot_not_applicable(slotId: str, body: dict | None = None) -> BomSlot:
    """Mark a BOM slot as not applicable for this project.

    not_applicable slots are excluded from the required denominator in coverage.
    """
    repo = _get_bom_repo()
    slot = repo.get_slot(slotId)
    if slot is None:
        return not_found(f"BOM slot '{slotId}' not found.")  # type: ignore[return-value]

    reason = (body or {}).get("reason")
    patch: dict = {"status": BomSlotStatus.not_applicable.value}
    if reason:
        patch["guidance"] = reason
    updated = repo.update_slot(slotId, patch)
    return updated or slot


@router.post("/bom/slots/{slotId}/request-asset", status_code=202)
def request_asset_for_slot(slotId: str, body: dict | None = None) -> dict:
    """Create an asset request (suggestion) for an unfilled BOM slot.

    Emits an atlas_event of type bom_slot_filled.
    IntentTree task creation is NEVER automatic — only emitted as a suggestion
    in the event payload. The caller or UI must present this to the user for
    explicit confirmation before creating any task.
    """
    repo = _get_bom_repo()
    slot = repo.get_slot(slotId)
    if slot is None:
        return not_found(f"BOM slot '{slotId}' not found.")  # type: ignore[return-value]

    body = body or {}
    settings = get_settings()
    audit = AuditService(settings.registry_dir)
    event = audit.emit(
        "bom_slot_filled",  # type: ignore[arg-type]
        "slot",
        slotId,
        payload={
            "action": "asset_requested",
            "notes": body.get("notes"),
            # suggestion_only: intenttree task creation requires explicit human action
            "intenttree_node_id": body.get("intenttree_node_id"),
            "suggestion_only": True,
        },
    )

    return {"event_id": event.id, "slot_id": slotId}
