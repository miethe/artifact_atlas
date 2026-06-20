"""Context Packs router.

Routes:
  GET  /api/projects/{projectId}/context-packs
  POST /api/projects/{projectId}/context-packs
  GET  /api/context-packs/{packId}
  PATCH /api/context-packs/{packId}
  POST /api/context-packs/{packId}/preview
  POST /api/context-packs/{packId}/export
  POST /api/context-packs/{packId}/publish
  POST /api/context-packs/from-node/{nodeId}

All routes delegate to ContextPackService (CP-BE-001..004).
MCP/CLI must call the same service, not bypass it.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import (
    apply_cursor_page,
    conflict,
    forbidden,
    not_found,
    internal_error,
)
from app.models.context_pack import (
    ContextPack,
    ContextPackCreate,
    ContextPackDetail,
    ContextPackFromNodeRequest,
    ContextPackPreview,
    ContextPackPublishRequest,
    ContextPackUpdate,
)
from app.models.vocabulary import (
    ContextPackAudience,
    ContextPackStatus,
)
from app.services.context_pack_service import ConflictError, ContextPackService
from app.settings import get_settings

router = APIRouter(prefix="/api", tags=["context-packs"])


def _get_service() -> ContextPackService:
    settings = get_settings()
    return ContextPackService(
        registry_dir=settings.registry_dir,
        context_packs_dir=settings.context_packs_dir,
    )


# ---------------------------------------------------------------------------
# Project-scoped context packs
# ---------------------------------------------------------------------------


@router.get("/projects/{projectId}/context-packs")
def list_context_packs(
    projectId: str,
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    status: Annotated[ContextPackStatus | None, Query()] = None,
    audience: Annotated[ContextPackAudience | None, Query()] = None,
) -> dict:
    """List context packs for a project."""
    svc = _get_service()
    packs = svc.list(
        projectId,
        status=status.value if status else None,
        audience=audience.value if audience else None,
    )
    return apply_cursor_page(packs, cursor=cursor, limit=limit)


@router.post("/projects/{projectId}/context-packs", status_code=201, response_model=ContextPack)
def create_context_pack(projectId: str, data: ContextPackCreate) -> ContextPack:
    """Create a new context pack for a project (always draft)."""
    svc = _get_service()
    return svc.create(projectId, data)


# ---------------------------------------------------------------------------
# Context pack by ID
# ---------------------------------------------------------------------------


@router.get("/context-packs/{packId}", response_model=ContextPackDetail)
def get_context_pack(packId: str) -> ContextPackDetail:
    """Get a single context pack with its items."""
    svc = _get_service()
    detail = svc.get(packId)
    if detail is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]
    return detail


@router.patch("/context-packs/{packId}", response_model=ContextPack)
def update_context_pack(packId: str, data: ContextPackUpdate) -> ContextPack:
    """Update context pack metadata and optionally replace all items."""
    svc = _get_service()
    updated = svc.update(packId, data)
    if updated is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]
    return updated


@router.post("/context-packs/{packId}/preview", response_model=ContextPackPreview)
def preview_context_pack(packId: str) -> ContextPackPreview:
    """Render a policy-aware preview of the context pack payload.

    Applies include-mode policy to each item, computes token estimate,
    and returns the YAML manifest string matching the spec §14.3 shape.
    """
    svc = _get_service()
    preview = svc.preview(packId)
    if preview is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]
    return preview


@router.post("/context-packs/{packId}/export")
def export_context_pack(packId: str, output_path: Annotated[str | None, Query()] = None) -> dict:
    """Export the context pack YAML to exports/context-packs/.

    Returns the written file path.
    Does not change pack status (use /publish for that).
    """
    svc = _get_service()
    # Verify exists first
    detail = svc.get(packId)
    if detail is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]

    from pathlib import Path
    dest = Path(output_path) if output_path else None
    try:
        written = svc.export_yaml(packId, output_path=dest)
    except ValueError as exc:
        return not_found(str(exc))  # type: ignore[return-value]

    return {"pack_id": packId, "export_path": str(written)}


@router.post("/context-packs/{packId}/publish", response_model=ContextPack)
def publish_context_pack(packId: str, data: ContextPackPublishRequest) -> ContextPack:
    """Publish a context pack.

    Blocked for sensitive-sensitivity packs unless approved (policy.evaluate_generic).
    Emits audit event + CCDash event hook payload.
    Exports YAML to exports/context-packs/.
    """
    svc = _get_service()

    try:
        updated, _ccdash = svc.publish(
            packId,
            destination=data.destination.value,
            output_path=data.output_path,
        )
    except ValueError as exc:
        return not_found(str(exc))  # type: ignore[return-value]
    except ConflictError as exc:
        return conflict(str(exc))  # type: ignore[return-value]
    except PermissionError as exc:
        return forbidden(str(exc))  # type: ignore[return-value]
    except RuntimeError:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]

    return updated


@router.post("/context-packs/from-node/{nodeId}", status_code=201, response_model=ContextPack)
def create_context_pack_from_node(
    nodeId: str,
    data: ContextPackFromNodeRequest,
) -> ContextPack:
    """Create a draft context pack scoped to an IntentTree node.

    Collects assets linked to the node, BOM slot refs, and MeatyWiki page refs
    (stub where integration not live — marked clearly in items).
    All items default to include_mode=metadata.
    """
    svc = _get_service()
    pack = svc.create_from_node(
        node_id=nodeId,
        project_id=data.project_id,
        title=data.title,
        audience=data.audience,
        sensitivity=data.sensitivity,
        instructions=data.instructions,
        include_assets=data.include_assets,
        include_bom_slots=data.include_bom_slots,
        include_meatywiki_pages=data.include_meatywiki_pages,
        asset_statuses=data.asset_statuses,
    )
    return pack
