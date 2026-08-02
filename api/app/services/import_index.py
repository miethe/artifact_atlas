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
import re
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import IO, Any

from app.models.asset import Asset, AssetCreate, AssetLinkCreate
from app.models.vocabulary import (
    AgentAccess,
    AssetLinkRelationship,
    AssetLinkTargetType,
    AssetStatus,
    GeneratedBy,
    Sensitivity,
    SourceKind,
)
from app.repositories.assets import AssetRepository
from app.repositories.projects import ProjectRepository
from app.repositories import jsonl as _jl
from app.services.audit import AuditService
from app.settings import get_settings

# ---------------------------------------------------------------------------
# PF-1 M2: tracker_links[] resolution
#
# The PF-3 envelope's tracker_links[] does not carry a typed target — target
# identity is buried in a free-form `tracker` string
# (delivery_report.py:1380-1384 emits `{"tracker": h["tracker"], ...}` with no
# `node_id`/`scope`/`type`/`url` key). The documented convention is
# `"node_<id> — <title>"`, but it is enforced only by a warning-only check
# upstream — real emitted data includes bare ids (e.g. a bare `tree_...`
# id). Resolution here is intentionally narrow: only `node_`/`tree_`
# -prefixed ids (optionally followed by an em-dash/hyphen title suffix) are
# recognized, both mapping to `intenttree_node` (Atlas has no
# `intenttree_tree` link target and the two id kinds are indistinguishable
# from a bare string). Anything else is a loud failure, never a silent
# skip or a guessed target — see the plan's C3 "silent misattribution" risk.
# ---------------------------------------------------------------------------

_TRACKER_TITLE_SEP_RE = re.compile(r"\s+[—-]\s+")
_TRACKER_NODE_RE = re.compile(r"^(?:node|tree)_[A-Za-z0-9]+$")


@dataclass
class ImportResult:
    """Result of an import operation."""

    asset: Asset
    is_duplicate: bool
    duplicate_of: str | None = None  # ID of existing asset if duplicate


class ImportError(ValueError):
    """Raised when an import cannot be processed."""


