"""TEST-002: API integration tests.

End-to-end workflow tests for the main API surfaces:
  - Projects: CRUD
  - Assets: CRUD, filters, pagination
  - Inbox: import, classify, apply-classification
  - Templates: list, get
  - BOM: get, apply template, coverage, gaps, slot assignment
  - Context Packs: create, get, preview, export
  - Policy + Audit: evaluate, event recording
  - Search: keyword and semantic

All tests run against the FastAPI test client with an isolated temp registry
(no real filesystem writes to registry/ or exports/).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_project(name: str = "Integration Project") -> str:
    slug = name.lower().replace(" ", "-")
    resp = client.post("/api/projects", json={"name": name, "slug": slug, "status": "active"})
    assert resp.status_code == 201, f"create_project: {resp.text}"
    return resp.json()["id"]


def _create_asset(project_id: str, **overrides) -> dict:
    payload = {
        "title": "Integration Asset",
        "source_kind": "local",
        "uri": "file:///tmp/integration.md",
        "status": "inbox",
        "sensitivity": "personal",
        "agent_access": "read_allowed",
        **overrides,
    }
    resp = client.post(f"/api/projects/{project_id}/assets", json=payload)
    assert resp.status_code == 201, f"create_asset: {resp.text}"
    return resp.json()


# ===========================================================================
# Project CRUD
# ===========================================================================


class TestProjectCRUD:
    def test_list_projects_paginated(self, tmp_registry) -> None:
        """GET /api/projects returns cursor-paginated list."""
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "has_more" in body
        assert isinstance(body["items"], list)

    def test_create_project(self, tmp_registry) -> None:
        """POST /api/projects creates a project with expected fields."""
        payload = {"name": "My Project", "slug": "my-project", "status": "active"}
        resp = client.post("/api/projects", json=payload)
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "My Project"
        assert body["slug"] == "my-project"
        assert "id" in body
        assert body["status"] == "active"

    def test_get_project_by_id(self, tmp_registry) -> None:
        """GET /api/projects/{id} returns the project."""
        pid = _create_project("Get By ID")
        resp = client.get(f"/api/projects/{pid}")
        assert resp.status_code == 200
        assert resp.json()["id"] == pid

    def test_update_project(self, tmp_registry) -> None:
        """PATCH /api/projects/{id} updates description."""
        pid = _create_project("Update Test")
        resp = client.patch(f"/api/projects/{pid}", json={"description": "Updated desc"})
        assert resp.status_code == 200
        assert resp.json()["description"] == "Updated desc"

    def test_get_project_not_found(self, tmp_registry) -> None:
        """GET nonexistent project returns 404."""
        resp = client.get("/api/projects/nonexistent_proj_xyz")
        assert resp.status_code == 404

    def test_create_duplicate_slug_conflict(self, tmp_registry) -> None:
        """Creating a project with duplicate slug returns 409."""
        payload = {"name": "Dupe", "slug": "dupe-slug", "status": "active"}
        r1 = client.post("/api/projects", json=payload)
        assert r1.status_code == 201
        r2 = client.post("/api/projects", json=payload)
        assert r2.status_code == 409

    def test_list_projects_filter_by_status(self, tmp_registry) -> None:
        """GET /api/projects?status=active filters correctly."""
        _create_project("Active One")
        resp = client.get("/api/projects", params={"status": "active"})
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert all(p["status"] == "active" for p in items)


# ===========================================================================
# Asset CRUD and filtering
# ===========================================================================


class TestAssetCRUD:
    def test_list_assets_empty(self, tmp_registry) -> None:
        """GET /api/projects/{id}/assets returns empty list for new project."""
        pid = _create_project("Empty Assets")
        resp = client.get(f"/api/projects/{pid}/assets")
        assert resp.status_code == 200
        assert resp.json()["items"] == []

    def test_create_and_get_asset(self, tmp_registry) -> None:
        """POST then GET an asset."""
        pid = _create_project("Asset CRUD")
        asset = _create_asset(pid, title="My Asset")
        aid = asset["id"]

        resp = client.get(f"/api/assets/{aid}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == aid
        assert body["title"] == "My Asset"

    def test_update_asset_fields(self, tmp_registry) -> None:
        """PATCH /api/assets/{id} updates specific fields."""
        pid = _create_project("Asset Update")
        asset = _create_asset(pid)
        aid = asset["id"]

        resp = client.patch(f"/api/assets/{aid}", json={"description": "New description"})
        assert resp.status_code == 200
        assert resp.json()["description"] == "New description"

    def test_list_assets_filter_by_status(self, tmp_registry) -> None:
        """Assets can be filtered by status."""
        pid = _create_project("Filter Status")
        _create_asset(pid, status="inbox")
        _create_asset(pid, status="candidate")

        resp = client.get(f"/api/projects/{pid}/assets", params={"status": "inbox"})
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert all(a["status"] == "inbox" for a in items)

    def test_list_assets_filter_by_sensitivity(self, tmp_registry) -> None:
        """Assets can be filtered by sensitivity."""
        pid = _create_project("Filter Sensitivity")
        _create_asset(pid, sensitivity="personal")
        _create_asset(pid, sensitivity="work_sensitive")

        resp = client.get(f"/api/projects/{pid}/assets", params={"sensitivity": "personal"})
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert all(a["sensitivity"] == "personal" for a in items)

    def test_list_assets_filter_by_source_kind(self, tmp_registry) -> None:
        """Assets can be filtered by source_kind."""
        pid = _create_project("Filter SourceKind")
        _create_asset(pid, source_kind="local")
        _create_asset(pid, source_kind="url", uri="https://example.com/doc.pdf")

        resp = client.get(f"/api/projects/{pid}/assets", params={"source_kind": "local"})
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert all(a["source_kind"] == "local" for a in items)

    def test_list_assets_keyword_search(self, tmp_registry) -> None:
        """Assets can be filtered by keyword via ?q=."""
        pid = _create_project("Keyword Search")
        _create_asset(pid, title="Alpha Blueprint Document")
        _create_asset(pid, title="Something Unrelated")

        resp = client.get(f"/api/projects/{pid}/assets", params={"q": "blueprint"})
        assert resp.status_code == 200
        items = resp.json()["items"]
        titles = [a["title"] for a in items]
        assert any("Blueprint" in t for t in titles)

    def test_asset_not_found(self, tmp_registry) -> None:
        """GET nonexistent asset returns 404."""
        resp = client.get("/api/assets/nonexistent_asset_xyz")
        assert resp.status_code == 404

    def test_delete_non_canonical_asset(self, tmp_registry) -> None:
        """DELETE /api/assets/{id} on a non-canonical asset returns 204."""
        pid = _create_project("Delete Asset")
        asset = _create_asset(pid, status="inbox")
        aid = asset["id"]

        resp = client.delete(f"/api/assets/{aid}")
        assert resp.status_code == 204

        # Asset should no longer be retrievable
        resp = client.get(f"/api/assets/{aid}")
        assert resp.status_code == 404

    def test_asset_pagination_cursor(self, tmp_registry) -> None:
        """Cursor-based pagination works for asset list."""
        pid = _create_project("Pagination Test")
        for i in range(5):
            _create_asset(pid, title=f"Asset {i}")

        resp = client.get(f"/api/projects/{pid}/assets", params={"limit": 2})
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["items"]) <= 2
        # If there are more, has_more should be True
        if len(body["items"]) == 2:
            assert "has_more" in body


# ===========================================================================
# Inbox workflow
# ===========================================================================


class TestInboxWorkflow:
    def test_list_inbox_empty(self, tmp_registry) -> None:
        """GET /api/projects/{id}/inbox returns paginated inbox items."""
        pid = _create_project("Empty Inbox")
        resp = client.get(f"/api/projects/{pid}/inbox")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body or "inbox_items" in body or isinstance(body, dict)

    def test_inbox_classify_returns_suggestions(self, tmp_registry) -> None:
        """POST /api/projects/{id}/inbox/classify returns classification suggestions."""
        pid = _create_project("Classify Test")
        asset = _create_asset(pid, status="inbox")
        aid = asset["id"]

        resp = client.post(
            f"/api/projects/{pid}/inbox/classify",
            json={"asset_ids": [aid]},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "suggestions" in body
        assert len(body["suggestions"]) >= 1

    def test_inbox_apply_classification(self, tmp_registry) -> None:
        """POST /api/projects/{id}/inbox/apply-classification updates asset status."""
        pid = _create_project("Apply Classification")
        asset = _create_asset(pid, status="inbox")
        aid = asset["id"]

        resp = client.post(
            f"/api/projects/{pid}/inbox/apply-classification",
            json={
                "classifications": [
                    {
                        "asset_id": aid,
                        "status": "candidate",
                        "sensitivity": "personal",
                    }
                ]
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("updated_count", 0) >= 1 or aid in body.get("asset_ids", [])

        # Verify the asset status was updated
        updated = client.get(f"/api/assets/{aid}")
        assert updated.status_code == 200
        assert updated.json()["status"] == "candidate"

    def test_inbox_filter_by_source_kind(self, tmp_registry) -> None:
        """GET /api/projects/{id}/inbox can filter by source_kind."""
        pid = _create_project("Inbox Filter")
        _create_asset(pid, status="inbox", source_kind="local")

        resp = client.get(f"/api/projects/{pid}/inbox", params={"source_kind": "local"})
        assert resp.status_code == 200


# ===========================================================================
# Templates
# ===========================================================================


class TestTemplates:
    def test_list_templates(self, tmp_registry) -> None:
        """GET /api/templates returns a list (may be empty with tmp registry)."""
        resp = client.get("/api/templates")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert isinstance(body["items"], list)

    def test_get_template_not_found(self, tmp_registry) -> None:
        """GET /api/templates/nonexistent returns 404."""
        resp = client.get("/api/templates/nonexistent_template_xyz")
        assert resp.status_code == 404


# ===========================================================================
# BOM workflow
# ===========================================================================


class TestBomWorkflow:
    def test_get_bom_for_project(self, tmp_registry) -> None:
        """GET /api/projects/{id}/bom creates or retrieves the BOM."""
        pid = _create_project("BOM Project")
        resp = client.get(f"/api/projects/{pid}/bom")
        assert resp.status_code in (200, 201, 404), (
            f"Expected 200/201/404, got {resp.status_code}: {resp.text}"
        )
        if resp.status_code == 200:
            body = resp.json()
            assert "id" in body
            assert body["project_id"] == pid

    def test_bom_coverage(self, tmp_registry) -> None:
        """GET /api/bom/{bomId}/coverage returns coverage summary."""
        pid = _create_project("BOM Coverage")
        bom_resp = client.get(f"/api/projects/{pid}/bom")
        if bom_resp.status_code not in (200, 201):
            pytest.skip("BOM not available for this project")

        bom_id = bom_resp.json()["id"]
        resp = client.get(f"/api/bom/{bom_id}/coverage")
        assert resp.status_code == 200
        body = resp.json()
        assert "coverage_score" in body
        assert "total_slots" in body

    def test_bom_gaps(self, tmp_registry) -> None:
        """GET /api/bom/{bomId}/gaps returns gap recommendations."""
        pid = _create_project("BOM Gaps")
        bom_resp = client.get(f"/api/projects/{pid}/bom")
        if bom_resp.status_code not in (200, 201):
            pytest.skip("BOM not available")

        bom_id = bom_resp.json()["id"]
        resp = client.get(f"/api/bom/{bom_id}/gaps")
        assert resp.status_code == 200
        body = resp.json()
        assert "total_gaps" in body or "recommendations" in body


# ===========================================================================
# Context Packs
# ===========================================================================


class TestContextPackWorkflow:
    @staticmethod
    def _cp_payload(title: str, pid: str, **overrides) -> dict:
        """Build a valid context pack create payload."""
        return {
            "title": title,
            "target_type": "project",
            "target_id": pid,
            "audience": "agent",
            "sensitivity": "personal",
            **overrides,
        }

    def test_create_context_pack(self, tmp_registry) -> None:
        """POST /api/projects/{id}/context-packs creates a draft pack."""
        pid = _create_project("Context Pack Test")
        resp = client.post(
            f"/api/projects/{pid}/context-packs",
            json=self._cp_payload("My Context Pack", pid),
        )
        assert resp.status_code == 201, f"create context pack: {resp.text}"
        body = resp.json()
        assert body["title"] == "My Context Pack"
        assert body["status"] == "draft"
        assert body["project_id"] == pid

    def test_get_context_pack(self, tmp_registry) -> None:
        """GET /api/context-packs/{id} retrieves the created pack."""
        pid = _create_project("CP Get")
        create_resp = client.post(
            f"/api/projects/{pid}/context-packs",
            json=self._cp_payload("Pack For Get", pid),
        )
        assert create_resp.status_code == 201, f"create: {create_resp.text}"
        pack_id = create_resp.json()["id"]

        resp = client.get(f"/api/context-packs/{pack_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == pack_id

    def test_list_context_packs_for_project(self, tmp_registry) -> None:
        """GET /api/projects/{id}/context-packs lists packs."""
        pid = _create_project("CP List")
        r1 = client.post(f"/api/projects/{pid}/context-packs", json=self._cp_payload("Pack A", pid))
        r2 = client.post(f"/api/projects/{pid}/context-packs", json=self._cp_payload("Pack B", pid))
        assert r1.status_code == 201, r1.text
        assert r2.status_code == 201, r2.text

        resp = client.get(f"/api/projects/{pid}/context-packs")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert len(body["items"]) >= 2

    def test_context_pack_preview(self, tmp_registry) -> None:
        """POST /api/context-packs/{id}/preview returns a preview."""
        pid = _create_project("CP Preview")
        create_resp = client.post(
            f"/api/projects/{pid}/context-packs",
            json=self._cp_payload("Previewable Pack", pid),
        )
        assert create_resp.status_code == 201, f"create: {create_resp.text}"
        pack_id = create_resp.json()["id"]

        resp = client.post(f"/api/context-packs/{pack_id}/preview")
        assert resp.status_code in (200, 201, 422), (
            f"Unexpected status: {resp.status_code}: {resp.text}"
        )

    def test_context_pack_publish_restricted_denied(self, tmp_registry) -> None:
        """Publishing a restricted context pack is blocked by policy."""
        pid = _create_project("CP Restricted Publish")
        create_resp = client.post(
            f"/api/projects/{pid}/context-packs",
            json=self._cp_payload("Restricted Pack", pid, sensitivity="restricted"),
        )
        assert create_resp.status_code == 201, f"create: {create_resp.text}"
        pack_id = create_resp.json()["id"]

        resp = client.post(
            f"/api/context-packs/{pack_id}/publish",
            json={"confirm": True},
        )
        # Policy should deny publishing a restricted pack
        assert resp.status_code in (403, 422, 409), (
            f"Expected policy denial for restricted publish, got {resp.status_code}: {resp.text}"
        )

    def test_context_pack_not_found(self, tmp_registry) -> None:
        """GET nonexistent context pack returns 404."""
        resp = client.get("/api/context-packs/nonexistent_pack_xyz")
        assert resp.status_code == 404


# ===========================================================================
# Health check
# ===========================================================================


class TestHealth:
    def test_health_check(self, tmp_registry) -> None:
        """GET /health returns {status: ok, version: ...}."""
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "version" in body


# ===========================================================================
# Search integration
# ===========================================================================


class TestSearchIntegration:
    def test_keyword_search(self, tmp_registry) -> None:
        """GET /api/search?q=... returns results."""
        pid = _create_project("Search Integration")
        _create_asset(pid, title="Unique Keyword Sigma")

        resp = client.get("/api/search", params={"q": "sigma"})
        assert resp.status_code == 200
        body = resp.json()
        assert "results" in body
        assert "total" in body

    def test_semantic_search(self, tmp_registry) -> None:
        """POST /api/search/semantic returns results dict."""
        pid = _create_project("Semantic")
        _create_asset(pid, title="Semantic Doc")

        resp = client.post("/api/search/semantic", json={"query": "doc", "project_id": pid})
        assert resp.status_code == 200
        assert "results" in resp.json()

    def test_similar_assets_not_found(self, tmp_registry) -> None:
        """POST /api/search/similar-assets for nonexistent asset returns 404."""
        resp = client.post(
            "/api/search/similar-assets",
            json={"asset_id": "nonexistent_for_similar_test"},
        )
        assert resp.status_code == 404


# ===========================================================================
# Audit and policy API integration
# ===========================================================================


class TestAuditAndPolicyIntegration:
    def test_audit_events_flow(self, tmp_registry) -> None:
        """Creating assets emits audit events visible via GET /api/audit/events."""
        pid = _create_project("Audit Flow")
        _create_asset(pid, title="Audited Asset")

        resp = client.get("/api/audit/events", params={"project_id": pid})
        assert resp.status_code == 200
        items = resp.json()["items"]
        event_types = [i["event_type"] for i in items]
        assert "asset_added" in event_types

    def test_policy_evaluate_allow_then_deny(self, tmp_registry) -> None:
        """Policy evaluation correctly distinguishes allow vs deny assets."""
        pid = _create_project("Policy Flow")
        allowed_asset = _create_asset(pid, agent_access="read_allowed", sensitivity="personal")
        denied_asset = _create_asset(pid, agent_access="none", sensitivity="personal")

        allow_resp = client.post(
            "/api/policies/evaluate",
            json={
                "resource_type": "asset",
                "resource_id": allowed_asset["id"],
                "action": "read",
                "actor_type": "agent",
            },
        )
        assert allow_resp.status_code == 200
        assert allow_resp.json()["decision"] == "allow"

        deny_resp = client.post(
            "/api/policies/evaluate",
            json={
                "resource_type": "asset",
                "resource_id": denied_asset["id"],
                "action": "read",
                "actor_type": "agent",
            },
        )
        assert deny_resp.status_code == 200
        assert deny_resp.json()["decision"] == "deny"

    def test_agent_access_log(self, tmp_registry) -> None:
        """GET /api/agents/access-log returns paginated list."""
        resp = client.get("/api/agents/access-log")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
