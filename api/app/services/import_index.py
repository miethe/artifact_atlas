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
from datetime import datetime, timezone
from pathlib import Path
from typing import IO, Any

from app.models.asset import Asset, AssetCreate, AssetLinkCreate
from app.models.project import Project
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

# Sentinel distinguishing "argument not supplied" from an explicit ``None``
# (a *resolved-to-nothing* project lookup is meaningful and must not trigger
# a second lookup).
_UNSET: Any = object()

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

# Report routes where one subject legitimately has MANY instances over time, so
# an explicit per-instance `instance_key` is required before an ingest may
# replace an existing asset in place (PF-3 OQ-5, resolved 2026-08-02). The
# complement — `feature`/`dossier` — is "one living record per subject" by
# design (OQ-3) and needs no discriminator.
RECURRING_REPORT_ROUTES = frozenset({"phase", "program", "readiness"})


@dataclass
class ImportResult:
    """Result of an import operation."""

    asset: Asset
    is_duplicate: bool
    duplicate_of: str | None = None  # ID of existing asset if duplicate
    # DI-ByteCollision: set by :meth:`ImportService.import_report` and by
    # nothing else. True means the content-hash duplicate branch handed back a
    # pre-existing report whose ``(route, subject, instance_key)`` identity is
    # NOT the one just ingested -- i.e. ``asset`` is somebody else's report and
    # this call stored nothing at all. Callers need it because ``is_duplicate``
    # alone cannot say so: the revise path's identical-bytes no-op also returns
    # ``is_duplicate=True``, and there ``asset`` IS the caller's own report.
    # A plain ``import_content`` hash duplicate never sets it -- identical bytes
    # there mean identical content, and only reports can be *different*
    # documents with identical bytes.
    matched_other_report: bool = False


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


