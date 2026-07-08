"""V1-011 — HTTP surface for content upload (multipart endpoints).

POST /api/projects/{projectId}/inbox/upload  — upload bytes, create assets
PUT  /api/assets/{assetId}/content           — attach bytes to existing asset
"""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.import_index import ImportService

client = TestClient(app)


def test_upload_creates_asset_with_servable_content(tmp_registry: Path) -> None:
    # agent_access=preview_allowed: the default (metadata_only) is now
    # policy-gated to 403 by the preview content proxy (CRITICAL fix), so an
    # asset intended to be servable via the proxy must clear that bar.
    resp = client.post(
        "/api/projects/proj1/inbox/upload",
        files=[("files", ("report.txt", b"hello bytes", "text/plain"))],
        data={"sensitivity": "personal", "agent_access": "preview_allowed"},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["imported_count"] == 1
    assert len(body["asset_ids"]) == 1

    asset_id = body["asset_ids"][0]
    # The preview proxy can now serve the bytes (no 404).
    content = client.get(f"/api/preview/asset/{asset_id}/content")
    assert content.status_code == 200, content.text
    assert content.content == b"hello bytes"


def test_upload_dedup_reports_duplicate(tmp_registry: Path) -> None:
    files = [("files", ("a.txt", b"dup payload", "text/plain"))]
    first = client.post("/api/projects/p/inbox/upload", files=files, data={"sensitivity": "personal"})
    second = client.post(
        "/api/projects/p/inbox/upload",
        files=[("files", ("b.txt", b"dup payload", "text/plain"))],
        data={"sensitivity": "personal"},
    )
    assert first.status_code == 202 and second.status_code == 202
    assert second.json()["duplicate_ids"] == first.json()["asset_ids"]


def test_put_content_attaches_to_metadata_only_asset(tmp_registry: Path) -> None:
    # Register a browser-picked asset with no bytes on disk yet (the
    # `metadata_only=True` kwarg here means "path-only import, skip the
    # disk-read block" — distinct from the agent_access enum value below).
    # agent_access=preview_allowed so the *only* reason preview 404s before
    # PUT is the missing file, not the policy gate (CRITICAL fix: the
    # default agent_access=metadata_only would now also 403 here).
    svc = ImportService(tmp_registry)
    meta = svc.import_local_path(
        "picked.txt", project_id="p", metadata_only=True, agent_access="preview_allowed"
    )
    pre = client.get(f"/api/preview/asset/{meta.asset.id}/content")
    assert pre.status_code != 200

    resp = client.put(
        f"/api/assets/{meta.asset.id}/content",
        files=[("file", ("picked.txt", b"attached now", "text/plain"))],
    )
    assert resp.status_code == 200, resp.text

    after = client.get(f"/api/preview/asset/{meta.asset.id}/content")
    assert after.status_code == 200
    assert after.content == b"attached now"


def test_put_content_missing_asset_404(tmp_registry: Path) -> None:
    resp = client.put(
        "/api/assets/asset_missing/content",
        files=[("file", ("x.txt", b"data", "text/plain"))],
    )
    assert resp.status_code == 404
