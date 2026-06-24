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
    resp = client.post(
        "/api/projects/proj1/inbox/upload",
        files=[("files", ("report.txt", b"hello bytes", "text/plain"))],
        data={"sensitivity": "personal"},
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
    # Register a metadata-only asset (browser-picked, no bytes) → preview 404s.
    svc = ImportService(tmp_registry)
    meta = svc.import_local_path("picked.txt", project_id="p", metadata_only=True)
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
