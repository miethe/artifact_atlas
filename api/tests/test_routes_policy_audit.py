"""Route tests for policy and audit endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _create_project(name: str) -> str:
    slug = name.lower().replace(" ", "-")
    resp = client.post("/api/projects", json={"name": name, "slug": slug, "status": "active"})
    assert resp.status_code == 201
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


# ---------------------------------------------------------------------------
# Policy evaluation
# ---------------------------------------------------------------------------


def test_evaluate_policy_allow(tmp_registry) -> None:
    """Policy evaluation for a public, read-allowed asset should return allow."""
    pid = _create_project("Policy Allow")
    asset = _create_asset(pid, sensitivity="personal", agent_access="read_allowed")
    aid = asset["id"]

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
    assert body["decision"] == "allow"
    assert body["resource_id"] == aid


def test_evaluate_policy_deny_agent_access_none(tmp_registry) -> None:
    """Policy evaluation for agent_access=none should deny."""
    pid = _create_project("Policy Deny")
    asset = _create_asset(pid, agent_access="none", sensitivity="personal")
    aid = asset["id"]

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
    assert body["rule_triggered"] == "agent_access_none"


def test_evaluate_policy_asset_not_found(tmp_registry) -> None:
    """Evaluating policy for nonexistent asset returns deny."""
    resp = client.post(
        "/api/policies/evaluate",
        json={
            "resource_type": "asset",
            "resource_id": "nonexistent_asset_xyz",
            "action": "read",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "deny"
    assert body["rule_triggered"] == "asset_not_found"


def test_evaluate_policy_generic_context_pack(tmp_registry) -> None:
    """Generic policy for context_pack publish with public sensitivity should allow."""
    resp = client.post(
        "/api/policies/evaluate",
        json={
            "resource_type": "context_pack",
            "resource_id": "pack_test_123",
            "action": "publish",
            "context": {"sensitivity": "personal"},
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "allow"


def test_evaluate_policy_generic_sensitive_publish_denied(tmp_registry) -> None:
    """Publishing restricted context pack is denied by policy."""
    resp = client.post(
        "/api/policies/evaluate",
        json={
            "resource_type": "context_pack",
            "resource_id": "pack_restricted_123",
            "action": "publish",
            "context": {"sensitivity": "restricted"},
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "deny"
    assert "sensitive" in body["rule_triggered"]


# ---------------------------------------------------------------------------
# Audit events
# ---------------------------------------------------------------------------


def test_list_audit_events_empty(tmp_registry) -> None:
    resp = client.get("/api/audit/events")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body


def test_audit_events_recorded_on_asset_create(tmp_registry) -> None:
    """Creating an asset should record an asset_added audit event."""
    pid = _create_project("Audit Test")
    asset = _create_asset(pid)
    aid = asset["id"]

    resp = client.get(f"/api/audit/events?project_id={pid}")
    assert resp.status_code == 200
    items = resp.json()["items"]
    event_types = [i.get("event_type") for i in items]
    assert "asset_added" in event_types


def test_audit_events_filter_by_event_type(tmp_registry) -> None:
    pid = _create_project("Audit Filter")
    _create_asset(pid)

    resp = client.get(f"/api/audit/events?project_id={pid}&event_type=asset_added")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 1
    assert all(i["event_type"] == "asset_added" for i in items)


def test_agent_access_log(tmp_registry) -> None:
    """GET /api/agents/access-log returns a paginated list."""
    resp = client.get("/api/agents/access-log")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "has_more" in body


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


def test_search_assets(tmp_registry) -> None:
    pid = _create_project("Search Test")
    _create_asset(pid, title="Findable Document Alpha")
    _create_asset(pid, title="Something Unrelated")

    resp = client.get("/api/search?q=alpha")
    assert resp.status_code == 200
    body = resp.json()
    assert "results" in body
    assert "total" in body
    # At least our asset should appear
    titles = [r["title"] for r in body["results"]]
    assert any("Alpha" in t for t in titles)


def test_semantic_search(tmp_registry) -> None:
    pid = _create_project("Semantic Search")
    _create_asset(pid, title="Semantic Doc Beta")

    resp = client.post(
        "/api/search/semantic",
        json={"query": "beta", "project_id": pid},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "results" in body


def test_similar_assets(tmp_registry) -> None:
    pid = _create_project("Similar Assets")
    a1 = _create_asset(pid, title="Blueprint Design")
    _create_asset(pid, title="Blueprint Revision")

    resp = client.post(
        "/api/search/similar-assets",
        json={"asset_id": a1["id"], "limit": 5},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "results" in body


def test_similar_assets_not_found(tmp_registry) -> None:
    resp = client.post(
        "/api/search/similar-assets",
        json={"asset_id": "nonexistent_xyz"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------


def test_list_integrations(tmp_registry) -> None:
    resp = client.get("/api/integrations")
    assert resp.status_code == 200
    body = resp.json()
    assert "integrations" in body
    integration_ids = [i["id"] for i in body["integrations"]]
    # At least the known integrations should appear
    assert "meatywiki" in integration_ids or len(body["integrations"]) > 0


def test_get_integration_status(tmp_registry) -> None:
    resp = client.get("/api/integrations/meatywiki/status")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == "meatywiki"
    assert "enabled" in body
    assert "sync_mode" in body


def test_get_integration_status_not_found(tmp_registry) -> None:
    resp = client.get("/api/integrations/nonexistent_integration/status")
    assert resp.status_code == 404


def test_trigger_integration_sync(tmp_registry) -> None:
    resp = client.post("/api/integrations/meatywiki/sync")
    assert resp.status_code == 202
    body = resp.json()
    assert body["integration_id"] == "meatywiki"
    assert "task_id" in body
