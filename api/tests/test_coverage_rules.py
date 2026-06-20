"""BOM-BE-004/005/006 coverage and assignment rule tests.

Tests:
  - test_slot_assignment_updates_coverage
  - test_stale_and_not_applicable_coverage_rules
  - test_gap_task_creation_is_suggestion_only
  - test_all_seven_slot_statuses (missing/partial/in_progress/complete/stale/blocked/not_applicable)
  - test_optional_score_tracked_separately
  - test_coverage_subscores_by_domain
  - test_assign_asset_creates_link_and_event
  - test_unassign_reverts_slot_to_missing
  - test_update_assignment_status_advances_slot
"""

from __future__ import annotations

import shutil
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_DIR = REPO_ROOT / "registry"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def tmp_registry(tmp_path: Path) -> Path:
    """Isolated temp registry dir with seed JSONL files."""
    reg = tmp_path / "registry"
    reg.mkdir()
    for jsonl in REGISTRY_DIR.glob("*.jsonl"):
        shutil.copy(jsonl, reg / jsonl.name)
    return reg


@pytest.fixture()
def empty_registry(tmp_path: Path) -> Path:
    reg = tmp_path / "registry"
    reg.mkdir()
    return reg


def _make_slot(
    bom_id: str = "bom_test",
    status: str = "missing",
    required: bool = True,
    min_assets: int = 1,
    staleness_days: int | None = None,
    domain: str = "engineering",
    artifact_type_id: str = "spec",
    phase: str | None = None,
) -> "BomSlot":  # noqa: F821
    from app.models.bom import BomSlot
    from app.models.vocabulary import BomSlotStatus

    return BomSlot(
        id=f"slot_{uuid.uuid4().hex[:8]}",
        bom_id=bom_id,
        artifact_type_id=artifact_type_id,
        domain=domain,
        required=required,
        status=BomSlotStatus(status),
        min_assets=min_assets,
        staleness_days=staleness_days,
        phase=phase,  # type: ignore[arg-type]
    )


# ---------------------------------------------------------------------------
# BOM-BE-005: All 7 slot statuses produce correct coverage scores
# ---------------------------------------------------------------------------


class TestAllSevenSlotStatuses:
    """test_all_seven_slot_statuses: each BomSlotStatus affects coverage correctly."""

    def test_missing_slot_counted_as_gap(self) -> None:
        from app.services.coverage import calculate_coverage

        slot = _make_slot(status="missing", required=True)
        summary = calculate_coverage([slot])
        assert summary.coverage_score == 0.0
        assert summary.missing_slots == 1
        assert summary.required_slots == 1

    def test_partial_slot_counted_as_gap(self) -> None:
        from app.services.coverage import calculate_coverage

        slot = _make_slot(status="partial", required=True)
        summary = calculate_coverage([slot])
        assert summary.coverage_score == 0.0
        assert summary.partial_slots == 1

    def test_in_progress_slot_counted_as_filled(self) -> None:
        from app.services.coverage import calculate_coverage

        slot = _make_slot(status="in_progress", required=True)
        summary = calculate_coverage([slot])
        # in_progress is filled but not complete — primary score still 0
        assert summary.coverage_score == 0.0
        assert summary.filled_slots == 1
        assert summary.in_progress_slots == 1

    def test_complete_slot_raises_score_to_1(self) -> None:
        from app.services.coverage import calculate_coverage

        slot = _make_slot(status="complete", required=True)
        summary = calculate_coverage([slot])
        assert summary.coverage_score == 1.0
        assert summary.filled_slots == 1

    def test_stale_slot_counted_as_gap(self) -> None:
        from app.services.coverage import calculate_coverage

        slot = _make_slot(status="stale", required=True)
        summary = calculate_coverage([slot])
        assert summary.coverage_score == 0.0
        assert summary.stale_slots == 1

    def test_blocked_slot_counted_as_gap(self) -> None:
        from app.services.coverage import calculate_coverage

        slot = _make_slot(status="blocked", required=True)
        summary = calculate_coverage([slot])
        assert summary.coverage_score == 0.0
        assert summary.blocked_slots == 1

    def test_not_applicable_excluded_from_denominator(self) -> None:
        from app.services.coverage import calculate_coverage

        slot_na = _make_slot(status="not_applicable", required=True)
        summary = calculate_coverage([slot_na])
        # No required active slots -> coverage_score is None (not vacuous 100%)
        assert summary.coverage_score is None
        assert summary.not_applicable_slots == 1
        assert summary.required_slots == 0

    def test_not_applicable_excluded_with_other_slots(self) -> None:
        from app.services.coverage import calculate_coverage

        slot_na = _make_slot(status="not_applicable", required=True)
        slot_complete = _make_slot(status="complete", required=True)
        slot_missing = _make_slot(status="missing", required=True)
        summary = calculate_coverage([slot_na, slot_complete, slot_missing])
        # 1 complete out of 2 required active (na excluded)
        assert summary.required_slots == 2
        assert abs(summary.coverage_score - 0.5) < 1e-9
        assert summary.not_applicable_slots == 1


