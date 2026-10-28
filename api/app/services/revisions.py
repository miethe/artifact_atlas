"""Immutable managed content and revision capture. Local POSIX storage only."""
from datetime import datetime, timezone
import hashlib
import os
from pathlib import Path
import tempfile
import uuid

from app.models.asset import Asset
from app.models.revision import ContentRevision
from app.repositories.assets import AssetRepository
from app.repositories import jsonl
from app.repositories.revisions import RevisionRepository
from app.settings import get_settings


def commit_blob(tmp_path: Path, blob_path: Path, sha256: str) -> Path:
    """Publish a complete file without ever replacing an existing inode."""
    blob_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.link(tmp_path, blob_path)
    except FileExistsError:
        if hashlib.sha256(blob_path.read_bytes()).hexdigest() != sha256:
            raise ValueError(f"Content store integrity failure: {sha256}")
    finally:
        tmp_path.unlink(missing_ok=True)
    return blob_path


class RevisionService:
    def __init__(self, registry_dir: Path) -> None:
        self.revisions = RevisionRepository(registry_dir)
        self.assets = AssetRepository(registry_dir)
        self.settings = get_settings()
        self.workspace_root = getattr(
            self.settings, "workspace_root", self.settings.content_store_dir.parent.parent
        ).resolve()

    def resolve(self, uri: str) -> Path:
        if not uri.startswith("file://"):
            raise ValueError("Only local content can be revisioned")
        path = Path(uri[7:])
        root = self.workspace_root
        path = (path if path.is_absolute() else root / path).resolve()
        if not path.is_relative_to(root):
            raise ValueError("Content path is outside workspace")
        return path

    def read(self, revision: ContentRevision) -> bytes:
        content = self.resolve(revision.storage_uri).read_bytes()
        if len(content) != revision.size_bytes or hashlib.sha256(content).hexdigest() != revision.sha256:
            raise ValueError("Revision content integrity failure")
        return content

    def capture(self, asset: Asset, *, sha256: str, size_bytes: int,
                storage_uri: str, mime_type: str | None, filename: str) -> ContentRevision:
        """Append a snapshot and then publish current. Caller holds writer()."""
        revision = ContentRevision(
            id=f"rev_{uuid.uuid4().hex}", asset_id=asset.id, sha256=sha256,
            size_bytes=size_bytes, storage_uri=storage_uri,
            created_at=datetime.now(timezone.utc), mime_type=mime_type,
            filename=Path(filename).name or "content", metadata=asset.metadata,
        )
        self.revisions.append(revision)
        self.point_to(revision)
        return revision

    def point_to(self, revision: ContentRevision) -> None:
        jsonl.update_record(self.assets._assets_path, revision.asset_id, {
            "current_revision_id": revision.id, "hash_sha256": revision.sha256,
            "size_bytes": revision.size_bytes, "storage_uri": revision.storage_uri,
            "mime_type": revision.mime_type,
        })

    def preserve_current(self, asset: Asset) -> ContentRevision | None:
        """Backfill legacy bytes before attach can change their only pointer."""
        if asset.current_revision_id:
            revision = self.revisions.get(asset.id, asset.current_revision_id)
            if revision is None:
                raise ValueError("Current revision is missing from ledger")
            return revision
        uri = asset.storage_uri or asset.uri
        if not uri.startswith("file://"):
            return None
        source = self.resolve(uri)
        if not source.is_file():
            if asset.storage_uri or asset.hash_sha256:
                raise FileNotFoundError(f"Legacy content unavailable: {asset.id}")
            return None  # metadata-only asset, no content to preserve
        store = self.settings.content_store_dir
        store.mkdir(parents=True, exist_ok=True)
        digest = hashlib.sha256()
        size = 0
        fd, name = tempfile.mkstemp(dir=store)
        temporary = Path(name)
        try:
            with os.fdopen(fd, "wb") as target, source.open("rb") as original:
                for chunk in iter(lambda: original.read(1024 * 1024), b""):
                    digest.update(chunk)
                    size += len(chunk)
                    target.write(chunk)
                target.flush()
                os.fsync(target.fileno())
            sha256 = digest.hexdigest()
            if asset.hash_sha256 and asset.hash_sha256 != sha256:
                raise ValueError(f"Legacy content hash mismatch: {asset.id}")
            blob = commit_blob(temporary, store / sha256[:2] / sha256, sha256)
        finally:
            temporary.unlink(missing_ok=True)
        uri = f"file://{blob.resolve().relative_to(self.workspace_root).as_posix()}"
        # Reuse retained history on a migration down/up cycle (no duplicate backfill).
        revision = self.revisions.get(asset.id, sha256)
        if revision is not None:
            self.read(revision)
            self.point_to(revision)
            return revision
        return self.capture(asset, sha256=sha256, size_bytes=size, storage_uri=uri,
                            mime_type=asset.mime_type, filename=Path(asset.uri[7:]).name)
