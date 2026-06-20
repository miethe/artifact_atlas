"""Templates router.

Routes:
  GET    /api/templates
  POST   /api/templates
  GET    /api/templates/{templateId}
  PATCH  /api/templates/{templateId}
  POST   /api/templates/{templateId}/duplicate
  GET    /api/templates/{templateId}/preview
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query

from app.api._deps import apply_cursor_page, not_found
from app.models.template import (
    Template,
    TemplateCreate,
    TemplateDetail,
    TemplatePreview,
    TemplateUpdate,
)
from app.models.vocabulary import TemplateStatus, TemplateType
from app.repositories.templates import TemplateRepository
from app.settings import get_settings

router = APIRouter(prefix="/api", tags=["templates"])


def _get_repo() -> TemplateRepository:
    settings = get_settings()
    from pathlib import Path
    templates_dir = Path(__file__).resolve().parents[4] / "templates"
    return TemplateRepository(settings.registry_dir, templates_dir=templates_dir if templates_dir.exists() else None)


@router.get("/templates")
def list_templates(
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    status: Annotated[TemplateStatus | None, Query()] = None,
    template_type: Annotated[TemplateType | None, Query()] = None,
) -> dict:
    """List artifact templates."""
    repo = _get_repo()
    templates = repo.list()

    if status is not None:
        sv = status.value
        templates = [t for t in templates if (
            t.status.value if hasattr(t.status, "value") else str(t.status)
        ) == sv]

    if template_type is not None:
        tv = template_type.value
        templates = [t for t in templates if (
            t.template_type.value if hasattr(t.template_type, "value") else str(t.template_type)
        ) == tv]

    return apply_cursor_page(templates, cursor=cursor, limit=limit)


@router.post("/templates", status_code=201, response_model=Template)
def create_template(data: TemplateCreate) -> Template:
    """Create a new artifact template."""
    repo = _get_repo()
    template_id = f"tmpl_{uuid.uuid4().hex[:16]}"
    return repo.create(template_id, data)


@router.get("/templates/{templateId}", response_model=TemplateDetail)
def get_template(templateId: str) -> TemplateDetail:
    """Get a single template with domains and slots."""
    repo = _get_repo()
    detail = repo.get_detail(templateId)
    if detail is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]
    return detail


@router.patch("/templates/{templateId}", response_model=Template)
def update_template(templateId: str, data: TemplateUpdate) -> Template:
    """Partially update a template."""
    repo = _get_repo()
    updated = repo.update(templateId, data)
    if updated is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]
    return updated


@router.post("/templates/{templateId}/duplicate", status_code=201, response_model=Template)
def duplicate_template(templateId: str, body: dict | None = None) -> Template:
    """Duplicate a template."""
    repo = _get_repo()
    source = repo.get(templateId)
    if source is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]

    name = (body or {}).get("name") or f"Copy of {source.name}"
    new_id = f"tmpl_{uuid.uuid4().hex[:16]}"
    new_slug = f"{source.slug}-copy-{new_id[-6:]}"

    create_data = TemplateCreate(
        name=name,
        slug=new_slug,
        description=source.description,
        template_type=source.template_type,
        status=source.status,
        version=source.version,
        metadata=source.metadata,
    )
    return repo.create(new_id, create_data)


@router.get("/templates/{templateId}/preview", response_model=TemplatePreview)
def preview_template(templateId: str) -> TemplatePreview:
    """Preview the slot structure of a template."""
    repo = _get_repo()
    detail = repo.get_detail(templateId)
    if detail is None:
        return not_found(f"Template '{templateId}' not found.")  # type: ignore[return-value]

    domains = detail.domains or []
    total_slots = sum(len(d.slots or []) for d in domains)
    required_slots = sum(
        sum(1 for s in (d.slots or []) if s.required)
        for d in domains
    )

    return TemplatePreview(
        template_id=templateId,
        domains=domains,
        total_slots=total_slots,
        required_slots=required_slots,
    )