# ---------------------------------------------------------------------------
# BOM-BE-005: test_stale_and_not_applicable_coverage_rules
# ---------------------------------------------------------------------------


class TestStaleAndNotApplicable:
    """test_stale_and_not_applicable_coverage_rules"""

    def test_stale_counts_as_gap_even_when_assigned(self) -> None:
        """stale slot does NOT contribute to coverage_score."""
        from app.services.coverage import calculate_coverage

        # Mix: 1 complete + 1 stale
        slot_complete = _make_slot(status="complete", required=True)
        slot_stale = _make_slot(status="stale", required=True)
        summary = calculate_coverage([slot_complete, slot_stale])
        # Only complete slot counted — stale is NOT complete
        assert summary.required_slots == 2
        assert abs(summary.coverage_score - 0.5) < 1e-9
        assert summary.stale_slots == 1

    def test_not_applicable_does_not_inflate_denominator(self) -> None:
        from app.services.coverage import calculate_coverage

        slot_na = _make_slot(status="not_applicable", required=True)
        slot_complete = _make_slot(status="complete", required=True)
        summary = calculate_coverage([slot_na, slot_complete])
        # Only 1 required active (na excluded) -> score = 1.0
        assert summary.coverage_score == 1.0
        assert summary.required_slots == 1

    def test_derive_slot_status_stale_by_threshold(self) -> None:
        """derive_slot_status returns stale when staleness_days exceeded."""
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="in_progress", required=True, staleness_days=30)
        # Simulate assignment made 60 days ago
        old_date = datetime(2025, 1, 1, tzinfo=timezone.utc)
        assignment = {
            "assignment_status": "accepted",
            "asset_id": "asset_001",
            "assigned_at": old_date.isoformat(),
        }
        asset_statuses = {"asset_001": "candidate"}

        derived = derive_slot_status(
            slot,
            [assignment],
            asset_statuses,
            today=date(2025, 3, 15),  # 73 days later > 30 days
        )
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.stale

    def test_derive_slot_status_not_stale_within_threshold(self) -> None:
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="in_progress", required=True, staleness_days=90)
        recent_date = datetime(2025, 1, 1, tzinfo=timezone.utc)
        assignment = {
            "assignment_status": "accepted",
            "asset_id": "asset_001",
            "assigned_at": recent_date.isoformat(),
        }
        asset_statuses = {"asset_001": "candidate"}
        # 30 days later — within 90-day threshold
        derived = derive_slot_status(
            slot,
            [assignment],
            asset_statuses,
            today=date(2025, 1, 31),
        )
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.in_progress


# ---------------------------------------------------------------------------
# BOM-BE-004: test_slot_assignment_updates_coverage
# ---------------------------------------------------------------------------


