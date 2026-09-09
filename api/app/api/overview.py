"""Fleet snapshot ingest and persisted overview read routes."""

from fastapi import APIRouter, HTTPException

from app.api._deps import get_overview_service, not_found
from app.models.overview import FleetSnapshot, OverviewResponse

router = APIRouter(prefix="/api", tags=["overview"])


@router.put("/overview/snapshot", response_model=FleetSnapshot)
def put_overview_snapshot(snapshot: FleetSnapshot) -> FleetSnapshot:
    try:
        return get_overview_service().ingest(snapshot)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/overview", response_model=OverviewResponse)
def get_overview() -> OverviewResponse:
    overview = get_overview_service().get_overview()
    if overview is None:
        return not_found("No fleet snapshot has been collected yet.")
    return overview
