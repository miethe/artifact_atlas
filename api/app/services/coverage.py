from app.models.schemas import BomSlot, CoverageSummary


def calculate_coverage(slots: list[BomSlot]) -> CoverageSummary:
    required = [slot for slot in slots if slot.required and slot.status != "not_applicable"]
    complete = [slot for slot in required if slot.status == "complete"]
    score = len(complete) / len(required) if required else 1.0
    return CoverageSummary(
        required_total=len(required),
        required_complete=len(complete),
        coverage_score=score,
    )