class TestSlotAssignmentUpdatesCoverage:
    """test_slot_assignment_updates_coverage"""

    def test_assign_suggested_moves_missing_to_partial(self, tmp_registry: Path) -> None:
        from app.models.vocabulary import AssignmentStatus, BomSlotStatus
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_asc", "proj_asc", "ASC BOM")
        slot = repo.create_slot("slot_asc", bom.id, "spec", "engineering", required=True)

        result = svc.assign_asset(
            slot.id,
            "asset_xyz",
            assignment_status=AssignmentStatus.suggested,
        )

        assert result.previous_slot_status == BomSlotStatus.missing.value
        assert result.new_slot_status == BomSlotStatus.partial.value

        refreshed = repo.get_slot(slot.id)
        assert refreshed is not None
        assert refreshed.status == BomSlotStatus.partial

    def test_assign_accepted_moves_missing_to_in_progress(self, tmp_registry: Path) -> None:
        from app.models.vocabulary import AssignmentStatus, BomSlotStatus
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_accepted", "proj_accepted", "Accepted BOM")
        slot = repo.create_slot(
            "slot_accepted", bom.id, "spec", "engineering", required=True
        )

        result = svc.assign_asset(
            slot.id,
            "asset_abc",
            assignment_status=AssignmentStatus.accepted,
        )
        assert result.new_slot_status == BomSlotStatus.in_progress.value

    def test_assignment_coverage_rises_after_slot_complete(self, tmp_registry: Path) -> None:
        from app.models.vocabulary import BomSlotStatus
        from app.repositories.bom import BomRepository
        from app.services.coverage import calculate_coverage

        repo = BomRepository(tmp_registry)
        bom = repo.create("bom_cov", "proj_cov", "Cov BOM")
        slot = repo.create_slot("slot_cov", bom.id, "spec", "engineering", required=True)

        # Slot is missing -> score 0
        slots = repo.list_slots(bom.id)
        summary = calculate_coverage(slots)
        assert summary.coverage_score == 0.0

        # Mark slot complete (simulating service layer updating status)
        repo.update_slot(slot.id, {"status": BomSlotStatus.complete.value})

        slots = repo.list_slots(bom.id)
        summary = calculate_coverage(slots)
        assert summary.coverage_score == 1.0

    def test_assign_creates_audit_event(self, tmp_registry: Path) -> None:
        from app.models.vocabulary import AssignmentStatus
        from app.repositories.bom import BomRepository
        from app.services.audit import AuditService
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_evt", "proj_evt", "Evt BOM")
        slot = repo.create_slot("slot_evt", bom.id, "spec", "engineering", required=True)

        svc.assign_asset(
            slot.id, "asset_evt_001", assignment_status=AssignmentStatus.suggested
        )

        audit = AuditService(tmp_registry)
        events = audit.list_events(event_type="bom_slot_filled")
        assert any(e.target_id == slot.id for e in events)


# ---------------------------------------------------------------------------
# BOM-BE-004: assign creates asset link
# ---------------------------------------------------------------------------


class TestAssignAssetCreatesLink:
    """test_assign_asset_creates_link_and_event"""

    def test_asset_link_created_on_assign(self, tmp_registry: Path) -> None:
        from app.models.vocabulary import AssignmentStatus
        from app.repositories.assets import AssetRepository
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)
        asset_repo = AssetRepository(tmp_registry)

        bom = repo.create("bom_link", "proj_link", "Link BOM")
        slot = repo.create_slot("slot_link", bom.id, "spec", "engineering", required=True)

        # Create a real asset
        from app.models.asset import AssetCreate
        from app.models.vocabulary import AgentAccess, AssetStatus, Sensitivity, SourceKind
        from app.services.assets import AssetService

        asset_svc = AssetService(tmp_registry)
        asset = asset_svc.create_asset(
            AssetCreate(
                title="Linked Asset",
                source_kind=SourceKind.local,
                uri="file:///tmp/linked.md",
                status=AssetStatus.candidate,
                sensitivity=Sensitivity.personal,
                agent_access=AgentAccess.metadata_only,
            ),
            project_id="proj_link",
        )

        result = svc.assign_asset(
            slot.id,
            asset.id,
            assignment_status=AssignmentStatus.accepted,
        )

        assert result.asset_link_id is not None
        links = asset_repo.list_links(asset.id)
        slot_links = [
            lk for lk in links
            if lk.target_id == slot.id
        ]
        assert len(slot_links) >= 1
        assert slot_links[0].relationship.value == "satisfies_slot"


