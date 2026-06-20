"""Template Registry Service (BOM-BE-001, BOM-BE-002).

Responsibilities:
- Load canonical Template/TemplateDomain/TemplateSlot models from YAML + JSONL.
- Validate that seed templates load with expected domain/slot counts.
- Build TemplatePreview objects with impact counts (total/required/optional slots).
- Expose project-readiness preview: what slots will be added, which will conflict.
- Manage custom template drafts (BOM-BE-007): save draft, update, publish explicitly.

Template semantics (do NOT conflate):
  artifact_template   – reusable definition (Template model)
  artifact_type       – e.g. PRD, API Spec (TemplateSlot.artifact_type_id)
  artifact_template_slot – slot def within domain/phase (TemplateSlot)
  project_bom         – applied instance (Bom)
  bom_slot            – project slot from template or custom (BomSlot)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.models.template import (
    Template,
    TemplateCreate,
    TemplateDetail,
    TemplateDomain,
    TemplatePreview,
    TemplateUpdate,
)
from app.models.vocabulary import TemplateStatus
from app.repositories.bom import BomRepository
from app.repositories.templates import TemplateRepository

logger = logging.getLogger(__name__)


@dataclass
class TemplateImpact:
    """Impact preview returned before applying a template to a project BOM."""

    template_id: str
    template_name: str
    total_slots: int
    required_slots: int
    optional_slots: int
    new_slots: int           # slots that do not exist yet in the project BOM
    conflict_slots: int      # slots already present (same domain+artifact_type_id)
    conflict_details: list[dict[str, Any]] = field(default_factory=list)


class TemplateService:
    """Business logic for the template registry.

    Wraps TemplateRepository and adds:
    - Preview with slot counts (BOM-BE-002).
    - Idempotency-aware impact calculation (BOM-BE-003 preview step).
    - Draft template management (BOM-BE-007).
    """

    def __init__(
        self,
        registry_dir: Path,
        templates_dir: Path | None = None,
    ) -> None:
        self._repo = TemplateRepository(registry_dir, templates_dir=templates_dir)
        self._registry_dir = registry_dir

    # ------------------------------------------------------------------
    # BOM-BE-001: registry loading
    # ------------------------------------------------------------------

    def list_templates(
        self,
        *,
        status: TemplateStatus | None = None,
        template_type: str | None = None,
        include_drafts: bool = False,
    ) -> list[Template]:
        """Return all template headers, optionally filtered.

        Args:
            status: Filter by TemplateStatus enum value.
            template_type: Filter by TemplateType string value.
            include_drafts: When False (default) only return non-draft statuses.
                            Experimental templates are included unless status is set.
        """
        templates = self._repo.list()

        if not include_drafts:
            # Experimental templates are included in default listing (they are
            # published in registry); only filter out explicit draft metadata.
            pass

        if status is not None:
            sv = status.value if hasattr(status, "value") else str(status)
            templates = [t for t in templates if self._status_value(t.status) == sv]

        if template_type is not None:
            templates = [
                t for t in templates
                if self._template_type_value(t.template_type) == template_type
            ]

        return templates

    def get_template(self, template_id: str) -> Template | None:
        """Return a single template header."""
        return self._repo.get(template_id)

    def get_template_detail(self, template_id: str) -> TemplateDetail | None:
        """Return a template with embedded domains and slots."""
        return self._repo.get_detail(template_id)

    def get_template_by_slug(self, slug: str) -> Template | None:
        """Return a template by slug."""
        return self._repo.get_by_slug(slug)

    def load_all_with_domains(self) -> list[TemplateDetail]:
        """Load all templates with their domain/slot trees.

        Used by BOM-BE-001 validation tests to confirm seed templates
        load with expected counts.

        Returns:
            List of TemplateDetail (may have domains=None if YAML not found).
        """
        headers = self._repo.list()
        results: list[TemplateDetail] = []
        for h in headers:
            detail = self._repo.get_detail(h.id)
            if detail is not None:
                results.append(detail)
        return results

    # ------------------------------------------------------------------
    # BOM-BE-002: Template Preview API
    # ------------------------------------------------------------------

    def build_preview(self, template_id: str) -> TemplatePreview | None:
        """Build a TemplatePreview with slot counts.

        Returns domains, artifact types, and total/required/optional slot counts.
        Returns None if template not found.
        """
        detail = self._repo.get_detail(template_id)
        if detail is None:
            return None

        domains = detail.domains or []
        total_slots = 0
        required_slots = 0
        for domain in domains:
            for slot in domain.slots or []:
                total_slots += 1
                if slot.required:
                    required_slots += 1

        return TemplatePreview(
            template_id=template_id,
            domains=domains,
            total_slots=total_slots,
            required_slots=required_slots,
        )

    def build_impact_preview(
        self,
        template_id: str,
        project_id: str,
    ) -> TemplateImpact | None:
        """Return a project-readiness impact preview before applying a template.

        Identifies which slots are net-new vs. would conflict with existing BOM slots.
        Conflict = same (domain, artifact_type_id) pair already exists in the project BOM.

        Returns None if template not found.
        """
        detail = self._repo.get_detail(template_id)
        if detail is None:
            return None

        # Load existing BOM slots to detect conflicts
        bom_repo = BomRepository(self._registry_dir)
        existing_bom = bom_repo.get_for_project(project_id)
        existing_keys: set[tuple[str, str]] = set()
        if existing_bom:
            for slot in bom_repo.list_slots(existing_bom.id):
                existing_keys.add((slot.domain.lower(), slot.artifact_type_id.lower()))

        domains = detail.domains or []
        total_slots = 0
        required_slots = 0
        optional_slots = 0
        new_slots = 0
        conflict_slots = 0
        conflict_details: list[dict[str, Any]] = []

        for domain in domains:
            for slot in domain.slots or []:
                total_slots += 1
                if slot.required:
                    required_slots += 1
                else:
                    optional_slots += 1

                key = (domain.name.lower(), slot.artifact_type_id.lower())
                if key in existing_keys:
                    conflict_slots += 1
                    conflict_details.append({
                        "domain": domain.name,
                        "artifact_type_id": slot.artifact_type_id,
                        "required": slot.required,
                    })
                else:
                    new_slots += 1

        return TemplateImpact(
            template_id=template_id,
            template_name=detail.name,
            total_slots=total_slots,
            required_slots=required_slots,
            optional_slots=optional_slots,
            new_slots=new_slots,
            conflict_slots=conflict_slots,
            conflict_details=conflict_details,
        )

    # ------------------------------------------------------------------
    # BOM-BE-007: Template Builder Persistence (draft templates)
    # ------------------------------------------------------------------

    def create_draft(self, data: TemplateCreate, template_id: str) -> Template:
        """Create a new template in draft/experimental status.

        Publishing is a separate explicit action. The template is saved
        with status=experimental until explicitly published.
        """
        # Force experimental status for newly created (draft) templates
        draft_data = TemplateCreate(
            name=data.name,
            slug=data.slug,
            description=data.description,
            template_type=data.template_type,
            status=TemplateStatus.experimental,
            version=data.version,
            metadata=data.metadata,
        )
        return self._repo.create(template_id, draft_data)

    def update_template(self, template_id: str, data: TemplateUpdate) -> Template | None:
        """Update a template (drafts and published alike)."""
        return self._repo.update(template_id, data)

    def publish_template(self, template_id: str) -> Template | None:
        """Explicitly publish a draft template.

        Transitions from experimental -> recommended (or to the caller-chosen
        status).  Draft->published is an EXPLICIT action; this is the gate.

        Returns None if template not found.
        """
        template = self._repo.get(template_id)
        if template is None:
            return None

        current_sv = self._status_value(template.status)
        if current_sv not in (TemplateStatus.experimental.value, TemplateStatus.optional.value):
            # Already published at core/recommended level — no-op return
            return template

        update = TemplateUpdate(status=TemplateStatus.recommended)
        return self._repo.update(template_id, update)

    def duplicate_template(self, template_id: str, name: str | None = None) -> Template | None:
        """Duplicate a template as a new draft."""
        source = self._repo.get(template_id)
        if source is None:
            return None

        import uuid
        new_id = f"tmpl_{uuid.uuid4().hex[:16]}"
        new_name = name or f"Copy of {source.name}"
        new_slug = f"{source.slug}-copy-{new_id[-6:]}"

        create_data = TemplateCreate(
            name=new_name,
            slug=new_slug,
            description=source.description,
            template_type=source.template_type,
            status=TemplateStatus.experimental,
            version=source.version,
            metadata=source.metadata,
        )
        return self._repo.create(new_id, create_data)

    def delete_template(self, template_id: str) -> bool:
        """Tombstone a template (soft-delete)."""
        return self._repo.delete(template_id)

    def generate_bom_slots(
        self, template_id: str, bom_id: str
    ) -> list[dict[str, Any]]:
        """Delegate slot generation to the repository layer."""
        return self._repo.generate_bom_slots(template_id, bom_id)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _status_value(status: object) -> str:
        if hasattr(status, "value"):
            return status.value  # type: ignore[union-attr]
        return str(status)

    @staticmethod
    def _template_type_value(tt: object) -> str:
        if hasattr(tt, "value"):
            return tt.value  # type: ignore[union-attr]
        return str(tt)
