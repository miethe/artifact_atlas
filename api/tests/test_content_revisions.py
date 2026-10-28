"""One boundary per requested item, plus the original pilot's worst failure."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
from pathlib import Path

from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.migrations.content_revisions import migrate
from app.models.asset import AssetCreate, AssetUpdate
from app.repositories.assets import AssetRepository
from app.repositories import jsonl
from app.services.import_index import ImportService
from app.services.revisions import RevisionService

client = TestClient(app)


def upload(registry: Path, content: bytes = b"original\x00\xff"):
    return ImportService(registry).import_content(
        "report.bin", content, mime_type="text/plain", agent_access="preview_allowed", on_duplicate="create_new"
    ).asset


def test_ac1_every_attach_appends_even_same_bytes_and_serializes_writers(tmp_registry):
    asset = upload(tmp_registry)
    service = RevisionService(tmp_registry)
    first = service.revisions.get(asset.id, asset.current_revision_id)
    ledger = service.revisions.path.read_bytes()
    blob = service.resolve(first.storage_uri)
    inode = blob.stat().st_ino
    with ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(lambda _: ImportService(tmp_registry).attach_content(
            asset.id, "report.bin", b"original\x00\xff"), range(3)))
    rows = service.revisions.list(asset.id)
    assert len(rows) == 4
    assert len({r.id for r in rows}) == 4
    assert all(r.sha256 == hashlib.sha256(b"original\x00\xff").hexdigest() for r in rows)
    assert all(r.size_bytes == 10 and r.created_at and r.storage_uri for r in rows)
    assert service.revisions.path.read_bytes().startswith(ledger)
    assert service.revisions.get(asset.id, first.id) == first
    assert blob.stat().st_ino == inode
    assert service.assets.get(asset.id).current_revision_id == rows[-1].id
    assert all(r is not None for r in results)
    denied = client.patch(f"/api/assets/{asset.id}", json={"current_revision_id": first.id})
    assert denied.status_code == 422
    service.assets.delete(asset.id)
    assert service.revisions.get(asset.id, first.id) == first  # tombstone retains history
    assert blob.read_bytes() == b"original\x00\xff"


def test_ac2_exact_addressing_missing_and_policy_boundaries(tmp_registry):
    asset = upload(tmp_registry)
    other = upload(tmp_registry, b"other asset")
    root = f"/api/assets/{asset.id}/revisions"
    listing = client.get(root)
    assert listing.status_code == 200
    assert [r["id"] for r in listing.json()] == [asset.current_revision_id]
    for selector in (asset.current_revision_id, asset.hash_sha256):
        metadata = client.get(f"{root}/{selector}")
        assert metadata.status_code == 200
        assert metadata.json()["sha256"] == asset.hash_sha256
        response = client.get(f"{root}/{selector}/content")
        assert response.status_code == 200
        assert response.content == b"original\x00\xff"
    for selector in ("rev_missing", "0" * 64, other.current_revision_id, other.hash_sha256):
        for suffix in ("", "/content", "/export"):
            assert client.get(f"{root}/{selector}{suffix}").status_code == 404
        assert client.post(f"{root}/{selector}/restore").status_code == 404
    service = RevisionService(tmp_registry)
    for access in ("metadata_only", "none"):
        service.assets.update(asset.id, AssetUpdate(agent_access=access))
        for suffix in ("content", "export"):
            assert client.get(f"{root}/{asset.current_revision_id}/{suffix}").status_code == 403
        assert client.post(f"{root}/{asset.current_revision_id}/restore").status_code == 403
    service.assets.update(asset.id, AssetUpdate(agent_access="preview_allowed"))
    blob = service.resolve(service.revisions.get(asset.id, asset.current_revision_id).storage_uri)
    # Simulate external disk corruption. Neither export nor restore may serve/propagate it.
    blob.write_bytes(b"corrupted")
    assert client.get(f"{root}/{asset.current_revision_id}/content").status_code == 409
    assert client.post(f"{root}/{asset.current_revision_id}/restore").status_code == 409
    with pytest.raises(ValueError, match="integrity"):
        ImportService(tmp_registry).attach_content(asset.id, "report.bin", b"original\x00\xff")
    blob.unlink()
    assert client.get(f"{root}/{asset.current_revision_id}/content").status_code == 404


def test_ac3_revision_export_restore_is_byte_identical(tmp_registry):
    asset = upload(tmp_registry)
    root = f"/api/assets/{asset.id}/revisions"
    service = RevisionService(tmp_registry)
    ImportService(tmp_registry).attach_content(asset.id, "changed.bin", b"second revision")
    ledger = service.revisions.path.read_bytes()
    for selector in (asset.current_revision_id, asset.hash_sha256):
        exported = client.get(f"{root}/{selector}/export")
        assert exported.status_code == 200
        assert hashlib.sha256(exported.content).hexdigest() == asset.hash_sha256
        assert exported.headers["x-content-sha256"] == asset.hash_sha256
        restored = client.post(f"{root}/{selector}/restore")
        assert restored.status_code == 200
        assert restored.json()["id"] == asset.id
        assert restored.json()["current_revision_id"] != asset.current_revision_id
        assert restored.json()["hash_sha256"] == asset.hash_sha256
        current = client.get(f"/api/preview/asset/{asset.id}/content")
        assert current.status_code == 200
        assert current.content == exported.content
    assert len(service.revisions.list(asset.id)) == 4
    assert service.revisions.path.read_bytes().startswith(ledger)


def test_ac4_backfill_forward_backward_and_conflicting_rollback(tmp_registry, tmp_path):
    # Isolate legacy records from production seed pointers that aren't present in this fixture.
    jsonl._atomic_write_lines(tmp_registry / "assets.jsonl", [])
    source = tmp_path / "legacy.txt"
    source.write_bytes(b"legacy content")
    repo = AssetRepository(tmp_registry)
    repo.create("legacy", AssetCreate(
        title="Legacy", source_kind="local", uri=f"file://{source}", mime_type="text/plain",
        sensitivity="personal", agent_access="preview_allowed", metadata={"custom": True},
    ))
    repo.create("metadata", AssetCreate(
        title="Metadata only", source_kind="manual", uri="https://example.test/report",
        sensitivity="restricted", agent_access="metadata_only",
    ))
    jsonl.update_record(tmp_registry / "assets.jsonl", "legacy", {
        "hash_sha256": hashlib.sha256(source.read_bytes()).hexdigest()
    })
    before = jsonl.read_all(tmp_registry / "assets.jsonl")
    source.write_bytes(b"wrong legacy bytes")
    with pytest.raises(ValueError, match="hash mismatch"):
        migrate(tmp_registry, "up", apply=True)
    assert jsonl.read_all(tmp_registry / "assets.jsonl") == before
    source.unlink()
    with pytest.raises(FileNotFoundError, match="unavailable"):
        migrate(tmp_registry, "up", apply=True)
    assert not (tmp_registry / "content_revisions.jsonl").exists()
    source.write_bytes(b"legacy content")
    assert migrate(tmp_registry, "up")["assets"] == 1
    assert jsonl.read_all(tmp_registry / "assets.jsonl") == before
    assert not (tmp_registry / "content_revisions.jsonl").exists()
    assert migrate(tmp_registry, "up", apply=True)["assets"] == 1
    assert migrate(tmp_registry, "up", apply=True)["assets"] == 0
    service = RevisionService(tmp_registry)
    revision = service.revisions.list("legacy")[0]
    assert service.assets.get("legacy").current_revision_id == revision.id
    assert service.assets.get("metadata").current_revision_id is None
    ledger = service.revisions.path.read_bytes()
    assert client.get("/api/preview/asset/legacy/content").content == b"legacy content"
    assert migrate(tmp_registry, "down")["assets"] == 1
    assert migrate(tmp_registry, "down", apply=True)["assets"] == 1
    assert jsonl.read_all(tmp_registry / "assets.jsonl") == before
    assert source.read_bytes() == service.read(revision) == b"legacy content"
    assert service.revisions.path.read_bytes() == ledger
    assert migrate(tmp_registry, "down", apply=True)["assets"] == 0
    source.write_bytes(b"source changed after rollback")
    assert service.read(revision) == b"legacy content"  # no mutable source pointer
    source.write_bytes(b"legacy content")
    migrate(tmp_registry, "up", apply=True)
    assert service.revisions.path.read_bytes() == ledger
    # An interrupted after-image write is recoverable by rerunning up.
    journal = tmp_registry / "migrations" / "content_revisions_v1.jsonl"
    entries = jsonl.read_all(journal)
    entries[0]["after"] = None
    jsonl._atomic_write_lines(journal, entries)
    with pytest.raises(ValueError, match="Interrupted"):
        migrate(tmp_registry, "down", apply=True)
    migrate(tmp_registry, "up", apply=True)
    ImportService(tmp_registry).attach_content("legacy", "legacy.txt", b"later write")
    current = (tmp_registry / "assets.jsonl").read_bytes()
    with pytest.raises(ValueError, match="Rollback conflict"):
        migrate(tmp_registry, "down", apply=True)
    assert (tmp_registry / "assets.jsonl").read_bytes() == current
    assert service.read(revision) == b"legacy content"


def test_worst_failure_report_reupload_never_changes_old_revision_bytes(tmp_registry, tmp_path):
    service = ImportService(tmp_registry)
    html = tmp_path / "index.html"
    html.write_bytes(b"<html>Original historical report</html>")
    original = html.read_bytes()
    envelope = {"route": "dossier", "subject": "revision-proof", "revision": 1,
                "title": "Revision proof", "truth_status": "not_executed"}
    first = service.import_report(html, envelope).asset
    revisions = RevisionService(tmp_registry)
    ledger = revisions.revisions.path.read_bytes()
    old = revisions.revisions.get(first.id, first.current_revision_id)
    html.write_bytes(b"<html>Re-uploaded changed report</html>")
    second = service.import_report(html, dict(envelope, revision=2)).asset
    assert first.id == second.id
    assert first.current_revision_id != second.current_revision_id
    assert second.hash_sha256 != first.hash_sha256
    assert revisions.revisions.path.read_bytes().startswith(ledger)
    for selector in (old.id, old.sha256):
        response = client.get(f"/api/assets/{first.id}/revisions/{selector}/content")
        assert response.status_code == 200
        assert response.content == original
        assert hashlib.sha256(response.content).hexdigest() == old.sha256
    assert revisions.revisions.get(first.id, old.id) == old
    assert revisions.revisions.get(first.id, second.current_revision_id).metadata["revision"] == 2
    current = client.get(f"/api/preview/asset/{first.id}/content")
    assert current.content == html.read_bytes()
