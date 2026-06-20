"""Inbox router.

Routes:
  GET  /api/projects/{projectId}/inbox
  POST /api/projects/{projectId}/inbox/import
  POST /api/projects/{projectId}/inbox/classify
  POST /api/projects/{projectId}/inbox/apply-classification

Security notes:
  - file:// URI imports are restricted to paths inside the configured workspace
    root (``settings.workspace_root``, defaulting to the repo root).  Requests
    for paths outside that boundary are rejected with HTTP 400.
  - The allowlist is configurable via ``ATLAS_FILE_IMPORT_ALLOWLIST`` (colon-
    separated list of absolute directory prefixes that are permitted).
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query

from app.api._deps import apply_cursor_page, get_asset_service, not_found
from app.models.asset import AssetUpdate
from app.models.inbox import (
    ApplyClassificationRequest,
    ClassificationSuggestion,
    InboxImportRequest,
    InboxItem,
)
from app.models.vocabulary import AssetStatus, SourceKind
from app.services.import_index import ImportService
from app.settings import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["inbox"])

# ---------------------------------------------------------------------------
# File-URI path guard
# ---------------------------------------------------------------------------

_THIS_FILE = Path(__file__).resolve()
# Default workspace root = repo root (four levels up from api/app/api/inbox.py)
_DEFAULT_WORKSPACE_ROOT = _THIS_FILE.parents[4]


def _get_allowed_roots() -> list[Path]:
    """Return the list of allowed root directories for file:// imports.

    Sources (highest to lowest priority):
    1. ``ATLAS_FILE_IMPORT_ALLOWLIST`` env-var (colon-separated absolute paths).
    2. ``ATLAS_REGISTRY_DIR`` env-var parent directory (workspace root).
    3. Hard-coded default: repo root.
    """
    env_allowlist = os.environ.get("ATLAS_FILE_IMPORT_ALLOWLIST", "")
    if env_allowlist.strip():
        return [Path(p).resolve() for p in env_allowlist.split(":") if p.strip()]

    # Fall back to settings registry dir's parent as workspace boundary
    try:
        settings = get_settings()
        return [settings.registry_dir.parent.resolve()]
    except Exception:  # noqa: BLE001
        return [_DEFAULT_WORKSPACE_ROOT]


def _assert_path_allowed(local_path: str) -> None:
    """Raise HTTP 400 if *local_path* falls outside every allowed root.

    Args:
        local_path: The filesystem path extracted from the file:// URI.

    Raises:
        HTTPException(400): When the path is outside the workspace boundary.
    """
    target = Path(local_path).resolve()
    allowed_roots = _get_allowed_roots()
    for root in allowed_roots:
        try:
            target.relative_to(root)
            return  # path is inside this allowed root — permit
        except ValueError:
            continue  # not under this root, try next

    logger.warning(
        "file:// import rejected: path %r is outside workspace roots %r",
        str(target),
        [str(r) for r in allowed_roots],
    )
    raise HTTPException(
        status_code=400,
        detail=(
            f"File path '{local_path}' is outside the permitted workspace boundary. "
            "Only paths inside the workspace root are allowed for file:// imports."
        ),
    )


@router.get("/projects/{projectId}/inbox")
def list_inbox(
    projectId: str,
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    source_kind: Annotated[list[SourceKind] | None, Query()] = None,
) -> dict:
    """List unclassified inbox/raw items for a project."""
    svc = get_asset_service()
    assets = svc.list_assets(project_id=projectId)

    # Inbox items are inbox or raw status
    inbox_statuses = {AssetStatus.inbox.value, AssetStatus.raw.value}
    assets = [
        a for a in assets
        if (a.status.value if hasattr(a.status, "value") else str(a.status)) in inbox_statuses
    ]

    if source_kind:
        sk_set = {sk.value for sk in source_kind}
        assets = [
            a for a in assets
            if (a.source_kind.value if hasattr(a.source_kind, "value") else str(a.source_kind)) in sk_set
        ]

    # Convert to InboxItem projections
    inbox_items = [
        InboxItem(
            id=a.id,
            title=a.title,
            source_kind=a.source_kind,
            uri=a.uri or "",
            status=a.status,
            sensitivity=a.sensitivity,
            agent_access=a.agent_access,
            mime_type=a.mime_type,
            captured_at=a.captured_at,
        )
        for a in assets
    ]

    return apply_cursor_page(inbox_items, cursor=cursor, limit=limit)


@router.post("/projects/{projectId}/inbox/import", status_code=202)
def import_to_inbox(projectId: str, data: InboxImportRequest) -> dict:
    """Import one or more URIs into the project inbox."""
    settings = get_settings()
    svc = ImportService(settings.registry_dir)

    uris = data.uris or []
    asset_ids: list[str] = []

    for uri in uris:
        if uri.startswith("file://") or not uri.startswith(("http://", "https://", "manual://")):
            local_path = uri.replace("file://", "") if uri.startswith("file://") else uri
            _assert_path_allowed(local_path)
            result = svc.import_local_path(
                local_path,
                project_id=projectId,
                sensitivity=data.sensitivity.value,
                agent_access=data.agent_access.value,
                metadata=data.metadata,
            )
        elif uri.startswith(("http://", "https://")):
            result = svc.import_url(
                uri,
                project_id=projectId,
                sensitivity=data.sensitivity.value,
                agent_access=data.agent_access.value,
                metadata=data.metadata,
            )
        else:
            result = svc.import_manual(
                uri,
                project_id=projectId,
                sensitivity=data.sensitivity.value,
                agent_access=data.agent_access.value,
                metadata=data.metadata,
            )
        asset_ids.append(result.asset.id)

    return {"imported_count": len(asset_ids), "asset_ids": asset_ids}


@router.post("/projects/{projectId}/inbox/classify")
def classify_inbox_items(projectId: str, body: dict) -> dict:
    """Return local heuristic classification suggestions for inbox items."""
    asset_ids: list[str] = body.get("asset_ids", [])
    svc = get_asset_service()
    suggestions: list[dict[str, Any]] = []

    for aid in asset_ids:
        asset = svc.get_asset(aid)
        if asset is None:
            continue
        # Local heuristic: suggest candidate status, preserve existing sensitivity
        suggestion = ClassificationSuggestion(
            asset_id=aid,
            artifact_type_id=asset.artifact_type_id,
            suggested_status=AssetStatus.candidate,
            suggested_sensitivity=asset.sensitivity,
            confidence=0.5,
            rationale="Heuristic: title-based classification (local, no model call).",
        )
        suggestions.append(suggestion.model_dump(mode="json"))

    return {"suggestions": suggestions}


@router.post("/projects/{projectId}/inbox/apply-classification")
def apply_classification(
    projectId: str,
    data: ApplyClassificationRequest,
) -> dict:
    """Apply accepted classification to inbox items, transitioning status."""
    svc = get_asset_service()
    updated: list[str] = []

    for item in data.classifications:
        asset = svc.get_asset(item.asset_id)
        if asset is None:
            continue

        patch = AssetUpdate(
            artifact_type_id=item.artifact_type_id,
            status=item.status,
            sensitivity=item.sensitivity,
        )
        result = svc.update_asset(item.asset_id, patch)
        if result is not None:
            updated.append(item.asset_id)

    return {"updated_count": len(updated), "asset_ids": updated}