def _resolve_tracker(tracker: Any) -> tuple[AssetLinkTargetType, str]:
    """Resolve a ``tracker_links[].tracker`` free-form string to an
    ``(target_type, target_id)`` pair.

    Tolerant of the documented ``"node_<id> — <title>"``/``"node_<id> -
    <title>"`` convention (only the id half is significant) and of a bare
    ``node_<id>`` or ``tree_<id>`` string. Raises :class:`ImportError` — the
    fail-loud path — for anything else: a non-string, an empty/blank value,
    or an id with no recognized prefix. This is intentionally *not* a
    best-effort guess; a wrong link is worse than an unlinked report (plan
    C3 risk), so an unrecognized shape must stop the ingest, not fall back
    to a plausible-looking target.

    Note: this validates *shape* only (does the id look like a node/tree
    id) — it does not verify the target *exists* in IntentTree, so a
    well-formed but nonexistent id (e.g. ``node_DOESNOTEXIST``) still
    creates a link. See implementation-notes.md's 2026-08-01 entry on this
    gap and the queued M4 DI- row.
    """
    if not isinstance(tracker, str) or not tracker.strip():
        raise ImportError(
            f"tracker_links[] entry has an empty/blank tracker value: {tracker!r}"
        )
    candidate = tracker.strip()
    head = _TRACKER_TITLE_SEP_RE.split(candidate, maxsplit=1)[0].strip()
    if _TRACKER_NODE_RE.match(head):
        return AssetLinkTargetType.intenttree_node, head
    raise ImportError(
        "tracker_links[] entry has an unresolvable tracker value: "
        f"{tracker!r} (expected 'node_<id>' or 'tree_<id>', optionally "
        "followed by ' — <title>')"
    )


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
        self._projects = ProjectRepository(registry_dir)
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
        generated_by: str | None = None,
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
            generated_by: Optional provenance label (e.g. "agent"); mirrors
                ``import_manual``'s coercion — an invalid value is dropped
                rather than raising, since provenance is descriptive, not a
                policy input.

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

        gen_by = None
        if generated_by:
            try:
                gen_by = GeneratedBy(generated_by)
            except ValueError:
                gen_by = None

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
            generated_by=gen_by,
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
    # Report ingest (PF-1 M1): host a shipped /delivery-report as an Asset
    # ------------------------------------------------------------------

    def import_report(
        self,
        html_path: str | Path,
        envelope: dict[str, Any],
        *,
        project_id: str | None = None,
        sensitivity: str | None = None,
        on_duplicate: str = "return_existing",
        actor_id: str = "system",
    ) -> ImportResult:
        """Ingest a rendered delivery-report HTML file + its PF-3 writeback
        envelope as a first-class ``delivery_report`` Asset.

        Thin composition over :meth:`import_content` — no new storage code.
        Sets the fields the capsule route (``GET /api/preview/asset/{id}/html``,
        ``preview.py:633-746``) requires to serve the report instead of 403ing:
        ``mime_type=text/html`` and, load-bearing, ``agent_access=preview_allowed``
        (``default_agent_access=metadata_only`` would otherwise 403 — plan's
        sharpest named risk). ``artifact_type_id=delivery_report`` and
        ``generated_by=agent`` classify the asset; envelope fields are captured
        verbatim into ``metadata`` (including the raw, unresolved
        ``tracker_links``).

        M2 (scope linking): also creates ``AssetLink`` rows to the envelope's
        ``subject`` (``target_type=feature``) and to every ``tracker_links[]``
        entry, resolved via :func:`_resolve_tracker` (``target_type=
        intenttree_node`` — see that function's docstring for the tolerated
        shapes). Link targets are resolved **before** any write happens, so a
        wrong/absent/unresolvable ``tracker_links[]`` target raises
        :class:`ImportError` with *no* asset created — silent misattribution
        (linking to the wrong node, or silently dropping an unresolvable one)
        is the plan's named C3 risk, worse than an unlinked report. Re-ingest
        of the same report is idempotent: linking is skipped for any
        ``(target_type, target_id, relationship)`` tuple that already exists
        on the asset, so a second ingest adds zero duplicate links.

        M3 (dossier revisioning, OQ-3 decision): when the envelope's
        ``(route, subject)`` matches an existing ``delivery_report`` asset
        (see :meth:`_find_report_by_identity`), the ingest does **not**
        create a new asset — it revises the existing one in place via
        :meth:`_revise_report_asset` (``PUT /content`` on the stable id),
        leaving its ``AssetLink`` rows intact. This only engages when the
        envelope supplies both a non-blank ``route`` and ``subject``;
        otherwise (or on a genuine first ingest) the plain
        :meth:`import_content` path below creates a new asset as before.
        ``on_duplicate`` therefore only governs the first-ingest / no-stable-
        identity path — the stable-id path has its own hash-duplicate check
        (identical bytes are a no-op, ``is_duplicate=True``, no write).

        Sensitivity defaults to ``"personal"`` (never ``"public"``) regardless
        of the workspace-wide default: reports embed commit hashes, internal
        paths, and model-routing detail (plan's sensitivity-leakage risk).

        Args:
            html_path: Local path to the rendered report HTML (uploaded as
                content — the envelope's own ``html_path``/``manifest_path``
                are absolute paths on the *generating* machine and are not
                fetched from here).
            envelope: Parsed writeback-envelope JSON (see
                ``.claude/worknotes/delivery-report-hosting/implementation-notes.md``
                for the verified live field set — this method reads it
                defensively, via ``.get()``, and does not require every field).
            project_id: Optional project scope.
            sensitivity: Override the "personal" default (e.g. for a report
                confirmed non-sensitive, or one that needs a tighter cap).
                Ignored on the stable-id revision path — an existing report's
                sensitivity is not silently changed by a later re-ingest.
            on_duplicate: Hash-match handling forwarded to ``import_content``
                on the first-ingest / no-stable-identity path only (default
                "return_existing").
            actor_id: Actor performing the ingest.

        Returns:
            ImportResult with the ``delivery_report`` asset and duplicate flag.

        Raises:
            ImportError: if *html_path* does not exist or is not a file, if a
                ``tracker_links[]`` entry is not an object, or if a
                ``tracker_links[]`` entry's ``tracker`` value cannot be
                resolved to a link target (see :func:`_resolve_tracker`).
        """
        p = Path(html_path)
        if not p.exists():
            raise ImportError(f"Report HTML file does not exist: {p}")
        if not p.is_file():
            raise ImportError(f"Report HTML path is not a file: {p}")

        # M2: resolve every scope-link target BEFORE any write. A bad
        # envelope must never leave a partially-linked (or unlinked-but-
        # silently-so) asset behind.
        link_targets = self._resolve_report_link_targets(envelope)

        title = envelope.get("title") or envelope.get("subject") or p.stem

        metadata: dict[str, Any] = {
            "envelope_version": envelope.get("envelope_version"),
            "artifact_type": envelope.get("artifact_type"),
            "target": envelope.get("target"),
            "route": envelope.get("route"),
            "title": envelope.get("title"),
            "subject": envelope.get("subject"),
            "revision": envelope.get("revision"),
            "truth_status": envelope.get("truth_status"),
            "generated_from": envelope.get("generated_from"),
            "generated_at": envelope.get("generated_at"),
            "tracker_links": envelope.get("tracker_links") or [],
            "item_count": envelope.get("item_count"),
        }

        # M3 (OQ-3 decision): re-ingesting the same dossier slug must land on
        # the SAME asset id, not mint a new one. Identity is (route, subject)
        # exactly as emitted by the envelope -- see
        # ``_find_report_by_identity``'s docstring for the DI-283
        # subject-collapse limitation this implies. Both fields must be
        # present (subject is nullable upstream) for a stable identity to
        # exist at all; absent either, this is always a first/plain ingest.
        route = envelope.get("route")
        subject = envelope.get("subject")
        stable_target = (
            self._find_report_by_identity(route, subject)
            if isinstance(route, str)
            and route.strip()
            and isinstance(subject, str)
            and subject.strip()
            else None
        )

        if stable_target is not None:
            result = self._revise_report_asset(
                stable_target,
                p,
                metadata,
                title=title,
                project_id=project_id,
                actor_id=actor_id,
            )
        else:
            with p.open("rb") as fh:
                result = self.import_content(
                    p.name,
                    fh,
                    title=title,
                    project_id=project_id,
                    artifact_type_id="delivery_report",
                    sensitivity=self._report_sensitivity(sensitivity),
                    agent_access=AgentAccess.preview_allowed.value,
                    mime_type="text/html",
                    on_duplicate=on_duplicate,
                    actor_id=actor_id,
                    metadata=metadata,
                    generated_by=GeneratedBy.agent.value,
                )

        self._link_report_targets(result.asset, link_targets, actor_id=actor_id)
        return result

    def _report_sensitivity(self, explicit: str | None) -> str:
        """Resolve the sensitivity for a report asset.

        Precedence: an explicit caller value wins; otherwise the workspace
        default (``ATLAS_DEFAULT_SENSITIVITY`` / policy config) applies, the
        same as any other import. The one report-specific rule is a **floor**:
        the result is never ``public``.

        Reports embed commit hashes, internal paths and model-routing detail
        (the PF-1 plan's sensitivity-leakage risk), so a workspace that
        defaults to ``public`` must not silently publish them. Earlier this
        method's logic was inlined as ``sensitivity or "personal"``, which was
        always truthy and therefore *ignored* the workspace default entirely --
        silently DOWNGRADING a ``client_sensitive`` workspace to ``personal``.
        Deferring to the default and flooring only ``public`` fixes the
        downgrade while keeping the non-public guarantee.
        """
        resolved = explicit or self._default_sensitivity
        if resolved == Sensitivity.public.value:
            return Sensitivity.personal.value
        return resolved

    # ------------------------------------------------------------------
    # Report revisioning (PF-1 M3 -- executes the plan's OQ-3 decision)
    # ------------------------------------------------------------------

    def _find_report_by_identity(self, route: Any, subject: Any) -> Asset | None:
        """Return the existing ``delivery_report`` asset whose stable
        identity matches ``(route, subject)``, or ``None`` on a first
        ingest.

        Identity is **exactly** ``(route, subject)`` as emitted by the PF-3
        envelope -- the only identity signal it currently provides (no
        per-instance key; see implementation-notes.md's 2026-08-01
        "DI-283 / PF-3 OQ-5" entry). This is correct and sufficient for
        ``route in {feature, dossier}`` where the plan's intent is
        genuinely "one living record per subject". For
        ``route in {program, phase, readiness}`` it has a known, documented
        limitation: multiple distinct reports for the *same* subject/project
        (e.g. a phase-2 report and a phase-3 report) **collapse onto one
        asset**, silently overwriting each other's blob on re-ingest,
        because the envelope carries no phase/wave discriminator this repo
        can make authoritative. This repo does not invent one -- see the
        plan's M4 section and the queued ``DI-`` row.

        Scoped to ``artifact_type_id == "delivery_report"`` so a report can
        never collide with an unrelated asset that happens to carry the same
        ``metadata.route``/``metadata.subject`` keys by coincidence.
        """
        for asset in self._assets.list():
            if asset.artifact_type_id != "delivery_report":
                continue
            meta = asset.metadata or {}
            if meta.get("route") == route and meta.get("subject") == subject:
                return asset
        return None

    def _revise_report_asset(
        self,
        existing: Asset,
        html_path: Path,
        metadata: dict[str, Any],
        *,
        title: str,
        project_id: str | None,
        actor_id: str,
    ) -> ImportResult:
        """Update *existing*'s blob + metadata in place -- the stable-id
        revision path.

        Composes :meth:`attach_content` (the same primitive
        ``PUT /assets/{assetId}/content`` uses, ``api/app/api/assets.py:283``)
        to stream the new HTML bytes onto the **same** asset id: no new
        asset is created, so every existing ``AssetLink`` row on *existing*
        (keyed on ``asset_id``, untouched by a content-only update) survives
        the re-ingest unchanged -- this is what "links intact" means for the
        milestone AC.

        If the new file's content hash is identical to the existing blob's,
        this is a true no-op re-ingest: nothing changed, so nothing is
        written (mirrors :meth:`import_content`'s own hash-duplicate
        semantics) and the result carries ``is_duplicate=True``. A changed
        hash performs the revision and returns ``is_duplicate=False`` with
        ``duplicate_of`` still pointing at the (unchanged) stable asset id,
        distinguishing "revised" from "brand new" for callers that care
        (e.g. the CLI's status line).
        """
        new_hash = _sha256_file(html_path)
        if new_hash == existing.hash_sha256:
            return ImportResult(asset=existing, is_duplicate=True, duplicate_of=existing.id)

        with html_path.open("rb") as fh:
            updated = self.attach_content(
                existing.id,
                html_path.name,
                fh,
                mime_type="text/html",
                project_id=project_id,
                actor_id=actor_id,
            )
        if updated is None:
            # existing.id was just read from the repository above; this
            # would mean it was deleted concurrently mid-revision.
            raise ImportError(
                f"Report revision failed: asset {existing.id} no longer exists"
            )

        # metadata is fully derived from the envelope on every ingest (no
        # other code path mutates a delivery_report asset's metadata dict),
        # so replacing it wholesale is safe and keeps the two in sync.
        patch: dict[str, Any] = {"metadata": metadata}
        if title:
            patch["title"] = title
        _jl.update_record(self._assets._assets_path, existing.id, patch)
        refreshed = self._assets.get(existing.id)
        revised = refreshed if refreshed is not None else updated

        self._audit.emit_asset_added(
            revised.id,
            project_id=project_id,
            actor_id=actor_id,
            payload={
                "action": "report_revision",
                "route": metadata.get("route"),
                "subject": metadata.get("subject"),
                "revision": metadata.get("revision"),
                "hash_sha256": new_hash,
            },
        )
        return ImportResult(asset=revised, is_duplicate=False, duplicate_of=existing.id)

    # ------------------------------------------------------------------
    # Report scope linking (PF-1 M2)
    # ------------------------------------------------------------------

    def _resolve_report_link_targets(
        self, envelope: dict[str, Any]
    ) -> list[tuple[AssetLinkTargetType, str]]:
        """Resolve the envelope's ``subject`` and every ``tracker_links[]``
        entry into ``(target_type, target_id)`` pairs.

        ``subject`` is optional (nullable upstream) — when absent or blank,
        it is simply skipped, not an error (there is nothing "named" to fail
        on). Every present ``tracker_links[]`` entry, by contrast, *does*
        name a target, so an entry that is malformed or whose ``tracker``
        cannot be resolved raises :class:`ImportError` (fail loud — see
        :func:`_resolve_tracker`).

        ``subject`` itself carries no type tag upstream — the emitter sets it
        to ``report.subject or report.project`` (a project slug for
        route=program/phase/readiness, a feature slug for route=feature/
        dossier). The envelope cannot disambiguate the two, so this resolves
        against Atlas's *own* system of record: a hit on
        ``ProjectRepository.get_by_slug()`` means the slug names a real Atlas
        project (``target_type=project``); otherwise it is treated as a
        feature slug (``target_type=feature``), the prior default. This is
        not "inventing a typed target" from the envelope (which this repo's
        implementation-notes.md warns against) — it is a lookup against data
        Atlas already owns.
        """
        targets: list[tuple[AssetLinkTargetType, str]] = []

        subject = envelope.get("subject")
        if isinstance(subject, str) and subject.strip():
            slug = subject.strip()
            if self._projects.get_by_slug(slug) is not None:
                targets.append((AssetLinkTargetType.project, slug))
            else:
                targets.append((AssetLinkTargetType.feature, slug))

        for entry in envelope.get("tracker_links") or []:
            if not isinstance(entry, dict):
                raise ImportError(f"tracker_links[] entry is not an object: {entry!r}")
            target_type, target_id = _resolve_tracker(entry.get("tracker"))
            targets.append((target_type, target_id))

        return targets

    def _link_report_targets(
        self,
        asset: Asset,
        targets: list[tuple[AssetLinkTargetType, str]],
        *,
        actor_id: str,
    ) -> None:
        """Create an ``AssetLink`` (relationship=evidence) for each resolved
        target, skipping any ``(target_type, target_id, relationship)`` that
        already exists on *asset* — idempotent re-link (a second ingest of
        the same report adds zero duplicate links).
        """
        if not targets:
            return

        existing = self._assets.list_links(asset.id)
        seen: set[tuple[str, str, str]] = {
            (
                link.target_type.value
                if hasattr(link.target_type, "value")
                else str(link.target_type),
                link.target_id,
                link.relationship.value
                if hasattr(link.relationship, "value")
                else str(link.relationship),
            )
            for link in existing
        }

        relationship = AssetLinkRelationship.evidence
        for target_type, target_id in targets:
            key = (target_type.value, target_id, relationship.value)
            if key in seen:
                continue
            seen.add(key)

            link_id = f"link_{uuid.uuid4().hex[:16]}"
            data = AssetLinkCreate(
                target_type=target_type,
                target_id=target_id,
                relationship=relationship,
            )
            self._assets.create_link(link_id, asset.id, data)
            self._audit.emit_asset_linked(
                asset.id,
                project_id=asset.project_id,
                actor_id=actor_id,
                payload={
                    "link_id": link_id,
                    "target_type": target_type.value,
                    "target_id": target_id,
                    "relationship": relationship.value,
                    "source": "report_ingest",
                },
            )

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
