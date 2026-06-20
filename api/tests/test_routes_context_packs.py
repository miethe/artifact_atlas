"""Route tests for context pack endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _create_project(name: str) -> str:
    slug = name.lower().replace(" ", "-")
    resp = client.post("/api/projects", json={"name": name, "slug": slug, "status": "active"})
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _create_pack(project_id: str, **overrides) -> dict:
    payload = {
        "title": "Test Pack",
        "target_type": "project",
        "target_id": project_id,
        "audience": "agent",
        "sensitivity": "personal",
        **overrides,
    }
    resp = client.post(f"/api/projects/{project_id}/context-packs", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# List context packs
# ---------------------------------------------------------------------------


def test_list_context_packs_empty(tmp_registry) -> None:
    pid = _create_project("Empty Packs")
    resp = client.get(f"/api/projects/{pid}/context-packs")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert body["items"] == []


def test_list_context_packs_returns_items(tmp_registry) -> None:
    pid = _create_project("Pack List")
    _create_pack(pid, title="Pack A")
    _create_pack(pid, title="Pack B")
    resp = client.get(f"/api/projects/{pid}/context-packs")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 2


def test_list_context_packs_status_filter(tmp_registry) -> None:
    pid = _create_project("Pack Status Filter")
    _create_pack(pid, title="Draft Pack")
    resp = client.get(f"/api/projects/{pid}/context-packs?status=draft")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(p["status"] == "draft" for p in items)


# ---------------------------------------------------------------------------
# Create / get / update
# ---------------------------------------------------------------------------


def test_create_context_pack(tmp_registry) -> None:
    pid = _create_project("Create Pack")
    pack = _create_pack(pid, title="New Pack", description="A test pack")
    assert pack["title"] == "New Pack"
    assert pack["status"] == "draft"
    assert "id" in pack


def test_get_context_pack(tmp_registry) -> None:
    pid = _create_project("Get Pack")
    pack = _create_pack(pid)
    resp = client.get(f"/api/context-packs/{pack['id']}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == pack["id"]
    assert "items" in body  # ContextPackDetail includes items


def test_get_context_pack_not_found(tmp_registry) -> None:
    resp = client.get("/api/context-packs/nonexistent_pack_xyz")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_update_context_pack(tmp_registry) -> None:
    pid = _create_project("Update Pack")
    pack = _create_pack(pid)
    resp = client.patch(
        f"/api/context-packs/{pack['id']}",
        json={"title": "Updated Pack Title"},
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Pack Title"


# ---------------------------------------------------------------------------
# Preview
# ---------------------------------------------------------------------------


def test_preview_context_pack(tmp_registry) -> None:
    pid = _create_project("Preview Pack")
    pack = _create_pack(pid)
    resp = client.post(f"/api/context-packs/{pack['id']}/preview")
    assert resp.status_code == 200
    body = resp.json()
    assert "pack_id" in body
    assert "token_estimate" in body
    assert "manifest_yaml" in body


def test_preview_context_pack_not_found(tmp_registry) -> None:
    resp = client.post("/api/context-packs/nonexistent/preview")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Publish
# ---------------------------------------------------------------------------


def test_publish_context_pack(tmp_registry) -> None:
    pid = _create_project("Publish Pack")
    pack = _create_pack(pid)
    resp = client.post(
        f"/api/context-packs/{pack['id']}/publish",
        json={"destination": "file"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "published"


def test_publish_archived_pack_conflict(tmp_registry) -> None:
    """Publishing an archived context pack returns 409."""
    pid = _create_project("Archived Pack")
    pack = _create_pack(pid)
    pack_id = pack["id"]

    # Archive the pack by patching status via the repository directly
    from app.repositories.context_packs import ContextPackRepository
    from app.settings import get_settings
    repo = ContextPackRepository(get_settings().registry_dir)
    repo.update_status(pack_id, "archived")

    resp = client.post(
        f"/api/context-packs/{pack_id}/publish",
        json={"destination": "file"},
    )
    assert resp.status_code == 409


def test_publish_restricted_pack_forbidden(tmp_registry) -> None:
    """Publishing a restricted-sensitivity pack is denied by policy."""
    pid = _create_project("Restricted Pack")
    pack = _create_pack(pid, sensitivity="restricted")
    resp = client.post(
        f"/api/context-packs/{pack['id']}/publish",
        json={"destination": "file"},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Create from node
# ---------------------------------------------------------------------------


def test_create_context_pack_from_node(tmp_registry) -> None:
    pid = _create_project("Node Pack")
    resp = client.post(
        "/api/context-packs/from-node/node_test_abc",
        json={"project_id": pid, "title": "From Node Pack", "audience": "agent", "sensitivity": "personal"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["project_id"] == pid
    assert body["target_id"] == "node_test_abc"
