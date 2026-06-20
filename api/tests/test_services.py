"""SVC-001..006: Service layer tests.

Covers:
1. SVC-001 ProjectService: CRUD + dashboard aggregate counts.
2. SVC-002 AssetService: CRUD, status transitions, policy-gated content access, links.
3. SVC-003 ImportService: local/url/manual import, duplicate detection by hash.
4. SVC-004 PreviewService: text preview extraction, image thumbnail (graceful no-PIL).
5. SVC-005 PolicyService: allow/deny decisions, sensitivity cap, canonical promotion gate.
6. SVC-006 AuditService: append + query; audit events emitted on asset actions.
7. Coverage service: calculate_coverage with required/complete/stale slots.
"""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_DIR = REPO_ROOT / "registry"


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def tmp_registry(tmp_path: Path) -> Path:
    """Copy seed JSONL files into a fresh temp directory."""
    reg = tmp_path / "registry"
    reg.mkdir()
    for jsonl in REGISTRY_DIR.glob("*.jsonl"):
        shutil.copy(jsonl, reg / jsonl.name)
    return reg


@pytest.fixture()
def empty_registry(tmp_path: Path) -> Path:
    """Empty registry temp directory."""
    reg = tmp_path / "registry"
    reg.mkdir()
    return reg


def _make_asset_create(
    title: str = "Test Asset",
    sensitivity: str = "personal",
    agent_access: str = "metadata_only",
    status: str = "inbox",
    source_kind: str = "local",
    uri: str = "file:///test/doc.md",
) -> "AssetCreate":
    from app.models.asset import AssetCreate
    from app.models.vocabulary import AgentAccess, AssetStatus, Sensitivity, SourceKind

    return AssetCreate(
        title=title,
        source_kind=SourceKind(source_kind),
        uri=uri,
        status=AssetStatus(status),
        sensitivity=Sensitivity(sensitivity),
        agent_access=AgentAccess(agent_access),
    )


# ---------------------------------------------------------------------------
# SVC-006 AuditService
# ---------------------------------------------------------------------------


