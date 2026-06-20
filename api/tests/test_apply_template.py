"""Tests for BOM-BE-001, BOM-BE-002, BOM-BE-003, BOM-BE-007.

Covers:
- Template registry loading (BOM-BE-001): seed templates load with expected counts.
- Template preview API (BOM-BE-002): slot/required/optional counts; impact preview.
- Apply template service (BOM-BE-003): creates slots, idempotency, merge conflicts.
- Template builder persistence (BOM-BE-007): draft save, update, publish gate.

Test isolation: uses ``tmp_registry`` fixture (isolated temp dir with seed data).
"""

from __future__ import annotations

import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.bom import BomRepository
from app.repositories.templates import TemplateRepository
from app.services.bom_service import BomService, _slot_key
from app.services.templates_service import TemplateService
from app.settings import get_settings

# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[2]
TEMPLATES_DIR = REPO_ROOT / "templates"


def _templates_dir() -> Path | None:
    """Return the real templates dir if it exists; else None."""
    return TEMPLATES_DIR if TEMPLATES_DIR.exists() else None


def _make_service(registry_dir: Path) -> TemplateService:
    return TemplateService(registry_dir, templates_dir=_templates_dir())


def _make_bom_service(registry_dir: Path) -> BomService:
    return BomService(registry_dir, templates_dir=_templates_dir())


def _create_project(name: str) -> str:
    slug = name.lower().replace(" ", "-")
    resp = client.post("/api/projects", json={"name": name, "slug": slug, "status": "active"})
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ===========================================================================
# BOM-BE-001: Template Registry Service
# ===========================================================================


class TestTemplateRegistryService:
    """Verify seed templates load with expected domain/slot counts (BOM-BE-001)."""

    def test_new_product_app_loads(self, tmp_registry: Path) -> None:
        """new-product-app template loads with 5 domains and 17 slots (14 required, 3 optional)."""
        svc = _make_service(tmp_registry)
        detail = svc.get_template_detail("tmpl_new_product_app_v1")
        assert detail is not None, "new-product-app template not found"
        assert detail.id == "tmpl_new_product_app_v1"
        assert detail.name == "New Product / App"

        if _templates_dir() is not None:
            domains = detail.domains or []
            assert len(domains) == 5, f"Expected 5 domains, got {len(domains)}"

            total_slots = sum(len(d.slots or []) for d in domains)
            assert total_slots == 17, f"Expected 17 slots, got {total_slots}"

            required_slots = sum(
                sum(1 for s in (d.slots or []) if s.required)
                for d in domains
            )
            assert required_slots == 14, f"Expected 14 required slots, got {required_slots}"

    def test_architecture_initiative_loads(self, tmp_registry: Path) -> None:
        """architecture-initiative template loads with 2 domains and 10 slots."""
        svc = _make_service(tmp_registry)
        detail = svc.get_template_detail("tmpl_architecture_initiative_v1")
        assert detail is not None, "architecture-initiative template not found"
        assert detail.id == "tmpl_architecture_initiative_v1"

        if _templates_dir() is not None:
            domains = detail.domains or []
            assert len(domains) == 2, f"Expected 2 domains, got {len(domains)}"

            total_slots = sum(len(d.slots or []) for d in domains)
            assert total_slots == 10, f"Expected 10 slots, got {total_slots}"

    def test_load_all_with_domains(self, tmp_registry: Path) -> None:
        """load_all_with_domains returns all registry templates."""
        svc = _make_service(tmp_registry)
        details = svc.load_all_with_domains()
        assert len(details) >= 2

        ids = {d.id for d in details}
        assert "tmpl_new_product_app_v1" in ids
        assert "tmpl_architecture_initiative_v1" in ids

    def test_list_templates_returns_both_seeds(self, tmp_registry: Path) -> None:
        """List returns both seed templates."""
        svc = _make_service(tmp_registry)
        templates = svc.list_templates()
        ids = {t.id for t in templates}
        assert "tmpl_new_product_app_v1" in ids
        assert "tmpl_architecture_initiative_v1" in ids

    def test_list_templates_filter_by_status(self, tmp_registry: Path) -> None:
        """Filtering by status returns only matching templates."""
        from app.models.vocabulary import TemplateStatus
        svc = _make_service(tmp_registry)
        core_templates = svc.list_templates(status=TemplateStatus.core)
        assert all(
            (t.status.value if hasattr(t.status, "value") else str(t.status)) == "core"
            for t in core_templates
        )

    def test_get_template_by_slug(self, tmp_registry: Path) -> None:
        """get_template_by_slug resolves correctly."""
        svc = _make_service(tmp_registry)
        t = svc.get_template_by_slug("new-product-app")
        assert t is not None
        assert t.id == "tmpl_new_product_app_v1"

    def test_domain_names_new_product_app(self, tmp_registry: Path) -> None:
        """new-product-app has the expected domain names."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")
        svc = _make_service(tmp_registry)
        detail = svc.get_template_detail("tmpl_new_product_app_v1")
        assert detail is not None
        domain_names = {d.name for d in (detail.domains or [])}
        assert "Strategy" in domain_names
        assert "Architecture" in domain_names
        assert "GTM" in domain_names

    def test_domain_names_architecture_initiative(self, tmp_registry: Path) -> None:
        """architecture-initiative has Architecture and Governance domains."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")
        svc = _make_service(tmp_registry)
        detail = svc.get_template_detail("tmpl_architecture_initiative_v1")
        assert detail is not None
        domain_names = {d.name for d in (detail.domains or [])}
        assert "Architecture" in domain_names
        assert "Governance" in domain_names