# ---------------------------------------------------------------------------
# BOM-BE-004: unassign reverts slot
# ---------------------------------------------------------------------------


class TestUnassignRevertsSlot:
    """test_unassign_reverts_slot_to_missing"""

    def test_unassign_reverts_to_missing_when_no_remaining(self, tmp_registry: Path) -> None:
        from app.models.vocabulary import AssignmentStatus, BomSlotStatus
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_unassign", "proj_unassign", "Unassign BOM")
        slot = repo.create_slot(
            "slot_unassign", bom.id, "spec", "engineering", required=True
        )

        # Assign first
        result = svc.assign_asset(
            slot.id,
            "asset_to_remove",
            assignment_status=AssignmentStatus.suggested,
        )
        assert result.new_slot_status == BomSlotStatus.partial.value

        # Unassign
        removed = svc.unassign_asset(result.assignment.id)
        assert removed is True

        refreshed = repo.get_slot(slot.id)
        assert refreshed is not None
        assert refreshed.status == BomSlotStatus.missing


# ---------------------------------------------------------------------------
# BOM-BE-004: update_assignment_status
# ---------------------------------------------------------------------------


class TestUpdateAssignmentStatus:
    """test_update_assignment_status_advances_slot"""

    def test_promote_suggested_to_accepted_advances_slot(self, tmp_registry: Path) -> None:
        from app.models.vocabulary import AssignmentStatus, BomSlotStatus
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_promote", "proj_promote", "Promote BOM")
        slot = repo.create_slot(
            "slot_promote", bom.id, "spec", "engineering", required=True
        )

        # Suggested -> partial
        result = svc.assign_asset(
            slot.id,
            "asset_promote",
            assignment_status=AssignmentStatus.suggested,
        )
        assert result.new_slot_status == BomSlotStatus.partial.value

        # Promote to accepted
        updated = svc.update_assignment_status(
            result.assignment.id, AssignmentStatus.accepted
        )
        assert updated is not None
        assert updated.assignment_status == AssignmentStatus.accepted

        refreshed = repo.get_slot(slot.id)
        assert refreshed is not None
        assert refreshed.status == BomSlotStatus.in_progress


# ---------------------------------------------------------------------------
# BOM-BE-006: test_gap_task_creation_is_suggestion_only
# ---------------------------------------------------------------------------


