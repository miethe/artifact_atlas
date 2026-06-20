"""Comprehensive tests for Context Pack backend (CP-BE-001..004).

Covers:
- CP-BE-001: Draft-first create / update / list / get (all item types).
- CP-BE-002: Pack from IntentTree node — refs only, missing integrations marked.
- CP-BE-003: Policy envelope — include-mode downgrade and block on sensitive.
- CP-BE-004: Export YAML validity (spec §14.3 manifest shape), publish audit event,
             CCDash event hook payload.

Hard rules verified:
- Packs always start as draft.
- Publish blocked for restricted/work_sensitive/client_sensitive sensitivity packs.
- Assets with agent_access=none are denied in policy evaluation.
- Assets with restricted sensitivity are downgraded to preview (or denied if full requested).
- Export YAML includes context_pack_manifest key and spec-required fields.
- Publish emits audit event (context_pack_published) with ccdash_event_payload.
- Export does not silently overwrite existing files (timestamp-suffix).
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.context_pack import (
    ContextPackCreate,
    ContextPackFromNodeRequest,
    ContextPackItemCreate,
    ContextPackPolicy,
    ContextPackUpdate,
)
from app.models.vocabulary import (
    AgentAccess,
    ContextPackAudience,
    ContextPackItemType,
    ContextPackPublishDestination,
    ContextPackStatus,
    ContextPackTargetType,
    IncludeMode,
    Sensitivity,
    SourceKind,
)
from app.services.context_pack_service import ConflictError, ContextPackService

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_project(name: str) -> str:
    slug = name.lower().replace(" ", "-")
    resp = client.post("/api/projects", json={"name": name, "slug": slug, "status": "active"})
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _make_pack_create(
    project_id: str,
    *,
    title: str = "Test Pack",
    sensitivity: str = "personal",
    audience: str = "agent",
    **kwargs: Any,
) -> dict[str, Any]:
    return {
        "title": title,
        "target_type": "project",
        "target_id": project_id,
        "audience": audience,
        "sensitivity": sensitivity,
        **kwargs,
    }


def _create_pack_via_api(project_id: str, **overrides: Any) -> dict[str, Any]:
    payload = _make_pack_create(project_id, **overrides)
    resp = client.post(f"/api/projects/{project_id}/context-packs", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _make_service(tmp_registry: Path) -> ContextPackService:
    import app.settings as _settings_mod
    settings = _settings_mod.get_settings()
    return ContextPackService(
        registry_dir=settings.registry_dir,
        context_packs_dir=settings.context_packs_dir,
    )


def _create_asset(
    project_id: str,
    *,
    sensitivity: str = "personal",
    agent_access: str = "read_allowed",
    title: str = "Test Asset",
) -> str:
    """Create an asset and return its ID."""
    resp = client.post(
        f"/api/projects/{project_id}/assets",
        json={
            "title": title,
            "source_kind": "local",
            "uri": f"file:///tmp/{title.replace(' ', '_')}.txt",
            "sensitivity": sensitivity,
            "agent_access": agent_access,
            "status": "candidate",
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# CP-BE-001: Draft-first create / update / list / get
# ---------------------------------------------------------------------------


class TestDraftFirstCreate:
    """CP-BE-001: Packs always start as draft."""

    def test_create_pack_is_draft(self, tmp_registry: Path) -> None:
        pid = _create_project("Draft Test")
        pack = _create_pack_via_api(pid)
        assert pack["status"] == "draft"
        assert "id" in pack
        assert pack["project_id"] == pid

    def test_create_pack_with_all_item_types(self, tmp_registry: Path) -> None:
        pid = _create_project("Item Types")
        payload = _make_pack_create(pid, title="Multi-type Pack")
        payload["items"] = [
            {"item_type": "asset", "item_id": "asset_abc", "include_mode": "metadata"},
            {"item_type": "meatywiki_page", "item_id": "page_xyz", "include_mode": "full"},
            {"item_type": "intenttree_node", "item_id": "node_001", "include_mode": "summary"},
            {"item_type": "bom_slot", "item_id": "slot_001", "include_mode": "metadata"},
            {"item_type": "external_url", "item_id": "https://example.com", "include_mode": "link_only"},
            {"item_type": "note", "item_id": "my_note", "include_mode": "full"},
        ]
        resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        assert resp.status_code == 201, resp.text
        pack = resp.json()
        assert pack["status"] == "draft"

        # Get detail with items
        detail_resp = client.get(f"/api/context-packs/{pack['id']}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert "items" in detail
        assert len(detail["items"]) == 6

    def test_create_pack_with_policy_envelope(self, tmp_registry: Path) -> None:
        pid = _create_project("Policy Pack")
        payload = _make_pack_create(pid, title="Policy Pack")
        payload["policy"] = {
            "allow_external_data": False,
            "allow_code_execution": False,
            "network_access": "restricted",
            "agent_access": "trusted_agents_only",
        }
        resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        assert resp.status_code == 201, resp.text
        pack = resp.json()
        assert pack["policy"]["allow_external_data"] is False
        assert pack["policy"]["network_access"] == "restricted"

    def test_create_pack_with_instructions(self, tmp_registry: Path) -> None:
        pid = _create_project("Instructions Pack")
        payload = _make_pack_create(pid, instructions="Use this pack to evaluate designs.")
        resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        assert resp.status_code == 201, resp.text
        assert resp.json()["instructions"] == "Use this pack to evaluate designs."

    def test_list_packs_filtered_by_status(self, tmp_registry: Path) -> None:
        pid = _create_project("Filter Status")
        _create_pack_via_api(pid, title="Pack A")
        _create_pack_via_api(pid, title="Pack B")
        resp = client.get(f"/api/projects/{pid}/context-packs?status=draft")
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert len(items) == 2
        assert all(p["status"] == "draft" for p in items)

    def test_list_packs_filtered_by_audience(self, tmp_registry: Path) -> None:
        pid = _create_project("Filter Audience")
        _create_pack_via_api(pid, title="Agent Pack", audience="agent")
        _create_pack_via_api(pid, title="Human Pack", audience="human")
        resp = client.get(f"/api/projects/{pid}/context-packs?audience=agent")
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert len(items) == 1
        assert items[0]["audience"] == "agent"

    def test_get_pack_detail_includes_items(self, tmp_registry: Path) -> None:
        pid = _create_project("Get Detail")
        payload = _make_pack_create(pid)
        payload["items"] = [
            {"item_type": "note", "item_id": "note_01", "include_mode": "full"},
        ]
        resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        pack_id = resp.json()["id"]

        detail = client.get(f"/api/context-packs/{pack_id}").json()
        assert "items" in detail
        assert len(detail["items"]) == 1
        assert detail["items"][0]["item_type"] == "note"

    def test_update_pack_title(self, tmp_registry: Path) -> None:
        pid = _create_project("Update Title")
        pack = _create_pack_via_api(pid)
        resp = client.patch(
            f"/api/context-packs/{pack['id']}",
            json={"title": "Updated Title"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    def test_update_pack_replaces_items(self, tmp_registry: Path) -> None:
        pid = _create_project("Replace Items")
        payload = _make_pack_create(pid)
        payload["items"] = [{"item_type": "note", "item_id": "n1", "include_mode": "full"}]
        resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        pack_id = resp.json()["id"]

        # Replace items
        client.patch(
            f"/api/context-packs/{pack_id}",
            json={
                "items": [
                    {"item_type": "asset", "item_id": "asset_new", "include_mode": "metadata"},
                    {"item_type": "bom_slot", "item_id": "slot_new", "include_mode": "metadata"},
                ]
            },
        )
        detail = client.get(f"/api/context-packs/{pack_id}").json()
        assert len(detail["items"]) == 2
        types = {item["item_type"] for item in detail["items"]}
        assert "note" not in types
        assert "asset" in types

    def test_update_pack_not_found(self, tmp_registry: Path) -> None:
        resp = client.patch(
            "/api/context-packs/nonexistent_pack_xyz",
            json={"title": "Nope"},
        )
        assert resp.status_code == 404

    def test_get_pack_not_found(self, tmp_registry: Path) -> None:
        resp = client.get("/api/context-packs/nonexistent_pack")
        assert resp.status_code == 404
        assert resp.json()["error"]["code"] == "not_found"


# ---------------------------------------------------------------------------
# CP-BE-002: Pack from node (service-level)
# ---------------------------------------------------------------------------


class TestPackFromNode:
    """CP-BE-002: Pack builder from IntentTree node ref."""

    def test_from_node_basic(self, tmp_registry: Path) -> None:
        pid = _create_project("From Node Basic")
        resp = client.post(
            "/api/context-packs/from-node/node_test_001",
            json={"project_id": pid, "title": "Node Pack", "audience": "agent", "sensitivity": "personal"},
        )
        assert resp.status_code == 201, resp.text
        pack = resp.json()
        assert pack["status"] == "draft"
        assert pack["target_id"] == "node_test_001"
        assert pack["target_type"] == "intenttree_node"
        assert pack["project_id"] == pid

    def test_from_node_includes_node_item(self, tmp_registry: Path) -> None:
        pid = _create_project("From Node Items")
        resp = client.post(
            "/api/context-packs/from-node/node_items_test",
            json={"project_id": pid, "audience": "agent", "sensitivity": "personal"},
        )
        pack_id = resp.json()["id"]
        detail = client.get(f"/api/context-packs/{pack_id}").json()
        # The node ref item should always be present
        items = detail["items"]
        node_items = [i for i in items if i["item_type"] == "intenttree_node"]
        assert len(node_items) >= 1
        assert node_items[0]["item_id"] == "node_items_test"

    def test_from_node_marks_missing_meatywiki_integration(self, tmp_registry: Path) -> None:
        """MeatyWiki integration is not live — should be marked as missing."""
        pid = _create_project("From Node MW")
        resp = client.post(
            "/api/context-packs/from-node/node_mw_test",
            json={
                "project_id": pid,
                "audience": "agent",
                "sensitivity": "personal",
                "include_meatywiki_pages": True,
            },
        )
        pack_id = resp.json()["id"]
        detail = client.get(f"/api/context-packs/{pack_id}").json()
        # There should be a note item marking the missing MeatyWiki integration
        note_items = [i for i in detail["items"] if i["item_type"] == "note"]
        assert len(note_items) >= 1
        # The note ID signals the missing integration
        note_id = note_items[0]["item_id"]
        assert "meatywiki" in note_id or "missing" in note_id

    def test_from_node_with_linked_assets(self, tmp_registry: Path) -> None:
        """When assets are linked to the node, they should appear in the pack."""
        pid = _create_project("From Node Assets")
        asset_id = _create_asset(pid, title="Linked Asset")

        # Link the asset to our target node
        link_resp = client.post(
            f"/api/assets/{asset_id}/link",
            json={
                "target_type": "intenttree_node",
                "target_id": "node_linked_test",
                "relationship": "reference",
            },
        )
        assert link_resp.status_code in (200, 201), link_resp.text

        resp = client.post(
            "/api/context-packs/from-node/node_linked_test",
            json={
                "project_id": pid,
                "audience": "agent",
                "sensitivity": "personal",
                "include_assets": True,
                "asset_statuses": ["candidate", "selected", "canonical"],
            },
        )
        assert resp.status_code == 201, resp.text
        pack_id = resp.json()["id"]

        detail = client.get(f"/api/context-packs/{pack_id}").json()
        asset_items = [i for i in detail["items"] if i["item_type"] == "asset"]
        assert any(i["item_id"] == asset_id for i in asset_items), (
            f"Expected asset {asset_id} in pack items: {asset_items}"
        )

    def test_from_node_uses_refs_only_not_content(self, tmp_registry: Path) -> None:
        """Items in from-node packs use metadata mode (refs only, not content)."""
        pid = _create_project("Refs Only")
        resp = client.post(
            "/api/context-packs/from-node/node_refs_only",
            json={"project_id": pid, "audience": "agent", "sensitivity": "personal"},
        )
        pack_id = resp.json()["id"]
        detail = client.get(f"/api/context-packs/{pack_id}").json()
        # All auto-added items default to metadata mode
        for item in detail["items"]:
            assert item["include_mode"] in ("metadata", "link_only", "preview"), (
                f"Expected refs-only mode, got {item['include_mode']} for {item}"
            )

    def test_from_node_service_level(self, tmp_registry: Path) -> None:
        """Direct service call verifies from-node generates correct structure."""
        pid = _create_project("Service From Node")
        svc = _make_service(tmp_registry)
        pack = svc.create_from_node(
            node_id="node_svc_test",
            project_id=pid,
            title="Service Node Pack",
        )
        assert pack.status.value == "draft"
        assert pack.target_id == "node_svc_test"

        detail = svc.get(pack.id)
        assert detail is not None
        items = detail.items or []
        node_refs = [i for i in items if i.item_type.value == "intenttree_node"]
        assert len(node_refs) >= 1


# ---------------------------------------------------------------------------
# CP-BE-003: Policy envelope + estimate
# ---------------------------------------------------------------------------


class TestPolicyEnvelopeAndEstimate:
    """CP-BE-003: Policy downgrade and block for sensitive assets."""

    def test_preview_personal_pack_allowed(self, tmp_registry: Path) -> None:
        pid = _create_project("Policy Personal")
        pack = _create_pack_via_api(pid, sensitivity="personal")
        resp = client.post(f"/api/context-packs/{pack['id']}/preview")
        assert resp.status_code == 200
        body = resp.json()
        assert body["token_estimate"] >= 0
        assert "manifest_yaml" in body

    def test_preview_with_asset_item_includes_policy_warnings(self, tmp_registry: Path) -> None:
        """An asset with work_sensitive sensitivity should be noted in warnings."""
        pid = _create_project("Policy Asset Warn")
        asset_id = _create_asset(
            pid, sensitivity="work_sensitive", agent_access="preview_allowed"
        )
        payload = _make_pack_create(pid)
        payload["items"] = [
            {"item_type": "asset", "item_id": asset_id, "include_mode": "full"}
        ]
        resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        pack_id = resp.json()["id"]

        preview_resp = client.post(f"/api/context-packs/{pack_id}/preview")
        assert preview_resp.status_code == 200
        body = preview_resp.json()
        # Should report a sensitive item count or warnings
        assert (
            (body.get("sensitive_item_count") or 0) > 0
            or (body.get("warnings") is not None and len(body["warnings"]) > 0)
        )

    def test_policy_downgrade_via_service_restricted_asset(self, tmp_registry: Path) -> None:
        """Restricted asset with agent_access=preview_allowed should be capped at preview."""
        pid = _create_project("Policy Downgrade")
        asset_id = _create_asset(
            pid, sensitivity="restricted", agent_access="read_allowed"
        )
        create_data = ContextPackCreate(
            title="Downgrade Pack",
            target_type=ContextPackTargetType.project,
            target_id=pid,
            audience=ContextPackAudience.agent,
            sensitivity=Sensitivity.personal,
            items=[
                ContextPackItemCreate(
                    item_type=ContextPackItemType.asset,
                    item_id=asset_id,
                    include_mode=IncludeMode.full,  # Request full — should be downgraded
                )
            ],
        )
        svc = _make_service(tmp_registry)
        pack = svc.create(pid, create_data)
        result = svc.apply_policy_and_estimate(pack.id, actor_type="agent")

        items_eval = result["items"]
        asset_eval = [e for e in items_eval if e["item_ref_id"] == asset_id]
        assert len(asset_eval) == 1
        # Must be downgraded from full to preview (restricted sensitivity cap)
        assert asset_eval[0]["effective_include_mode"] != "full", (
            "Restricted asset must be downgraded from full include mode"
        )
        assert asset_eval[0]["effective_include_mode"] in ("preview", "metadata"), (
            f"Expected preview or metadata, got {asset_eval[0]['effective_include_mode']}"
        )

    def test_policy_block_agent_access_none(self, tmp_registry: Path) -> None:
        """Asset with agent_access=none must be denied."""
        pid = _create_project("Policy Block None")
        asset_id = _create_asset(
            pid, sensitivity="personal", agent_access="none"
        )
        create_data = ContextPackCreate(
            title="Block Pack",
            target_type=ContextPackTargetType.project,
            target_id=pid,
            audience=ContextPackAudience.agent,
            sensitivity=Sensitivity.personal,
            items=[
                ContextPackItemCreate(
                    item_type=ContextPackItemType.asset,
                    item_id=asset_id,
                    include_mode=IncludeMode.metadata,
                )
            ],
        )
        svc = _make_service(tmp_registry)
        pack = svc.create(pid, create_data)
        result = svc.apply_policy_and_estimate(pack.id, actor_type="agent")

        items_eval = result["items"]
        asset_eval = [e for e in items_eval if e["item_ref_id"] == asset_id]
        assert len(asset_eval) == 1
        assert asset_eval[0]["policy_decision"] == "deny"

    def test_policy_estimate_token_count(self, tmp_registry: Path) -> None:
        """Token estimate should accumulate per-item estimates."""
        pid = _create_project("Token Estimate")
        create_data = ContextPackCreate(
            title="Token Pack",
            target_type=ContextPackTargetType.project,
            target_id=pid,
            audience=ContextPackAudience.agent,
            sensitivity=Sensitivity.personal,
            items=[
                ContextPackItemCreate(
                    item_type=ContextPackItemType.note,
                    item_id="note_a",
                    include_mode=IncludeMode.full,
                ),
                ContextPackItemCreate(
                    item_type=ContextPackItemType.note,
                    item_id="note_b",
                    include_mode=IncludeMode.metadata,
                ),
            ],
        )
        svc = _make_service(tmp_registry)
        pack = svc.create(pid, create_data)
        result = svc.apply_policy_and_estimate(pack.id)
        # full=2000, metadata=150 → total=2150
        assert result["token_estimate"] == 2150

    def test_policy_envelope_carried_in_service(self, tmp_registry: Path) -> None:
        """Policy envelope fields are preserved through the service."""
        pid = _create_project("Envelope Carry")
        create_data = ContextPackCreate(
            title="Envelope Pack",
            target_type=ContextPackTargetType.project,
            target_id=pid,
            audience=ContextPackAudience.agent,
            sensitivity=Sensitivity.personal,
            policy=ContextPackPolicy(
                allow_external_data=False,
                allow_code_execution=True,
                network_access="restricted",
                agent_access="trusted_agents_only",
            ),
        )
        svc = _make_service(tmp_registry)
        pack = svc.create(pid, create_data)
        result = svc.apply_policy_and_estimate(pack.id)
        envelope = result["policy_envelope"]
        assert envelope["allow_code_execution"] is True
        assert envelope["network_access"] == "restricted"

    def test_publish_blocked_for_sensitive_pack_via_service(self, tmp_registry: Path) -> None:
        """Publish of restricted/client_sensitive/work_sensitive pack is blocked."""
        pid = _create_project("Blocked Publish Svc")
        for sensitivity in ("restricted", "client_sensitive", "work_sensitive"):
            create_data = ContextPackCreate(
                title=f"{sensitivity} Pack",
                target_type=ContextPackTargetType.project,
                target_id=pid,
                audience=ContextPackAudience.agent,
                sensitivity=Sensitivity(sensitivity),
            )
            svc = _make_service(tmp_registry)
            pack = svc.create(pid, create_data)
            with pytest.raises(PermissionError):
                svc.publish(pack.id)

    def test_publish_blocked_via_api(self, tmp_registry: Path) -> None:
        """API: publishing a restricted pack returns 403."""
        pid = _create_project("Blocked API")
        pack = _create_pack_via_api(pid, sensitivity="restricted")
        resp = client.post(
            f"/api/context-packs/{pack['id']}/publish",
            json={"destination": "file"},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert body["error"]["code"] == "policy_denied"

    def test_publish_blocked_client_sensitive_via_api(self, tmp_registry: Path) -> None:
        """API: publishing a client_sensitive pack returns 403."""
        pid = _create_project("Blocked CS API")
        pack = _create_pack_via_api(pid, sensitivity="client_sensitive")
        resp = client.post(
            f"/api/context-packs/{pack['id']}/publish",
            json={"destination": "file"},
        )
        assert resp.status_code == 403

    def test_publish_blocked_work_sensitive_via_api(self, tmp_registry: Path) -> None:
        """API: publishing a work_sensitive pack returns 403."""
        pid = _create_project("Blocked WS API")
        pack = _create_pack_via_api(pid, sensitivity="work_sensitive")
        resp = client.post(
            f"/api/context-packs/{pack['id']}/publish",
            json={"destination": "file"},
        )
        assert resp.status_code == 403

    def test_publish_allowed_for_personal_pack(self, tmp_registry: Path) -> None:
        """API: publishing a personal pack succeeds."""
        pid = _create_project("Allowed Publish")
        pack = _create_pack_via_api(pid, sensitivity="personal")
        resp = client.post(
            f"/api/context-packs/{pack['id']}/publish",
            json={"destination": "file"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "published"

    def test_publish_allowed_for_public_pack(self, tmp_registry: Path) -> None:
        """API: publishing a public pack succeeds."""
        pid = _create_project("Allowed Public Publish")
        pack = _create_pack_via_api(pid, sensitivity="public")
        resp = client.post(
            f"/api/context-packs/{pack['id']}/publish",
            json={"destination": "file"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "published"


# ---------------------------------------------------------------------------
# CP-BE-004: Preview + Export YAML validity
# ---------------------------------------------------------------------------


class TestPreviewAndExport:
    """CP-BE-004: Preview renders correct YAML; export writes valid file."""

    def test_preview_returns_manifest_yaml(self, tmp_registry: Path) -> None:
        pid = _create_project("Preview YAML")
        pack = _create_pack_via_api(pid, title="Preview Pack")
        resp = client.post(f"/api/context-packs/{pack['id']}/preview")
        assert resp.status_code == 200
        body = resp.json()
        yaml_text = body["manifest_yaml"]
        # Must contain the spec §14.3 top-level key
        assert "context_pack_manifest" in yaml_text
        # Must contain the pack ID
        assert pack["id"] in yaml_text

    def test_preview_yaml_contains_required_fields(self, tmp_registry: Path) -> None:
        """YAML manifest must have id, title, project_id, sensitivity, policy, items."""
        pid = _create_project("YAML Fields")
        payload = _make_pack_create(pid, title="Fields Pack")
        payload["items"] = [{"item_type": "note", "item_id": "n1", "include_mode": "full"}]
        pack_resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        pack_id = pack_resp.json()["id"]

        preview = client.post(f"/api/context-packs/{pack_id}/preview").json()
        yaml_text = preview["manifest_yaml"]
        for field in ("id:", "title:", "project_id:", "sensitivity:", "policy:", "items:"):
            assert field in yaml_text, f"Expected '{field}' in manifest YAML"

    def test_export_yaml_writes_file(self, tmp_registry: Path) -> None:
        """Export writes a YAML file to exports/context-packs/."""
        pid = _create_project("Export File")
        pack = _create_pack_via_api(pid, title="Export Pack")
        svc = _make_service(tmp_registry)
        written = svc.export_yaml(pack["id"])
        assert written.exists()
        assert written.suffix == ".yaml"
        content = written.read_text(encoding="utf-8")
        assert "context_pack_manifest" in content
        assert pack["id"] in content

    def test_export_yaml_valid_structure(self, tmp_registry: Path) -> None:
        """Exported YAML parses correctly and matches spec §14.3 shape."""
        pid = _create_project("Export Structure")
        payload = _make_pack_create(pid, title="Structured Pack")
        payload["policy"] = {"allow_external_data": False, "allow_code_execution": True, "network_access": "none"}
        payload["instructions"] = "Test instructions for agent."
        payload["items"] = [
            {"item_type": "asset", "item_id": "asset_ref_001", "include_mode": "preview"},
            {"item_type": "note", "item_id": "note_001", "include_mode": "full"},
        ]
        pack_resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        pack_id = pack_resp.json()["id"]

        svc = _make_service(tmp_registry)
        written = svc.export_yaml(pack_id)
        content = written.read_text(encoding="utf-8")

        try:
            import yaml as _yaml
            data = _yaml.safe_load(content)
        except ImportError:
            # Without yaml, do a basic string check
            assert "context_pack_manifest" in content
            return

        assert "context_pack_manifest" in data
        manifest = data["context_pack_manifest"]
        # Required top-level fields per spec §14.3
        assert manifest["id"] == pack_id
        assert "title" in manifest
        assert "project_id" in manifest
        assert "sensitivity" in manifest
        assert "policy" in manifest
        assert "items" in manifest
        # Policy fields
        policy = manifest["policy"]
        assert "allow_external_data" in policy
        assert "allow_code_execution" in policy
        assert "network_access" in policy
        # Items shape
        for item in manifest["items"]:
            assert "type" in item
            assert "id" in item
            assert "include_mode" in item

    def test_export_no_silent_overwrite(self, tmp_registry: Path) -> None:
        """A second export of the same pack produces a differently-named file."""
        pid = _create_project("No Overwrite")
        pack = _create_pack_via_api(pid, title="Overwrite Test Pack")
        svc = _make_service(tmp_registry)
        path1 = svc.export_yaml(pack["id"])
        path2 = svc.export_yaml(pack["id"])
        # Both files exist
        assert path1.exists()
        assert path2.exists()
        # Second path has a different name (timestamp suffix)
        assert path1 != path2

    def test_export_via_api_endpoint(self, tmp_registry: Path) -> None:
        """POST /context-packs/{packId}/export returns export_path."""
        pid = _create_project("API Export")
        pack = _create_pack_via_api(pid, title="API Export Pack")
        resp = client.post(f"/api/context-packs/{pack['id']}/export")
        assert resp.status_code == 200
        body = resp.json()
        assert "export_path" in body
        assert body["pack_id"] == pack["id"]

    def test_publish_updates_status_to_published(self, tmp_registry: Path) -> None:
        pid = _create_project("Publish Status")
        pack = _create_pack_via_api(pid, sensitivity="personal")
        resp = client.post(
            f"/api/context-packs/{pack['id']}/publish",
            json={"destination": "file"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "published"

    def test_publish_emits_audit_event(self, tmp_registry: Path) -> None:
        """Publish must emit a context_pack_published audit event."""
        pid = _create_project("Audit Publish")
        pack = _create_pack_via_api(pid, sensitivity="personal")
        resp = client.post(
            f"/api/context-packs/{pack['id']}/publish",
            json={"destination": "file"},
        )
        assert resp.status_code == 200

        # Verify audit event was written
        from app.services.audit import AuditService
        import app.settings as _settings_mod
        settings = _settings_mod.get_settings()
        audit = AuditService(settings.registry_dir)
        events = audit.list_events(event_type="context_pack_published")
        assert len(events) >= 1
        our_events = [e for e in events if e.target_id == pack["id"]]
        assert len(our_events) == 1

    def test_publish_emits_ccdash_event_payload(self, tmp_registry: Path) -> None:
        """Publish audit event payload must contain ccdash_event_payload hook."""
        pid = _create_project("CCDash Hook")
        pack = _create_pack_via_api(pid, sensitivity="personal")
        svc = _make_service(tmp_registry)
        updated, ccdash_payload = svc.publish(pack["id"])

        assert ccdash_payload is not None
        assert ccdash_payload["event_type"] == "context_pack_published"
        assert ccdash_payload["pack_id"] == pack["id"]
        assert "export_path" in ccdash_payload
        assert "timestamp" in ccdash_payload
        assert "sensitivity" in ccdash_payload
        assert "destination" in ccdash_payload

    def test_publish_archived_pack_conflict(self, tmp_registry: Path) -> None:
        """Publishing an archived pack returns 409."""
        pid = _create_project("Archived Conflict")
        pack = _create_pack_via_api(pid)
        pack_id = pack["id"]

        from app.repositories.context_packs import ContextPackRepository
        import app.settings as _settings_mod
        repo = ContextPackRepository(_settings_mod.get_settings().registry_dir)
        repo.update_status(pack_id, "archived")

        resp = client.post(
            f"/api/context-packs/{pack_id}/publish",
            json={"destination": "file"},
        )
        assert resp.status_code == 409
        assert resp.json()["error"]["code"] == "conflict"

    def test_publish_archived_pack_conflict_via_service(self, tmp_registry: Path) -> None:
        """Service raises ConflictError for archived pack publish."""
        pid = _create_project("Conflict Svc")
        pack = _create_pack_via_api(pid)
        pack_id = pack["id"]

        svc = _make_service(tmp_registry)
        svc._repo.update_status(pack_id, "archived")

        with pytest.raises(ConflictError):
            svc.publish(pack_id)

    def test_publish_writes_yaml_export(self, tmp_registry: Path) -> None:
        """Publish writes the YAML file as a side effect."""
        pid = _create_project("Publish YAML")
        pack = _create_pack_via_api(pid, sensitivity="personal", title="Publish YAML Pack")
        svc = _make_service(tmp_registry)
        updated, ccdash = svc.publish(pack["id"])

        export_path = Path(ccdash["export_path"])
        assert export_path.exists(), f"Expected export file at {export_path}"
        content = export_path.read_text(encoding="utf-8")
        assert "context_pack_manifest" in content

    def test_export_does_not_inline_restricted_content(self, tmp_registry: Path) -> None:
        """Export must reference asset IDs/URIs, not inline any restricted content."""
        pid = _create_project("No Inline")
        asset_id = _create_asset(
            pid, sensitivity="restricted", agent_access="preview_allowed", title="Secret Asset"
        )
        payload = _make_pack_create(pid, sensitivity="personal")
        payload["items"] = [
            {"item_type": "asset", "item_id": asset_id, "include_mode": "full"}
        ]
        resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        pack_id = resp.json()["id"]

        svc = _make_service(tmp_registry)
        written = svc.export_yaml(pack_id)
        content = written.read_text(encoding="utf-8")

        # Content should contain the asset ID reference
        assert asset_id in content
        # Content should NOT contain the asset's raw file content
        # (We verify no large inline blob — just the ID is present)
        # The include_mode should be downgraded (not 'full') in the YAML
        assert "Secret Asset" not in content  # Title not inlined in content field


# ---------------------------------------------------------------------------
# Integration: full lifecycle
# ---------------------------------------------------------------------------


class TestFullLifecycle:
    """End-to-end lifecycle: create → items → preview → export → publish."""

    def test_full_lifecycle(self, tmp_registry: Path) -> None:
        pid = _create_project("Full Lifecycle")
        asset_id = _create_asset(pid, sensitivity="personal", agent_access="read_allowed")

        # 1. Create draft pack with items
        payload = _make_pack_create(pid, title="Lifecycle Pack")
        payload["policy"] = {
            "allow_external_data": False,
            "allow_code_execution": False,
            "network_access": "none",
        }
        payload["instructions"] = "Complete lifecycle test."
        payload["items"] = [
            {"item_type": "asset", "item_id": asset_id, "include_mode": "preview"},
            {"item_type": "note", "item_id": "note_lifecycle", "include_mode": "full"},
        ]
        create_resp = client.post(f"/api/projects/{pid}/context-packs", json=payload)
        assert create_resp.status_code == 201
        pack = create_resp.json()
        pack_id = pack["id"]
        assert pack["status"] == "draft"

        # 2. Update metadata
        update_resp = client.patch(
            f"/api/context-packs/{pack_id}",
            json={"title": "Updated Lifecycle Pack"},
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["title"] == "Updated Lifecycle Pack"

        # 3. Preview
        preview_resp = client.post(f"/api/context-packs/{pack_id}/preview")
        assert preview_resp.status_code == 200
        preview = preview_resp.json()
        assert "context_pack_manifest" in preview["manifest_yaml"]
        assert preview["token_estimate"] > 0

        # 4. Export
        export_resp = client.post(f"/api/context-packs/{pack_id}/export")
        assert export_resp.status_code == 200
        export_path = Path(export_resp.json()["export_path"])
        assert export_path.exists()

        # 5. Publish
        publish_resp = client.post(
            f"/api/context-packs/{pack_id}/publish",
            json={"destination": "file"},
        )
        assert publish_resp.status_code == 200
        assert publish_resp.json()["status"] == "published"

        # 6. Verify audit events
        from app.services.audit import AuditService
        import app.settings as _settings_mod
        settings = _settings_mod.get_settings()
        audit = AuditService(settings.registry_dir)

        created_evts = [
            e for e in audit.list_events(event_type="context_pack_created")
            if e.target_id == pack_id
        ]
        published_evts = [
            e for e in audit.list_events(event_type="context_pack_published")
            if e.target_id == pack_id
        ]
        assert len(created_evts) >= 1
        assert len(published_evts) >= 1
        # CCDash hook in published event payload
        pub_payload = published_evts[0].payload or {}
        assert "ccdash_event_payload" in pub_payload