# ===========================================================================
# BOM-BE-002: Template Preview API
# ===========================================================================


class TestTemplatePreviewAPI:
    """Verify preview endpoint returns correct counts (BOM-BE-002)."""

    def test_preview_new_product_app_via_api(self, tmp_registry: Path) -> None:
        """GET /api/templates/{id}/preview returns domains and counts."""
        resp = client.get("/api/templates/tmpl_new_product_app_v1/preview")
        assert resp.status_code == 200
        body = resp.json()
        assert "template_id" in body
        assert body["template_id"] == "tmpl_new_product_app_v1"
        assert "domains" in body
        assert isinstance(body["total_slots"], int)
        assert isinstance(body["required_slots"], int)
        if _templates_dir() is not None:
            # new-product-app: 5 domains, 17 slots (14 required, 3 optional)
            assert body["total_slots"] == 17
            assert body["required_slots"] == 14

    def test_preview_architecture_initiative_via_api(self, tmp_registry: Path) -> None:
        """GET /api/templates/{id}/preview returns correct counts for arch template."""
        resp = client.get("/api/templates/tmpl_architecture_initiative_v1/preview")
        assert resp.status_code == 200
        body = resp.json()
        if _templates_dir() is not None:
            # architecture-initiative: 2 domains, 10 slots
            assert body["total_slots"] == 10

    def test_preview_not_found(self, tmp_registry: Path) -> None:
        resp = client.get("/api/templates/tmpl_does_not_exist/preview")
        assert resp.status_code == 404

    def test_preview_service_optional_slots(self, tmp_registry: Path) -> None:
        """TemplateService.build_preview calculates optional slots correctly."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")
        svc = _make_service(tmp_registry)
        preview = svc.build_preview("tmpl_new_product_app_v1")
        assert preview is not None
        optional = preview.total_slots - preview.required_slots  # type: ignore[operator]
        assert optional >= 0
        # new-product-app has 3 optional slots (ADR Log, Design System, Sales One-Pager)
        assert optional == 3

    def test_impact_preview_new_project(self, tmp_registry: Path) -> None:
        """Impact preview for a new project reports all slots as new (no conflicts)."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")
        svc = _make_service(tmp_registry)
        impact = svc.build_impact_preview("tmpl_new_product_app_v1", "proj_brand_new")
        assert impact is not None
        assert impact.conflict_slots == 0
        assert impact.new_slots == impact.total_slots
        # new-product-app: 17 slots
        assert impact.total_slots == 17

    def test_impact_preview_via_api(self, tmp_registry: Path) -> None:
        """GET /api/templates/{id}/impact returns impact payload."""
        resp = client.get(
            "/api/templates/tmpl_new_product_app_v1/impact"
            "?project_id=proj_new_no_bom"
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "new_slots" in body
        assert "conflict_slots" in body
        assert "conflict_details" in body

    def test_impact_preview_not_found(self, tmp_registry: Path) -> None:
        resp = client.get(
            "/api/templates/tmpl_nonexistent/impact?project_id=proj_x"
        )
        assert resp.status_code == 404


# ===========================================================================
# BOM-BE-003: Apply Template Service
# ===========================================================================


class TestApplyTemplateService:
    """Core tests for template application, idempotency, and merge conflicts."""

    def test_apply_template_creates_slots(self, tmp_registry: Path) -> None:
        """Applying new-product-app to a new project creates 17 slots."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")

        svc = _make_bom_service(tmp_registry)
        result = svc.apply_template("proj_apply_test_001", "tmpl_new_product_app_v1")

        assert result.bom is not None
        assert result.created_bom is True
        assert result.slots_added == 17
        assert result.slots_skipped == 0
        assert result.merge_conflicts == []

        # Verify slots in repository
        bom_repo = BomRepository(tmp_registry)
        slots = bom_repo.list_slots(result.bom.id)
        assert len(slots) == 17

    def test_apply_template_creates_bom_if_missing(self, tmp_registry: Path) -> None:
        """Applying a template to a project with no BOM creates both BOM and slots."""
        svc = _make_bom_service(tmp_registry)
        result = svc.apply_template("proj_no_bom_yet", "tmpl_new_product_app_v1")
        assert result.created_bom is True
        assert result.bom.project_id == "proj_no_bom_yet"

    def test_apply_template_idempotent(self, tmp_registry: Path) -> None:
        """Applying the same template twice does NOT duplicate slots."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")

        svc = _make_bom_service(tmp_registry)

        result1 = svc.apply_template("proj_idempotent_001", "tmpl_new_product_app_v1")
        slots_after_first = result1.slots_added

        result2 = svc.apply_template("proj_idempotent_001", "tmpl_new_product_app_v1")

        assert result2.slots_added == 0
        assert result2.slots_skipped == slots_after_first
        assert len(result2.merge_conflicts) == slots_after_first

        # Total slots in repository unchanged
        bom_repo = BomRepository(tmp_registry)
        slots = bom_repo.list_slots(result1.bom.id)
        assert len(slots) == slots_after_first

    def test_apply_second_template_merges_without_duplicate(self, tmp_registry: Path) -> None:
        """Applying two different templates adds only non-conflicting slots."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")

        svc = _make_bom_service(tmp_registry)
        r1 = svc.apply_template("proj_merge_001", "tmpl_new_product_app_v1")
        r2 = svc.apply_template("proj_merge_001", "tmpl_architecture_initiative_v1")

        bom_repo = BomRepository(tmp_registry)
        all_slots = bom_repo.list_slots(r1.bom.id)

        # architecture-initiative has an 'Architecture' domain with some overlapping
        # artifact types (e.g. ADR Log). Confirm no duplicates exist.
        seen: set[tuple[str, str]] = set()
        for s in all_slots:
            key = (s.domain.lower(), s.artifact_type_id.lower())
            assert key not in seen, f"Duplicate slot detected: {key}"
            seen.add(key)

        # Total = first template slots + net-new from second template
        assert len(all_slots) == r1.slots_added + r2.slots_added

    def test_apply_template_merge_conflict_report(self, tmp_registry: Path) -> None:
        """Merge conflicts are reported accurately (not silently dropped)."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")

        svc = _make_bom_service(tmp_registry)
        r1 = svc.apply_template("proj_conflict_001", "tmpl_new_product_app_v1")
        result = svc.apply_template("proj_conflict_001", "tmpl_new_product_app_v1")

        # All slots should be conflicts on second apply
        expected = r1.slots_added
        assert result.slots_skipped == expected
        assert len(result.merge_conflicts) == expected
        for conflict in result.merge_conflicts:
            assert "domain" in conflict
            assert "artifact_type_id" in conflict
            assert conflict["reason"] == "slot_already_exists"

    def test_apply_template_invalid_template_raises(self, tmp_registry: Path) -> None:
        """Applying a non-existent template raises ValueError."""
        svc = _make_bom_service(tmp_registry)
        with pytest.raises(ValueError, match="not found"):
            svc.apply_template("proj_x", "tmpl_does_not_exist")

    def test_apply_template_source_templates_updated(self, tmp_registry: Path) -> None:
        """BOM source_templates list is updated after template application."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")

        svc = _make_bom_service(tmp_registry)
        r1 = svc.apply_template("proj_sources_001", "tmpl_new_product_app_v1")
        r2 = svc.apply_template("proj_sources_001", "tmpl_architecture_initiative_v1")

        bom_repo = BomRepository(tmp_registry)
        bom = bom_repo.get(r1.bom.id)
        assert bom is not None
        assert "tmpl_new_product_app_v1" in (bom.source_templates or [])
        assert "tmpl_architecture_initiative_v1" in (bom.source_templates or [])

    def test_apply_template_emits_audit_event(self, tmp_registry: Path) -> None:
        """apply_template emits a bom_template_applied audit event."""
        from app.services.audit import AuditService
        svc = _make_bom_service(tmp_registry)
        svc.apply_template("proj_audit_001", "tmpl_new_product_app_v1")

        audit = AuditService(tmp_registry)
        events = audit.list_events(event_type="bom_template_applied")
        assert len(events) >= 1
        latest = events[0]
        assert latest.event_type.value == "bom_template_applied"
        assert latest.payload is not None
        assert latest.payload["template_id"] == "tmpl_new_product_app_v1"

    def test_apply_template_via_api_creates_slots(self, tmp_registry: Path) -> None:
        """POST /api/projects/{id}/bom/apply-template creates BOM and returns it."""
        pid = _create_project("ApplyTemplateAPI")
        resp = client.post(
            f"/api/projects/{pid}/bom/apply-template",
            json={"template_id": "tmpl_new_product_app_v1"},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["project_id"] == pid
        assert "slots" in body

        if _templates_dir() is not None:
            # new-product-app: 17 slots
            assert len(body["slots"]) == 17

    def test_apply_template_via_api_idempotent(self, tmp_registry: Path) -> None:
        """Calling apply-template twice via API does not duplicate slots."""
        pid = _create_project("ApplyIdempotentAPI")

        resp1 = client.post(
            f"/api/projects/{pid}/bom/apply-template",
            json={"template_id": "tmpl_new_product_app_v1"},
        )
        assert resp1.status_code == 200

        resp2 = client.post(
            f"/api/projects/{pid}/bom/apply-template",
            json={"template_id": "tmpl_new_product_app_v1"},
        )
        assert resp2.status_code == 200

        body1 = resp1.json()
        body2 = resp2.json()

        if _templates_dir() is not None:
            # Slot count must be identical (no duplication)
            assert len(body2["slots"]) == len(body1["slots"])

    def test_apply_template_not_found_returns_404(self, tmp_registry: Path) -> None:
        """Applying a non-existent template returns 404."""
        pid = _create_project("ApplyMissing")
        resp = client.post(
            f"/api/projects/{pid}/bom/apply-template",
            json={"template_id": "tmpl_does_not_exist"},
        )
        assert resp.status_code == 404

    def test_slot_key_determinism(self) -> None:
        """_slot_key is stable for same domain/artifact_type_id regardless of casing."""
        k1 = _slot_key("bom_1", "Architecture", "api_specification")
        k2 = _slot_key("bom_1", "architecture", "api_specification")
        k3 = _slot_key("bom_1", "ARCHITECTURE", "API_Specification")
        assert k1 == k2 == k3

    def test_get_bom_with_slots(self, tmp_registry: Path) -> None:
        """get_bom_with_slots returns BOM with embedded slot list."""
        svc = _make_bom_service(tmp_registry)
        bom_repo = BomRepository(tmp_registry)
        bom = bom_repo.create("bom_test_slots", "proj_slot_test", "Test BOM")
        bom_repo.create_slot("slot_s1", bom.id, "prd", "product", required=True)

        result = svc.get_bom_with_slots(bom.id)
        assert result is not None
        assert result.slots is not None
        assert len(result.slots) == 1
        assert result.slots[0].artifact_type_id == "prd"

    def test_get_bom_with_slots_assignment_counts(self, tmp_registry: Path) -> None:
        """Slot assignment counts are populated correctly."""
        from app.models.bom import SlotAssignRequest
        from app.models.vocabulary import AssignmentStatus
        svc = _make_bom_service(tmp_registry)
        bom_repo = BomRepository(tmp_registry)
        bom = bom_repo.create("bom_asn_count", "proj_asn_count", "Assignment Count BOM")
        slot = bom_repo.create_slot("slot_asn_1", bom.id, "spec", "engineering", required=True)

        req = SlotAssignRequest(
            asset_id="asset_x",
            slot_id=slot.id,
            assignment_status=AssignmentStatus.accepted,
        )
        bom_repo.create_assignment("asn_1", req, assigned_by="user")

        result = svc.get_bom_with_slots(bom.id)
        assert result is not None
        slot_result = next(s for s in result.slots if s.id == slot.id)  # type: ignore[union-attr]
        assert slot_result.assignment_count == 1
        assert slot_result.accepted_assignment_count == 1


# ===========================================================================
# BOM-BE-007: Template Builder Persistence
# ===========================================================================


class TestTemplateBuilderPersistence:
    """Draft template save, update, and publish gate (BOM-BE-007)."""

    def test_create_draft_template(self, tmp_registry: Path) -> None:
        """Creating a template via service always sets status to experimental (draft)."""
        from app.models.template import TemplateCreate
        from app.models.vocabulary import TemplateStatus, TemplateType
        svc = _make_service(tmp_registry)
        data = TemplateCreate(
            name="My Custom Template",
            slug="my-custom-template",
            template_type=TemplateType.custom,
            description="A custom draft template.",
        )
        template_id = "tmpl_custom_draft_001"
        t = svc.create_draft(data, template_id)

        assert t.id == template_id
        sv = t.status.value if hasattr(t.status, "value") else str(t.status)
        assert sv == TemplateStatus.experimental.value, (
            f"Draft template should be experimental, got {sv}"
        )

    def test_update_draft_template(self, tmp_registry: Path) -> None:
        """Draft templates can be updated (name, description, etc.)."""
        from app.models.template import TemplateCreate, TemplateUpdate
        from app.models.vocabulary import TemplateType
        svc = _make_service(tmp_registry)
        data = TemplateCreate(
            name="Updatable Draft",
            slug="updatable-draft",
            template_type=TemplateType.custom,
        )
        t = svc.create_draft(data, "tmpl_update_draft_001")
        updated = svc.update_template(t.id, TemplateUpdate(name="Updated Draft Name"))
        assert updated is not None
        assert updated.name == "Updated Draft Name"

    def test_publish_draft_template_explicit_gate(self, tmp_registry: Path) -> None:
        """Publishing requires an explicit publish_template call; draft stays draft otherwise."""
        from app.models.template import TemplateCreate
        from app.models.vocabulary import TemplateStatus, TemplateType
        svc = _make_service(tmp_registry)
        data = TemplateCreate(
            name="Publishable Draft",
            slug="publishable-draft",
            template_type=TemplateType.product,
        )
        t = svc.create_draft(data, "tmpl_publish_gate_001")

        # Verify still draft before publishing
        before = svc.get_template(t.id)
        assert before is not None
        sv_before = before.status.value if hasattr(before.status, "value") else str(before.status)
        assert sv_before == TemplateStatus.experimental.value

        # Explicit publish
        published = svc.publish_template(t.id)
        assert published is not None
        sv_after = published.status.value if hasattr(published.status, "value") else str(published.status)
        assert sv_after == TemplateStatus.recommended.value

    def test_publish_already_published_is_idempotent(self, tmp_registry: Path) -> None:
        """Publishing an already-published template returns it unchanged."""
        svc = _make_service(tmp_registry)
        # Core template is already published
        published = svc.publish_template("tmpl_new_product_app_v1")
        assert published is not None
        sv = published.status.value if hasattr(published.status, "value") else str(published.status)
        # core status should be unchanged (not downgraded)
        assert sv == "core"

    def test_publish_template_via_api(self, tmp_registry: Path) -> None:
        """POST /api/templates/{id}/publish transitions a draft to recommended."""
        # First create a draft via API
        resp = client.post(
            "/api/templates",
            json={
                "name": "API Draft Template",
                "slug": "api-draft-template",
                "template_type": "custom",
                "status": "experimental",
            },
        )
        assert resp.status_code == 201, resp.text
        tmpl_id = resp.json()["id"]
        sv = resp.json()["status"]
        assert sv == "experimental"

        # Publish via API
        pub_resp = client.post(f"/api/templates/{tmpl_id}/publish")
        assert pub_resp.status_code == 200, pub_resp.text
        assert pub_resp.json()["status"] == "recommended"

    def test_create_template_via_api_is_draft(self, tmp_registry: Path) -> None:
        """POST /api/templates always creates with experimental (draft) status."""
        resp = client.post(
            "/api/templates",
            json={
                "name": "Another Draft",
                "slug": "another-draft-slug",
                "template_type": "custom",
            },
        )
        assert resp.status_code == 201
        # Even if caller requests a different status, it's set to experimental
        assert resp.json()["status"] == "experimental"

    def test_draft_template_not_found_publish(self, tmp_registry: Path) -> None:
        """Publishing a non-existent template returns 404."""
        resp = client.post("/api/templates/tmpl_nonexistent_9999/publish")
        assert resp.status_code == 404

    def test_duplicate_template_is_draft(self, tmp_registry: Path) -> None:
        """Duplicating a published template creates a new draft copy."""
        svc = _make_service(tmp_registry)
        dup = svc.duplicate_template("tmpl_new_product_app_v1", name="My Draft Copy")
        assert dup is not None
        sv = dup.status.value if hasattr(dup.status, "value") else str(dup.status)
        assert sv == "experimental"
        assert dup.name == "My Draft Copy"

    def test_duplicate_via_api(self, tmp_registry: Path) -> None:
        """POST /api/templates/{id}/duplicate creates experimental copy."""
        resp = client.post(
            "/api/templates/tmpl_new_product_app_v1/duplicate",
            json={"name": "Dup via API"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["status"] == "experimental"
        assert body["name"] == "Dup via API"


# ===========================================================================
# Coverage rules integration (subset relevant to template-apply path)
# ===========================================================================


class TestCoverageAfterTemplateApply:
    """Verify coverage baseline is correct after template application."""

    def test_all_slots_missing_after_apply(self, tmp_registry: Path) -> None:
        """All slots start as missing; coverage score should be 0."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")

        pid = _create_project("Coverage Baseline")
        resp = client.post(
            f"/api/projects/{pid}/bom/apply-template",
            json={"template_id": "tmpl_new_product_app_v1"},
        )
        assert resp.status_code == 200
        bom_id = resp.json()["id"]

        cov_resp = client.get(f"/api/bom/{bom_id}/coverage")
        assert cov_resp.status_code == 200
        body = cov_resp.json()
        assert body["coverage_score"] == 0.0
        assert body["missing_slots"] > 0

    def test_gaps_populated_after_apply(self, tmp_registry: Path) -> None:
        """All slots appear as gaps immediately after template application."""
        if _templates_dir() is None:
            pytest.skip("templates/ dir not available")

        pid = _create_project("Gap Baseline")
        resp = client.post(
            f"/api/projects/{pid}/bom/apply-template",
            json={"template_id": "tmpl_new_product_app_v1"},
        )
        assert resp.status_code == 200
        bom_id = resp.json()["id"]

        gaps_resp = client.get(f"/api/bom/{bom_id}/gaps")
        assert gaps_resp.status_code == 200
        body = gaps_resp.json()
        assert len(body["gaps"]) > 0

    def test_not_applicable_excluded_from_denominator(self, tmp_registry: Path) -> None:
        """Slots marked not_applicable are excluded from coverage denominator."""
        from app.repositories.bom import BomRepository
        from app.settings import get_settings
        from app.services.coverage import calculate_coverage
        from app.models.bom import BomSlot
        from app.models.vocabulary import BomSlotStatus

        # Build a synthetic slot list with one N/A slot
        slots = [
            BomSlot(
                id="s1", bom_id="b1", artifact_type_id="prd",
                domain="product", required=True,
                status=BomSlotStatus.missing,
            ),
            BomSlot(
                id="s2", bom_id="b1", artifact_type_id="sales_one_pager",
                domain="gtm", required=False,
                status=BomSlotStatus.not_applicable,
            ),
            BomSlot(
                id="s3", bom_id="b1", artifact_type_id="arch_diagram",
                domain="architecture", required=True,
                status=BomSlotStatus.complete,
            ),
        ]
        summary = calculate_coverage(slots)
        # Only s1 and s3 are required active; s3 is complete -> score = 1/2
        assert summary.required_slots == 2
        assert summary.not_applicable_slots == 1
        assert abs(summary.coverage_score - 0.5) < 0.001
