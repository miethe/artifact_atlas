"""Route tests for /api/projects endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_projects_empty(tmp_registry) -> None:
    """GET /api/projects returns a cursor-paginated list (may be empty)."""
    resp = client.get("/api/projects")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "has_more" in body


def test_create_and_get_project(tmp_registry) -> None:
    """POST then GET a project."""
    payload = {
        "name": "Test Project",
        "slug": "test-project",
        "description": "A test project.",
        "status": "active",
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    project_id = body["id"]
    assert body["name"] == "Test Project"
    assert body["slug"] == "test-project"

    # GET by ID
    resp = client.get(f"/api/projects/{project_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == project_id


def test_get_project_not_found(tmp_registry) -> None:
    resp = client.get("/api/projects/nonexistent_project_id")
    assert resp.status_code == 404
    body = resp.json()
    assert body["error"]["code"] == "not_found"


def test_update_project(tmp_registry) -> None:
    """PATCH /api/projects/{projectId}."""
    resp = client.post(
        "/api/projects",
        json={"name": "Patch Me", "slug": "patch-me", "status": "active"},
    )
    assert resp.status_code == 201
    pid = resp.json()["id"]

    resp = client.patch(f"/api/projects/{pid}", json={"name": "Patched"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Patched"


def test_list_projects_status_filter(tmp_registry) -> None:
    """Filter projects by status."""
    client.post("/api/projects", json={"name": "Active P", "slug": "active-p", "status": "active"})
    client.post("/api/projects", json={"name": "Paused P", "slug": "paused-p", "status": "paused"})

    resp = client.get("/api/projects?status=active")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(p["status"] == "active" for p in items)


def test_create_project_slug_conflict(tmp_registry) -> None:
    """Creating two projects with same slug returns 409."""
    payload = {"name": "Unique", "slug": "unique-slug", "status": "active"}
    resp1 = client.post("/api/projects", json=payload)
    assert resp1.status_code == 201
    resp2 = client.post("/api/projects", json=payload)
    assert resp2.status_code == 409


# ---------------------------------------------------------------------------
# WS-4 additive fields: tags, starred, asset_count
# ---------------------------------------------------------------------------


def test_create_project_with_tags_and_starred(tmp_registry) -> None:
    """POST /api/projects accepts tags[] and starred and round-trips them."""
    payload = {
        "name": "Tagged Project",
        "slug": "tagged-project",
        "status": "active",
        "tags": ["Strategic Initiative", "Platform"],
        "starred": True,
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["tags"] == ["Strategic Initiative", "Platform"]
    assert body["starred"] is True

    # Persisted — GET returns the same values
    resp = client.get(f"/api/projects/{body['id']}")
    assert resp.status_code == 200
    fetched = resp.json()
    assert fetched["tags"] == ["Strategic Initiative", "Platform"]
    assert fetched["starred"] is True


def test_create_project_tags_default_empty(tmp_registry) -> None:
    """Omitting tags/starred defaults to []/False (backward compatible)."""
    resp = client.post(
        "/api/projects",
        json={"name": "Plain", "slug": "plain-project", "status": "active"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["tags"] == []
    assert body["starred"] is False


def test_patch_project_tags_and_starred(tmp_registry) -> None:
    """PATCH can update tags and toggle starred (including back to False)."""
    resp = client.post(
        "/api/projects",
        json={"name": "Star Me", "slug": "star-me", "status": "active"},
    )
    pid = resp.json()["id"]

    resp = client.patch(
        f"/api/projects/{pid}",
        json={"tags": ["In Progress"], "starred": True},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["tags"] == ["In Progress"]
    assert body["starred"] is True

    # Toggle starred back off — False must not be dropped by the patch
    resp = client.patch(f"/api/projects/{pid}", json={"starred": False})
    assert resp.status_code == 200
    assert resp.json()["starred"] is False
    # tags untouched by the second patch
    assert resp.json()["tags"] == ["In Progress"]


def test_list_projects_includes_asset_count(tmp_registry) -> None:
    """GET /api/projects enriches each item with a live asset_count."""
    resp = client.post(
        "/api/projects",
        json={"name": "Counted", "slug": "counted-project", "status": "active"},
    )
    assert resp.status_code == 201
    pid = resp.json()["id"]

    # No assets yet
    resp = client.get("/api/projects")
    assert resp.status_code == 200
    item = next(p for p in resp.json()["items"] if p["id"] == pid)
    assert item["asset_count"] == 0

    # Add an asset to the project
    asset_payload = {
        "title": "Doc",
        "source_kind": "local",
        "uri": "file:///tmp/doc.md",
        "sensitivity": "public",
    }
    resp = client.post(f"/api/projects/{pid}/assets", json=asset_payload)
    assert resp.status_code in (200, 201)

    resp = client.get("/api/projects")
    item = next(p for p in resp.json()["items"] if p["id"] == pid)
    assert item["asset_count"] == 1


def test_create_project_persists_workspace_id(tmp_registry) -> None:
    """POST /api/projects accepts a declared workspace_id and round-trips it.

    Regression guard for node_01KZRMMDB3YKT7T4FJTVVRMKG0: workspace_id is now a
    declared field on ProjectCreate (not a mere extra="allow" passthrough), so
    it survives even if ProjectRepository.create narrowed its model_dump()
    spread to declared fields.
    """
    payload = {
        "name": "WS Project",
        "slug": "ws-project",
        "status": "active",
        "workspace_id": "ws_regression_test",
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["workspace_id"] == "ws_regression_test"

    # Round-trips on GET, not just the create echo.
    resp = client.get(f"/api/projects/{body['id']}")
    assert resp.status_code == 200
    assert resp.json()["workspace_id"] == "ws_regression_test"


def test_patch_project_reassigns_workspace_id(tmp_registry) -> None:
    """PATCH /api/projects/{id} can change a declared workspace_id."""
    resp = client.post(
        "/api/projects",
        json={"name": "Reassign", "slug": "reassign-ws", "status": "active",
              "workspace_id": "ws_old"},
    )
    assert resp.status_code == 201
    pid = resp.json()["id"]

    resp = client.patch(f"/api/projects/{pid}", json={"workspace_id": "ws_new"})
    assert resp.status_code == 200
    assert resp.json()["workspace_id"] == "ws_new"


def test_project_create_schema_declares_workspace_id() -> None:
    """workspace_id is visible in the generated OpenAPI, not hidden behind extras."""
    from app.models.project import ProjectCreate, ProjectUpdate

    assert "workspace_id" in ProjectCreate.model_json_schema()["properties"]
    assert "workspace_id" in ProjectUpdate.model_json_schema()["properties"]
