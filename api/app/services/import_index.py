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
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

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
        hash_sha256: int | None = None
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


def _sha256_file(path: Path) -> str:
    """Compute SHA-256 hex digest for a local file."""
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()
