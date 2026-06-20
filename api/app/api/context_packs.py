"""Context Packs router.

Routes:
  GET  /api/projects/{projectId}/context-packs
  POST /api/projects/{projectId}/context-packs
  GET  /api/context-packs/{packId}
  PATCH /api/context-packs/{packId}
  POST /api/context-packs/{packId}/preview
  POST /api/context-packs/{packId}/publish
  POST /api/context-packs/from-node/{nodeId}
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import (
    apply_cursor_page,
    conflict,
    forbidden,
    get_policy_service,
    not_found,
)
from app.models.context_pack import (
    ContextPack,
    ContextPackCreate,
    ContextPackDetail,
    ContextPackFromNodeRequest,
    ContextPackItemCreate,
    ContextPackPreview,
    ContextPackPublishRequest,
    ContextPackUpdate,
)
from app.models.vocabulary import (
    ContextPackAudience,
    ContextPackItemType,
    ContextPackStatus,
    IncludeMode,
)
from app.repositories.context_packs import ContextPackRepository
from app.services.audit import AuditService
from app.settings import get_settings

router = APIRouter(prefix="/api", tags=["context-packs"])


def _get_repo() -> ContextPackRepository:
    return ContextPackRepository(get_settings().registry_dir)


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
    repo = _get_repo()
    packs = repo.list(project_id=projectId)

    if status is not None:
        sv = status.value
        packs = [p for p in packs if (
            p.status.value if hasattr(p.status, "value") else str(p.status)
        ) == sv]

    if audience is not None:
        av = audience.value
        packs = [p for p in packs if (
            p.audience.value if hasattr(p.audience, "value") else str(p.audience)
        ) == av]

    return apply_cursor_page(packs, cursor=cursor, limit=limit)


@router.post("/projects/{projectId}/context-packs", status_code=201, response_model=ContextPack)
def create_context_pack(projectId: str, data: ContextPackCreate) -> ContextPack:
    """Create a new context pack for a project."""
    repo = _get_repo()
    pack_id = f"pack_{uuid.uuid4().hex[:16]}"
    pack = repo.create(pack_id, projectId, data)

    # Persist items if provided
    if data.items:
        for idx, item_data in enumerate(data.items):
            item_id = f"item_{uuid.uuid4().hex[:12]}"
            ordered = ContextPackItemCreate(
                item_type=item_data.item_type,
                item_id=item_data.item_id,
                include_mode=item_data.include_mode,
                display_order=item_data.display_order if item_data.display_order is not None else idx,
                required=item_data.required,
            )
            repo.add_item(item_id, pack_id, ordered)

    # Audit
    AuditService(get_settings().registry_dir).emit(
        "context_pack_created",  # type: ignore[arg-type]
        "context_pack",
        pack_id,
        project_id=projectId,
        payload={"title": pack.title, "audience": pack.audience.value},
    )
    return pack


# ---------------------------------------------------------------------------
# Context pack by ID
# ---------------------------------------------------------------------------


@router.get("/context-packs/{packId}", response_model=ContextPackDetail)
def get_context_pack(packId: str) -> ContextPackDetail:
    """Get a single context pack with its items."""
    repo = _get_repo()
    pack = repo.get(packId)
    if pack is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]

    items = repo.list_items(packId)
    return ContextPackDetail(**pack.model_dump(mode="python"), items=items)


@router.patch("/context-packs/{packId}", response_model=ContextPack)
def update_context_pack(packId: str, data: ContextPackUpdate) -> ContextPack:
    """Update context pack metadata and items."""
    repo = _get_repo()
    pack = repo.get(packId)
    if pack is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]

    updated = repo.update(packId, data)
    if updated is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]

    # Replace items if provided
    if data.items is not None:
        repo.replace_items(packId, data.items)

    return updated


@router.post("/context-packs/{packId}/preview", response_model=ContextPackPreview)
def preview_context_pack(packId: str) -> ContextPackPreview:
    """Render a preview of the context pack payload."""
    repo = _get_repo()
    pack = repo.get(packId)
    if pack is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]

    items = repo.list_items(packId)

    # Build a simple YAML manifest for preview
    manifest_lines = [
        f"# Context Pack: {pack.title}",
        f"id: {pack.id}",
        f"project_id: {pack.project_id}",
        f"audience: {pack.audience.value if hasattr(pack.audience, 'value') else pack.audience}",
        f"sensitivity: {pack.sensitivity.value if hasattr(pack.sensitivity, 'value') else pack.sensitivity}",
        f"item_count: {len(items)}",
        "items:",
    ]
    token_est = 0
    sensitive_count = 0
    for item in items:
        est = item.token_estimate or 200
        token_est += est
        mode = item.include_mode.value if hasattr(item.include_mode, "value") else str(item.include_mode)
        itype = item.item_type.value if hasattr(item.item_type, "value") else str(item.item_type)
        manifest_lines.append(f"  - type: {itype}, id: {item.item_id}, include_mode: {mode}")

    pack_sensitivity = pack.sensitivity.value if hasattr(pack.sensitivity, "value") else str(pack.sensitivity)
    if pack_sensitivity in ("work_sensitive", "client_sensitive", "restricted"):
        sensitive_count = len(items)

    return ContextPackPreview(
        pack_id=packId,
        token_estimate=token_est,
        manifest_yaml="\n".join(manifest_lines),
        sensitive_item_count=sensitive_count if sensitive_count else None,
        warnings=["Preview only — no external model calls."],
    )


@router.post("/context-packs/{packId}/publish", response_model=ContextPack)
def publish_context_pack(packId: str, data: ContextPackPublishRequest) -> ContextPack:
    """Publish a context pack."""
    repo = _get_repo()
    pack = repo.get(packId)
    if pack is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]

    # Check current status — cannot re-publish an archived pack
    pack_status = pack.status.value if hasattr(pack.status, "value") else str(pack.status)
    if pack_status == ContextPackStatus.archived.value:
        return conflict("Cannot publish an archived context pack.")  # type: ignore[return-value]

    # Policy check for sensitive packs
    policy_svc = get_policy_service()
    policy = policy_svc.evaluate_generic(
        resource_type="context_pack",
        resource_id=packId,
        action="publish",
        context={"sensitivity": pack.sensitivity.value if hasattr(pack.sensitivity, "value") else str(pack.sensitivity)},
    )
    if policy.decision == "deny":
        return forbidden(policy.reason or "Policy denied.")  # type: ignore[return-value]

    updated = repo.update_status(packId, ContextPackStatus.published.value)
    if updated is None:
        return not_found(f"Context pack '{packId}' not found.")  # type: ignore[return-value]

    # Audit
    AuditService(get_settings().registry_dir).emit(
        "context_pack_published",  # type: ignore[arg-type]
        "context_pack",
        packId,
        project_id=pack.project_id,
        payload={"destination": data.destination.value, "output_path": data.output_path},
    )
    return updated


# ---------------------------------------------------------------------------
# Create from IntentTree node
# ---------------------------------------------------------------------------


@router.post("/context-packs/from-node/{nodeId}", status_code=201, response_model=ContextPack)
def create_context_pack_from_node(
    nodeId: str,
    data: ContextPackFromNodeRequest,
) -> ContextPack:
    """Create a context pack scoped to an IntentTree node."""
    repo = _get_repo()
    settings = get_settings()

    pack_id = f"pack_{uuid.uuid4().hex[:16]}"
    create_data = ContextPackCreate(
        title=data.title or f"Context pack for node {nodeId}",
        target_type="intenttree_node",  # type: ignore[arg-type]
        target_id=nodeId,
        audience=data.audience,
        sensitivity=data.sensitivity,
        instructions=data.instructions,
        items=None,
    )
    pack = repo.create(pack_id, data.project_id, create_data)

    # Collect assets linked to this node from the asset links (scan all assets)
    from app.repositories.assets import AssetRepository
    from app.repositories.jsonl import read_where
    asset_repo = AssetRepository(settings.registry_dir)
    # Filter links by target_type and target_id
    all_link_records = read_where(
        asset_repo._links_path,
        lambda r: r.get("target_type") == "intenttree_node" and r.get("target_id") == nodeId,
    )
    from app.models.asset import AssetLink
    links = [AssetLink.model_validate(r) for r in all_link_records]

    for idx, link in enumerate(links):
        item_id = f"item_{uuid.uuid4().hex[:12]}"
        repo.add_item(
            item_id,
            pack_id,
            ContextPackItemCreate(
                item_type=ContextPackItemType.asset,
                item_id=link.asset_id,
                include_mode=IncludeMode.metadata,
                display_order=idx,
                required=False,
            ),
        )

    AuditService(settings.registry_dir).emit(
        "context_pack_created",  # type: ignore[arg-type]
        "context_pack",
        pack_id,
        project_id=data.project_id,
        payload={"from_node": nodeId, "items_added": len(links)},
    )
    return pack
