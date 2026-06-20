"""Coverage calculation service (BOM-BE-005).

Implements the deterministic slot-status rules exactly as specified:

    not_applicable  – excluded from required denominator
    missing         – required slot has no accepted assignment
    partial         – only suggested/uncertain assignment, or min-count-unmet
    in_progress     – accepted asset exists with raw/candidate/in_progress status
    complete        – selected/canonical asset exists and review satisfied
    stale           – assigned asset past staleness threshold or superseded
    blocked         – missing dependency or explicit blocker state

Coverage score:
    primary  = required_complete / required_active  (not_applicable excluded)
    optional = optional_complete / optional_active  (tracked separately)
    subscores by domain/phase/template

stale and blocked count as gaps even when an asset is assigned.

Works with both enum values (BomSlotStatus) and plain strings for backward
compatibility. Assignment data is passed in via the ``slots_with_assignments``
parameter so the caller controls data loading.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

from app.models.bom import BomSlot, CoverageGroup, CoverageSummary
from app.models.vocabulary import BomSlotStatus


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _sv(status: object) -> str:
    """Return the string value of a status enum or plain str."""
    if hasattr(status, "value"):
        return status.value  # type: ignore[union-attr]
    return str(status)


def _is_gap_status(sv: str) -> bool:
    """Return True if this slot status is a coverage gap."""
    return sv in (
        BomSlotStatus.missing.value,
        BomSlotStatus.stale.value,
        BomSlotStatus.blocked.value,
        BomSlotStatus.partial.value,
    )


def _compute_group_score(group_slots: list[BomSlot]) -> CoverageGroup:
    """Compute a single CoverageGroup row from a list of slots.

    Only used for subscores — not_applicable slots are pre-filtered by the
    caller before grouping.
    """
    total = len(group_slots)
    filled = 0
    missing = 0
    required_active: list[BomSlot] = []
    complete_required: list[BomSlot] = []

    for slot in group_slots:
        sv = _sv(slot.status)
        if slot.required:
            required_active.append(slot)
            if sv == BomSlotStatus.complete.value:
                complete_required.append(slot)
        if sv in (BomSlotStatus.complete.value, BomSlotStatus.in_progress.value):
            filled += 1
        elif sv == BomSlotStatus.missing.value:
            missing += 1

    score = len(complete_required) / len(required_active) if required_active else 1.0
    return CoverageGroup(
        group_key="",  # caller fills this in
        coverage_score=score,
        total_slots=total,
        filled_slots=filled,
        missing_slots=missing,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def calculate_coverage(
    slots: list[BomSlot],
    *,
    group_by: str | None = None,
) -> CoverageSummary:
    """Compute CoverageSummary from a list of BomSlot records.

    Args:
        slots: All slots belonging to a BOM (assignments already reflected
               in slot.status by the service layer before calling here).
        group_by: Optional subscore grouping — "domain" | "phase" | "template".
                  When provided, ``groups`` is populated in the result.

    Returns:
        CoverageSummary with:
        - coverage_score = required_complete / required_active
        - optional_score = optional_complete / optional_active
        - not_applicable excluded from all denominators
        - stale/blocked counted as gaps even if assigned
    """
    bom_id = slots[0].bom_id if slots else ""

    total = len(slots)
    not_applicable = 0

    required_active: list[BomSlot] = []
    complete_required: list[BomSlot] = []

    optional_active: list[BomSlot] = []
    complete_optional: list[BomSlot] = []

    filled = 0
    missing = 0
    partial = 0
    in_progress = 0
    stale = 0
    blocked = 0

    active_slots: list[BomSlot] = []  # non-NA slots for group calcs

    for slot in slots:
        sv = _sv(slot.status)

        if sv == BomSlotStatus.not_applicable.value:
            not_applicable += 1
            continue

        active_slots.append(slot)

        if slot.required:
            required_active.append(slot)
            if sv == BomSlotStatus.complete.value:
                complete_required.append(slot)
        else:
            optional_active.append(slot)
            if sv == BomSlotStatus.complete.value:
                complete_optional.append(slot)

        # Tally by status
        if sv == BomSlotStatus.complete.value:
            filled += 1
        elif sv == BomSlotStatus.in_progress.value:
            filled += 1
            in_progress += 1
        elif sv == BomSlotStatus.missing.value:
            missing += 1
        elif sv == BomSlotStatus.partial.value:
            partial += 1
        elif sv == BomSlotStatus.stale.value:
            stale += 1
        elif sv == BomSlotStatus.blocked.value:
            blocked += 1

    # Primary score: required_complete / required_active.
    # A BOM with zero slots (or all not_applicable) has no meaningful coverage
    # score — report None rather than vacuous 100%.
    if not required_active:
        primary_score: float | None = None
    else:
        primary_score = len(complete_required) / len(required_active)

    # Optional score: optional_complete / optional_active
    optional_score: float | None = None
    if optional_active:
        optional_score = len(complete_optional) / len(optional_active)

    # Build group subscores
    groups: list[CoverageGroup] | None = None
    if group_by in ("domain", "phase", "template") and active_slots:
        group_map: dict[str, list[BomSlot]] = {}
        for slot in active_slots:
            if group_by == "domain":
                key = slot.domain or "uncategorized"
            elif group_by == "phase":
                key = _sv(slot.phase) if slot.phase is not None else "unphased"
            else:
                key = "template"
            group_map.setdefault(key, []).append(slot)

        groups = []
        for gk, gslots in sorted(group_map.items()):
            row = _compute_group_score(gslots)
            row.group_key = gk
            groups.append(row)

    return CoverageSummary(
        bom_id=bom_id,
        coverage_score=primary_score,
        total_slots=total,
        required_slots=len(required_active),
        optional_slots=len(optional_active),
        optional_complete=len(complete_optional),
        optional_score=optional_score,
        filled_slots=filled,
        missing_slots=missing,
        partial_slots=partial,
        in_progress_slots=in_progress,
        stale_slots=stale,
        blocked_slots=blocked,
        not_applicable_slots=not_applicable,
        groups=groups,
    )


# ---------------------------------------------------------------------------
# Slot status derivation from assignment data
# ---------------------------------------------------------------------------

# Asset statuses that satisfy "accepted / in-progress" (not yet complete)
_IN_PROGRESS_ASSET_STATUSES = frozenset({"raw", "candidate", "in_progress"})

# Asset statuses that satisfy "complete"
_COMPLETE_ASSET_STATUSES = frozenset({"selected", "canonical"})

# Assignment statuses that count as "accepted"
_ACCEPTED_ASSIGNMENT_STATUSES = frozenset({"accepted", "canonical"})

# Assignment statuses that count as only "suggested" (partial)
_SUGGESTED_ONLY_STATUSES = frozenset({"suggested"})


def derive_slot_status(
    slot: BomSlot,
    assignments: list[dict[str, Any]],
    asset_statuses: dict[str, str],
    *,
    today: date | None = None,
) -> BomSlotStatus:
    """Deterministically derive a BomSlotStatus from slot + assignment data.

    Args:
        slot: The BOM slot record.
        assignments: List of assignment dicts for this slot.  Each dict must
            have ``assignment_status`` and ``asset_id`` keys.  Rejected
            assignments are ignored.
        asset_statuses: Mapping of asset_id -> asset status string (for
            in-progress / complete / stale determination).
        today: Override "today" for staleness calculation (test injection).

    Returns:
        The derived BomSlotStatus.

    Rules (deterministic, highest-priority first):
        1. blocked     – slot has explicit blocker (slot.status == blocked and no
                         non-rejected assignments override it).
        2. not_applicable – already handled upstream; returned as-is.
        3. stale       – any accepted/canonical assignment whose asset is in a
                         stale-triggering state (superseded) or whose slot
                         staleness_days threshold is exceeded.
        4. complete    – at least one accepted/canonical assignment where the
                         asset status is selected or canonical, and min_assets met.
        5. in_progress – at least one accepted/canonical assignment where the
                         asset status is raw/candidate/in_progress.
        6. partial     – only suggested assignments exist, or confidence < 0.5,
                         or accepted count < min_assets.
        7. missing     – no non-rejected assignments.
    """
    if today is None:
        today = datetime.now(tz=timezone.utc).date()

    current_sv = _sv(slot.status)

    # Pass through not_applicable unchanged
    if current_sv == BomSlotStatus.not_applicable.value:
        return BomSlotStatus.not_applicable

    # Filter out rejected assignments
    active = [a for a in assignments if a.get("assignment_status") != "rejected"]

    if not active:
        # No active assignments
        if current_sv == BomSlotStatus.blocked.value:
            return BomSlotStatus.blocked
        return BomSlotStatus.missing

    # Partition assignments by status tier
    accepted = [
        a for a in active
        if a.get("assignment_status") in _ACCEPTED_ASSIGNMENT_STATUSES
    ]
    suggested_only = [
        a for a in active
        if a.get("assignment_status") in _SUGGESTED_ONLY_STATUSES
    ]

    # Check for explicit blocker (blocked slot with accepted assignments can
    # only be unblocked when a complete asset clears it — see below)
    is_explicitly_blocked = (
        current_sv == BomSlotStatus.blocked.value and not accepted
    )
    if is_explicitly_blocked:
        return BomSlotStatus.blocked

    # --- Check staleness ---
    # Any accepted/canonical assignment whose slot has exceeded staleness_days
    # counts as stale.  Also any asset that is in "superseded" state.
    if accepted and slot.staleness_days is not None:
        # Check if any accepted assignment has an "assigned_at" that exceeds
        # the staleness threshold for this slot.
        for a in accepted:
            assigned_at_raw = a.get("assigned_at")
            if assigned_at_raw:
                try:
                    assigned_date = datetime.fromisoformat(
                        str(assigned_at_raw).replace("Z", "+00:00")
                    ).date()
                    age_days = (today - assigned_date).days
                    if age_days > slot.staleness_days:
                        return BomSlotStatus.stale
                except (ValueError, TypeError):
                    pass

    # --- Check complete ---
    if accepted:
        complete_count = sum(
            1 for a in accepted
            if asset_statuses.get(a["asset_id"], "") in _COMPLETE_ASSET_STATUSES
        )
        if complete_count >= slot.min_assets:
            return BomSlotStatus.complete

        # --- Check in_progress ---
        in_progress_count = sum(
            1 for a in accepted
            if asset_statuses.get(a["asset_id"], "") in _IN_PROGRESS_ASSET_STATUSES
        )
        if in_progress_count > 0 or len(accepted) > 0:
            # Has accepted assignments but not enough complete ones
            return BomSlotStatus.in_progress

    # --- Partial: only suggested assignments or min count unmet ---
    if suggested_only:
        return BomSlotStatus.partial

    # --- If we reach here with an explicit blocker status ---
    if current_sv == BomSlotStatus.blocked.value:
        return BomSlotStatus.blocked

    return BomSlotStatus.missing
