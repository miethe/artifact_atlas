"""BOM Service (BOM-BE-003, BOM-BE-004, BOM-BE-006, BOM-BE-007).

Responsibilities:
- Apply a template to a project BOM: create or MERGE project_bom + bom_slots.
- Idempotency/conflict-aware: deterministic slot keys prevent duplicates.
- Assign / unassign assets to slots with status and confidence (BOM-BE-004).
- Emit audit events on apply, assign, unassign.
- Gap recommendations: deterministic, suggestion-only (BOM-BE-006).
- Builder persistence: save custom template drafts; publish is explicit.

Slot key determinism:
    A slot is identified by the triple (bom_id, domain_slug, artifact_type_id).
    Before inserting, we check whether a slot with the same triple already
    exists. If it does, we report it as a merge conflict and skip insertion
    (no duplicate slots ever created). This makes apply-template idempotent.

Coverage rules (from spec):
    not_applicable  – excluded from required denominator
    missing         – required slot, no accepted assignment
    partial         – suggested/uncertain/min-count-unmet
    in_progress     – accepted asset raw/candidate/in_progress
    complete        – selected/canonical asset + review satisfied
    stale           – assigned asset past staleness or superseded
    blocked         – missing dep / explicit blocker

Gap rules (BOM-BE-006):
    IntentTree task creation is NEVER automatic.  This service only returns
    DraftTaskSuggestion payloads; the caller/UI must present them to the user
    for explicit acceptance before creating any task.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.bom import (
    Bom,
    BomAssignment,
    BomSlot,
    BomUpdate,
    DraftTaskSuggestion,
    GapRecommendation,
    GapRecommendationsResponse,
    SlotAssignRequest,
)
from app.models.vocabulary import (
    AssetLinkRelationship,
    AssetLinkTargetType,
    AssignmentStatus,
    BomMergeStrategy,
    BomSlotStatus,
)
from app.repositories.bom import BomRepository
from app.repositories.templates import TemplateRepository
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------


@dataclass
class ApplyTemplateResult:
    """Returned by BomService.apply_template."""

    bom: Bom
    slots_added: int
    slots_skipped: int          # conflicts / duplicates detected
    merge_conflicts: list[dict[str, Any]] = field(default_factory=list)
    created_bom: bool = False   # True when a new BOM was created


@dataclass
class AssignSlotResult:
    """Returned by BomService.assign_asset."""

    assignment: BomAssignment
    slot: BomSlot
    asset_link_id: str | None = None
    previous_slot_status: str = ""
    new_slot_status: str = ""


# ---------------------------------------------------------------------------
# Deterministic slot key
# ---------------------------------------------------------------------------


def _slot_key(bom_id: str, domain: str, artifact_type_id: str) -> str:
    """Stable slot identity key used for idempotency checks.

    Not persisted — used only in-memory during apply to detect duplicates.
    """
    d = domain.lower().replace(" ", "_")
    a = artifact_type_id.lower()
    return f"{bom_id}|{d}|{a}"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _sv(status: object) -> str:
    """Return the string value of an enum or plain str."""
    if hasattr(status, "value"):
        return status.value  # type: ignore[union-attr]
    return str(status)


def _gap_priority(slot: BomSlot) -> str:
    """Determine gap priority from slot attributes."""
    if slot.required:
        sv = _sv(slot.status)
        if sv in (BomSlotStatus.missing.value, BomSlotStatus.blocked.value):
            return "high"
        if sv == BomSlotStatus.stale.value:
            return "high"
        return "medium"
    return "low"


def _gap_action(slot: BomSlot) -> str:
    """Return a human-readable remediation action for a gap slot."""
    sv = _sv(slot.status)
    if sv == BomSlotStatus.missing.value:
        return (
            f"Create or locate a '{slot.artifact_type_id}' artifact "
            f"for domain '{slot.domain}' and assign it to this slot."
        )
    if sv == BomSlotStatus.stale.value:
        return (
            f"Update or replace the assigned '{slot.artifact_type_id}' artifact "
            f"in domain '{slot.domain}' — current assignment has exceeded "
            "the staleness threshold."
        )
    if sv == BomSlotStatus.partial.value:
        return (
            f"Promote the suggested '{slot.artifact_type_id}' assignment to "
            f"accepted status in domain '{slot.domain}', or assign an accepted asset."
        )
    if sv == BomSlotStatus.blocked.value:
        return (
            f"Resolve the blocker preventing '{slot.artifact_type_id}' "
            f"completion in domain '{slot.domain}'."
        )
    return f"Review slot '{slot.id}' — status '{sv}' requires attention."


# ---------------------------------------------------------------------------
# BomService
# ---------------------------------------------------------------------------


class BomService:
    """Orchestrate BOM creation, template application, and related mutations.

    All writes are local-first (JSONL via repositories). No external calls.
    """

    def __init__(self, registry_dir: Path, templates_dir: Path | None = None) -> None:
        self._registry_dir = registry_dir
        self._bom_repo = BomRepository(registry_dir)
        self._tmpl_repo = TemplateRepository(registry_dir, templates_dir=templates_dir)
        self._audit = AuditService(registry_dir)

    # ------------------------------------------------------------------
    # BOM-BE-003: Apply Template
    # ------------------------------------------------------------------

    def apply_template(
        self,
        project_id: str,
        template_id: str,
        *,
        merge_strategy: BomMergeStrategy = BomMergeStrategy.merge_existing,
        intenttree_node_id: str | None = None,
    ) -> ApplyTemplateResult:
        """Apply a template to a project BOM (idempotent, conflict-aware).

        Algorithm:
        1. Verify the template exists.
        2. Get or create the project BOM.
        3. Build the set of existing slot keys (domain+artifact_type_id).
        4. Generate new slots from the template; skip any that already exist
           (conflict detection) and report them.
        5. Persist new slots.
        6. Update BOM source_templates list.
        7. Emit bom_template_applied audit event.
        8. Return ApplyTemplateResult.

        Args:
            project_id: The project to apply the template to.
            template_id: The template to apply.
            merge_strategy: How to handle existing slots.
            intenttree_node_id: Optional scope filter (stored in event payload).

        Returns:
            ApplyTemplateResult with the updated BOM and conflict report.

        Raises:
            ValueError: If the template does not exist.
        """
        template = self._tmpl_repo.get(template_id)
        if template is None:
            raise ValueError(f"Template '{template_id}' not found.")

        # ------------------------------------------------------------------
        # 2. Get or create BOM
        # ------------------------------------------------------------------
        bom = self._bom_repo.get_for_project(project_id)
        created_bom = False

        if bom is None:
            bom_id = f"bom_{uuid.uuid4().hex[:16]}"
            bom = self._bom_repo.create(
                bom_id,
                project_id,
                f"BOM for {project_id}",
                source_templates=[template_id],
            )
            created_bom = True
        else:
            bom_id = bom.id

        # ------------------------------------------------------------------
        # 3. Build existing slot key set for idempotency
        # ------------------------------------------------------------------
        existing_slots = self._bom_repo.list_slots(bom_id)
        existing_keys: set[str] = {
            _slot_key(bom_id, s.domain, s.artifact_type_id)
            for s in existing_slots
        }

        # ------------------------------------------------------------------
        # 4. Generate candidate slots from the template
        # ------------------------------------------------------------------
        slot_dicts = self._tmpl_repo.generate_bom_slots(template_id, bom_id)

        slots_added = 0
        slots_skipped = 0
        merge_conflicts: list[dict[str, Any]] = []

        for slot_dict in slot_dicts:
            key = _slot_key(
                bom_id,
                slot_dict["domain"],
                slot_dict["artifact_type_id"],
            )
            if key in existing_keys:
                # Conflict: a slot for this domain+type already exists
                slots_skipped += 1
                merge_conflicts.append({
                    "domain": slot_dict["domain"],
                    "artifact_type_id": slot_dict["artifact_type_id"],
                    "required": slot_dict.get("required", True),
                    "reason": "slot_already_exists",
                })
                logger.debug(
                    "Skipping duplicate slot domain=%s artifact_type=%s for bom=%s",
                    slot_dict["domain"],
                    slot_dict["artifact_type_id"],
                    bom_id,
                )
                continue

            # Insert new slot
            self._bom_repo.create_slot(
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
            existing_keys.add(key)  # guard against intra-batch dupes
            slots_added += 1

        # ------------------------------------------------------------------
        # 5. Update BOM source_templates (union)
        # ------------------------------------------------------------------
        if not created_bom:
            current_sources = list(bom.source_templates or [])
            if template_id not in current_sources:
                current_sources.append(template_id)
                # Write the updated source_templates list back
                from app.repositories import jsonl as _jl
                _jl.update_record(
                    self._bom_repo._bom_path,
                    bom_id,
                    {
                        "source_templates": current_sources,
                        "updated_at": datetime.now(tz=timezone.utc).isoformat(),
                    },
                )

        # ------------------------------------------------------------------
        # 6. Emit audit event
        # ------------------------------------------------------------------
        self._audit.emit(
            "bom_template_applied",  # type: ignore[arg-type]
            "bom",
            bom_id,
            project_id=project_id,
            payload={
                "template_id": template_id,
                "slots_added": slots_added,
                "slots_skipped": slots_skipped,
                "merge_conflicts": merge_conflicts,
                "merge_strategy": (
                    merge_strategy.value
                    if hasattr(merge_strategy, "value")
                    else str(merge_strategy)
                ),
                "intenttree_node_id": intenttree_node_id,
            },
        )

        # ------------------------------------------------------------------
        # 7. Return result with refreshed BOM
        # ------------------------------------------------------------------
        bom = self._bom_repo.get(bom_id)
        if bom is None:  # pragma: no cover — should not happen
            raise RuntimeError(f"BOM '{bom_id}' disappeared after creation.")

        return ApplyTemplateResult(
            bom=bom,
            slots_added=slots_added,
            slots_skipped=slots_skipped,
            merge_conflicts=merge_conflicts,
            created_bom=created_bom,
        )

    # ------------------------------------------------------------------
    # BOM-BE-004: Slot Assignment
    # ------------------------------------------------------------------

    def assign_asset(
        self,
        slot_id: str,
        asset_id: str,
        *,
        assignment_status: AssignmentStatus = AssignmentStatus.suggested,
        confidence: float | None = None,
        notes: str | None = None,
        assigned_by: str = "user",
    ) -> AssignSlotResult:
        """Assign an asset to a BOM slot.

        Deterministic slot-status advancement:
            missing   + suggested   -> partial
            missing   + accepted    -> in_progress
            missing   + canonical   -> in_progress (or complete after asset check)
            partial   + accepted    -> in_progress
            partial   + canonical   -> in_progress
            in_progress (no change — coverage service recalculates on read)

        Side effects:
            - Creates a BomAssignment record.
            - Creates an AssetLink (satisfies_slot) from the asset to the slot.
            - Emits a bom_slot_filled audit event.
            - Updates slot status in-place.

        Args:
            slot_id: The BOM slot to assign to.
            asset_id: The asset being assigned.
            assignment_status: Confidence tier for the assignment.
            confidence: Optional 0.0-1.0 float confidence score.
            notes: Optional free-text notes.
            assigned_by: Actor making the assignment (user/agent/system).

        Returns:
            AssignSlotResult with the created assignment and updated slot.

        Raises:
            ValueError: If the slot is not found.
        """
        slot = self._bom_repo.get_slot(slot_id)
        if slot is None:
            raise ValueError(f"BOM slot '{slot_id}' not found.")

        bom = self._bom_repo.get(slot.bom_id)
        project_id = bom.project_id if bom else None

        # Create the assignment record
        assignment_id = f"asn_{uuid.uuid4().hex[:16]}"
        req = SlotAssignRequest(
            asset_id=asset_id,
            slot_id=slot_id,
            assignment_status=assignment_status,
            confidence=confidence,
            notes=notes,
        )
        assignment = self._bom_repo.create_assignment(
            assignment_id, req, assigned_by=assigned_by
        )

        # Create an asset link: asset -> bom_slot (satisfies_slot)
        asset_link_id: str | None = None
        try:
            from app.models.asset import AssetLinkCreate
            from app.repositories.assets import AssetRepository

            asset_repo = AssetRepository(self._registry_dir)
            link_data = AssetLinkCreate(
                target_type=AssetLinkTargetType.bom_slot,
                target_id=slot_id,
                relationship=AssetLinkRelationship.satisfies_slot,
            )
            link_id = f"lnk_{uuid.uuid4().hex[:16]}"
            asset_link = asset_repo.create_link(link_id, asset_id, link_data)
            asset_link_id = asset_link.id
        except Exception as exc:
            # Asset link creation is best-effort — log and continue.
            logger.warning(
                "Could not create asset link for assignment %s: %s",
                assignment_id,
                exc,
            )

        # Advance slot status deterministically
        previous_sv = _sv(slot.status)
        assign_sv = _sv(assignment_status)

        new_sv = previous_sv
        if previous_sv in (BomSlotStatus.missing.value,):
            if assign_sv == AssignmentStatus.suggested.value:
                new_sv = BomSlotStatus.partial.value
            elif assign_sv in (
                AssignmentStatus.accepted.value,
                AssignmentStatus.canonical.value,
            ):
                new_sv = BomSlotStatus.in_progress.value
        elif previous_sv == BomSlotStatus.partial.value:
            if assign_sv in (
                AssignmentStatus.accepted.value,
                AssignmentStatus.canonical.value,
            ):
                new_sv = BomSlotStatus.in_progress.value

        updated_slot = slot
        if new_sv != previous_sv:
            updated_slot = self._bom_repo.update_slot(slot_id, {"status": new_sv}) or slot

        # Emit audit event
        self._audit.emit(
            "bom_slot_filled",  # type: ignore[arg-type]
            "slot",
            slot_id,
            project_id=project_id,
            payload={
                "assignment_id": assignment_id,
                "asset_id": asset_id,
                "assignment_status": assign_sv,
                "confidence": confidence,
                "previous_slot_status": previous_sv,
                "new_slot_status": new_sv,
                "asset_link_id": asset_link_id,
            },
        )

        return AssignSlotResult(
            assignment=assignment,
            slot=updated_slot,
            asset_link_id=asset_link_id,
            previous_slot_status=previous_sv,
            new_slot_status=new_sv,
        )

    def unassign_asset(
        self,
        assignment_id: str,
        *,
        reason: str | None = None,
    ) -> bool:
        """Unassign (tombstone) an asset assignment from a BOM slot.

        After removal, if the slot has no remaining accepted assignments,
        the slot status is recalculated and the slot may revert to partial
        or missing.

        Args:
            assignment_id: The assignment ID to remove.
            reason: Optional justification logged in the audit event.

        Returns:
            True if the assignment was found and removed; False otherwise.
        """
        assignment = self._bom_repo.get_assignment(assignment_id)
        if assignment is None:
            return False

        slot_id = assignment.slot_id
        slot = self._bom_repo.get_slot(slot_id)

        bom = self._bom_repo.get(slot.bom_id) if slot else None
        project_id = bom.project_id if bom else None

        # Tombstone the assignment
        removed = self._bom_repo.delete_assignment(assignment_id)
        if not removed:
            return False

        # Recalculate slot status based on remaining assignments
        if slot:
            remaining = self._bom_repo.list_assignments(slot_id)
            active = [
                a for a in remaining
                if _sv(a.assignment_status) != AssignmentStatus.rejected.value
            ]
            accepted = [
                a for a in active
                if _sv(a.assignment_status) in ("accepted", "canonical")
            ]
            suggested = [
                a for a in active
                if _sv(a.assignment_status) == AssignmentStatus.suggested.value
            ]

            current_sv = _sv(slot.status)
            if current_sv == BomSlotStatus.not_applicable.value:
                pass  # not_applicable is sticky
            elif not active:
                self._bom_repo.update_slot(slot_id, {"status": BomSlotStatus.missing.value})
            elif not accepted and suggested:
                self._bom_repo.update_slot(slot_id, {"status": BomSlotStatus.partial.value})
            elif accepted:
                # Keep in_progress / complete — coverage service will recalc on read
                pass

        # Emit audit event
        self._audit.emit(
            "bom_slot_filled",  # type: ignore[arg-type]
            "slot",
            slot_id,
            project_id=project_id,
            payload={
                "action": "unassigned",
                "assignment_id": assignment_id,
                "asset_id": _sv(assignment.asset_id),
                "reason": reason,
            },
        )

        return True

    def update_assignment_status(
        self,
        assignment_id: str,
        new_status: AssignmentStatus,
    ) -> BomAssignment | None:
        """Change the assignment_status of an existing assignment.

        Emits a bom_slot_filled audit event and recalculates slot status
        if the change is significant.

        Args:
            assignment_id: The assignment to update.
            new_status: The target AssignmentStatus.

        Returns:
            Updated BomAssignment, or None if not found.
        """
        assignment = self._bom_repo.get_assignment(assignment_id)
        if assignment is None:
            return None

        old_sv = _sv(assignment.assignment_status)
        new_sv = _sv(new_status)

        updated = self._bom_repo.update_assignment_status(assignment_id, new_sv)
        if updated is None:
            return None

        # Advance slot status if upgrading to accepted/canonical
        slot = self._bom_repo.get_slot(assignment.slot_id)
        if slot:
            slot_sv = _sv(slot.status)
            if new_sv in ("accepted", "canonical") and slot_sv == BomSlotStatus.partial.value:
                self._bom_repo.update_slot(
                    assignment.slot_id,
                    {"status": BomSlotStatus.in_progress.value},
                )

        # Emit audit event
        bom = self._bom_repo.get(slot.bom_id) if slot else None
        self._audit.emit(
            "bom_slot_filled",  # type: ignore[arg-type]
            "slot",
            assignment.slot_id,
            project_id=bom.project_id if bom else None,
            payload={
                "action": "assignment_status_updated",
                "assignment_id": assignment_id,
                "old_status": old_sv,
                "new_status": new_sv,
            },
        )

        return updated

    # ------------------------------------------------------------------
    # BOM-BE-006: Gap Recommendations
    # ------------------------------------------------------------------

    def get_gap_recommendations(
        self,
        bom_id: str,
        *,
        critical_only: bool = False,
        statuses: set[str] | None = None,
    ) -> GapRecommendationsResponse:
        """Generate deterministic gap recommendations for a BOM.

        Gaps = slots with status in {missing, stale, partial, blocked}.
        stale and blocked count as gaps even if an asset is assigned.

        IntentTree task creation is NEVER automatic.  Each recommendation
        carries a ``draft_task_suggestion`` payload that the UI must present
        to the user for explicit acceptance before creating any task.

        Args:
            bom_id: The BOM to analyse.
            critical_only: When True, only required slots are included.
            statuses: Optional set of status strings to filter to.

        Returns:
            GapRecommendationsResponse with suggestions (never auto-created).

        Raises:
            ValueError: If the BOM is not found.
        """
        bom = self._bom_repo.get(bom_id)
        if bom is None:
            raise ValueError(f"BOM '{bom_id}' not found.")

        slots = self._bom_repo.list_slots(bom_id)

        _gap_statuses = {
            BomSlotStatus.missing.value,
            BomSlotStatus.stale.value,
            BomSlotStatus.blocked.value,
            BomSlotStatus.partial.value,
        }
        if statuses:
            _gap_statuses = _gap_statuses & statuses

        gap_slots = [
            s for s in slots
            if _sv(s.status) in _gap_statuses
        ]

        if critical_only:
            gap_slots = [s for s in gap_slots if s.required]

        recommendations: list[GapRecommendation] = []
        critical_count = 0

        for slot in gap_slots:
            sv = _sv(slot.status)
            priority = _gap_priority(slot)
            action = _gap_action(slot)

            if slot.required and sv in (
                BomSlotStatus.missing.value,
                BomSlotStatus.stale.value,
                BomSlotStatus.blocked.value,
            ):
                critical_count += 1

            # Build a draft task suggestion (NEVER auto-created)
            draft = DraftTaskSuggestion(
                suggestion_only=True,
                title=f"[Draft] {action[:80]}",
                description=(
                    f"BOM slot '{slot.id}' in domain '{slot.domain}' "
                    f"(artifact_type={slot.artifact_type_id}) is in '{sv}' state. "
                    f"{slot.guidance or ''}"
                ).strip(),
                slot_id=slot.id,
                slot_domain=slot.domain,
                artifact_type_id=slot.artifact_type_id,
                priority=priority,
            )

            recommendations.append(
                GapRecommendation(
                    slot_id=slot.id,
                    slot_domain=slot.domain,
                    artifact_type_id=slot.artifact_type_id,
                    gap_reason=sv,
                    required=slot.required,
                    priority=priority,
                    action=action,
                    guidance=slot.guidance,
                    draft_task_suggestion=draft,
                    metadata={
                        "phase": _sv(slot.phase) if slot.phase else None,
                        "staleness_days": slot.staleness_days,
                        "min_assets": slot.min_assets,
                    },
                )
            )

        # Sort: high > medium > low, then required before optional
        _priority_order = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(
            key=lambda r: (_priority_order.get(r.priority, 9), 0 if r.required else 1)
        )

        return GapRecommendationsResponse(
            bom_id=bom_id,
            total_gaps=len(recommendations),
            critical_gaps=critical_count,
            recommendations=recommendations,
        )

    # ------------------------------------------------------------------
    # Convenience: load BOM with embedded slots
    # ------------------------------------------------------------------

    def get_bom_with_slots(self, bom_id: str) -> Bom | None:
        """Return a BOM with its slot list embedded (slot assignment counts populated)."""
        bom = self._bom_repo.get(bom_id)
        if bom is None:
            return None

        slots = self._bom_repo.list_slots(bom_id)
        for slot in slots:
            assignments = self._bom_repo.list_assignments(slot.id)
            slot.assignment_count = len(assignments)
            slot.accepted_assignment_count = sum(
                1 for a in assignments
                if _sv(a.assignment_status) in ("accepted", "canonical")
            )

        bom_dict = bom.model_dump(mode="python")
        bom_dict["slots"] = slots
        return Bom.model_validate(bom_dict)

    def get_bom_for_project(self, project_id: str) -> Bom | None:
        """Return the BOM for a project (without embedded slots)."""
        return self._bom_repo.get_for_project(project_id)

    def get_bom(self, bom_id: str) -> Bom | None:
        """Return a BOM by ID."""
        return self._bom_repo.get(bom_id)