class TestGapTaskCreationIsSuggestionOnly:
    """test_gap_task_creation_is_suggestion_only"""

    def test_gap_recommendations_are_suggestion_only(self, tmp_registry: Path) -> None:
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_gap", "proj_gap", "Gap BOM")
        repo.create_slot("slot_gap_1", bom.id, "spec", "engineering", required=True)
        repo.create_slot(
            "slot_gap_2", bom.id, "design", "ux", required=False
        )

        recs = svc.get_gap_recommendations(bom.id)

        assert recs.bom_id == bom.id
        assert recs.total_gaps >= 1
        for rec in recs.recommendations:
            assert rec.draft_task_suggestion is not None
            # CRITICAL: suggestion_only MUST always be True
            assert rec.draft_task_suggestion.suggestion_only is True

    def test_gap_recommendations_no_auto_create(self, tmp_registry: Path) -> None:
        """Calling get_gap_recommendations MUST NOT create any IntentTree tasks."""
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService
        from app.services.audit import AuditService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_noauto", "proj_noauto", "NoAuto BOM")
        repo.create_slot("slot_noauto", bom.id, "spec", "engineering", required=True)

        # Count events before
        audit = AuditService(tmp_registry)
        events_before = audit.list_events()

        recs = svc.get_gap_recommendations(bom.id)

        # No new intenttree events should have been created
        events_after = audit.list_events()
        new_events = [e for e in events_after if e not in events_before]
        intenttree_events = [e for e in new_events if "intenttree" in str(e.event_type).lower()]
        assert len(intenttree_events) == 0, (
            "get_gap_recommendations must NEVER auto-create IntentTree tasks"
        )

    def test_critical_only_filter(self, tmp_registry: Path) -> None:
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_crit", "proj_crit", "Crit BOM")
        repo.create_slot("slot_crit_req", bom.id, "spec", "engineering", required=True)
        repo.create_slot("slot_crit_opt", bom.id, "spec", "marketing", required=False)

        recs = svc.get_gap_recommendations(bom.id, critical_only=True)
        for rec in recs.recommendations:
            assert rec.required is True

    def test_gap_priority_ordering(self, tmp_registry: Path) -> None:
        """high-priority required gaps appear before low-priority optional ones."""
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_order", "proj_order", "Order BOM")
        repo.create_slot("slot_req_1", bom.id, "spec", "engineering", required=True)
        repo.create_slot("slot_opt_1", bom.id, "design", "ux", required=False)

        recs = svc.get_gap_recommendations(bom.id)

        if len(recs.recommendations) >= 2:
            # Required (high) should come before optional (low)
            req_indices = [
                i for i, r in enumerate(recs.recommendations) if r.required
            ]
            opt_indices = [
                i for i, r in enumerate(recs.recommendations) if not r.required
            ]
            if req_indices and opt_indices:
                assert max(req_indices) < min(opt_indices) or min(req_indices) < max(opt_indices)


# ---------------------------------------------------------------------------
# BOM-BE-005: optional score tracked separately
# ---------------------------------------------------------------------------


class TestOptionalScoreTrackedSeparately:
    """test_optional_score_tracked_separately"""

    def test_optional_slots_do_not_affect_primary_score(self) -> None:
        from app.services.coverage import calculate_coverage

        req_slot = _make_slot(status="complete", required=True)
        opt_slot_missing = _make_slot(status="missing", required=False)

        summary = calculate_coverage([req_slot, opt_slot_missing])
        # Required score should be 1.0 (1 complete / 1 required)
        assert summary.coverage_score == 1.0
        # Optional score should be 0.0 (0 complete / 1 optional)
        assert summary.optional_slots == 1
        assert summary.optional_score == 0.0

    def test_optional_complete_raises_optional_score(self) -> None:
        from app.services.coverage import calculate_coverage

        req_slot = _make_slot(status="complete", required=True)
        opt_complete = _make_slot(status="complete", required=False)
        opt_missing = _make_slot(status="missing", required=False)

        summary = calculate_coverage([req_slot, opt_complete, opt_missing])
        assert summary.coverage_score == 1.0
        assert summary.optional_slots == 2
        assert summary.optional_complete == 1
        assert abs(summary.optional_score - 0.5) < 1e-9

    def test_no_optional_slots_returns_none_optional_score(self) -> None:
        from app.services.coverage import calculate_coverage

        slot = _make_slot(status="complete", required=True)
        summary = calculate_coverage([slot])
        assert summary.optional_slots == 0
        assert summary.optional_score is None


# ---------------------------------------------------------------------------
# BOM-BE-005: coverage subscores by domain
# ---------------------------------------------------------------------------


