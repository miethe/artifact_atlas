"""Cross-project delivery-report collection route."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Query

from app.api._deps import apply_cursor_page, get_report_service
from app.models.report import ReportPage

router = APIRouter(prefix="/api", tags=["reports"])


@router.get(
    "/reports",
    response_model=ReportPage,
)
def list_reports(
    project_id: Annotated[list[str] | None, Query()] = None,
    route: Annotated[list[str] | None, Query()] = None,
    truth_status: Annotated[list[str] | None, Query()] = None,
    tracker_node_id: Annotated[list[str] | None, Query()] = None,
    captured_after: Annotated[datetime | None, Query()] = None,
    captured_before: Annotated[datetime | None, Query()] = None,
    q: Annotated[str | None, Query()] = None,
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    include: Annotated[list[Literal["links"]] | None, Query()] = None,
) -> dict:
    """List delivery reports across projects with full-set facets.

    ``project_id=__unattributed__`` selects reports without a project, and
    ``tracker_node_id=__unlinked__`` selects reports with no tracker-node link.
    Actual persisted links are included by default.
    """
    items, facets = get_report_service().list_reports(
        project_ids=project_id,
        routes=route,
        truth_statuses=truth_status,
        tracker_node_ids=tracker_node_id,
        captured_after=captured_after,
        captured_before=captured_before,
        query=q,
        include_links=include is None or "links" in include,
    )
    page = apply_cursor_page(items, cursor=cursor, limit=limit)
    page["facets"] = facets.model_dump(mode="json")
    return page
