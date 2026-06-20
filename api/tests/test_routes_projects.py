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