class TestAuditService:
    def test_emit_and_list(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AuditEventType
        from app.services.audit import AuditService

        svc = AuditService(empty_registry)
        event = svc.emit(
            AuditEventType.asset_added,
            "asset",
            "asset_123",
            project_id="proj_x",
            actor_id="user_1",
        )
        assert event.id.startswith("evt_")
        assert event.event_type == AuditEventType.asset_added

        events = svc.list_events()
        assert len(events) == 1
        assert events[0].target_id == "asset_123"

    def test_emit_asset_added(self, empty_registry: Path) -> None:
        from app.services.audit import AuditService

        svc = AuditService(empty_registry)
        evt = svc.emit_asset_added("asset_x", project_id="proj_1", actor_id="agent_a")
        assert evt.event_type.value == "asset_added"
        assert evt.project_id == "proj_1"

    def test_emit_policy_denied(self, empty_registry: Path) -> None:
        from app.services.audit import AuditService

        svc = AuditService(empty_registry)
        evt = svc.emit_policy_denied("asset_y", "asset", actor_id="agent_b")
        assert evt.event_type.value == "policy_denied"
        assert evt.target_id == "asset_y"

    def test_list_filter_by_project(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AuditEventType
        from app.services.audit import AuditService

        svc = AuditService(empty_registry)
        svc.emit(AuditEventType.asset_added, "asset", "a1", project_id="proj_a")
        svc.emit(AuditEventType.asset_added, "asset", "a2", project_id="proj_b")
        svc.emit(AuditEventType.asset_added, "asset", "a3", project_id="proj_a")

        proj_a_events = svc.list_events(project_id="proj_a")
        assert len(proj_a_events) == 2
        ids = {e.target_id for e in proj_a_events}
        assert ids == {"a1", "a3"}

    def test_list_filter_by_event_type(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AuditEventType
        from app.services.audit import AuditService

        svc = AuditService(empty_registry)
        svc.emit(AuditEventType.asset_added, "asset", "a1")
        svc.emit(AuditEventType.policy_denied, "asset", "a2")

        added = svc.list_events(event_type="asset_added")
        assert len(added) == 1
        assert added[0].target_id == "a1"

    def test_list_limit(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AuditEventType
        from app.services.audit import AuditService

        svc = AuditService(empty_registry)
        for i in range(10):
            svc.emit(AuditEventType.asset_added, "asset", f"a{i}")

        events = svc.list_events(limit=3)
        assert len(events) == 3

    def test_events_append_only_no_delete(self, empty_registry: Path) -> None:
        """Events file should only ever grow — tombstone_record is not used."""
        from app.models.vocabulary import AuditEventType
        from app.repositories.jsonl import read_all
        from app.services.audit import AuditService

        svc = AuditService(empty_registry)
        svc.emit(AuditEventType.asset_added, "asset", "a1")
        svc.emit(AuditEventType.asset_added, "asset", "a2")

        raw = read_all(empty_registry / "events.jsonl", include_deleted=True)
        assert len(raw) == 2
        # No _deleted fields
        for r in raw:
            assert "_deleted" not in r


# ---------------------------------------------------------------------------
# SVC-005 PolicyService
# ---------------------------------------------------------------------------


class TestPolicyService:
    def test_allow_metadata_public(self) -> None:
        from app.services.policy import PolicyService

        svc = PolicyService()
        policy = svc.evaluate_asset_access(
            resource_id="asset_1",
            sensitivity="public",
            agent_access="metadata_only",
            action="read",
            actor_type="agent",
        )
        assert policy.decision == "allow"
        assert policy.effective_include_mode is not None

    def test_deny_agent_access_none(self) -> None:
        from app.services.policy import PolicyService

        svc = PolicyService()
        policy = svc.evaluate_asset_access(
            resource_id="asset_1",
            sensitivity="public",
            agent_access="none",
            action="read",
            actor_type="agent",
        )
        assert policy.decision == "deny"
        assert policy.rule_triggered == "agent_access_none"

    def test_sensitivity_cap_downgrade(self) -> None:
        """Agent requesting full content on work_sensitive → downgraded to preview."""
        from app.models.vocabulary import IncludeMode
        from app.services.policy import PolicyService

        svc = PolicyService()
        policy = svc.evaluate_asset_access(
            resource_id="asset_1",
            sensitivity="work_sensitive",
            agent_access="read_allowed",
            action="read_content",
            include_mode=IncludeMode.full,
            actor_type="agent",
        )
        assert policy.decision == "allow"
        assert policy.effective_include_mode == IncludeMode.preview
        assert "downgraded" in (policy.reason or "").lower()

    def test_restricted_cap_denies_full(self) -> None:
        """Restricted with read_allowed → content is capped to preview (downgraded)."""
        from app.models.vocabulary import IncludeMode
        from app.services.policy import PolicyService

        svc = PolicyService()
        policy = svc.evaluate_asset_access(
            resource_id="asset_1",
            sensitivity="restricted",
            agent_access="read_allowed",
            action="read_content",
            include_mode=IncludeMode.full,
            actor_type="agent",
        )
        # Should be downgraded to preview, not denied
        assert policy.effective_include_mode == IncludeMode.preview

    def test_user_can_access_full_work_sensitive(self) -> None:
        """Non-agent users are not subject to sensitivity cap."""
        from app.models.vocabulary import IncludeMode
        from app.services.policy import PolicyService

        svc = PolicyService()
        policy = svc.evaluate_asset_access(
            resource_id="asset_1",
            sensitivity="work_sensitive",
            agent_access="read_allowed",
            action="read_content",
            include_mode=IncludeMode.full,
            actor_type="user",
        )
        assert policy.decision == "allow"
        assert policy.effective_include_mode == IncludeMode.full

    def test_metadata_only_caps_to_metadata(self) -> None:
        from app.models.vocabulary import IncludeMode
        from app.services.policy import PolicyService

        svc = PolicyService()
        policy = svc.evaluate_asset_access(
            resource_id="asset_1",
            sensitivity="personal",
            agent_access="metadata_only",
            include_mode=IncludeMode.full,
            actor_type="agent",
        )
        assert policy.decision == "allow"
        assert policy.effective_include_mode == IncludeMode.metadata

    def test_promote_canonical_requires_review_notes(self) -> None:
        from app.services.policy import PolicyService

        svc = PolicyService()
        policy = svc.evaluate_promotion(
            resource_id="asset_1",
            current_status="selected",
            sensitivity="personal",
            has_project=True,
            has_artifact_type=True,
            has_provenance=True,
            has_review_marker=False,  # Missing review notes
        )
        assert policy.decision == "deny"
        assert "review_notes" in (policy.reason or "")

    def test_promote_canonical_allowed_with_all_fields(self) -> None:
        from app.services.policy import PolicyService

        svc = PolicyService(automated_promotion_allowed=True)
        policy = svc.evaluate_promotion(
            resource_id="asset_1",
            current_status="selected",
            sensitivity="personal",
            has_project=True,
            has_artifact_type=True,
            has_provenance=True,
            has_review_marker=True,
        )
        assert policy.decision == "allow"

    def test_promote_canonical_denied_for_agent_by_default(self) -> None:
        from app.services.policy import PolicyService

        svc = PolicyService(automated_promotion_allowed=False)
        policy = svc.evaluate_promotion(
            resource_id="asset_1",
            current_status="selected",
            sensitivity="personal",
            has_project=True,
            has_artifact_type=True,
            has_provenance=True,
            has_review_marker=True,
            actor_type="agent",
        )
        assert policy.decision == "deny"
        assert policy.rule_triggered == "human_gate_canonical_promotion"

    def test_promote_wrong_status_denied(self) -> None:
        from app.services.policy import PolicyService

        svc = PolicyService(automated_promotion_allowed=True)
        policy = svc.evaluate_promotion(
            resource_id="asset_1",
            current_status="inbox",
            sensitivity="personal",
            has_project=True,
            has_artifact_type=True,
            has_provenance=True,
            has_review_marker=True,
        )
        assert policy.decision == "deny"
        assert "invalid_status" in (policy.rule_triggered or "")


# ---------------------------------------------------------------------------
# SVC-001 ProjectService
# ---------------------------------------------------------------------------


class TestProjectService:
    def test_list_seed_projects(self, tmp_registry: Path) -> None:
        from app.services.projects import ProjectService

        svc = ProjectService(tmp_registry)
        projects = svc.list_projects()
        assert len(projects) >= 1

    def test_create_get_update_delete(self, empty_registry: Path) -> None:
        from app.models.project import ProjectCreate, ProjectUpdate
        from app.services.projects import ProjectService

        svc = ProjectService(empty_registry)
        project = svc.create_project(
            ProjectCreate(name="Alpha", slug="alpha", status="active")
        )
        assert project.name == "Alpha"

        retrieved = svc.get_project(project.id)
        assert retrieved is not None
        assert retrieved.slug == "alpha"

        updated = svc.update_project(project.id, ProjectUpdate(name="Alpha Updated"))
        assert updated is not None
        assert updated.name == "Alpha Updated"

        deleted = svc.delete_project(project.id)
        assert deleted is True
        assert svc.get_project(project.id) is None

    def test_get_project_by_slug(self, tmp_registry: Path) -> None:
        from app.services.projects import ProjectService

        svc = ProjectService(tmp_registry)
        project = svc.get_project_by_slug("artifact-atlas")
        assert project is not None
        assert project.id == "proj_artifact_atlas"

    def test_dashboard_counts_empty_project(self, empty_registry: Path) -> None:
        from app.models.project import ProjectCreate
        from app.services.projects import ProjectService

        svc = ProjectService(empty_registry)
        project = svc.create_project(
            ProjectCreate(name="Empty", slug="empty", status="active")
        )
        counts = svc.get_dashboard_counts(project.id)
        assert counts.total_assets == 0
        assert counts.inbox_assets == 0
        assert counts.canonical_assets == 0
        assert counts.bom_coverage_score == 0.0

    def test_dashboard_counts_with_assets(self, empty_registry: Path) -> None:
        from app.models.project import ProjectCreate
        from app.services.assets import AssetService
        from app.services.projects import ProjectService

        proj_svc = ProjectService(empty_registry)
        asset_svc = AssetService(empty_registry)

        project = proj_svc.create_project(
            ProjectCreate(name="Counted", slug="counted", status="active")
        )

        # Create inbox + canonical assets
        for i in range(3):
            asset_svc.create_asset(
                _make_asset_create(title=f"Inbox {i}", status="inbox"),
                project_id=project.id,
            )
        asset = asset_svc.create_asset(
            _make_asset_create(title="Canonical", status="inbox"),
            project_id=project.id,
        )

        counts = proj_svc.get_dashboard_counts(project.id)
        assert counts.total_assets == 4
        assert counts.inbox_assets == 4


# ---------------------------------------------------------------------------
# SVC-002 AssetService
# ---------------------------------------------------------------------------


class TestAssetService:
    def test_create_emits_audit_event(self, empty_registry: Path) -> None:
        from app.services.assets import AssetService
        from app.services.audit import AuditService

        asset_svc = AssetService(empty_registry)
        audit_svc = AuditService(empty_registry)

        asset = asset_svc.create_asset(
            _make_asset_create(title="Audited Asset"),
            project_id="proj_1",
            actor_id="user_x",
        )
        events = audit_svc.list_events(event_type="asset_added")
        assert len(events) >= 1
        assert events[0].target_id == asset.id

    def test_update_asset_sensitivity_emits_classified(self, empty_registry: Path) -> None:
        from app.models.asset import AssetUpdate
        from app.models.vocabulary import Sensitivity
        from app.services.assets import AssetService
        from app.services.audit import AuditService

        asset_svc = AssetService(empty_registry)
        audit_svc = AuditService(empty_registry)

        asset = asset_svc.create_asset(
            _make_asset_create(sensitivity="personal"),
        )
        asset_svc.update_asset(asset.id, AssetUpdate(sensitivity=Sensitivity.work_sensitive))

        classified_events = audit_svc.list_events(event_type="asset_classified")
        assert len(classified_events) >= 1

    def test_status_transition_valid(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AssetStatus
        from app.services.assets import AssetService

        svc = AssetService(empty_registry)
        asset = svc.create_asset(_make_asset_create(status="inbox"))

        updated = svc.transition_status(asset.id, AssetStatus.raw)
        assert updated.status == AssetStatus.raw

    def test_status_transition_invalid_raises(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AssetStatus
        from app.services.assets import AssetService, StatusTransitionError

        svc = AssetService(empty_registry)
        asset = svc.create_asset(_make_asset_create(status="inbox"))

        # inbox → canonical is not a valid direct transition
        with pytest.raises(StatusTransitionError):
            svc.transition_status(asset.id, AssetStatus.canonical)

    def test_status_transition_to_archived(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AssetStatus
        from app.services.assets import AssetService

        svc = AssetService(empty_registry)
        asset = svc.create_asset(_make_asset_create(status="inbox"))
        updated = svc.transition_status(asset.id, AssetStatus.archived)
        assert updated.status == AssetStatus.archived

    def test_promote_canonical_denied_without_review(self, empty_registry: Path) -> None:
        from app.models.asset import AssetPromoteRequest
        from app.models.vocabulary import AssetStatus
        from app.services.assets import AssetService, PolicyDeniedError

        svc = AssetService(empty_registry)
        # Create asset in 'inbox', transition to selected
        asset = svc.create_asset(
            _make_asset_create(status="inbox"),
            project_id="proj_1",
        )
        # transition: inbox → raw → candidate → in_review → selected
        from app.models.vocabulary import AssetStatus as AS
        svc.transition_status(asset.id, AS.raw)
        svc.transition_status(asset.id, AS.candidate)
        svc.transition_status(asset.id, AS.in_review)
        svc.transition_status(asset.id, AS.selected)

        # Now try canonical promotion without review_notes
        promote_req = AssetPromoteRequest(target_status=AssetStatus.canonical, review_notes=None)
        with pytest.raises(PolicyDeniedError) as exc_info:
            svc.promote_asset(asset.id, promote_req)
        assert exc_info.value.policy.decision == "deny"

    def test_policy_denied_emits_audit_event(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AgentAccess, AssetStatus, Sensitivity, SourceKind
        from app.models.asset import AssetCreate
        from app.services.assets import AssetService
        from app.services.audit import AuditService

        svc = AssetService(empty_registry)
        audit_svc = AuditService(empty_registry)

        # Create an asset with agent_access=none
        create_data = AssetCreate(
            title="No Access Asset",
            source_kind=SourceKind.local,
            uri="file:///restricted.pdf",
            status=AssetStatus.inbox,
            sensitivity=Sensitivity.restricted,
            agent_access=AgentAccess.none,
        )
        asset = svc.create_asset(create_data)

        # Attempt content access → should get denied and emit policy_denied
        policy = svc.check_content_access(asset.id, actor_type="agent")
        assert policy.decision == "deny"

        denied_events = audit_svc.list_events(event_type="policy_denied")
        assert len(denied_events) >= 1

    def test_check_content_access_allowed(self, empty_registry: Path) -> None:
        from app.models.vocabulary import AgentAccess, AssetStatus, Sensitivity, SourceKind
        from app.models.asset import AssetCreate
        from app.services.assets import AssetService

        svc = AssetService(empty_registry)
        create_data = AssetCreate(
            title="Open Asset",
            source_kind=SourceKind.local,
            uri="file:///public.md",
            status=AssetStatus.inbox,
            sensitivity=Sensitivity.public,
            agent_access=AgentAccess.read_allowed,
        )
        asset = svc.create_asset(create_data)
        policy = svc.check_content_access(asset.id, actor_type="agent")
        assert policy.decision == "allow"

    def test_search_by_title(self, empty_registry: Path) -> None:
        from app.services.assets import AssetService

        svc = AssetService(empty_registry)
        svc.create_asset(_make_asset_create(title="Alpha Report"))
        svc.create_asset(_make_asset_create(title="Beta Analysis"))
        svc.create_asset(_make_asset_create(title="Alpha Design"))

        results = svc.search_assets(query="alpha")
        assert len(results) == 2
        titles = {a.title for a in results}
        assert titles == {"Alpha Report", "Alpha Design"}

    def test_search_by_status_filter(self, empty_registry: Path) -> None:
        from app.services.assets import AssetService

        svc = AssetService(empty_registry)
        svc.create_asset(_make_asset_create(title="Inbox Asset", status="inbox"))
        svc.create_asset(_make_asset_create(title="Raw Asset", status="raw"))

        inbox_results = svc.search_assets(status_filter=["inbox"])
        assert all(a.status.value == "inbox" for a in inbox_results)
        assert len(inbox_results) >= 1

    def test_create_link_emits_audit(self, empty_registry: Path) -> None:
        from app.models.asset import AssetLinkCreate
        from app.models.vocabulary import AssetLinkRelationship, AssetLinkTargetType
        from app.services.assets import AssetService
        from app.services.audit import AuditService

        svc = AssetService(empty_registry)
        audit_svc = AuditService(empty_registry)

        asset = svc.create_asset(_make_asset_create())
        link = svc.create_link(
            asset.id,
            AssetLinkCreate(
                target_type=AssetLinkTargetType.project,
                target_id="proj_x",
                relationship=AssetLinkRelationship.reference,
            ),
        )
        assert link.asset_id == asset.id

        linked_events = audit_svc.list_events(event_type="asset_linked")
        assert len(linked_events) >= 1

    def test_list_links(self, empty_registry: Path) -> None:
        from app.models.asset import AssetLinkCreate
        from app.models.vocabulary import AssetLinkRelationship, AssetLinkTargetType
        from app.services.assets import AssetService

        svc = AssetService(empty_registry)
        asset = svc.create_asset(_make_asset_create())
        svc.create_link(
            asset.id,
            AssetLinkCreate(
                target_type=AssetLinkTargetType.project,
                target_id="proj_1",
                relationship=AssetLinkRelationship.evidence,
            ),
        )
        links = svc.list_links(asset.id)
        assert len(links) == 1

    def test_delete_asset(self, empty_registry: Path) -> None:
        from app.services.assets import AssetService

        svc = AssetService(empty_registry)
        asset = svc.create_asset(_make_asset_create())
        assert svc.delete_asset(asset.id) is True
        assert svc.get_asset(asset.id) is None

    def test_delete_nonexistent_returns_false(self, empty_registry: Path) -> None:
        from app.services.assets import AssetService

        svc = AssetService(empty_registry)
        assert svc.delete_asset("asset_nonexistent") is False


# ---------------------------------------------------------------------------
# SVC-003 ImportService
# ---------------------------------------------------------------------------


class TestImportService:
    def test_import_local_nonexistent_file(self, empty_registry: Path) -> None:
        """Non-existent file path still creates an asset record (no error)."""
        from app.services.import_index import ImportService

        svc = ImportService(empty_registry)
        result = svc.import_local_path("/tmp/nonexistent_file_xyz.md", title="Missing File")
        assert result.asset.title == "Missing File"
        assert result.is_duplicate is False
        assert result.asset.source_kind.value == "local"

    def test_import_local_emits_asset_added(self, empty_registry: Path) -> None:
        from app.services.audit import AuditService
        from app.services.import_index import ImportService

        svc = ImportService(empty_registry)
        audit_svc = AuditService(empty_registry)

        svc.import_local_path("/tmp/test.txt", title="Test File")
        events = audit_svc.list_events(event_type="asset_added")
        assert len(events) >= 1

    def test_import_local_duplicate_returns_existing(self, tmp_path: Path) -> None:
        """Duplicate by hash → return_existing returns the original asset."""
        from app.services.import_index import ImportService

        reg = tmp_path / "registry"
        reg.mkdir()
        svc = ImportService(reg)

        # Create a real file to hash
        test_file = tmp_path / "doc.txt"
        test_file.write_text("Hello, Artifact Atlas!")

        result1 = svc.import_local_path(str(test_file), title="Original")
        result2 = svc.import_local_path(
            str(test_file), title="Duplicate Attempt", on_duplicate="return_existing"
        )
        assert result2.is_duplicate is True
        assert result2.asset.id == result1.asset.id

    def test_import_local_duplicate_link(self, tmp_path: Path) -> None:
        """Duplicate with on_duplicate='link' returns existing without creating new asset."""
        from app.services.import_index import ImportService

        reg = tmp_path / "registry"
        reg.mkdir()
        svc = ImportService(reg)

        test_file = tmp_path / "doc2.txt"
        test_file.write_text("Artifact Atlas content!")

        r1 = svc.import_local_path(str(test_file), title="Original")
        r2 = svc.import_local_path(str(test_file), title="Dup Link", on_duplicate="link")
        assert r2.is_duplicate is True
        assert r2.duplicate_of == r1.asset.id

    def test_import_url_no_remote_fetch(self, empty_registry: Path) -> None:
        """URL import records metadata only; no network calls."""
        from app.services.import_index import ImportService

        svc = ImportService(empty_registry)
        result = svc.import_url(
            "https://example.com/doc.pdf",
            title="External PDF",
            project_id="proj_test",
        )
        assert result.asset.source_kind.value == "url"
        assert result.asset.uri == "https://example.com/doc.pdf"
        assert result.is_duplicate is False

    def test_import_url_emits_event(self, empty_registry: Path) -> None:
        from app.services.audit import AuditService
        from app.services.import_index import ImportService

        svc = ImportService(empty_registry)
        audit_svc = AuditService(empty_registry)

        svc.import_url("https://example.com/spec.md")
        events = audit_svc.list_events(event_type="asset_added")
        assert len(events) >= 1

    def test_import_manual(self, empty_registry: Path) -> None:
        from app.services.import_index import ImportService

        svc = ImportService(empty_registry)
        result = svc.import_manual("My Manual Record", description="A test record")
        assert result.asset.title == "My Manual Record"
        assert result.asset.source_kind.value == "manual"
        assert result.asset.uri.startswith("manual://")
        assert result.is_duplicate is False

    def test_import_manual_emits_event(self, empty_registry: Path) -> None:
        from app.services.audit import AuditService
        from app.services.import_index import ImportService

        svc = ImportService(empty_registry)
        audit_svc = AuditService(empty_registry)

        svc.import_manual("Manual Asset")
        events = audit_svc.list_events(event_type="asset_added")
        assert len(events) >= 1

    def test_import_applies_default_sensitivity(self, empty_registry: Path) -> None:
        from app.services.import_index import ImportService

        svc = ImportService(empty_registry, default_sensitivity="work_sensitive")
        result = svc.import_url("https://example.com/report.pdf", title="Sensitive Report")
        assert result.asset.sensitivity.value == "work_sensitive"

    def test_import_overrides_default_sensitivity(self, empty_registry: Path) -> None:
        from app.services.import_index import ImportService

        svc = ImportService(empty_registry, default_sensitivity="personal")
        result = svc.import_url(
            "https://example.com/public.md",
            title="Public Doc",
            sensitivity="public",
        )
        assert result.asset.sensitivity.value == "public"


# ---------------------------------------------------------------------------
# SVC-004 PreviewService
# ---------------------------------------------------------------------------


class TestPreviewService:
    def test_text_preview_markdown(self, tmp_path: Path) -> None:
        from app.services.previews import PreviewService

        thumbs = tmp_path / "thumbs"
        previews = tmp_path / "previews"
        svc = PreviewService(thumbs, previews)

        md_file = tmp_path / "doc.md"
        md_file.write_text("# Title\n\nThis is the body of the document.\n\n## Section\n\nMore text here.")

        out = svc.generate_text_preview("asset_001", md_file)
        assert out is not None
        assert out.exists()
        content = out.read_text()
        assert "Title" in content
        assert "body of the document" in content
        # Markdown heading markers stripped
        assert "# " not in content

    def test_text_preview_caps_length(self, tmp_path: Path) -> None:
        from app.services.previews import PreviewService, MAX_PREVIEW_CHARS

        svc = PreviewService(tmp_path / "t", tmp_path / "p")
        txt_file = tmp_path / "long.txt"
        txt_file.write_text("x" * (MAX_PREVIEW_CHARS + 500))

        out = svc.generate_text_preview("asset_long", txt_file)
        assert out is not None
        content = out.read_text()
        assert len(content) <= MAX_PREVIEW_CHARS

    def test_text_preview_missing_file(self, tmp_path: Path) -> None:
        from app.services.previews import PreviewService

        svc = PreviewService(tmp_path / "t", tmp_path / "p")
        result = svc.generate_text_preview("asset_x", tmp_path / "nope.md")
        assert result is None

    def test_text_preview_unsupported_extension(self, tmp_path: Path) -> None:
        from app.services.previews import PreviewService

        svc = PreviewService(tmp_path / "t", tmp_path / "p")
        f = tmp_path / "data.csv"
        f.write_text("a,b,c\n1,2,3")
        result = svc.generate_text_preview("asset_csv", f)
        assert result is None

    def test_thumbnail_no_pil_returns_none(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """If PIL is not available, generate_thumbnail returns None gracefully."""
        from app.services import previews as prev_module

        monkeypatch.setattr(prev_module, "_try_import_pil", lambda: None)

        svc = prev_module.PreviewService(tmp_path / "t", tmp_path / "p")
        img_file = tmp_path / "image.jpg"
        img_file.write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 100)  # Fake JPEG header

        result = svc.generate_thumbnail("asset_img", img_file)
        assert result is None

    def test_preview_for_mime_text(self, tmp_path: Path) -> None:
        from app.services.previews import PreviewService

        svc = PreviewService(tmp_path / "t", tmp_path / "p")
        md_file = tmp_path / "readme.md"
        md_file.write_text("# README\n\nContent here.")

        thumbnail, preview = svc.preview_for_mime("asset_md", md_file, "text/markdown")
        assert thumbnail is None
        assert preview is not None

    def test_preview_for_mime_unknown(self, tmp_path: Path) -> None:
        from app.services.previews import PreviewService

        svc = PreviewService(tmp_path / "t", tmp_path / "p")
        f = tmp_path / "data.bin"
        f.write_bytes(b"\x00\x01\x02")

        thumbnail, preview = svc.preview_for_mime("asset_bin", f, None)
        assert thumbnail is None
        assert preview is None


# ---------------------------------------------------------------------------
# Coverage service
# ---------------------------------------------------------------------------


class TestCoverageService:
    def _make_slot(
        self,
        slot_id: str,
        bom_id: str,
        *,
        required: bool = True,
        status: str = "missing",
    ) -> "BomSlot":
        from app.models.bom import BomSlot
        from app.models.vocabulary import BomSlotStatus

        return BomSlot(
            id=slot_id,
            bom_id=bom_id,
            artifact_type_id="prd",
            domain="Product",
            required=required,
            status=BomSlotStatus(status),
        )

    def test_all_complete(self) -> None:
        from app.services.coverage import calculate_coverage

        slots = [
            self._make_slot("s1", "bom_1", status="complete"),
            self._make_slot("s2", "bom_1", status="complete"),
        ]
        result = calculate_coverage(slots)
        assert result.coverage_score == 1.0
        assert result.required_slots == 2
        assert result.filled_slots == 2

    def test_partial_coverage(self) -> None:
        from app.services.coverage import calculate_coverage

        slots = [
            self._make_slot("s1", "bom_1", status="complete"),
            self._make_slot("s2", "bom_1", status="missing"),
            self._make_slot("s3", "bom_1", status="missing"),
        ]
        result = calculate_coverage(slots)
        assert abs(result.coverage_score - 1 / 3) < 0.001
        assert result.missing_slots == 2

    def test_no_required_slots_returns_null_score(self) -> None:
        """Zero required slots → coverage_score is None (not vacuous 100%)."""
        from app.services.coverage import calculate_coverage

        slots = [
            self._make_slot("s1", "bom_1", required=False, status="missing"),
        ]
        result = calculate_coverage(slots)
        assert result.coverage_score is None
        assert result.required_slots == 0

    def test_not_applicable_excluded_from_required(self) -> None:
        from app.services.coverage import calculate_coverage

        slots = [
            self._make_slot("s1", "bom_1", required=True, status="complete"),
            self._make_slot("s2", "bom_1", required=True, status="not_applicable"),
        ]
        result = calculate_coverage(slots)
        # not_applicable excluded from required count
        assert result.required_slots == 1
        assert result.coverage_score == 1.0
        assert result.not_applicable_slots == 1

    def test_stale_counted(self) -> None:
        from app.services.coverage import calculate_coverage

        slots = [
            self._make_slot("s1", "bom_1", status="complete"),
            self._make_slot("s2", "bom_1", status="stale"),
        ]
        result = calculate_coverage(slots)
        assert result.stale_slots == 1

    def test_blocked_counted(self) -> None:
        from app.services.coverage import calculate_coverage

        slots = [
            self._make_slot("s1", "bom_1", status="blocked"),
        ]
        result = calculate_coverage(slots)
        assert result.blocked_slots == 1

    def test_empty_slots(self) -> None:
        """An empty slot list has no required slots → coverage_score is None."""
        from app.services.coverage import calculate_coverage

        result = calculate_coverage([])
        assert result.coverage_score is None
        assert result.total_slots == 0

    def test_bom_id_carried_through(self) -> None:
        from app.services.coverage import calculate_coverage

        slots = [self._make_slot("s1", "bom_target_001", status="complete")]
        result = calculate_coverage(slots)
        assert result.bom_id == "bom_target_001"