class TestCoverageSubscoresByDomain:
    """test_coverage_subscores_by_domain"""

    def test_group_by_domain_produces_subscores(self) -> None:
        from app.services.coverage import calculate_coverage

        eng_complete = _make_slot(status="complete", domain="engineering", required=True)
        eng_missing = _make_slot(status="missing", domain="engineering", required=True)
        ux_complete = _make_slot(status="complete", domain="ux", required=True)

        summary = calculate_coverage(
            [eng_complete, eng_missing, ux_complete], group_by="domain"
        )

        assert summary.groups is not None
        domains = {g.group_key for g in summary.groups}
        assert "engineering" in domains
        assert "ux" in domains

        eng_group = next(g for g in summary.groups if g.group_key == "engineering")
        ux_group = next(g for g in summary.groups if g.group_key == "ux")

        # Engineering: 1/2 = 0.5
        assert abs(eng_group.coverage_score - 0.5) < 1e-9
        # UX: 1/1 = 1.0
        assert ux_group.coverage_score == 1.0

    def test_group_by_none_produces_no_groups(self) -> None:
        from app.services.coverage import calculate_coverage

        slot = _make_slot(status="complete", required=True)
        summary = calculate_coverage([slot], group_by=None)
        assert summary.groups is None

    def test_group_by_phase_produces_phase_subscores(self) -> None:
        from app.services.coverage import calculate_coverage

        disc_slot = _make_slot(status="complete", required=True, phase="discovery")
        build_slot = _make_slot(status="missing", required=True, phase="build")

        summary = calculate_coverage([disc_slot, build_slot], group_by="phase")
        assert summary.groups is not None
        phases = {g.group_key for g in summary.groups}
        assert "discovery" in phases
        assert "build" in phases


# ---------------------------------------------------------------------------
# BOM-BE-005: derive_slot_status — complete and missing rules
# ---------------------------------------------------------------------------


class TestDeriveSlotStatus:
    def test_no_assignments_is_missing(self) -> None:
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="missing")
        derived = derive_slot_status(slot, [], {})
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.missing

    def test_suggested_assignment_is_partial(self) -> None:
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="missing")
        assignment = {"assignment_status": "suggested", "asset_id": "a1"}
        derived = derive_slot_status(slot, [assignment], {"a1": "inbox"})
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.partial

    def test_accepted_candidate_asset_is_in_progress(self) -> None:
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="missing")
        assignment = {"assignment_status": "accepted", "asset_id": "a1"}
        derived = derive_slot_status(slot, [assignment], {"a1": "candidate"})
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.in_progress

    def test_accepted_canonical_asset_is_complete(self) -> None:
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="missing")
        assignment = {"assignment_status": "canonical", "asset_id": "a1"}
        derived = derive_slot_status(slot, [assignment], {"a1": "canonical"})
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.complete

    def test_rejected_assignment_excluded(self) -> None:
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="missing")
        assignment = {"assignment_status": "rejected", "asset_id": "a1"}
        derived = derive_slot_status(slot, [assignment], {"a1": "canonical"})
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.missing

    def test_blocked_slot_with_no_accepted_stays_blocked(self) -> None:
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="blocked")
        assignment = {"assignment_status": "suggested", "asset_id": "a1"}
        derived = derive_slot_status(slot, [assignment], {"a1": "inbox"})
        # Only suggested — still blocked (blocker not resolved by suggestion alone)
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.blocked

    def test_not_applicable_slot_returned_unchanged(self) -> None:
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="not_applicable")
        derived = derive_slot_status(slot, [], {})
        from app.models.vocabulary import BomSlotStatus
        assert derived == BomSlotStatus.not_applicable

    def test_min_assets_unmet_keeps_in_progress(self) -> None:
        """If min_assets=2 but only 1 complete assignment, slot stays in_progress."""
        from app.services.coverage import derive_slot_status

        slot = _make_slot(status="in_progress", min_assets=2)
        assignment = {"assignment_status": "canonical", "asset_id": "a1"}
        derived = derive_slot_status(slot, [assignment], {"a1": "canonical"})
        from app.models.vocabulary import BomSlotStatus
        # complete_count=1 < min_assets=2 -> in_progress
        assert derived == BomSlotStatus.in_progress


# ---------------------------------------------------------------------------
# Route-level integration tests (via TestClient)
# ---------------------------------------------------------------------------


