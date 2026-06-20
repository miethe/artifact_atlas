"""Audit router.

Routes:
  GET /api/audit/events
  GET /api/agents/access-log
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import apply_cursor_page, get_audit_service
from app.models.vocabulary import AuditEventType

router = APIRouter(prefix="/api", tags=["audit"])

# Agent-related event types for the access log
_AGENT_EVENT_TYPES = {
    AuditEventType.agent_query.value,
    AuditEventType.policy_denied.value,
}


@router.get("/audit/events")
def list_audit_events(
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    project_id: Annotated[str | None, Query()] = None,
    event_type: Annotated[list[AuditEventType] | None, Query()] = None,
    actor_type: Annotated[str | None, Query()] = None,
    target_type: Annotated[str | None, Query()] = None,
    from_: Annotated[datetime | None, Query(alias="from")] = None,
    to: Annotated[datetime | None, Query()] = None,
) -> dict:
    """List atlas audit events with cursor pagination."""
    svc = get_audit_service()

    # Fetch with primary filters
    event_type_str = event_type[0].value if event_type and len(event_type) == 1 else None
    events = svc.list_events(
        project_id=project_id,
        event_type=event_type_str,
        since=from_,
    )

    # Secondary in-memory filters
    if event_type and len(event_type) > 1:
        ev_set = {et.value for et in event_type}
        events = [e for e in events if (
            e.event_type.value if hasattr(e.event_type, "value") else str(e.event_type)
        ) in ev_set]

    if actor_type is not None:
        events = [e for e in events if (
            e.actor_type.value if hasattr(e.actor_type, "value") else str(e.actor_type)
        ) == actor_type]

    if target_type is not None:
        events = [e for e in events if e.target_type == target_type]

    if to is not None:
        to_iso = to.isoformat()
        events = [e for e in events if e.timestamp.isoformat() <= to_iso]

    return apply_cursor_page(events, cursor=cursor, limit=limit)


@router.get("/agents/access-log")
def list_agent_access_log(
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    project_id: Annotated[str | None, Query()] = None,
    agent_id: Annotated[str | None, Query()] = None,
    from_: Annotated[datetime | None, Query(alias="from")] = None,
    to: Annotated[datetime | None, Query()] = None,
) -> dict:
    """List agent asset access events (subset of audit log)."""
    svc = get_audit_service()
    events = svc.list_events(
        project_id=project_id,
        actor_id=agent_id,
        since=from_,
    )

    # Filter to agent-relevant events
    events = [e for e in events if (
        (e.actor_type.value if hasattr(e.actor_type, "value") else str(e.actor_type)) == "agent"
        or (e.event_type.value if hasattr(e.event_type, "value") else str(e.event_type)) in _AGENT_EVENT_TYPES
    )]

    if to is not None:
        to_iso = to.isoformat()
        events = [e for e in events if e.timestamp.isoformat() <= to_iso]

    return apply_cursor_page(events, cursor=cursor, limit=limit)
