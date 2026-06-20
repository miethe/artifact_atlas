"""BOM router.

Routes:
  GET  /api/projects/{projectId}/bom
  POST /api/projects/{projectId}/bom/apply-template
  PATCH /api/bom/{bomId}
  GET  /api/bom/{bomId}/coverage
  GET  /api/bom/{bomId}/gaps
  POST /api/bom/slots/{slotId}/assign
  POST /api/bom/slots/{slotId}/mark-not-applicable
  POST /api/bom/slots/{slotId}/request-asset
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
    SlotAssignRequest,
)
from app.models.vocabulary import BomSlotStatus
from app.repositories.bom import BomRepository
from app.repositories.templates import TemplateRepository
from app.services.audit import AuditService
from app.services.coverage import calculate_coverage
from app.settings import get_settings

router = APIRouter(prefix="/api", tags=["bom"])


def _get_bom_repo() -> BomRepository:
    return BomRepository(get_settings().registry_dir)


def _get_template_repo() -> TemplateRepository:
    from pathlib import Path
    settings = get_settings()
    templates_dir = Path(__file__).resolve().parents[4] / "templates"
    return TemplateRepository(
        settings.registry_dir,
        templates_dir=templates_dir if templates_dir.exists() else None,
    )


# ---------------------------------------------------------------------------
# Project-scoped BOM
# ---------------------------------------------------------------------------


@router.get("/projects/{projectId}/bom", response_model=Bom)
def get_project_bom(projectId: str) -> Bom:
    """Get the Artifact BOM for a project."""
    repo = _get_bom_repo()
    bom = repo.get_for_project(projectId)
    if bom is None:
        return not_found(f"No BOM found for project '{projectId}'.")  # type: ignore[return-value]

    # Embed slots with assignment counts
    slots = repo.list_slots(bom.id)
    for slot in slots:
        assignments = repo.list_assignments(slot.id)
        slot.assignment_count = len(assignments)
        slot.accepted_assignment_count = sum(
            1 for a in assignments if (
                a.assignment_status.value if hasattr(a.assignment_status, "value") else str(a.assignment_status)
            ) == "accepted"
        )

    bom_dict = bom.model_dump(mode="python")
    bom_dict["slots"] = slots
    return Bom.model_validate(bom_dict)


@router.post("/projects/{projectId}/bom/apply-template", response_model=Bom)
def apply_bom_template(projectId: str, data: BomApplyTemplateRequest) -> Bom:
    """Apply an artifact template to create or extend the project BOM."""
    bom_repo = _get_bom_repo()
    tmpl_repo = _get_template_repo()

    template = tmpl_repo.get(data.template_id)
    if template is None:
        return not_found(f"Template '{data.template_id}' not found.")  # type: ignore[return-value]

    # Get or create BOM
    bom = bom_repo.get_for_project(projectId)
    if bom is None:
        bom_id = f"bom_{uuid.uuid4().hex[:16]}"
        bom = bom_repo.create(
            bom_id,
            projectId,
            f"BOM for {projectId}",
            source_templates=[data.template_id],
        )
    else:
        # Update source_templates list
        existing_templates = list(bom.source_templates or [])
        if data.template_id not in existing_templates:
            existing_templates.append(data.template_id)
            bom_repo.update(bom.id, BomUpdate())

    # Generate and persist slots
    slot_dicts = tmpl_repo.generate_bom_slots(data.template_id, bom.id)
    for slot_dict in slot_dicts:
        bom_repo.create_slot(
            slot_dict["id"],
            slot_dict["bom_id"],
            slot_dict["artifact_type_id"],
            slot_dict["domain"],
            required=slot_dict.get("required", True),
            phase=slot_dict.get("phase"),
            min_assets=slot_dict.get("min_assets", 1),
            max_assets=slot_dict.get("max_assets"),
            staleness_days=slot_dict.get("staleness_days"),
            guidance=slot_dict.get("guidance"),
        )

    # Emit audit
    settings = get_settings()
    AuditService(settings.registry_dir).emit(
        "bom_template_applied",  # type: ignore[arg-type]
        "bom",
        bom.id,
        project_id=projectId,
        payload={"template_id": data.template_id, "slots_added": len(slot_dicts)},
    )

    # Return updated BOM with slots
    bom = bom_repo.get(bom.id)
    if bom is None:
        return not_found("BOM not found after creation.")  # type: ignore[return-value]
    slots = bom_repo.list_slots(bom.id)
    bom_dict = bom.model_dump(mode="python")
    bom_dict["slots"] = slots
    return Bom.model_validate(bom_dict)


# ---------------------------------------------------------------------------
# BOM by ID
# ---------------------------------------------------------------------------


@router.patch("/bom/{bomId}", response_model=Bom)
def update_bom(bomId: str, data: BomUpdate) -> Bom:
    """Update BOM metadata."""
    repo = _get_bom_repo()
    updated = repo.update(bomId, data)
    if updated is None:
        return not_found(f"BOM '{bomId}' not found.")  # type: ignore[return-value]
    return updated


@router.get("/bom/{bomId}/coverage", response_model=CoverageSummary, tags=["coverage"])
def get_bom_coverage(
    bomId: str,
    group_by: Annotated[str, Query()] = "domain",
) -> CoverageSummary:
    """Get coverage summary for a BOM."""
    repo = _get_bom_repo()
    bom = repo.get(bomId)
    if bom is None:
        return not_found(f"BOM '{bomId}' not found.")  # type: ignore[return-value]

    slots = repo.list_slots(bomId)
    summary = calculate_coverage(slots)
    return summary


@router.get("/bom/{bomId}/gaps", tags=["coverage"])
def get_bom_gaps(
    bomId: str,
    critical_only: Annotated[bool, Query()] = False,
    status: Annotated[list[BomSlotStatus] | None, Query()] = None,
) -> dict:
    """List unfilled or blocked BOM slots."""
    repo = _get_bom_repo()
    bom = repo.get(bomId)
    if bom is None:
        return not_found(f"BOM '{bomId}' not found.")  # type: ignore[return-value]

    slots = repo.list_slots(bomId)
    gap_statuses = {
        BomSlotStatus.missing.value,
        BomSlotStatus.stale.value,
        BomSlotStatus.blocked.value,
        BomSlotStatus.partial.value,
    }

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

    return {"gaps": [s.model_dump(mode="json") for s in gaps]}


# ---------------------------------------------------------------------------
# Slot operations
# ---------------------------------------------------------------------------


@router.post("/bom/slots/{slotId}/assign", status_code=201, response_model=BomAssignment)
def assign_slot(slotId: str, data: SlotAssignRequest) -> BomAssignment:
    """Assign an asset to a BOM slot."""
    repo = _get_bom_repo()
    slot = repo.get_slot(slotId)
    if slot is None:
        return not_found(f"BOM slot '{slotId}' not found.")  # type: ignore[return-value]

    # Fill slot_id from path param if not provided
    req = SlotAssignRequest(
        asset_id=data.asset_id,
        slot_id=slotId,
        assignment_status=data.assignment_status,
        confidence=data.confidence,
        notes=data.notes,
    )
    assignment_id = f"asn_{uuid.uuid4().hex[:16]}"
    assignment = repo.create_assignment(assignment_id, req, assigned_by="user")

    # Update slot status to in_progress if it was missing
    slot_sv = slot.status.value if hasattr(slot.status, "value") else str(slot.status)
    if slot_sv in (BomSlotStatus.missing.value, BomSlotStatus.partial.value):
        repo.update_slot(slotId, {"status": BomSlotStatus.in_progress.value})

    return assignment


@router.post("/bom/slots/{slotId}/mark-not-applicable", response_model=BomSlot)
def mark_slot_not_applicable(slotId: str, body: dict | None = None) -> BomSlot:
    """Mark a BOM slot as not applicable for this project."""
    repo = _get_bom_repo()
    slot = repo.get_slot(slotId)
    if slot is None:
        return not_found(f"BOM slot '{slotId}' not found.")  # type: ignore[return-value]

    reason = (body or {}).get("reason")
    patch = {"status": BomSlotStatus.not_applicable.value}
    if reason:
        patch["guidance"] = reason
    updated = repo.update_slot(slotId, patch)
    return updated or slot


@router.post("/bom/slots/{slotId}/request-asset", status_code=202)
def request_asset_for_slot(slotId: str, body: dict | None = None) -> dict:
    """Create an asset request for an unfilled BOM slot."""
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
            "intenttree_node_id": body.get("intenttree_node_id"),
        },
    )

    return {"event_id": event.id, "slot_id": slotId}
