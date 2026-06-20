"""Integration tests for audit emission and CCDash wiring (Stage 1 gate findings).

Covers:
- Finding 1 (CCDash wiring): Real audited actions write to ccdash-events.jsonl.
- Finding 2 (Destructive-action audit): delete_asset emits asset_archived;
  delete_link, delete_project, delete_template emit 'deleted'.
- Finding 3 (Policy evaluate audit): POST /api/policies/evaluate emits policy_denied
  audit when decision is deny.

All tests are fully isolated via tmp_registry (ATLAS_REGISTRY_DIR / ATLAS_EXPORTS_DIR
point to tmp_path subdirectories — real registry and exports are never touched).
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_project(name: str) -> str:
    slug = name.lower().replace(" ", "-").replace("_", "-")
    resp = client.post("/api/projects", json={"name": name, "slug": slug, "status": "active"})
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _create_asset(project_id: str, **overrides) -> dict:
    payload = {
        "title": "Test Asset",
        "source_kind": "local",
        "uri": "file:///tmp/test.md",
        "status": "inbox",
        "sensitivity": "personal",
        "agent_access": "read_allowed",
        **overrides,
    }
    resp = client.post(f"/api/projects/{project_id}/assets", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _read_ccdash_events(tmp_registry: Path) -> list[dict]:
    """Read all records from the isolated ccdash-events.jsonl."""
    from app.settings import get_settings
    settings = get_settings()
    events_path = settings.ccdash_events_path
    if not events_path.exists():
        return []
    records = []
    for line in events_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            records.append(json.loads(line))
    return records


def _read_audit_events(tmp_registry: Path, event_type: str | None = None) -> list[dict]:
    """Read audit events from the isolated registry."""
    events_file = tmp_registry / "events.jsonl"
    if not events_file.exists():
        return []
    records = []
    for line in events_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                rec = json.loads(line)
                if event_type is None or rec.get("event_type") == event_type:
                    records.append(rec)
            except json.JSONDecodeError:
                pass
    return records


# ---------------------------------------------------------------------------
# Finding 1: CCDash wiring — audited actions produce ccdash-events.jsonl
# ---------------------------------------------------------------------------


class TestCCDashWiring:
    """Verify CCDashClient is called by AuditService for real audited actions."""

    def test_create_asset_writes_ccdash_event(self, tmp_registry: Path) -> None:
        """Creating an asset (which emits asset_added) should write to ccdash-events.jsonl."""
        from app.settings import get_settings
        settings = get_settings()
        # Ensure parent dir exists for the events file
        settings.ccdash_events_path.parent.mkdir(parents=True, exist_ok=True)

        pid = _create_project("ccdash-wiring-create")
        _create_asset(pid, title="CCDash Wired Asset")

        events = _read_ccdash_events(tmp_registry)
        assert len(events) >= 1, "Expected at least one CCDash event after asset creation"
        event_types = [e.get("event_type") for e in events]
        assert "asset_added" in event_types, (
            f"Expected 'asset_added' in CCDash events. Got: {event_types}"
        )
        # Validate schema fields
        for evt in events:
            assert evt.get("ccdash_schema_version") == "v1"
            assert "id" in evt
            assert "timestamp" in evt

    def test_policy_denied_writes_ccdash_event(self, tmp_registry: Path) -> None:
        """A denied policy action should appear in ccdash-events.jsonl."""
        from app.settings import get_settings
        settings = get_settings()
        settings.ccdash_events_path.parent.mkdir(parents=True, exist_ok=True)

        pid = _create_project("ccdash-policy-deny")
        asset = _create_asset(pid, agent_access="none", sensitivity="personal")
        aid = asset["id"]

        # Trigger a policy denial via the canonical promotion route
        # (asset in 'inbox' can't go to 'canonical' directly — triggers transition error,
        # not a policy denial from check_content_access. Use policy evaluate instead.)
        resp = client.post(
            "/api/policies/evaluate",
            json={
                "resource_type": "asset",
                "resource_id": aid,
                "action": "read",
                "actor_type": "agent",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["decision"] == "deny"

        events = _read_ccdash_events(tmp_registry)
        event_types = [e.get("event_type") for e in events]
        assert "policy_denied" in event_types, (
            f"Expected 'policy_denied' in CCDash events. Got: {event_types}"
        )
        denied_events = [e for e in events if e.get("event_type") == "policy_denied"]
        assert any(e.get("target_id") == aid for e in denied_events)

    def test_ccdash_export_isolated_from_real_registry(self, tmp_registry: Path) -> None:
        """CCDash events must go to the isolated tmp path, not the real exports/."""
        from app.settings import get_settings
        settings = get_settings()
        ccdash_path = settings.ccdash_events_path.resolve()
        registry_path = tmp_registry.resolve()
        # ccdash_path = <tmp_root>/exports/events/ccdash-events.jsonl  (3 levels deep)
        # registry_path = <tmp_root>/registry  (1 level deep)
        # Verify they share the same tmp_root
        tmp_root = registry_path.parent
        assert str(ccdash_path).startswith(str(tmp_root)), (
            f"CCDash events path {ccdash_path} should be under the isolated tmp root "
            f"{tmp_root} (same root as registry at {registry_path})"
        )

    def test_multiple_audited_actions_accumulate(self, tmp_registry: Path) -> None:
        """Multiple audited actions should each produce a CCDash event."""
        from app.settings import get_settings
        settings = get_settings()
        settings.ccdash_events_path.parent.mkdir(parents=True, exist_ok=True)

        pid = _create_project("ccdash-accumulate")
        _create_asset(pid, title="First Asset")
        _create_asset(pid, title="Second Asset")
        _create_asset(pid, title="Third Asset")

        events = _read_ccdash_events(tmp_registry)
        added = [e for e in events if e.get("event_type") == "asset_added"]
        assert len(added) >= 3, f"Expected at least 3 asset_added events, got {len(added)}"


# ---------------------------------------------------------------------------
# Finding 2: Destructive-action audit
# ---------------------------------------------------------------------------


class TestDestructiveActionAudit:
    """Verify delete operations emit correctly-typed audit events."""

    def test_delete_asset_emits_asset_archived(self, tmp_registry: Path) -> None:
        """delete_asset must emit 'asset_archived', not 'asset_promoted'."""
        pid = _create_project("audit-delete-asset")
        asset = _create_asset(pid)
        aid = asset["id"]

        resp = client.delete(f"/api/assets/{aid}")
        assert resp.status_code == 204

        events = _read_audit_events(tmp_registry)
        archived_events = [e for e in events if e.get("event_type") == "asset_archived"]
        assert len(archived_events) >= 1, (
            f"Expected at least one 'asset_archived' event. Events: "
            f"{[e.get('event_type') for e in events]}"
        )
        assert any(e.get("target_id") == aid for e in archived_events), (
            f"No asset_archived event for asset {aid}"
        )
        # Must NOT have a mislabeled 'asset_promoted' for this deletion
        promoted_for_delete = [
            e for e in events
            if e.get("event_type") == "asset_promoted" and e.get("target_id") == aid
            and e.get("payload", {}).get("action") == "archived_tombstone"
        ]
        assert len(promoted_for_delete) == 0, (
            "delete_asset must NOT emit 'asset_promoted' (mislabeled event)"
        )

    def test_delete_link_emits_deleted(self, tmp_registry: Path) -> None:
        """Deleting an asset link must emit a 'deleted' audit event."""
        pid = _create_project("audit-delete-link")
        asset = _create_asset(pid)
        aid = asset["id"]

        # Create a link
        link_resp = client.post(
            f"/api/assets/{aid}/link",
            json={
                "target_type": "project",
                "target_id": pid,
                "relationship": "reference",
            },
        )
        assert link_resp.status_code == 201, link_resp.text
        link_id = link_resp.json()["id"]

        # Delete the link via the service directly (no DELETE /api/assets/{id}/links/{lid} route yet)
        from app.settings import get_settings
        from app.services.assets import AssetService
        from app.services.audit import AuditService
        from app.services.ccdash_client import CCDashClient
        settings = get_settings()
        settings.ccdash_events_path.parent.mkdir(parents=True, exist_ok=True)
        ccdash = CCDashClient(settings.ccdash_events_path, workspace_id=settings.workspace_id)
        audit_svc = AuditService(settings.registry_dir, ccdash_client=ccdash)
        svc = AssetService(settings.registry_dir, audit_service=audit_svc)

        result = svc.delete_link(link_id, actor_id="test_actor")
        assert result is True

        events = _read_audit_events(tmp_registry)
        deleted_events = [e for e in events if e.get("event_type") == "deleted"]
        assert len(deleted_events) >= 1, (
            f"Expected 'deleted' event for link deletion. Events: "
            f"{[e.get('event_type') for e in events]}"
        )
        assert any(e.get("target_id") == link_id for e in deleted_events), (
            f"No 'deleted' event for link {link_id}"
        )
        assert any(e.get("target_type") == "asset_link" for e in deleted_events)

    def test_delete_project_emits_deleted(self, tmp_registry: Path) -> None:
        """Deleting a project must emit a 'deleted' audit event."""
        from app.settings import get_settings
        from app.services.projects import ProjectService
        from app.services.audit import AuditService
        from app.services.ccdash_client import CCDashClient
        settings = get_settings()
        settings.ccdash_events_path.parent.mkdir(parents=True, exist_ok=True)
        ccdash = CCDashClient(settings.ccdash_events_path, workspace_id=settings.workspace_id)
        audit_svc = AuditService(settings.registry_dir, ccdash_client=ccdash)
        svc = ProjectService(settings.registry_dir, audit_service=audit_svc)

        from app.models.project import ProjectCreate
        project = svc.create_project(ProjectCreate(name="DeleteMe", slug="deleteme-project", status="active"))

        result = svc.delete_project(project.id, actor_id="test_actor")
        assert result is True

        events = _read_audit_events(tmp_registry)
        deleted_events = [e for e in events if e.get("event_type") == "deleted"]
        assert len(deleted_events) >= 1, (
            f"Expected 'deleted' event for project deletion. Events: "
            f"{[e.get('event_type') for e in events]}"
        )
        assert any(
            e.get("target_id") == project.id and e.get("target_type") == "project"
            for e in deleted_events
        ), f"No 'deleted' event for project {project.id}"

    def test_delete_template_emits_deleted(self, tmp_registry: Path) -> None:
        """Deleting a template must emit a 'deleted' audit event."""
        from pathlib import Path as _Path
        from app.settings import get_settings
        from app.services.templates_service import TemplateService
        from app.services.audit import AuditService
        from app.services.ccdash_client import CCDashClient
        from app.models.template import TemplateCreate
        settings = get_settings()
        settings.ccdash_events_path.parent.mkdir(parents=True, exist_ok=True)
        ccdash = CCDashClient(settings.ccdash_events_path, workspace_id=settings.workspace_id)
        audit_svc = AuditService(settings.registry_dir, ccdash_client=ccdash)
        svc = TemplateService(settings.registry_dir, audit_service=audit_svc)

        tmpl = svc.create_draft(
            TemplateCreate(name="Delete Template", slug="delete-template-test", template_type="custom"),
            "tmpl_delete_test",
        )

        result = svc.delete_template(tmpl.id, actor_id="test_actor")
        assert result is True

        events = _read_audit_events(tmp_registry)
        deleted_events = [e for e in events if e.get("event_type") == "deleted"]
        assert len(deleted_events) >= 1, (
            f"Expected 'deleted' event for template deletion. Events: "
            f"{[e.get('event_type') for e in events]}"
        )
        assert any(
            e.get("target_id") == tmpl.id and e.get("target_type") == "template"
            for e in deleted_events
        ), f"No 'deleted' event for template {tmpl.id}"

    def test_asset_archived_event_not_asset_promoted(self, tmp_registry: Path) -> None:
        """Verify the vocabulary now contains asset_archived and deleted event types."""
        from app.models.vocabulary import AuditEventType
        assert AuditEventType.asset_archived.value == "asset_archived"
        assert AuditEventType.deleted.value == "deleted"
        # Confirm asset_promoted still exists (separate lifecycle event)
        assert AuditEventType.asset_promoted.value == "asset_promoted"


# ---------------------------------------------------------------------------
# Finding 3: Policy evaluate audit on deny
# ---------------------------------------------------------------------------


class TestPolicyEvaluateAudit:
    """Verify POST /api/policies/evaluate emits policy_denied on deny outcomes."""

    def test_policy_deny_agent_access_none_emits_audit(self, tmp_registry: Path) -> None:
        """Denying an agent with access=none must write a policy_denied audit event."""
        pid = _create_project("policy-audit-deny-access")
        asset = _create_asset(pid, agent_access="none", sensitivity="personal")
        aid = asset["id"]

        resp = client.post(
            "/api/policies/evaluate",
            json={
                "resource_type": "asset",
                "resource_id": aid,
                "action": "read",
                "actor_type": "agent",
                "actor_id": "test_agent",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["decision"] == "deny"

        events = _read_audit_events(tmp_registry)
        denied = [e for e in events if e.get("event_type") == "policy_denied"]
        assert len(denied) >= 1, (
            f"Expected policy_denied audit event. Events: "
            f"{[e.get('event_type') for e in events]}"
        )
        assert any(e.get("target_id") == aid for e in denied)

    def test_policy_allow_does_not_emit_audit(self, tmp_registry: Path) -> None:
        """Allow decisions must NOT produce policy_denied audit events."""
        pid = _create_project("policy-audit-allow")
        asset = _create_asset(pid, agent_access="read_allowed", sensitivity="personal")
        aid = asset["id"]

        # Record audit events before
        before = _read_audit_events(tmp_registry, "policy_denied")

        resp = client.post(
            "/api/policies/evaluate",
            json={
                "resource_type": "asset",
                "resource_id": aid,
                "action": "read",
                "actor_type": "agent",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["decision"] == "allow"

        after = _read_audit_events(tmp_registry, "policy_denied")
        # No new policy_denied events
        assert len(after) == len(before), (
            "Allow decisions must not emit policy_denied events"
        )

    def test_policy_deny_asset_not_found_emits_audit(self, tmp_registry: Path) -> None:
        """A not-found asset denial must also be audited."""
        resp = client.post(
            "/api/policies/evaluate",
            json={
                "resource_type": "asset",
                "resource_id": "nonexistent_asset_xyz999",
                "action": "read",
                "actor_id": "some_agent",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["decision"] == "deny"

        events = _read_audit_events(tmp_registry, "policy_denied")
        assert len(events) >= 1, "Expected policy_denied audit for not-found asset"
        assert any(e.get("target_id") == "nonexistent_asset_xyz999" for e in events)

    def test_generic_policy_deny_emits_audit(self, tmp_registry: Path) -> None:
        """Generic (non-asset) policy denials should also be audited."""
        resp = client.post(
            "/api/policies/evaluate",
            json={
                "resource_type": "context_pack",
                "resource_id": "pack_restricted_999",
                "action": "publish",
                "context": {"sensitivity": "restricted"},
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        if body["decision"] == "deny":
            events = _read_audit_events(tmp_registry, "policy_denied")
            assert len(events) >= 1, "Expected policy_denied audit for generic deny"
