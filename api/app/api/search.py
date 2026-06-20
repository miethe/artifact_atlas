"""Search router.

Routes:
  GET  /api/search
  POST /api/search/semantic
  POST /api/search/similar-assets
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import get_asset_service, not_found
from app.models.search import SearchRequest, SearchResult
from app.models.vocabulary import AssetStatus, Sensitivity, SourceKind

router = APIRouter(prefix="/api", tags=["search"])


def _asset_to_result(asset, score: float = 1.0) -> SearchResult:
    return SearchResult(
        asset_id=asset.id,
        title=asset.title,
        status=asset.status,
        sensitivity=asset.sensitivity,
        agent_access=asset.agent_access,
        source_kind=asset.source_kind,
        artifact_type_id=asset.artifact_type_id,
        project_id=asset.project_id,
        score=score,
    )


@router.get("/search")
def search_assets(
    q: Annotated[str, Query()],
    project_id: Annotated[str | None, Query()] = None,
    status: Annotated[list[AssetStatus] | None, Query()] = None,
    source_kind: Annotated[list[SourceKind] | None, Query()] = None,
    sensitivity: Annotated[list[Sensitivity] | None, Query()] = None,
    artifact_type: Annotated[list[str] | None, Query()] = None,
    intenttree_node_id: Annotated[str | None, Query()] = None,
    bom_slot_id: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    include: Annotated[list[str] | None, Query()] = None,
) -> dict:
    """Keyword/metadata search across assets."""
    svc = get_asset_service()

    status_filter = [s.value for s in status] if status else None
    sensitivity_filter = [s.value for s in sensitivity] if sensitivity else None
    source_kind_filter = [sk.value for sk in source_kind] if source_kind else None
    artifact_type_filter = list(artifact_type) if artifact_type else None

    assets = svc.search_assets(
        project_id=project_id,
        query=q,
        status_filter=status_filter,
        sensitivity_filter=sensitivity_filter,
        source_kind_filter=source_kind_filter,
        artifact_type_filter=artifact_type_filter,
        limit=limit,
    )

    results = [_asset_to_result(a, score=1.0).model_dump(mode="json") for a in assets]
    return {"results": results, "total": len(results)}


@router.post("/search/semantic")
def semantic_search(data: SearchRequest) -> dict:
    """Semantic similarity search (falls back to keyword search in MVP)."""
    svc = get_asset_service()

    filters = data.filters
    status_filter = [s.value for s in filters.status] if filters and filters.status else None
    sensitivity_filter = [s.value for s in filters.sensitivity] if filters and filters.sensitivity else None
    source_kind_filter = [sk.value for sk in filters.source_kind] if filters and filters.source_kind else None
    artifact_type_filter = list(filters.artifact_type) if filters and filters.artifact_type else None

    assets = svc.search_assets(
        project_id=data.project_id,
        query=data.query,
        status_filter=status_filter,
        sensitivity_filter=sensitivity_filter,
        source_kind_filter=source_kind_filter,
        artifact_type_filter=artifact_type_filter,
        limit=data.limit,
    )

    results = [_asset_to_result(a, score=1.0).model_dump(mode="json") for a in assets]
    return {"results": results, "total": len(results)}


@router.post("/search/similar-assets")
def find_similar_assets(body: dict) -> dict:
    """Find assets similar to a given asset (by title keyword fallback)."""
    asset_id = body.get("asset_id", "")
    limit = int(body.get("limit", 10))

    svc = get_asset_service()
    source = svc.get_asset(asset_id)
    if source is None:
        return not_found(f"Asset '{asset_id}' not found.")  # type: ignore[return-value]

    # Local heuristic: search by title keywords
    keywords = source.title.split()[:3]
    query = " ".join(keywords)
    assets = svc.search_assets(query=query, limit=limit + 1)
    # Exclude the source asset
    similar = [a for a in assets if a.id != asset_id][:limit]

    results = [_asset_to_result(a, score=0.8).model_dump(mode="json") for a in similar]
    return {"results": results}
