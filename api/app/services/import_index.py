"""Import / indexing service (SVC-003): local-path import, URL/manual import,
duplicate-by-hash detection, and asset_added event emission.

Rules:
- Every import emits asset_added event.
- Duplicate by hash_sha256: link or return existing asset (caller chooses).
- URL/manual import: never fetches remote content; records metadata only.
- Default sensitivity and agent_access from workspace.yaml policy defaults.
- source_kind, uri, mime_type, size_bytes, hash_sha256, captured_at recorded.
- Default status: inbox (raw after indexing, but we default to inbox at import time).
"""

from __future__ import annotations

import hashlib
import mimetypes
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import IO, Any

from app.models.asset import Asset, AssetCreate
from app.models.vocabulary import AgentAccess, AssetStatus, GeneratedBy, Sensitivity, SourceKind
from app.repositories.assets import AssetRepository
from app.repositories import jsonl as _jl
from app.services.audit import AuditService
from app.settings import get_settings


@dataclass
class ImportResult:
    """Result of an import operation."""

    asset: Asset
    is_duplicate: bool
    duplicate_of: str | None = None  # ID of existing asset if duplicate


class ImportError(ValueError):
    """Raised when an import cannot be processed."""


class ImportService:
    """Handle asset import from local paths, URLs, and manual records.

    Invariants:
    - No remote fetch is performed for url/manual imports in MVP.
    - Duplicate detection is by hash_sha256 (local imports only).
    - All imports emit asset_added audit event.
    - Default sensitivity/agent_access sourced from workspace.yaml settings.
    """

    def __init__(
        self,
        registry_dir: Path,
        *,
        audit_service: AuditService | None = None,
        default_sensitivity: str | None = None,
        default_agent_access: str | None = None,
    ) -> None:
        self._assets = AssetRepository(registry_dir)
        self._audit = audit_service or AuditService(registry_dir)
        settings = get_settings()
        self._default_sensitivity = default_sensitivity or settings.default_sensitivity
        self._default_agent_access = default_agent_access or settings.default_agent_access
        self._content_store_dir: Path = settings.content_store_dir

    # ------------------------------------------------------------------
    # Local path import
    # ------------------------------------------------------------------

    def import_local_path(
        self,
        file_path: str | Path,
        *,
        title: str | None = None,
        project_id: str | None = None,
        artifact_type_id: str | None = None,
        sensitivity: str | None = None,
        agent_access: str | None = None,
        on_duplicate: str = "link",  # "link" | "return_existing" | "create_new"
        actor_id: str = "system",
        metadata: dict[str, Any] | None = None,
        metadata_only: bool = False,
    ) -> ImportResult:
        """Import a local file as an asset.

        Records source_kind=local, uri=file://..., mime_type (guessed),
        size_bytes, hash_sha256, captured_at.

        Args:
            file_path: Absolute or relative local file path.
            title: Asset title (defaults to filename).
            project_id: Optional project scope.
            artifact_type_id: Optional artifact type classification.
            sensitivity: Override workspace default sensitivity.
            agent_access: Override workspace default agent_access.
            on_duplicate: How to handle a hash match: "link" adds a
                relationship then returns existing, "return_existing" returns
                existing without changes, "create_new" creates a new record.
            actor_id: Actor performing the import.
            metadata: Additional metadata to embed.
            metadata_only: When True, skip the disk-read block entirely
                (no size_bytes, hash, or MIME guess) and preserve the
                supplied path verbatim in the ``file://`` URI without
                resolving against the API process CWD. Used for browser
                file picker uploads where only the basename is exposed.

        Returns:
            ImportResult with asset and duplicate flag.
        """
        p = Path(file_path)
        file_title = title or p.name

        # Compute file attributes
        size_bytes: int | None = None
        hash_sha256: str | None = None
        mime_type: str | None = None

        if metadata_only:
            # Browser-uploaded file: preserve the original (bare) path in the
            # URI; do not resolve against the API process CWD and do not read
            # the file from disk.
            uri = f"file://{file_path}"
        else:
            uri = f"file://{p.resolve()}"
            if p.exists():
                size_bytes = p.stat().st_size
                hash_sha256 = _sha256_file(p)
                mime_type, _ = mimetypes.guess_type(str(p))
                if mime_type is None:
                    mime_type = "application/octet-stream"

        # Duplicate detection by hash (only if we have a hash)
        if hash_sha256 and on_duplicate != "create_new":
            existing = self._find_by_hash(hash_sha256)
            if existing:
                if on_duplicate == "return_existing":
                    return ImportResult(asset=existing, is_duplicate=True, duplicate_of=existing.id)
                # on_duplicate == "link": emit event and return existing
                self._audit.emit_asset_added(
                    existing.id,
                    project_id=project_id,
                    actor_id=actor_id,
                    payload={
                        "action": "duplicate_import_linked",
                        "uri": uri,
                        "duplicate_of": existing.id,
                    },
                )
                return ImportResult(asset=existing, is_duplicate=True, duplicate_of=existing.id)

        eff_sensitivity = sensitivity or self._default_sensitivity
        eff_agent_access = agent_access or self._default_agent_access

        create_data = AssetCreate(
            title=file_title,
            source_kind=SourceKind.local,
            uri=uri,
            original_uri=uri,
            mime_type=mime_type,
            size_bytes=size_bytes,
            status=AssetStatus.inbox,
            sensitivity=Sensitivity(eff_sensitivity),
            agent_access=AgentAccess(eff_agent_access),
            artifact_type_id=artifact_type_id,
            metadata=metadata,
        )

        asset_id = f"asset_{uuid.uuid4().hex[:16]}"
        asset = self._assets.create(asset_id, create_data, project_id=project_id)

        # Write hash_sha256 as a metadata supplement (patch via update since
        # AssetCreate doesn't carry hash fields directly)
        if hash_sha256:
            _jl.update_record(
                self._assets._assets_path,
                asset_id,
                {"hash_sha256": hash_sha256},
            )
            # Refresh in-memory
            refreshed = self._assets.get(asset_id)
            if refreshed:
                asset = refreshed

        self._audit.emit_asset_added(
            asset.id,
            project_id=project_id,
            actor_id=actor_id,
            payload={
                "title": asset.title,
                "uri": uri,
                "source_kind": "local",
                "mime_type": mime_type,
                "size_bytes": size_bytes,
                "hash_sha256": hash_sha256,
            },
        )
        return ImportResult(asset=asset, is_duplicate=False)

    # ------------------------------------------------------------------
    # Content import (V1-011): persist uploaded bytes into the managed store
    # ------------------------------------------------------------------

    def import_content(
        self,
        filename: str,
        content: bytes | IO[bytes],
        *,
        title: str | None = None,
        project_id: str | None = None,
        artifact_type_id: str | None = None,
        sensitivity: str | None = None,
        agent_access: str | None = None,
        mime_type: str | None = None,
        on_duplicate: str = "return_existing",
        actor_id: str = "system",
        metadata: dict[str, Any] | None = None,
    ) -> ImportResult:
        """Persist uploaded *content* bytes into the managed content store and
        register an asset whose ``storage_uri`` resolves through the preview
        proxy.

        This is the write half of the metadata-vs-blob boundary: Atlas indexes
        metadata by default, but content upload is an explicit, opt-in action
        that copies bytes into ``settings.content_store_dir`` (under
        ``workspace_root``) using content-addressed storage (sha256). The
        preview proxy already prefers ``storage_uri`` and confines resolved
        paths to ``workspace_root``, so stored blobs are served through the
        existing LFI/SSRF guard with no proxy change.

        Args:
            filename: Original filename (display/MIME inference; not a path).
            content: Raw bytes or a readable binary stream (e.g. an uploaded
                file's ``.file`` handle). Streamed to disk in chunks.
            title: Asset title (defaults to *filename*).
            project_id: Optional project scope.
            artifact_type_id: Optional artifact type classification.
            sensitivity: Override workspace default sensitivity.
            agent_access: Override workspace default agent_access.
            mime_type: Explicit MIME type; guessed from *filename* when absent.
            on_duplicate: Hash-match handling — "return_existing" (default),
                "link", or "create_new".
            actor_id: Actor performing the upload.
            metadata: Additional metadata to embed.

        Returns:
            ImportResult with the asset and duplicate flag.
        """
        display_name = Path(filename).name or "upload"
        file_title = title or display_name

        # 1. Stream to a temp file inside the store, hashing as we go.
        tmp_path, hash_sha256, size_bytes = self._spool_to_temp(content)

        try:
            # 2. Duplicate detection by content hash.
            if on_duplicate != "create_new":
                existing = self._find_by_hash(hash_sha256)
                if existing is not None:
                    if on_duplicate == "link":
                        self._audit.emit_asset_added(
                            existing.id,
                            project_id=project_id,
                            actor_id=actor_id,
                            payload={
                                "action": "duplicate_upload_linked",
                                "filename": display_name,
                                "hash_sha256": hash_sha256,
                                "duplicate_of": existing.id,
                            },
                        )
                    return ImportResult(
                        asset=existing, is_duplicate=True, duplicate_of=existing.id
                    )

            # 3. Promote the temp file into the content-addressed store.
            blob_path = self._commit_blob(tmp_path, hash_sha256)
            tmp_path = None  # consumed by _commit_blob
        finally:
            if tmp_path is not None and tmp_path.exists():
                tmp_path.unlink()

        eff_mime = mime_type
        if eff_mime is None:
            eff_mime, _ = mimetypes.guess_type(display_name)
            if eff_mime is None:
                eff_mime = "application/octet-stream"

        eff_sensitivity = sensitivity or self._default_sensitivity
        eff_agent_access = agent_access or self._default_agent_access

        # Preserve the original (bare) filename in ``uri`` for display; point
        # ``storage_uri`` at the managed blob so the proxy can serve bytes.
        uri = f"file://{display_name}"
        storage_uri = f"file://{blob_path}"

        create_data = AssetCreate(
            title=file_title,
            source_kind=SourceKind.local,
            uri=uri,
            original_uri=uri,
            mime_type=eff_mime,
            size_bytes=size_bytes,
            status=AssetStatus.inbox,
            sensitivity=Sensitivity(eff_sensitivity),
            agent_access=AgentAccess(eff_agent_access),
            artifact_type_id=artifact_type_id,
            metadata=metadata,
        )

        asset_id = f"asset_{uuid.uuid4().hex[:16]}"
        asset = self._assets.create(asset_id, create_data, project_id=project_id)

        # storage_uri / hash_sha256 are not first-class AssetCreate columns in
        # the repository write path — patch them in explicitly.
        _jl.update_record(
            self._assets._assets_path,
            asset_id,
            {"storage_uri": storage_uri, "hash_sha256": hash_sha256},
        )
        refreshed = self._assets.get(asset_id)
        if refreshed:
            asset = refreshed

        self._audit.emit_asset_added(
            asset.id,
            project_id=project_id,
            actor_id=actor_id,
            payload={
                "title": asset.title,
                "uri": uri,
                "storage_uri": storage_uri,
                "source_kind": "local",
                "mime_type": eff_mime,
                "size_bytes": size_bytes,
                "hash_sha256": hash_sha256,
                "action": "content_uploaded",
            },
        )
        return ImportResult(asset=asset, is_duplicate=False)

    def attach_content(
        self,
        asset_id: str,
        filename: str,
        content: bytes | IO[bytes],
        *,
        mime_type: str | None = None,
        project_id: str | None = None,
        actor_id: str = "system",
    ) -> Asset | None:
        """Attach uploaded *content* bytes to an already-registered asset.

        Powers the "fix the 404" path for metadata-only (browser-picked)
        assets: stores the blob in the managed content store and patches the
        asset's ``storage_uri``/``hash_sha256``/``size_bytes``/``mime_type`` so
        the preview proxy can serve it. Existing fields are preserved when not
        derivable from the upload.

        Returns the refreshed asset, or ``None`` if *asset_id* does not exist.
        """
        existing = self._assets.get(asset_id)
        if existing is None:
            return None

        display_name = Path(filename).name or "upload"
        tmp_path, hash_sha256, size_bytes = self._spool_to_temp(content)
        try:
            blob_path = self._commit_blob(tmp_path, hash_sha256)
            tmp_path = None
        finally:
            if tmp_path is not None and tmp_path.exists():
                tmp_path.unlink()

        eff_mime = mime_type or existing.mime_type
        if eff_mime is None:
            eff_mime, _ = mimetypes.guess_type(display_name)
            if eff_mime is None:
                eff_mime = "application/octet-stream"

        storage_uri = f"file://{blob_path}"
        _jl.update_record(
            self._assets._assets_path,
            asset_id,
            {
                "storage_uri": storage_uri,
                "hash_sha256": hash_sha256,
                "size_bytes": size_bytes,
                "mime_type": eff_mime,
            },
        )

        self._audit.emit_asset_added(
            asset_id,
            project_id=project_id or existing.project_id,
            actor_id=actor_id,
            payload={
                "action": "content_attached",
                "filename": display_name,
                "storage_uri": storage_uri,
                "hash_sha256": hash_sha256,
                "size_bytes": size_bytes,
                "mime_type": eff_mime,
            },
        )
        return self._assets.get(asset_id)

    # ------------------------------------------------------------------
    # URL import (metadata only — no remote fetch)
    # ------------------------------------------------------------------

    def import_url(
        self,
        url: str,
        *,
        title: str | None = None,
        project_id: str | None = None,
        artifact_type_id: str | None = None,
        sensitivity: str | None = None,
        agent_access: str | None = None,
        mime_type: str | None = None,
        actor_id: str = "system",
        metadata: dict[str, Any] | None = None,
    ) -> ImportResult:
        """Record a URL as an asset without fetching remote content.

        No network calls are made. Only the URL itself is recorded as the uri.

        Args:
            url: The URL to import.
            title: Asset title.
            project_id: Optional project scope.
            artifact_type_id: Optional artifact type.
            sensitivity: Override sensitivity.
            agent_access: Override agent_access.
            mime_type: Optional MIME type hint.
            actor_id: Actor performing the import.
            metadata: Additional metadata.

        Returns:
            ImportResult (never a duplicate since URLs have no hash).
        """
        eff_sensitivity = sensitivity or self._default_sensitivity
        eff_agent_access = agent_access or self._default_agent_access

        create_data = AssetCreate(
            title=title or url,
            source_kind=SourceKind.url,
            uri=url,
            original_uri=url,
            mime_type=mime_type,
            status=AssetStatus.inbox,
            sensitivity=Sensitivity(eff_sensitivity),
            agent_access=AgentAccess(eff_agent_access),
            artifact_type_id=artifact_type_id,
            metadata=metadata,
        )

        asset_id = f"asset_{uuid.uuid4().hex[:16]}"
        asset = self._assets.create(asset_id, create_data, project_id=project_id)

        self._audit.emit_asset_added(
            asset.id,
            project_id=project_id,
            actor_id=actor_id,
            payload={"title": asset.title, "uri": url, "source_kind": "url"},
        )
        return ImportResult(asset=asset, is_duplicate=False)

    # ------------------------------------------------------------------
    # Manual import (no file, no URL — purely descriptive metadata)
    # ------------------------------------------------------------------

    def import_manual(
        self,
        title: str,
        *,
        description: str | None = None,
        project_id: str | None = None,
        artifact_type_id: str | None = None,
        sensitivity: str | None = None,
        agent_access: str | None = None,
        generated_by: str | None = None,
        actor_id: str = "system",
        metadata: dict[str, Any] | None = None,
    ) -> ImportResult:
        """Record a manually-described asset with no backing file or URL.

        Uses source_kind=manual and uri=manual://<uuid>.

        Args:
            title: Asset title (required).
            description: Optional description.
            project_id: Optional project scope.
            artifact_type_id: Optional artifact type.
            sensitivity: Override sensitivity.
            agent_access: Override agent_access.
            generated_by: Who created the asset.
            actor_id: Actor performing the import.
            metadata: Additional metadata.

        Returns:
            ImportResult (never a duplicate).
        """
        eff_sensitivity = sensitivity or self._default_sensitivity
        eff_agent_access = agent_access or self._default_agent_access
        manual_id = uuid.uuid4().hex[:16]
        uri = f"manual://{manual_id}"

        gen_by = None
        if generated_by:
            try:
                gen_by = GeneratedBy(generated_by)
            except ValueError:
                gen_by = None

        create_data = AssetCreate(
            title=title,
            description=description,
            source_kind=SourceKind.manual,
            uri=uri,
            status=AssetStatus.inbox,
            sensitivity=Sensitivity(eff_sensitivity),
            agent_access=AgentAccess(eff_agent_access),
            artifact_type_id=artifact_type_id,
            generated_by=gen_by,
            metadata=metadata,
        )

        asset_id = f"asset_{uuid.uuid4().hex[:16]}"
        asset = self._assets.create(asset_id, create_data, project_id=project_id)

        self._audit.emit_asset_added(
            asset.id,
            project_id=project_id,
            actor_id=actor_id,
            payload={"title": asset.title, "source_kind": "manual"},
        )
        return ImportResult(asset=asset, is_duplicate=False)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _find_by_hash(self, hash_sha256: str) -> Asset | None:
        """Return the first non-tombstoned asset with the given sha256 hash."""
        all_assets = self._assets.list()
        for asset in all_assets:
            if asset.hash_sha256 == hash_sha256:
                return asset
        return None

    def _spool_to_temp(self, content: bytes | IO[bytes]) -> tuple[Path, str, int]:
        """Stream *content* to a temp file in the store, returning
        ``(temp_path, sha256_hex, size_bytes)``.

        Hashing happens during the write so large uploads are never buffered
        fully in memory.
        """
        self._content_store_dir.mkdir(parents=True, exist_ok=True)
        tmp_path = self._content_store_dir / f".tmp-{uuid.uuid4().hex}"
        h = hashlib.sha256()
        size = 0
        with tmp_path.open("wb") as out:
            if isinstance(content, (bytes, bytearray)):
                out.write(content)
                h.update(content)
                size = len(content)
            else:
                for chunk in iter(lambda: content.read(65536), b""):
                    out.write(chunk)
                    h.update(chunk)
                    size += len(chunk)
        return tmp_path, h.hexdigest(), size

    def _commit_blob(self, tmp_path: Path, hash_sha256: str) -> Path:
        """Move a spooled temp file into the content-addressed store and return
        the final blob path (``<store>/<hash[:2]>/<hash>``).

        Idempotent: if a blob with this hash already exists (same bytes), the
        temp file is discarded and the existing blob path is returned.
        """
        shard = self._content_store_dir / hash_sha256[:2]
        shard.mkdir(parents=True, exist_ok=True)
        blob_path = shard / hash_sha256
        if blob_path.exists():
            tmp_path.unlink(missing_ok=True)
            return blob_path
        # os.replace is atomic within the same filesystem (store + temp share a dir).
        os.replace(tmp_path, blob_path)
        return blob_path


def _sha256_file(path: Path) -> str:
    """Compute SHA-256 hex digest for a local file."""
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()
