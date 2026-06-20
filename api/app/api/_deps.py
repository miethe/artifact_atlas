"""Shared FastAPI dependencies and helpers for route handlers."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse

from app.services.assets import AssetService
from app.services.audit import AuditService
from app.services.coverage import calculate_coverage
from app.services.policy import PolicyService
from app.services.projects import ProjectService
from app.settings import get_settings


# ---------------------------------------------------------------------------
# Service factories (one per request — stateless for local-first JSONL backend)
# ---------------------------------------------------------------------------


def get_asset_service() -> AssetService:
    settings = get_settings()
    return AssetService(settings.registry_dir, audit_service=get_audit_service())


def get_project_service() -> ProjectService:
    settings = get_settings()
    return ProjectService(settings.registry_dir, audit_service=get_audit_service())


def get_audit_service() -> AuditService:
    settings = get_settings()
    from app.services.ccdash_client import CCDashClient
    ccdash = CCDashClient(
        events_path=settings.ccdash_events_path,
        workspace_id=settings.workspace_id,
    )
    return AuditService(settings.registry_dir, ccdash_client=ccdash)


def get_policy_service() -> PolicyService:
    settings = get_settings()
    return PolicyService(
        agent_full_content_sensitivity_cap=settings.agent_full_content_sensitivity_cap,
        automated_promotion_allowed=settings.automated_promotion_allowed,
    )


# ---------------------------------------------------------------------------
# Cursor pagination helpers
# ---------------------------------------------------------------------------


def apply_cursor_page(
    items: list[Any],
    *,
    cursor: str | None,
    limit: int,
) -> dict[str, Any]:
    """Apply cursor-based pagination to a list of dicts or Pydantic models.

    Items are assumed pre-filtered and pre-sorted by the caller.
    The cursor encodes the starting index as a base-10 integer string.

    Returns a CursorPage-shaped dict ready to be JSON-serialised.
    """
    start = 0
    if cursor:
        try:
            start = int(cursor)
        except ValueError:
            start = 0

    page = items[start : start + limit]
    has_more = (start + limit) < len(items)
    next_cursor = str(start + limit) if has_more else None

    # Serialise Pydantic models
    serialised = []
    for item in page:
        if hasattr(item, "model_dump"):
            serialised.append(item.model_dump(mode="json"))
        else:
            serialised.append(item)

    return {
        "items": serialised,
        "has_more": has_more,
        "next_cursor": next_cursor,
        "total": len(items),
    }


# ---------------------------------------------------------------------------
# Error response helpers
# ---------------------------------------------------------------------------


def _request_id() -> str:
    return f"req_{uuid.uuid4().hex[:12]}"


def not_found(message: str = "The requested resource was not found.") -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"error": {"code": "not_found", "message": message, "request_id": _request_id()}},
    )


def forbidden(message: str = "Access denied by policy.") -> JSONResponse:
    return JSONResponse(
        status_code=403,
        content={"error": {"code": "policy_denied", "message": message, "request_id": _request_id()}},
    )


def conflict(message: str = "Conflict with current resource state.") -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"error": {"code": "conflict", "message": message, "request_id": _request_id()}},
    )


def internal_error(message: str = "Internal server error.") -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal_error", "message": message, "request_id": _request_id()}},
    )
