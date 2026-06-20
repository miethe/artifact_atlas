"""Templates router (BOM-BE-001, BOM-BE-002, BOM-BE-007).

Routes:
  GET    /api/templates
  POST   /api/templates
  GET    /api/templates/{templateId}
  PATCH  /api/templates/{templateId}
  POST   /api/templates/{templateId}/duplicate
  GET    /api/templates/{templateId}/preview
  POST   /api/templates/{templateId}/publish    (BOM-BE-007: explicit publish gate)
  GET    /api/templates/{templateId}/impact     (BOM-BE-002: project readiness preview)
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import apply_cursor_page, conflict, not_found
from app.models.template import (
    Template,
    TemplateCreate,
    TemplateDetail,
    TemplatePreview,
    TemplateUpdate,
)
from app.models.vocabulary import TemplateStatus, TemplateType
from app.services.templates_service import TemplateService
from app.settings import get_settings

router = APIRouter(prefix="/api", tags=["templates"])


def _get_service() -> TemplateService:
    settings = get_settings()
    from pathlib import Path
    # api/app/api/templates.py -> parents[3] = repo root
    templates_dir = Path(__file__).resolve().parents[3] / "templates"
    return TemplateService(
        settings.registry_dir,
        templates_dir=templates_dir if templates_dir.exists() else None,
    )


# ---------------------------------------------------------------------------
# List / Create
# ---------------------------------------------------------------------------


@router.get("/templates")
def list_templates(
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    status: Annotated[TemplateStatus | None, Query()] = None,
    template_type: Annotated[TemplateType | None, Query()] = None,
) -> dict:
    """List artifact templates with optional filtering."""
    svc = _get_service()
    templates = svc.list_templates(
        status=status,
        template_type=template_type.value if template_type is not None else None,
    )
    return apply_cursor_page(templates, cursor=cursor, limit=limit)


@router.post("/templates", status_code=201, response_model=Template)
def create_template(data: TemplateCreate) -> Template:
    """Create a new artifact template (saved as draft/experimental).

    Publishing is a separate explicit action (POST /api/templates/{id}/publish).
    """
    svc = _get_service()
    template_id = f"tmpl_{uuid.uuid4().hex[:16]}"
    return svc.create_draft(data, template_id)


# ---------------------------------------------------------------------------
# Single template CRUD
# ---------------------------------------------------------------------------


@router.get("/templates/{templateId}", response_model=TemplateDetail)
def get_template(templateId: str) -> TemplateDetail:
    """Get a single template with domains and slots."""
    svc = _get_service()
    detail = svc.get_template_detail(templateId)
    if detail is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]
    return detail


@router.patch("/templates/{templateId}", response_model=Template)
def update_template(templateId: str, data: TemplateUpdate) -> Template:
    """Partially update a template (name, description, status, version, metadata)."""
    svc = _get_service()
    updated = svc.update_template(templateId, data)
    if updated is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]
    return updated


@router.post("/templates/{templateId}/duplicate", status_code=201, response_model=Template)
def duplicate_template(templateId: str, body: dict | None = None) -> Template:
    """Duplicate a template as a new draft (experimental status)."""
    svc = _get_service()
    name = (body or {}).get("name")
    duplicate = svc.duplicate_template(templateId, name=name)
    if duplicate is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]
    return duplicate


# ---------------------------------------------------------------------------
# Preview (BOM-BE-002)
# ---------------------------------------------------------------------------


@router.get("/templates/{templateId}/preview", response_model=TemplatePreview)
def preview_template(templateId: str) -> TemplatePreview:
    """Preview the slot structure of a template with domain/slot/required counts.

    Returns domains, artifact types, total slot count, and required slot count
    without applying to any project.
    """
    svc = _get_service()
    preview = svc.build_preview(templateId)
    if preview is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]
    return preview


@router.get("/templates/{templateId}/impact")
def template_impact(templateId: str, project_id: Annotated[str, Query()]) -> dict:
    """Return impact preview for applying a template to a specific project.

    Shows how many slots would be added vs. would conflict with existing BOM slots,
    allowing the UI to show a merge preview before the user confirms.

    Query params:
        project_id: The project to check impact against.
    """
    svc = _get_service()
    impact = svc.build_impact_preview(templateId, project_id)
    if impact is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]

    return {
        "template_id": impact.template_id,
        "template_name": impact.template_name,
        "total_slots": impact.total_slots,
        "required_slots": impact.required_slots,
        "optional_slots": impact.optional_slots,
        "new_slots": impact.new_slots,
        "conflict_slots": impact.conflict_slots,
        "conflict_details": impact.conflict_details,
    }


# ---------------------------------------------------------------------------
# Explicit publish gate (BOM-BE-007)
# ---------------------------------------------------------------------------


@router.post("/templates/{templateId}/publish", response_model=Template)
def publish_template(templateId: str) -> Template:
    """Explicitly publish a draft (experimental) template.

    This is the REQUIRED gate before a custom template can be used in production
    BOMs. The endpoint transitions status from experimental -> recommended.

    If the template is already published (core/recommended/optional), returns
    the existing template unchanged (idempotent).
    """
    svc = _get_service()
    template = svc.get_template(templateId)
    if template is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]

    published = svc.publish_template(templateId)
    if published is None:
        return not_found(f"Template '{templateId}' not found after publish attempt.")  # type: ignore[return-value]
    return published
