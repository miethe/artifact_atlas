"""Route tests for /api/projects/{projectId}/inbox endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _create_project(name: str = "InboxTest") -> str:
    resp = client.post(
        "/api/projects",
        json={"name": name, "slug": name.lower().replace(" ", "-"), "status": "active"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def test_import_browser_basename_uri_metadata_only(tmp_registry) -> None:
    """A bare-basename file:// URI (browser file picker) imports as metadata."""
    pid = _create_project("InboxBrowser")
    resp = client.post(
        f"/api/projects/{pid}/inbox/import",
        json={
            "source_kind": "local",
            "uris": ["file://openapi.yaml"],
            "sensitivity": "personal",
        },
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["imported_count"] == 1
    asset_ids = body["asset_ids"]
    assert len(asset_ids) == 1

    # Confirm the asset is registered as an inbox/local asset
    aresp = client.get(f"/api/assets/{asset_ids[0]}")
    assert aresp.status_code == 200, aresp.text
    asset = aresp.json()
    assert asset["source_kind"] == "local"
    assert asset["status"] == "inbox"
    # The URI should preserve the basename and NOT be resolved against CWD
    assert asset["uri"] == "file://openapi.yaml"


def test_import_absolute_path_outside_workspace_rejected(tmp_registry) -> None:
    """An absolute path outside the workspace boundary still returns 400."""
    pid = _create_project("InboxAbs")
    resp = client.post(
        f"/api/projects/{pid}/inbox/import",
        json={
            "source_kind": "local",
            "uris": ["file:///etc/shadow"],
            "sensitivity": "personal",
        },
    )
    assert resp.status_code == 400, resp.text
