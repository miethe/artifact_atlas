"""DATA-004: Registry validation for JSONL, YAML template, and context-pack export files.

Validates:
- registry/*.jsonl files: well-formed JSON, dict records, required fields present.
- templates/*.yaml files: parseable YAML, required top-level keys present,
  domain/slot structure valid.
- exports/context-packs/*.yaml files: parseable YAML, required manifest keys present.

Usage as a library::

    from app.repositories.registry_validation import validate_registry
    errors = validate_registry(registry_dir, templates_dir, context_packs_dir)

Usage as a CLI::

    python -m app.repositories.registry_validation [--registry-dir ...] [--templates-dir ...]
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

try:
    import yaml  # type: ignore[import-untyped]
    _YAML_AVAILABLE = True
except ImportError:  # pragma: no cover
    _YAML_AVAILABLE = False

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Known JSONL files and their required fields
# ---------------------------------------------------------------------------

_JSONL_SCHEMA: dict[str, list[str]] = {
    "projects.jsonl": ["id", "name", "slug", "status"],
    "assets.jsonl": ["id", "title", "source_kind", "uri", "status", "sensitivity", "agent_access"],
    "bom.jsonl": ["id", "project_id", "name", "status"],
    "templates.jsonl": ["id", "name", "slug", "template_type", "status", "version"],
    # Optional / generated files — validate format if present, no required fields enforced
    "context_packs.jsonl": ["id", "project_id", "title", "status"],
    "bom_slots.jsonl": ["id", "bom_id", "artifact_type_id", "domain", "required", "status"],
    "bom_assignments.jsonl": ["id", "slot_id", "asset_id", "assignment_status", "assigned_by"],
    "asset_links.jsonl": ["id", "asset_id", "target_type", "target_id", "relationship"],
    "asset_relationships.jsonl": ["id", "source_asset_id", "target_asset_id", "relationship_type"],
    "context_pack_items.jsonl": ["id", "context_pack_id", "item_type", "item_id", "include_mode"],
}

# Files that are required to exist in a healthy registry
_REQUIRED_JSONL = {"projects.jsonl", "assets.jsonl", "bom.jsonl", "templates.jsonl"}


# ---------------------------------------------------------------------------
# JSONL validation
# ---------------------------------------------------------------------------


def validate_jsonl_file(
    path: Path,
    required_fields: list[str] | None = None,
) -> list[str]:
    """Validate a single JSONL file; return list of error strings."""
    errors: list[str] = []

    if not path.exists():
        errors.append(f"File not found: {path}")
        return errors

    for lineno, raw in _iter_lines(path):
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError as exc:
            errors.append(f"{path.name}:{lineno}: malformed JSON: {exc}")
            continue

        if not isinstance(obj, dict):
            errors.append(
                f"{path.name}:{lineno}: expected JSON object, got {type(obj).__name__}"
            )
            continue

        if required_fields:
            for field in required_fields:
                val = obj.get(field)
                if val is None or val == "" or val == [] or val == {}:
                    errors.append(
                        f"{path.name}:{lineno}: missing/empty required field '{field}'"
                        f" (id={obj.get('id', '<no-id>')})"
                    )

    return errors


def validate_registry_jsonl(registry_dir: Path) -> list[str]:
    """Validate all known JSONL files in the registry directory."""
    errors: list[str] = []

    # Check required files exist
    for filename in _REQUIRED_JSONL:
        path = registry_dir / filename
        if not path.exists():
            errors.append(f"Required registry file missing: {path}")

    # Validate all known files that are present
    for filename, required_fields in _JSONL_SCHEMA.items():
        path = registry_dir / filename
        if path.exists():
            file_errors = validate_jsonl_file(path, required_fields)
            errors.extend(file_errors)

    # Also validate any unexpected JSONL files (format check only)
    for path in registry_dir.glob("*.jsonl"):
        if path.name not in _JSONL_SCHEMA:
            file_errors = validate_jsonl_file(path, required_fields=None)
            errors.extend(file_errors)

    return errors


# ---------------------------------------------------------------------------
# YAML template validation
# ---------------------------------------------------------------------------


def validate_template_yaml(path: Path) -> list[str]:
    """Validate a single template YAML file."""
    errors: list[str] = []

    if not _YAML_AVAILABLE:
        logger.debug("PyYAML not installed; skipping YAML validation for %s", path)
        return errors

    if not path.exists():
        errors.append(f"Template file not found: {path}")
        return errors

    try:
        with path.open("r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{path.name}: YAML parse error: {exc}")
        return errors

    if not isinstance(data, dict):
        errors.append(f"{path.name}: top-level value is not a mapping (got {type(data).__name__})")
        return errors

    # Unwrap top-level 'template' key
    payload: dict[str, Any] = data.get("template", data)

    # Required fields in template YAML
    for field in ("id", "name"):
        if not payload.get(field):
            errors.append(f"{path.name}: missing required field 'template.{field}'")

    # Validate domains structure
    raw_domains = payload.get("domains", [])
    if not isinstance(raw_domains, list):
        errors.append(f"{path.name}: 'template.domains' must be a list")
        return errors

    if not raw_domains:
        errors.append(f"{path.name}: 'template.domains' is empty — template has no slots")

    for d_idx, domain in enumerate(raw_domains):
        if not isinstance(domain, dict):
            errors.append(f"{path.name}: domain[{d_idx}] is not a mapping")
            continue
        if not domain.get("name"):
            errors.append(f"{path.name}: domain[{d_idx}] missing 'name'")

        raw_slots = domain.get("slots", [])
        if not isinstance(raw_slots, list):
            errors.append(f"{path.name}: domain[{d_idx}].slots must be a list")
            continue
        for s_idx, slot in enumerate(raw_slots):
            if not isinstance(slot, dict):
                errors.append(
                    f"{path.name}: domain[{d_idx}].slots[{s_idx}] is not a mapping"
                )
                continue
            has_type = slot.get("artifact_type") or slot.get("artifact_type_id")
            if not has_type:
                errors.append(
                    f"{path.name}: domain[{d_idx}].slots[{s_idx}] missing "
                    f"'artifact_type' or 'artifact_type_id'"
                )

    return errors


def validate_templates_dir(templates_dir: Path) -> list[str]:
    """Validate all *.yaml files in the templates directory."""
    errors: list[str] = []

    if not templates_dir.exists():
        errors.append(f"Templates directory not found: {templates_dir}")
        return errors

    yaml_files = list(templates_dir.glob("*.yaml"))
    if not yaml_files:
        logger.debug("No YAML template files found in %s", templates_dir)
        return errors

    for path in yaml_files:
        errors.extend(validate_template_yaml(path))

    return errors


# ---------------------------------------------------------------------------
# Context-pack export YAML validation
# ---------------------------------------------------------------------------


def validate_context_pack_yaml(path: Path) -> list[str]:
    """Validate a single exported context-pack YAML file."""
    errors: list[str] = []

    if not _YAML_AVAILABLE:
        return errors

    if not path.exists():
        errors.append(f"Context-pack file not found: {path}")
        return errors

    try:
        with path.open("r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{path.name}: YAML parse error: {exc}")
        return errors

    if not isinstance(data, dict):
        errors.append(f"{path.name}: top-level value is not a mapping")
        return errors

    # Support both 'context_pack_manifest' wrapper and flat format
    payload: dict[str, Any] = data.get("context_pack_manifest", data)

    for field in ("id", "title", "project_id", "status"):
        if not payload.get(field):
            errors.append(f"{path.name}: missing required field '{field}'")

    return errors


def validate_context_packs_dir(context_packs_dir: Path) -> list[str]:
    """Validate all *.yaml files in the context-packs export directory."""
    errors: list[str] = []

    if not context_packs_dir.exists():
        # Missing export dir is a warning, not a hard error
        logger.debug("Context-packs export directory not found: %s", context_packs_dir)
        return errors

    for path in context_packs_dir.glob("*.yaml"):
        errors.extend(validate_context_pack_yaml(path))

    return errors


# ---------------------------------------------------------------------------
# Top-level validator
# ---------------------------------------------------------------------------


def validate_registry(
    registry_dir: Path,
    templates_dir: Path | None = None,
    context_packs_dir: Path | None = None,
) -> list[str]:
    """Run all validations and return a flat list of error strings.

    An empty list indicates all files are valid.

    Args:
        registry_dir: Path to ``registry/``.
        templates_dir: Path to ``templates/`` (optional).
        context_packs_dir: Path to ``exports/context-packs/`` (optional).
    """
    errors: list[str] = []

    if not registry_dir.exists():
        errors.append(f"Registry directory not found: {registry_dir}")
        return errors

    errors.extend(validate_registry_jsonl(registry_dir))

    if templates_dir is not None:
        errors.extend(validate_templates_dir(templates_dir))

    if context_packs_dir is not None:
        errors.extend(validate_context_packs_dir(context_packs_dir))

    return errors


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _iter_lines(path: Path):
    """Yield (lineno, stripped_line) for non-empty lines."""
    with path.open("r", encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, start=1):
            stripped = raw.strip()
            if stripped:
                yield lineno, stripped


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


if __name__ == "__main__":  # pragma: no cover
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Validate the Artifact Atlas registry files.")
    parser.add_argument(
        "--registry-dir",
        default="registry",
        help="Path to registry directory (default: registry)",
    )
    parser.add_argument(
        "--templates-dir",
        default="templates",
        help="Path to templates directory (default: templates)",
    )
    parser.add_argument(
        "--context-packs-dir",
        default="exports/context-packs",
        help="Path to context-packs export directory",
    )
    args = parser.parse_args()

    errs = validate_registry(
        registry_dir=Path(args.registry_dir),
        templates_dir=Path(args.templates_dir),
        context_packs_dir=Path(args.context_packs_dir),
    )

    if errs:
        print(f"Validation FAILED with {len(errs)} error(s):", file=sys.stderr)
        for e in errs:
            print(f"  {e}", file=sys.stderr)
        sys.exit(1)
    else:
        print("Validation passed — registry is clean.")
        sys.exit(0)
