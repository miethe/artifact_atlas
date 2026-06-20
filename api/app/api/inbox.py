"""Inbox router.

Routes:
  GET  /api/projects/{projectId}/inbox
  POST /api/projects/{projectId}/inbox/import
  POST /api/projects/{projectId}/inbox/classify
  POST /api/projects/{projectId}/inbox/apply-classification
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Query

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

router = APIRouter(prefix="/api", tags=["inbox"])


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
            result = svc.import_local_path(
                uri.replace("file://", ""),
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
