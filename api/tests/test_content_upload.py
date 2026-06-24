"""V1-011 — content upload & storage pipeline (service layer).

Covers ImportService.import_content / attach_content: content-addressed
storage under workspace_root, dedup-by-hash, streamed uploads, and the
metadata-only -> bytes "attach" path that fixes the preview 404.
"""

from __future__ import annotations

import io
from pathlib import Path

from app.services.import_index import ImportService
from app.settings import get_settings


def _svc(reg: Path) -> ImportService:
    return ImportService(reg)


def test_import_content_stores_blob_under_workspace(tmp_registry: Path) -> None:
    svc = _svc(tmp_registry)
    settings = get_settings()

    result = svc.import_content("hello.txt", b"hello world", project_id="proj1")

    assert result.is_duplicate is False
    asset = result.asset
    assert asset.storage_uri is not None
    assert asset.hash_sha256 is not None
    assert asset.size_bytes == len(b"hello world")
    assert asset.mime_type == "text/plain"

    blob = Path(asset.storage_uri.replace("file://", ""))
    assert blob.exists()
    assert blob.read_bytes() == b"hello world"
    # content-addressed: blob lives under the managed store, sharded by hash prefix
    blob.relative_to(settings.content_store_dir)
    assert blob.name == asset.hash_sha256
    # store is under workspace_root so the preview proxy's LFI guard serves it
    blob.relative_to(settings.workspace_root)


def test_import_content_dedup_returns_existing(tmp_registry: Path) -> None:
    svc = _svc(tmp_registry)
    first = svc.import_content("a.txt", b"same bytes", project_id="p")
    second = svc.import_content("b-different-name.txt", b"same bytes", project_id="p")

    assert second.is_duplicate is True
    assert second.asset.id == first.asset.id
    assert second.duplicate_of == first.asset.id


def test_import_content_create_new_bypasses_dedup(tmp_registry: Path) -> None:
    svc = _svc(tmp_registry)
    first = svc.import_content("a.txt", b"dup", project_id="p")
    second = svc.import_content("a.txt", b"dup", project_id="p", on_duplicate="create_new")

    assert second.is_duplicate is False
    assert second.asset.id != first.asset.id
    # both records point at the same content-addressed blob
    assert second.asset.storage_uri == first.asset.storage_uri


def test_import_content_accepts_binary_stream(tmp_registry: Path) -> None:
    svc = _svc(tmp_registry)
    stream = io.BytesIO(b"%PDF-1.4 streamed")
    result = svc.import_content("doc.pdf", stream, project_id="p", mime_type="application/pdf")

    assert result.asset.mime_type == "application/pdf"
    assert result.asset.size_bytes == len(b"%PDF-1.4 streamed")
    assert Path(result.asset.storage_uri.replace("file://", "")).exists()


def test_attach_content_to_metadata_only_asset(tmp_registry: Path) -> None:
    svc = _svc(tmp_registry)
    # Register a browser-picked (metadata-only) asset with no bytes.
    meta = svc.import_local_path("picked.pdf", project_id="p", metadata_only=True)
    assert meta.asset.storage_uri is None

    updated = svc.attach_content(
        meta.asset.id, "picked.pdf", io.BytesIO(b"%PDF-1.4 fake"), mime_type="application/pdf"
    )

    assert updated is not None
    assert updated.id == meta.asset.id
    assert updated.storage_uri is not None
    assert updated.mime_type == "application/pdf"
    assert updated.size_bytes == len(b"%PDF-1.4 fake")
    blob = Path(updated.storage_uri.replace("file://", ""))
    assert blob.exists() and blob.read_bytes() == b"%PDF-1.4 fake"


def test_attach_content_missing_asset_returns_none(tmp_registry: Path) -> None:
    svc = _svc(tmp_registry)
    assert svc.attach_content("asset_does_not_exist", "x.txt", b"data") is None
