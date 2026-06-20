"""Coverage calculation service.

Computes BOM coverage from a list of BomSlot records. Works with both enum
values (BomSlotStatus) and plain strings for backward compatibility.
"""

from __future__ import annotations

from app.models.bom import BomSlot, CoverageSummary
from app.models.vocabulary import BomSlotStatus


def _slot_status_value(status: object) -> str:
    """Return the string value of a slot status (enum or plain str)."""
    if isinstance(status, BomSlotStatus):
        return status.value
    return str(status)


def calculate_coverage(slots: list[BomSlot]) -> CoverageSummary:
    """Compute CoverageSummary from a list of BomSlot records.

    Args:
        slots: All slots belonging to a BOM.

    Returns:
        CoverageSummary with coverage_score = required_complete / required_total.
        If there are no required slots, coverage_score is 1.0 (vacuously complete).
    """
    bom_id = slots[0].bom_id if slots else ""

    total = len(slots)
    filled = 0
    missing = 0
    stale = 0
    blocked = 0
    not_applicable = 0
    required_slots: list[BomSlot] = []
    complete_required: list[BomSlot] = []

    for slot in slots:
        sv = _slot_status_value(slot.status)
        if sv == BomSlotStatus.not_applicable.value:
            not_applicable += 1
            continue
        if slot.required:
            required_slots.append(slot)
            if sv == BomSlotStatus.complete.value:
                complete_required.append(slot)

        if sv in (BomSlotStatus.complete.value, BomSlotStatus.in_progress.value):
            filled += 1
        elif sv == BomSlotStatus.missing.value:
            missing += 1
        elif sv == BomSlotStatus.stale.value:
            stale += 1
        elif sv == BomSlotStatus.blocked.value:
            blocked += 1

    score = len(complete_required) / len(required_slots) if required_slots else 1.0

    return CoverageSummary(
        bom_id=bom_id,
        coverage_score=score,
        total_slots=total,
        required_slots=len(required_slots),
        filled_slots=filled,
        missing_slots=missing,
        stale_slots=stale,
        blocked_slots=blocked,
        not_applicable_slots=not_applicable,
    )
