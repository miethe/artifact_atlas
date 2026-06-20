"""Assets router.

Routes:
  GET    /api/projects/{projectId}/assets
  POST   /api/projects/{projectId}/assets
  GET    /api/assets/{assetId}
  PATCH  /api/assets/{assetId}
  DELETE /api/assets/{assetId}
  POST   /api/assets/{assetId}/link
  POST   /api/assets/{assetId}/promote
  POST   /api/assets/{assetId}/summarize
  POST   /api/assets/{assetId}/assign-slot
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import (
    apply_cursor_page,
    conflict,
    forbidden,
    get_asset_service,
    get_audit_service,
    not_found,
)
from app.models.asset import (
    Asset,
    AssetCreate,
    AssetLink,
    AssetLinkCreate,
    AssetPromoteRequest,
    AssetUpdate,
)
from app.models.bom import BomAssignment, SlotAssignRequest
from app.models.vocabulary import (
    AgentAccess,
    AssetStatus,
    AssignedBy,
    AssignmentStatus,
    Sensitivity,
    SourceKind,
)
from app.repositories.bom import BomRepository
from app.services.assets import PolicyDeniedError, StatusTransitionError
from app.settings import get_settings

router = APIRouter(prefix="/api", tags=["assets"])


# ---------------------------------------------------------------------------
# Project-scoped asset list + create
# ---------------------------------------------------------------------------


@router.get("/projects/{projectId}/assets")
def list_project_assets(
    projectId: str,
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    status: Annotated[list[AssetStatus] | None, Query()] = None,
    sensitivity: Annotated[Sensitivity | None, Query()] = None,
    source_kind: Annotated[list[SourceKind] | None, Query()] = None,
    agent_access: Annotated[AgentAccess | None, Query()] = None,
    artifact_type_id: Annotated[str | None, Query()] = None,
    q: Annotated[str | None, Query()] = None,
) -> dict:
    """List assets for a project with optional filters."""
    svc = get_asset_service()

    status_filter = [s.value for s in status] if status else None
    sensitivity_filter = [sensitivity.value] if sensitivity else None
    source_kind_filter = [sk.value for sk in source_kind] if source_kind else None
    artifact_type_filter = [artifact_type_id] if artifact_type_id else None

    # Also filter by agent_access if provided
    assets = svc.search_assets(
        project_id=projectId,
        query=q,
        status_filter=status_filter,
        sensitivity_filter=sensitivity_filter,
        source_kind_filter=source_kind_filter,
        artifact_type_filter=artifact_type_filter,
        limit=10000,
    )

    if agent_access is not None:
        av = agent_access.value
        assets = [a for a in assets if (
            a.agent_access.value if hasattr(a.agent_access, "value") else str(a.agent_access)
        ) == av]

    return apply_cursor_page(assets, cursor=cursor, limit=limit)


@router.post("/projects/{projectId}/assets", status_code=201, response_model=Asset)
def create_asset(projectId: str, data: AssetCreate) -> Asset:
    """Register a new asset in a project."""
    svc = get_asset_service()
    return svc.create_asset(data, project_id=projectId)


# ---------------------------------------------------------------------------
# Asset detail / edit / delete
# ---------------------------------------------------------------------------


@router.get("/assets/{assetId}", response_model=Asset)
def get_asset(assetId: str) -> Asset:
    """Get a single asset. Policy-gated for content fields."""
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]
    return asset


@router.patch("/assets/{assetId}", response_model=Asset)
def update_asset(assetId: str, data: AssetUpdate) -> Asset:
    """Partially update asset metadata."""
    svc = get_asset_service()
    updated = svc.update_asset(assetId, data)
    if updated is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]
    return updated


@router.delete("/assets/{assetId}", status_code=204)
def delete_asset(
    assetId: str,
    confirm_canonical: Annotated[bool, Query()] = False,
) -> None:
    """Archive an asset (tombstone). Canonical assets require confirm_canonical=true."""
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]

    current_status = asset.status.value if hasattr(asset.status, "value") else str(asset.status)
    if current_status == AssetStatus.canonical.value and not confirm_canonical:
        return conflict("Canonical asset deletion requires confirm_canonical=true.")  # type: ignore[return-value]

    svc.delete_asset(assetId)
    return None


# ---------------------------------------------------------------------------
# Links
# ---------------------------------------------------------------------------


@router.post("/assets/{assetId}/link", status_code=201, response_model=AssetLink)
def link_asset(assetId: str, data: AssetLinkCreate) -> AssetLink:
    """Link an asset to a target entity."""
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]
    return svc.create_link(assetId, data)


# ---------------------------------------------------------------------------
# Promote
# ---------------------------------------------------------------------------


@router.post("/assets/{assetId}/promote", response_model=Asset)
def promote_asset(assetId: str, data: AssetPromoteRequest) -> Asset:
    """Promote an asset toward canonical status."""
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]

    try:
        return svc.promote_asset(assetId, data)
    except PolicyDeniedError as exc:
        return forbidden(str(exc))  # type: ignore[return-value]
    except StatusTransitionError as exc:
        return conflict(str(exc))  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Summarize (async preview generation)
# ---------------------------------------------------------------------------


@router.post("/assets/{assetId}/summarize", status_code=202)
def summarize_asset(assetId: str) -> dict:
    """Request local preview/summary generation for an asset."""
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]

    task_id = f"task_{uuid.uuid4().hex[:12]}"
    return {"task_id": task_id, "asset_id": assetId}


# ---------------------------------------------------------------------------
# Assign to BOM slot (shorthand)
# ---------------------------------------------------------------------------


@router.post("/assets/{assetId}/assign-slot", status_code=201, response_model=BomAssignment)
def assign_asset_to_slot(assetId: str, data: SlotAssignRequest) -> BomAssignment:
    """Assign an asset to a BOM slot (shorthand from the asset side)."""
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]

    settings = get_settings()
    bom_repo = BomRepository(settings.registry_dir)

    slot_id = data.slot_id or assetId  # slot_id must be in the request in practice
    if not data.slot_id:
        return not_found("slot_id is required in the request body.")  # type: ignore[return-value]

    slot = bom_repo.get_slot(slot_id)
    if slot is None:
        return not_found(f"BOM slot '{slot_id}' not found.")  # type: ignore[return-value]

    assignment_id = f"asn_{uuid.uuid4().hex[:16]}"
    assignment = bom_repo.create_assignment(
        assignment_id,
        SlotAssignRequest(
            asset_id=assetId,
            slot_id=slot_id,
            assignment_status=data.assignment_status,
            confidence=data.confidence,
            notes=data.notes,
        ),
        assigned_by="user",
    )
    return assignment