class TestBomRoutesCoverageAndGaps:
    """Integration tests for coverage and gaps endpoints (BOM-BE-005/006)."""

    def _setup(self) -> "tuple[Any, str, str, str]":  # type: ignore[return]
        import app.settings as _settings_mod
        from fastapi.testclient import TestClient

        from app.main import app
        return TestClient(app)

    def test_coverage_endpoint_returns_required_and_optional_fields(
        self, tmp_registry: Path, monkeypatch: "pytest.MonkeyPatch"
    ) -> None:
        import app.settings as _settings_mod
        from fastapi.testclient import TestClient

        from app.main import app
        from app.repositories.bom import BomRepository

        # Patch settings to point to tmp_registry
        settings = _settings_mod.Settings.__new__(_settings_mod.Settings)
        settings.registry_dir = tmp_registry
        settings.context_packs_dir = tmp_registry / "context-packs"
        settings.reports_dir = tmp_registry / "reports"
        settings.thumbnails_dir = tmp_registry / "thumbnails"
        settings.previews_dir = tmp_registry / "previews"
        settings.workspace_id = "ws_test"
        settings.workspace_name = "Test Workspace"
        settings.default_sensitivity = "personal"
        settings.default_agent_access = "metadata_only"
        settings.automated_promotion_allowed = False
        settings.agent_full_content_sensitivity_cap = ["work_sensitive"]
        settings.require_human_approval_for = ["canonical_promotion"]
        settings.bind_host = "127.0.0.1"
        settings.bind_port = 8000
        monkeypatch.setattr(_settings_mod, "_settings_instance", settings)
        _settings_mod._cached_settings.cache_clear()

        client = TestClient(app)
        repo = BomRepository(tmp_registry)
        bom = repo.create("bom_route_cov", "proj_route_cov", "Route Cov BOM")
        repo.create_slot("slot_rc_1", bom.id, "spec", "engineering", required=True)
        repo.create_slot("slot_rc_2", bom.id, "design", "ux", required=False)

        resp = client.get(f"/api/bom/{bom.id}/coverage")
        assert resp.status_code == 200
        body = resp.json()
        assert "coverage_score" in body
        assert "required_slots" in body
        assert "optional_slots" in body
        assert "stale_slots" in body
        assert "blocked_slots" in body
        assert "not_applicable_slots" in body

    def test_gaps_endpoint_returns_gaps_list(
        self, tmp_registry: Path, monkeypatch: "pytest.MonkeyPatch"
    ) -> None:
        import app.settings as _settings_mod
        from fastapi.testclient import TestClient

        from app.main import app
        from app.repositories.bom import BomRepository

        settings = _settings_mod.Settings.__new__(_settings_mod.Settings)
        settings.registry_dir = tmp_registry
        settings.context_packs_dir = tmp_registry / "context-packs"
        settings.reports_dir = tmp_registry / "reports"
        settings.thumbnails_dir = tmp_registry / "thumbnails"
        settings.previews_dir = tmp_registry / "previews"
        settings.workspace_id = "ws_test"
        settings.workspace_name = "Test Workspace"
        settings.default_sensitivity = "personal"
        settings.default_agent_access = "metadata_only"
        settings.automated_promotion_allowed = False
        settings.agent_full_content_sensitivity_cap = ["work_sensitive"]
        settings.require_human_approval_for = ["canonical_promotion"]
        settings.bind_host = "127.0.0.1"
        settings.bind_port = 8000
        monkeypatch.setattr(_settings_mod, "_settings_instance", settings)
        _settings_mod._cached_settings.cache_clear()

        client = TestClient(app)
        repo = BomRepository(tmp_registry)
        bom = repo.create("bom_route_gap", "proj_route_gap", "Route Gap BOM")
        slot = repo.create_slot("slot_rg_1", bom.id, "spec", "engineering", required=True)

        resp = client.get(f"/api/bom/{bom.id}/gaps")
        assert resp.status_code == 200
        body = resp.json()
        assert "gaps" in body
        gap_ids = [g["id"] for g in body["gaps"]]
        assert slot.id in gap_ids

    def test_gaps_with_recommendations_flag(
        self, tmp_registry: Path, monkeypatch: "pytest.MonkeyPatch"
    ) -> None:
        import app.settings as _settings_mod
        from fastapi.testclient import TestClient

        from app.main import app
        from app.repositories.bom import BomRepository

        settings = _settings_mod.Settings.__new__(_settings_mod.Settings)
        settings.registry_dir = tmp_registry
        settings.context_packs_dir = tmp_registry / "context-packs"
        settings.reports_dir = tmp_registry / "reports"
        settings.thumbnails_dir = tmp_registry / "thumbnails"
        settings.previews_dir = tmp_registry / "previews"
        settings.workspace_id = "ws_test"
        settings.workspace_name = "Test Workspace"
        settings.default_sensitivity = "personal"
        settings.default_agent_access = "metadata_only"
        settings.automated_promotion_allowed = False
        settings.agent_full_content_sensitivity_cap = ["work_sensitive"]
        settings.require_human_approval_for = ["canonical_promotion"]
        settings.bind_host = "127.0.0.1"
        settings.bind_port = 8000
        monkeypatch.setattr(_settings_mod, "_settings_instance", settings)
        _settings_mod._cached_settings.cache_clear()

        client = TestClient(app)
        repo = BomRepository(tmp_registry)
        bom = repo.create("bom_route_rec", "proj_route_rec", "Route Rec BOM")
        repo.create_slot("slot_rr_1", bom.id, "spec", "engineering", required=True)

        resp = client.get(
            f"/api/bom/{bom.id}/gaps?include_recommendations=true"
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "gaps" in body
        assert "recommendations" in body
        recs_data = body["recommendations"]
        assert "recommendations" in recs_data
        for rec in recs_data["recommendations"]:
            assert rec["draft_task_suggestion"]["suggestion_only"] is True

    def test_unassign_endpoint(
        self, tmp_registry: Path, monkeypatch: "pytest.MonkeyPatch"
    ) -> None:
        import app.settings as _settings_mod
        from fastapi.testclient import TestClient

        from app.main import app
        from app.models.vocabulary import AssignmentStatus, BomSlotStatus
        from app.repositories.bom import BomRepository
        from app.services.bom_service import BomService

        settings = _settings_mod.Settings.__new__(_settings_mod.Settings)
        settings.registry_dir = tmp_registry
        settings.context_packs_dir = tmp_registry / "context-packs"
        settings.reports_dir = tmp_registry / "reports"
        settings.thumbnails_dir = tmp_registry / "thumbnails"
        settings.previews_dir = tmp_registry / "previews"
        settings.workspace_id = "ws_test"
        settings.workspace_name = "Test Workspace"
        settings.default_sensitivity = "personal"
        settings.default_agent_access = "metadata_only"
        settings.automated_promotion_allowed = False
        settings.agent_full_content_sensitivity_cap = ["work_sensitive"]
        settings.require_human_approval_for = ["canonical_promotion"]
        settings.bind_host = "127.0.0.1"
        settings.bind_port = 8000
        monkeypatch.setattr(_settings_mod, "_settings_instance", settings)
        _settings_mod._cached_settings.cache_clear()

        client = TestClient(app)
        svc = BomService(tmp_registry)
        repo = BomRepository(tmp_registry)

        bom = repo.create("bom_unassign_r", "proj_unassign_r", "Unassign Route BOM")
        slot = repo.create_slot("slot_ur_1", bom.id, "spec", "engineering", required=True)

        result = svc.assign_asset(
            slot.id, "asset_ur_001", assignment_status=AssignmentStatus.suggested
        )
        assignment_id = result.assignment.id

        resp = client.delete(f"/api/bom/assignments/{assignment_id}")
        assert resp.status_code == 204

        refreshed = repo.get_slot(slot.id)
        assert refreshed is not None
        assert refreshed.status == BomSlotStatus.missing
