"""Template repository: CRUD over registry/templates.jsonl + YAML template loading.

DATA-003 responsibilities:
- list/get/create/update + tombstone-delete for Template header records.
- Load the full Template (with TemplateDomain/TemplateSlot tree) from templates/*.yaml.
- Expose slot generation: given a template ID, produce BomSlot-shaped dicts
  ready for the BOM repository to persist.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.template import (
    Template,
    TemplateCreate,
    TemplateDetail,
    TemplateDomain,
    TemplateSlot,
    TemplateUpdate,
)
from app.repositories import jsonl as _jl

try:
    import yaml  # type: ignore[import-untyped]
    _YAML_AVAILABLE = True
except ImportError:  # pragma: no cover
    _YAML_AVAILABLE = False

logger = logging.getLogger(__name__)

_TEMPLATES_FILE = "templates.jsonl"


class TemplateRepository:
    """CRUD + YAML-loading operations for Template records.

    Args:
        registry_dir: Directory containing ``templates.jsonl``.
        templates_dir: Directory containing ``<slug>.yaml`` template definitions.
                       If None, YAML loading is disabled (headers-only mode).
    """

    def __init__(
        self,
        registry_dir: Path,
        templates_dir: Path | None = None,
    ) -> None:
        self._path = registry_dir / _TEMPLATES_FILE
        self._templates_dir = templates_dir

    # ------------------------------------------------------------------
    # Header CRUD (registry/templates.jsonl)
    # ------------------------------------------------------------------

    def list(self, *, include_deleted: bool = False) -> list[Template]:
        """Return all non-tombstoned template headers."""
        records = _jl.read_all(self._path, include_deleted=include_deleted)
        return [Template.model_validate(r) for r in records]

    def get(self, template_id: str) -> Template | None:
        """Return a single template header by ID."""
        record = _jl.read_by_id(self._path, template_id)
        if record is None:
            return None
        return Template.model_validate(record)

    def get_by_slug(self, slug: str) -> Template | None:
        """Return the first template header whose slug matches."""
        matches = _jl.read_where(self._path, lambda r: r.get("slug") == slug)
        if not matches:
            return None
        return Template.model_validate(matches[0])

    def create(self, template_id: str, data: TemplateCreate) -> Template:
        """Persist a new template header record."""
        now = datetime.now(tz=timezone.utc).isoformat()
        record: dict[str, Any] = {
            "id": template_id,
            **data.model_dump(mode="json", exclude_none=False),
            "created_at": now,
            "updated_at": now,
        }
        _jl.append_record(self._path, record)
        return Template.model_validate(record)

    def update(self, template_id: str, data: TemplateUpdate) -> Template | None:
        """Partially update a template header.  Preserves unknown fields."""
        patch: dict[str, Any] = {
            k: v
            for k, v in data.model_dump(mode="json").items()
            if v is not None
        }
        patch["updated_at"] = datetime.now(tz=timezone.utc).isoformat()
        updated = _jl.update_record(self._path, template_id, patch)
        if updated is None:
            return None
        return Template.model_validate(updated)

    def delete(self, template_id: str) -> bool:
        """Tombstone a template header.  Returns True if found."""
        result = _jl.tombstone_record(self._path, template_id)
        return result is not None

    # ------------------------------------------------------------------
    # YAML template loading (DATA-003)
    # ------------------------------------------------------------------

    def get_detail(self, template_id: str) -> TemplateDetail | None:
        """Return a TemplateDetail with embedded domains and slots.

        Merges the JSONL header with the YAML domain/slot tree.
        Falls back to a header-only TemplateDetail if no YAML is found.
        """
        header = self.get(template_id)
        if header is None:
            return None

        domains = self._load_yaml_domains(header.slug, template_id)
        return TemplateDetail(
            **header.model_dump(mode="python"),
            domains=domains if domains else None,
        )

    def get_detail_by_slug(self, slug: str) -> TemplateDetail | None:
        """Convenience: look up by slug and return TemplateDetail."""
        header = self.get_by_slug(slug)
        if header is None:
            return None
        domains = self._load_yaml_domains(slug, header.id)
        return TemplateDetail(
            **header.model_dump(mode="python"),
            domains=domains if domains else None,
        )

    def _load_yaml_domains(
        self, slug: str, template_id: str
    ) -> list[TemplateDomain] | None:
        """Load domain/slot tree from <templates_dir>/<slug>.yaml.

        Returns None if yaml is unavailable, the file does not exist, or
        parsing fails (error is logged as a warning).
        """
        if not _YAML_AVAILABLE:
            logger.debug("PyYAML not installed; skipping YAML template load for %s", slug)
            return None

        if self._templates_dir is None:
            return None

        yaml_path = self._templates_dir / f"{slug}.yaml"
        if not yaml_path.exists():
            logger.debug("No YAML template file at %s", yaml_path)
            return None

        try:
            with yaml_path.open("r", encoding="utf-8") as fh:
                data = yaml.safe_load(fh)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to parse YAML template %s: %s", yaml_path, exc)
            return None

        return _parse_yaml_domains(data, template_id)

    # ------------------------------------------------------------------
    # Slot generation (DATA-003)
    # ------------------------------------------------------------------

    def generate_bom_slots(
        self,
        template_id: str,
        bom_id: str,
    ) -> list[dict[str, Any]]:
        """Return BomSlot-shaped dicts for all slots in a template.

        Each returned dict is ready to be stored directly in bom_slots.jsonl via
        BomRepository.create_slot().  IDs are auto-generated (uuid hex).

        Returns an empty list if the template is not found or has no domains.
        """
        detail = self.get_detail(template_id)
        if detail is None or not detail.domains:
            return []

        slots: list[dict[str, Any]] = []
        for domain in detail.domains:
            if not domain.slots:
                continue
            for slot in domain.slots:
                slot_record: dict[str, Any] = {
                    "id": f"slot_{uuid.uuid4().hex[:12]}",
                    "bom_id": bom_id,
                    "artifact_type_id": slot.artifact_type_id,
                    "domain": domain.name,
                    "required": slot.required,
                    "status": "missing",
                    "min_assets": slot.min_assets,
                }
                if slot.phase is not None:
                    slot_record["phase"] = slot.phase
                if slot.max_assets is not None:
                    slot_record["max_assets"] = slot.max_assets
                if slot.staleness_days is not None:
                    slot_record["staleness_days"] = slot.staleness_days
                if slot.linked_intenttree_node_pattern is not None:
                    slot_record["linked_intenttree_node_pattern"] = (
                        slot.linked_intenttree_node_pattern
                    )
                slots.append(slot_record)

        return slots


# ---------------------------------------------------------------------------
# YAML parsing helpers
# ---------------------------------------------------------------------------


def _parse_yaml_domains(
    data: Any, template_id: str
) -> list[TemplateDomain]:
    """Parse raw YAML data into TemplateDomain objects.

    Supports the simplified template format used in templates/*.yaml:
    ```yaml
    template:
      id: ...
      name: ...
      domains:
        - name: Strategy
          slots:
            - artifact_type: PRD
              required: true
    ```
    """
    if not isinstance(data, dict):
        return []

    # Unwrap top-level 'template' key if present
    payload = data.get("template", data)

    raw_domains = payload.get("domains", [])
    if not isinstance(raw_domains, list):
        return []

    domains: list[TemplateDomain] = []
    for d_idx, raw_domain in enumerate(raw_domains):
        if not isinstance(raw_domain, dict):
            continue

        domain_name: str = raw_domain.get("name", f"domain_{d_idx}")
        domain_slug: str = raw_domain.get(
            "slug", domain_name.lower().replace(" ", "_")
        )
        domain_id = f"dom_{uuid.uuid4().hex[:8]}"
        description: str | None = raw_domain.get("description")
        display_order: int = raw_domain.get("display_order", d_idx)

        raw_slots: list[Any] = raw_domain.get("slots", [])
        slots: list[TemplateSlot] = []

        for s_idx, raw_slot in enumerate(raw_slots):
            if not isinstance(raw_slot, dict):
                continue

            # The YAML uses 'artifact_type' (human label) as the type ID in MVP.
            artifact_type_id: str = (
                raw_slot.get("artifact_type_id")
                or _slugify(raw_slot.get("artifact_type", f"artifact_{s_idx}"))
            )
            slot = TemplateSlot(
                id=f"tslot_{uuid.uuid4().hex[:8]}",
                template_id=template_id,
                domain_id=domain_id,
                artifact_type_id=artifact_type_id,
                phase=raw_slot.get("phase"),
                required=bool(raw_slot.get("required", True)),
                min_assets=int(raw_slot.get("min_assets", 1)),
                max_assets=raw_slot.get("max_assets"),
                staleness_days=raw_slot.get("staleness_days"),
                linked_intenttree_node_pattern=raw_slot.get(
                    "linked_intenttree_node_pattern"
                ),
                display_order=raw_slot.get("display_order", s_idx),
                rule_config=raw_slot.get("rule_config"),
            )
            slots.append(slot)

        domain = TemplateDomain(
            id=domain_id,
            template_id=template_id,
            name=domain_name,
            slug=domain_slug,
            description=description,
            display_order=display_order,
            slots=slots if slots else None,
        )
        domains.append(domain)

    return domains


def _slugify(text: str) -> str:
    """Convert human-readable artifact type names to slug-style IDs."""
    return text.lower().replace(" ", "_").replace("/", "_").replace("-", "_")