def _repo_slug_candidates(repo: Any) -> list[str]:
    """Derive Atlas project-slug candidates from ``generated_from.repo``.

    The PF-3 envelope's ``generated_from.repo`` is *not* a slug: it is emitted
    as an absolute path on the **generating** machine (e.g.
    ``/Users/me/dev/homelab/development/artifact_atlas``), sometimes as a bare
    directory name (``artifact_atlas``), occasionally as a git remote
    (``git@host:org/artifact_atlas.git``). Only the basename can name a
    project, and repo directories are conventionally *underscored* while Atlas
    project slugs are *hyphenated* (``artifact_atlas`` vs ``artifact-atlas``) —
    that one-character mismatch is the whole reason repo-derived attribution
    used to be impossible without a cross-repo envelope contract change.

    Returns the candidate slugs to try, most-literal first, de-duplicated.
    An empty list means the value cannot name a project at all (absent,
    non-string, or blank) — callers then fall through, never guess.
    """
    if not isinstance(repo, str) or not repo.strip():
        return []
    raw = repo.strip().replace("\\", "/").rstrip("/")
    basename = raw.rsplit("/", 1)[-1]  # path / remote-with-org tail
    basename = basename.rsplit(":", 1)[-1]  # scp-style remote with no org path
    if basename.endswith(".git"):
        basename = basename[: -len(".git")]
    basename = basename.strip()
    if not basename:
        return []

    out: list[str] = []
    for candidate in (basename, basename.lower(), basename.lower().replace("_", "-")):
        if candidate and candidate not in out:
            out.append(candidate)
    return out


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
        # Workspace scope, stamped onto ingested reports so a future
        # workspace-scoped lens can span them (getattr: test fixtures build
        # Settings via __new__ and may not set every attribute).
        self._workspace_id: str | None = getattr(settings, "workspace_id", None)

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
        status: AssetStatus | str | None = None,
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
            status: Optional lifecycle status for the new asset. Defaults to
                ``AssetStatus.inbox`` — the historical hardcoded value — so the
                two long-standing callers (``import_url``'s sibling paths and
                the MCP/HTTP content upload) keep their exact behaviour. Report
                ingest passes ``candidate`` (see :meth:`import_report`).
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
            status=AssetStatus(status) if status is not None else AssetStatus.inbox,
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

        M3 (revisioning, OQ-3 + OQ-5): when the envelope's
        ``(route, subject, instance_key)`` matches an existing
        ``delivery_report`` asset (see :meth:`_find_report_by_identity`), the
        ingest does **not** create a new asset — it revises the existing one
        in place via :meth:`_revise_report_asset` (``PUT /content`` on the
        stable id), leaving its ``AssetLink`` rows intact. This engages only
        when the envelope carries a full stable identity (see
        :meth:`_has_stable_report_identity`: ``route`` + ``subject``, plus
        ``instance_key`` for the recurring routes); otherwise (or on a genuine
        first ingest of an instance) the plain :meth:`import_content` path
        below creates a new asset as before. So re-publishing one instance
        replaces it, while a *different* instance of the same subject gets its
        own asset instead of silently overwriting its predecessor
        (``DI-SubjectCollapse``).
        ``on_duplicate`` therefore only governs the first-ingest / no-stable-
        identity path — the stable-id path has its own hash-duplicate check
        (identical bytes are a no-op, ``is_duplicate=True``, no write).

        PF-4 (project attribution / reachability): every Atlas web route lives
        under ``(projects)/projects/[projectId]``, so a report stored with
        ``project_id=None`` is reachable from **no** page — hosted but invisible.
        The owning project is therefore resolved on **both** the create and the
        revise path by :meth:`_resolve_report_project_id` (explicit caller value
        → envelope ``subject`` → ``generated_from.repo`` basename → ``None``),
        always to the *canonical* ``proj_*`` id, never a slug.
        ``workspace_id`` is stamped from settings at the same time so a future
        workspace-scoped lens can span reports across projects. Both are
        applied by :meth:`_stamp_report_attribution` — including on a no-op
        re-ingest, which makes re-publishing an already-hosted report an
        idempotent attribution *repair* rather than a wasted call.
        The one case attribution is **not** applied is the create path's
        hash-duplicate branch (``is_duplicate`` with no stable-identity target):
        there the returned asset is a pre-existing report with a *different*
        identity that merely renders byte-identical HTML, and re-attributing it
        would move another report to this envelope's project
        (``DI-ByteCollision``). Such an ingest is a no-op on attribution, and
        the CLI already reports it as "duplicate of <that asset>".

        Status is ``candidate``, not the ``import_content`` default of
        ``inbox``: the PRD's OQ-1 decision is that auto-ingest lands at
        ``status=candidate``, never ``canonical``
        (``docs/project_plans/prds/features/delivery-report-hosting-v1.md``).
        The revise path deliberately leaves an existing report's status alone —
        a later re-ingest must never silently demote a human's promotion back
        to ``candidate``.

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
            project_id: Optional project scope, given as either a project
                **slug** or a canonical **id** — it is resolved to the
                canonical id before any write, and an unresolvable value is a
                loud failure (see :meth:`_resolve_explicit_project_id`). When
                omitted, attribution is inferred from the envelope.
            sensitivity: Override the "personal" default (e.g. for a report
                confirmed non-sensitive, or one that needs a tighter cap).
                Ignored on the stable-id revision path — an existing report's
                sensitivity is not silently changed by a later re-ingest.
            on_duplicate: Hash-match handling forwarded to ``import_content``
                on the first-ingest / no-stable-identity path only (default
                "return_existing").
            actor_id: Actor performing the ingest.

        Returns:
            ImportResult with the ``delivery_report`` asset and duplicate flag,
            plus ``matched_other_report=True`` on the one path where the
            returned asset is NOT the report just ingested: a byte-hash
            collision with an already-stored report of a different identity.
            Nothing is written to that asset (neither attribution nor scope
            links) and no new asset is created, so this report is not stored --
            callers that report success to a human must surface that flag.

        Raises:
            ImportError: if *html_path* does not exist or is not a file, if
                *project_id* is given but names no known project, if a
                ``tracker_links[]`` entry is not an object, or if a
                ``tracker_links[]`` entry's ``tracker`` value cannot be
                resolved to a link target (see :func:`_resolve_tracker`).
        """
        p = Path(html_path)
        if not p.exists():
            raise ImportError(f"Report HTML file does not exist: {p}")
        if not p.is_file():
            raise ImportError(f"Report HTML path is not a file: {p}")

        # PF-4: resolve project attribution BEFORE any write, for the same
        # reason link targets are resolved first — an explicit-but-unknown
        # project must fail loud with no asset created, never store a dangling
        # id. The subject→project lookup is done once here and handed to
        # _resolve_report_link_targets, which needs the same answer to type its
        # link target (it used to re-derive and discard it).
        subject_project = self._project_for_subject(envelope.get("subject"))
        resolved_project_id = self._resolve_report_project_id(
            envelope, project_id, subject_project=subject_project
        )

        # M2: resolve every scope-link target BEFORE any write. A bad
        # envelope must never leave a partially-linked (or unlinked-but-
        # silently-so) asset behind.
        link_targets = self._resolve_report_link_targets(
            envelope, subject_project=subject_project
        )

        title = envelope.get("title") or envelope.get("subject") or p.stem

        metadata: dict[str, Any] = {
            "envelope_version": envelope.get("envelope_version"),
            "artifact_type": envelope.get("artifact_type"),
            "target": envelope.get("target"),
            "route": envelope.get("route"),
            "title": envelope.get("title"),
            "subject": envelope.get("subject"),
            "instance_key": envelope.get("instance_key"),
            "link_identity": envelope.get("link_identity"),
            "revision": envelope.get("revision"),
            "truth_status": envelope.get("truth_status"),
            "generated_from": envelope.get("generated_from"),
            "generated_at": envelope.get("generated_at"),
            "tracker_links": envelope.get("tracker_links") or [],
            "item_count": envelope.get("item_count"),
        }

        # M3 (OQ-3) + DI-SubjectCollapse (resolved via PF-3 OQ-5): re-publishing
        # the same report INSTANCE must land on the SAME asset id, not mint a new
        # one -- but two DIFFERENT instances must never collapse onto one asset.
        # Identity is ``(route, subject, instance_key)``; see
        # ``_find_report_by_identity`` for why all three are required and what
        # happens when a recurring route omits ``instance_key``.
        route = envelope.get("route")
        subject = envelope.get("subject")
        instance_key = envelope.get("instance_key")
        stable_target = (
            self._find_report_by_identity(route, subject, instance_key)
            if self._has_stable_report_identity(route, subject, instance_key)
            else None
        )

        if stable_target is not None:
            result = self._revise_report_asset(
                stable_target,
                p,
                metadata,
                title=title,
                project_id=resolved_project_id,
                actor_id=actor_id,
            )
        else:
            with p.open("rb") as fh:
                result = self.import_content(
                    p.name,
                    fh,
                    title=title,
                    project_id=resolved_project_id,
                    artifact_type_id="delivery_report",
                    # PRD OQ-1: auto-ingest lands at candidate, never canonical.
                    status=AssetStatus.candidate,
                    sensitivity=self._report_sensitivity(sensitivity),
                    agent_access=AgentAccess.preview_allowed.value,
                    mime_type="text/html",
                    on_duplicate=on_duplicate,
                    actor_id=actor_id,
                    metadata=metadata,
                    generated_by=GeneratedBy.agent.value,
                )

        # PF-4 + DI-ByteCollision: attribution applies on a genuine create and
        # on the whole revise path (including the identical-bytes no-op, so
        # re-publishing an already-hosted-but-unattributed report REPAIRS it) —
        # but never on the create path's hash-duplicate branch. There, the asset
        # ``import_content`` handed back is a *pre-existing, differently
        # identified* report that merely shares bytes (two reports can render
        # byte-identical HTML), and stamping this envelope's project onto it
        # would silently move someone else's report to another project page.
        # ``artifact_type_id`` cannot catch that case — both assets are
        # delivery_reports — so the identity check has to happen here, where
        # ``stable_target`` says which asset we actually set out to write.
        #
        # The scope links are gated by the SAME condition, because an AssetLink
        # is just as much a write onto ``result.asset`` as the attribution patch
        # is. Left ungated (as it was), a colliding ingest of report B attached
        # B's ``("project", "fleet-beta")`` evidence link -- plus an
        # ``asset_linked`` audit event -- onto report A's asset, contaminating
        # the very project surface the attribution guard was protecting. Both
        # writes are skipped together, which is what makes "nothing is written
        # to the matched asset" literally true rather than nearly true.
        wrote_intended_asset = (
            stable_target is not None and result.asset.id == stable_target.id
        )
        if not result.is_duplicate or wrote_intended_asset:
            result.asset = self._stamp_report_attribution(
                result.asset, project_id=resolved_project_id, actor_id=actor_id
            )
            self._link_report_targets(result.asset, link_targets, actor_id=actor_id)
        else:
            # Nothing was written -- and on this path ``import_content`` returned
            # a pre-existing asset instead of creating one, so THIS report may
            # not be stored anywhere. Whether that is true depends on the
            # matched asset's identity, not on ``is_duplicate``: re-ingesting an
            # identity-less envelope (a recurring route with no instance_key)
            # can land on the *same* report, which is stored. Ask
            # ``_find_report_by_identity`` -- the single source of truth for
            # report identity -- rather than re-deriving the tuple, so this
            # cannot drift the day identity grows a field (it already grew
            # ``instance_key`` once, in DI-SubjectCollapse). Unconditionally
            # here, not via ``_has_stable_report_identity``: that gate decides
            # whether to REVISE in place, a stricter question than whether the
            # asset we landed on happens to be the same report.
            twin = self._find_report_by_identity(route, subject, instance_key)
            result.matched_other_report = twin is None or twin.id != result.asset.id
        return result

    # ------------------------------------------------------------------
    # Report project attribution (PF-4) — reachability, not decoration
    # ------------------------------------------------------------------

    def _project_for_subject(self, subject: Any) -> Project | None:
        """Return the Atlas project whose slug equals the envelope ``subject``.

        ``subject`` carries no type tag upstream — the emitter sets it to
        ``report.subject or report.project``, i.e. a *project* slug for
        route=program/phase/readiness and a *feature* slug for
        route=feature/dossier. One lookup against Atlas's own project registry
        answers both questions that need it: which link target type to use
        (:meth:`_resolve_report_link_targets`) and which project owns the
        report (:meth:`_resolve_report_project_id`). Shared here so the two
        can never disagree, and so the resolved Project is used rather than
        looked up and thrown away.
        """
        if not isinstance(subject, str) or not subject.strip():
            return None
        return self._projects.get_by_slug(subject.strip())

    def _resolve_explicit_project_id(self, explicit: str) -> str:
        """Resolve a caller-supplied project **slug or id** to the canonical id.

        Fails loud on an unknown value. This is the fix for the original
        pass-through bug: ``--project artifact-atlas`` (a slug) used to be
        stored verbatim as ``project_id="artifact-atlas"`` while the real id is
        ``proj_artifact_atlas``, so the asset matched *no* project under
        ``GET /api/projects/{id}/assets``' exact-equality filter — hosted and
        silently unreachable. Storing a dangling id is strictly worse than
        refusing, so an unresolvable value raises with nothing written.
        """
        candidate = explicit.strip()
        project = self._projects.get(candidate) or self._projects.get_by_slug(candidate)
        if project is None:
            raise ImportError(
                f"Unknown project for report ingest: {explicit!r} "
                "(expected an existing project id or slug)"
            )
        return project.id

    def _resolve_report_project_id(
        self,
        envelope: dict[str, Any],
        explicit: str | None,
        *,
        subject_project: Project | None = None,
    ) -> str | None:
        """Resolve the canonical ``proj_*`` id that owns this report.

        Order — first hit wins:

        1. **Explicit caller value** (slug or id) — resolved, or a loud failure.
        2. **Envelope ``subject``** matched against a project slug (the lookup
           passed in as *subject_project*).
        3. **``generated_from.repo`` basename**, underscore-normalized
           (``artifact_atlas`` → ``artifact-atlas``) — see
           :func:`_repo_slug_candidates`. This is the cheap win: it needs no
           change to the cross-repo envelope contract.
        4. **``None``** — left unattributed rather than guessed. An
           unattributed report is visible to a workspace-wide lens and to a
           backfill sweep; a *wrongly* attributed one lies to whoever reads
           that project's page.
        """
        if isinstance(explicit, str) and explicit.strip():
            return self._resolve_explicit_project_id(explicit)

        if subject_project is not None:
            return subject_project.id

        generated_from = envelope.get("generated_from")
        repo = generated_from.get("repo") if isinstance(generated_from, dict) else None
        for slug in _repo_slug_candidates(repo):
            project = self._projects.get_by_slug(slug)
            if project is not None:
                return project.id

        return None

    def _stamp_report_attribution(
        self, asset: Asset, *, project_id: str | None, actor_id: str = "system"
    ) -> Asset:
        """Write the resolved ``project_id`` + workspace scope onto *asset*.

        The ``artifact_type_id == "delivery_report"`` check is a **type** guard
        and nothing more: it stops attribution being stamped onto a *non-report*
        asset (e.g. a plain HTML upload) that happens to share bytes with this
        report. It deliberately does **not** claim to tell one report from
        another — two different report instances can render byte-identical HTML
        and both pass this guard. Keeping this method off a byte-duplicate of a
        *different* report is therefore the **caller's** responsibility:
        :meth:`import_report` only calls it when ``result.asset`` is either
        freshly created or the stable-identity target it set out to revise (see
        the ``DI-ByteCollision`` comment there).

        ``project_id`` is normally already correct on the create path (the
        repository writes it at create time), so this usually only adds
        ``workspace_id`` there. On the revise path — where
        :meth:`_revise_report_asset` historically used ``project_id`` for the
        audit event only, never writing it — this is what actually attributes
        the asset.

        A ``project_id`` delta is what marks an attribution **repair**: it moves
        an already-stored report from one project page to another (or off
        "unattributed"), and on the identical-bytes no-op path
        :meth:`_revise_report_asset` returns before emitting anything, so without
        its own event that move would leave no trace at all. That case therefore
        bumps ``last_indexed_at`` and emits an
        ``asset_added``/``report_attribution_repaired`` event carrying the
        before/after ids. A ``workspace_id``-only stamp stays quiet: it backfills
        a never-populated field on an asset whose create/revise event was just
        emitted, so logging it would only double up.

        A *fresh* create produces no ``project_id`` delta (the repository already
        wrote the resolved id), so it does not emit a repair event —
        ``test_first_ingest_does_not_emit_a_spurious_repair_event`` pins that
        rather than leaving it to inspection.

        Returns the refreshed asset, or *asset* unchanged when there is nothing
        to write.
        """
        if asset.artifact_type_id != "delivery_report":
            return asset

        patch: dict[str, Any] = {}
        if project_id is not None and asset.project_id != project_id:
            patch["project_id"] = project_id
        if self._workspace_id and asset.workspace_id != self._workspace_id:
            patch["workspace_id"] = self._workspace_id
        if not patch:
            return asset

        reattributed = "project_id" in patch
        if reattributed:
            # Mirrors AssetRepository.update: assets carry last_indexed_at, not
            # updated_at, as their mutation timestamp.
            patch["last_indexed_at"] = datetime.now(tz=timezone.utc).isoformat()

        _jl.update_record(self._assets._assets_path, asset.id, patch)
        refreshed = self._assets.get(asset.id)
        stamped = refreshed if refreshed is not None else asset

        if reattributed:
            self._audit.emit_asset_added(
                stamped.id,
                project_id=project_id,
                actor_id=actor_id,
                payload={
                    "action": "report_attribution_repaired",
                    "project_id_before": asset.project_id,
                    "project_id_after": project_id,
                    "route": (asset.metadata or {}).get("route"),
                    "subject": (asset.metadata or {}).get("subject"),
                },
            )
        return stamped

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

    def _has_stable_report_identity(
        self, route: Any, subject: Any, instance_key: Any
    ) -> bool:
        """Whether this envelope carries enough identity to revise in place.

        Requires a non-blank ``route`` and ``subject`` always, plus a non-blank
        ``instance_key`` for the **recurring** routes (``phase``, ``program``,
        ``readiness``) where one subject legitimately has many instances.

        The ``instance_key`` requirement is the fix for ``DI-SubjectCollapse``.
        A recurring-route envelope with no ``instance_key`` has no way to say
        *which* instance it is, so treating it as a stable identity is what
        silently overwrote a prior phase's report. Falling through to the
        create path instead means the worst case is an extra asset, never a
        lost one. PF-3's exporter already hard-fails before emitting such an
        envelope for ``target=atlas`` (``delivery_report.py`` ``build_export``),
        so in practice this fallback only catches hand-rolled or pre-OQ-5
        envelopes.

        ``feature``/``dossier`` deliberately need no ``instance_key``: collapse
        onto one living record per subject is the intended model there (design
        spec 6.1), which is what OQ-3 accepted.
        """
        if not (isinstance(route, str) and route.strip()):
            return False
        if not (isinstance(subject, str) and subject.strip()):
            return False
        if route in RECURRING_REPORT_ROUTES:
            return isinstance(instance_key, str) and bool(instance_key.strip())
        return True

    def _find_report_by_identity(
        self, route: Any, subject: Any, instance_key: Any = None
    ) -> Asset | None:
        """Return the existing ``delivery_report`` asset whose stable identity
        matches ``(route, subject, instance_key)``, or ``None`` on a first
        ingest of that instance.

        Identity is ``(route, subject, instance_key)``, all three read verbatim
        from the PF-3 envelope. ``instance_key`` is the named per-instance
        discriminator resolved by **PF-3 OQ-5** (2026-08-02): it is derived by
        the caller from whatever actually distinguishes the instance -- the
        phase/milestone id for ``phase``, the milestone id for ``program``, the
        decision date for ``readiness`` -- and is ``None`` for
        ``feature``/``dossier``, where one living record per subject is correct
        by design.

        This is what closes ``DI-SubjectCollapse``. Under the previous
        ``(route, subject)`` key, a phase-2 and a phase-3 report for one
        project collapsed onto a single asset and the second silently
        overwrote the first's blob. Keying on the instance too means distinct
        instances get distinct assets, while re-publishing the *same* instance
        still replaces in place -- so OQ-3's replace-in-place idempotence and
        OQ-5's per-instance separation compose instead of conflicting.

        ``revision`` is deliberately **not** part of identity: it is a display
        field that ``init_manifest`` sets to ``1`` and nothing increments, so
        folding it in would mint a new asset on every re-render of one report.

        Scoped to ``artifact_type_id == "delivery_report"`` so a report can
        never collide with an unrelated asset that happens to carry the same
        ``metadata.route``/``metadata.subject`` keys by coincidence.
        """
        for asset in self._assets.list():
            if asset.artifact_type_id != "delivery_report":
                continue
            meta = asset.metadata or {}
            if (
                meta.get("route") == route
                and meta.get("subject") == subject
                and meta.get("instance_key") == instance_key
            ):
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

        *project_id* here is the already-resolved canonical id, used for the
        audit event only — writing it onto the asset is
        :meth:`_stamp_report_attribution`'s job, which :meth:`import_report`
        runs after this returns so the identical-hash early return is covered
        too. ``status`` is deliberately untouched: a re-ingest must not demote
        a report a human already promoted back to ``candidate``.
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
        self,
        envelope: dict[str, Any],
        *,
        subject_project: Any = _UNSET,
    ) -> list[tuple[AssetLinkTargetType, str]]:
        """Resolve the envelope's ``subject`` and every ``tracker_links[]``
        entry into ``(target_type, target_id)`` pairs.

        *subject_project* is the already-resolved
        :meth:`_project_for_subject` result, passed in by
        :meth:`import_report` so the same lookup is not repeated (and, more to
        the point, so the resolved Project is *used* for attribution rather
        than discarded). Omit it and the lookup happens here as before — an
        explicit ``None`` means "resolved to no project", which is why the
        default is a sentinel rather than ``None``.

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
            resolved = (
                self._project_for_subject(subject)
                if subject_project is _UNSET
                else subject_project
            )
            if resolved is not None:
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

        Like :meth:`_stamp_report_attribution`, this trusts *asset* to be the
        right one and cannot check: linking is a write, so calling it with a
        byte-twin of a **different** report attaches this envelope's scope links
        (and ``asset_linked`` events) to that other report's asset. Keeping it
        off that asset is therefore the **caller's** responsibility —
        :meth:`import_report` calls it under the same guard as the attribution
        stamp (see the ``DI-ByteCollision`` comment there).
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
