"""DATA-004: Registry validation tests.

Verifies:
1. The real seed registry/*.jsonl files pass validation (no errors).
2. The real templates/*.yaml files pass validation.
3. The real exports/context-packs/*.yaml files pass validation.
4. Invalid JSONL records produce clear error messages.
5. Invalid YAML files produce clear error messages.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_DIR = REPO_ROOT / "registry"
TEMPLATES_DIR = REPO_ROOT / "templates"
CONTEXT_PACKS_DIR = REPO_ROOT / "exports" / "context-packs"


# ---------------------------------------------------------------------------
# 1. Real seed data must pass validation
# ---------------------------------------------------------------------------


class TestSeedDataValid:
    def test_registry_jsonl_valid(self) -> None:
        """All seed registry JSONL files must validate without errors."""
        from app.repositories.registry_validation import validate_registry_jsonl

        errors = validate_registry_jsonl(REGISTRY_DIR)
        assert errors == [], f"Seed registry validation failed:\n" + "\n".join(errors)

    def test_templates_yaml_valid(self) -> None:
        """All seed templates/*.yaml files must validate without errors."""
        from app.repositories.registry_validation import validate_templates_dir

        errors = validate_templates_dir(TEMPLATES_DIR)
        assert errors == [], f"Template YAML validation failed:\n" + "\n".join(errors)

    def test_context_packs_yaml_valid(self) -> None:
        """All seed exports/context-packs/*.yaml files must validate without errors."""
        from app.repositories.registry_validation import validate_context_packs_dir

        errors = validate_context_packs_dir(CONTEXT_PACKS_DIR)
        assert errors == [], f"Context-pack YAML validation failed:\n" + "\n".join(errors)

    def test_full_validate_registry(self) -> None:
        """top-level validate_registry() over all real seed directories must pass."""
        from app.repositories.registry_validation import validate_registry

        errors = validate_registry(
            registry_dir=REGISTRY_DIR,
            templates_dir=TEMPLATES_DIR,
            context_packs_dir=CONTEXT_PACKS_DIR,
        )
        assert errors == [], "Full registry validation failed:\n" + "\n".join(errors)


# ---------------------------------------------------------------------------
# 2. Individual file-level validators with good data
# ---------------------------------------------------------------------------


class TestValidateJsonlFile:
    def test_valid_file_no_errors(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_jsonl_file

        p = tmp_path / "test.jsonl"
        p.write_text(
            json.dumps({"id": "rec_1", "name": "Alice", "status": "active"}) + "\n"
        )
        errors = validate_jsonl_file(p, required_fields=["id", "name", "status"])
        assert errors == []

    def test_missing_file(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_jsonl_file

        p = tmp_path / "missing.jsonl"
        errors = validate_jsonl_file(p)
        assert any("not found" in e.lower() or "not exist" in e.lower() for e in errors)

    def test_malformed_json_line(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_jsonl_file

        p = tmp_path / "bad.jsonl"
        p.write_text('{"id": "ok"}\n{NOT VALID JSON}\n')
        errors = validate_jsonl_file(p)
        assert any("malformed" in e.lower() or "JSON" in e for e in errors)

    def test_non_object_json_line(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_jsonl_file

        p = tmp_path / "arr.jsonl"
        p.write_text('["this", "is", "an", "array"]\n')
        errors = validate_jsonl_file(p)
        assert any("object" in e.lower() or "mapping" in e.lower() for e in errors)

    def test_missing_required_field(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_jsonl_file

        p = tmp_path / "missing_field.jsonl"
        p.write_text(json.dumps({"id": "rec_1", "name": "Alice"}) + "\n")
        errors = validate_jsonl_file(p, required_fields=["id", "name", "status"])
        assert any("status" in e for e in errors)

    def test_empty_required_field(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_jsonl_file

        p = tmp_path / "empty_field.jsonl"
        p.write_text(json.dumps({"id": "", "name": "Alice"}) + "\n")
        errors = validate_jsonl_file(p, required_fields=["id"])
        assert any("id" in e for e in errors)

    def test_empty_lines_ignored(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_jsonl_file

        p = tmp_path / "blanks.jsonl"
        p.write_text('\n{"id": "rec_1", "name": "Bob"}\n\n\n')
        errors = validate_jsonl_file(p, required_fields=["id", "name"])
        assert errors == []

    def test_multiple_records_one_bad(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_jsonl_file

        p = tmp_path / "multi.jsonl"
        lines = [
            json.dumps({"id": "rec_1", "name": "Alice"}),
            "INVALID",
            json.dumps({"id": "rec_3", "name": "Charlie"}),
        ]
        p.write_text("\n".join(lines) + "\n")
        errors = validate_jsonl_file(p, required_fields=["id", "name"])
        assert len(errors) == 1
        assert "2" in errors[0]  # line number 2


# ---------------------------------------------------------------------------
# 3. YAML template validation
# ---------------------------------------------------------------------------


class TestValidateTemplateYaml:
    def test_valid_template(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_template_yaml

        p = tmp_path / "tmpl.yaml"
        p.write_text(
            "template:\n"
            "  id: tmpl_test\n"
            "  name: Test Template\n"
            "  domains:\n"
            "    - name: Strategy\n"
            "      slots:\n"
            "        - artifact_type: PRD\n"
            "          required: true\n"
        )
        errors = validate_template_yaml(p)
        assert errors == []

    def test_missing_id(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_template_yaml

        p = tmp_path / "bad_tmpl.yaml"
        p.write_text(
            "template:\n"
            "  name: Missing ID Template\n"
            "  domains:\n"
            "    - name: A\n"
            "      slots:\n"
            "        - artifact_type: X\n"
            "          required: true\n"
        )
        errors = validate_template_yaml(p)
        assert any("id" in e for e in errors)

    def test_empty_domains(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_template_yaml

        p = tmp_path / "empty_domains.yaml"
        p.write_text("template:\n  id: tmpl_x\n  name: X\n  domains: []\n")
        errors = validate_template_yaml(p)
        assert any("empty" in e.lower() or "no slots" in e.lower() for e in errors)

    def test_slot_missing_artifact_type(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_template_yaml

        p = tmp_path / "no_type.yaml"
        p.write_text(
            "template:\n"
            "  id: tmpl_x\n"
            "  name: X\n"
            "  domains:\n"
            "    - name: A\n"
            "      slots:\n"
            "        - required: true\n"
        )
        errors = validate_template_yaml(p)
        assert any("artifact_type" in e for e in errors)

    def test_invalid_yaml_syntax(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_template_yaml

        p = tmp_path / "bad_syntax.yaml"
        p.write_text("template:\n  id: [\n  broken\n")
        errors = validate_template_yaml(p)
        assert any("parse" in e.lower() or "YAML" in e for e in errors)

    def test_missing_file(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_template_yaml

        p = tmp_path / "nope.yaml"
        errors = validate_template_yaml(p)
        assert any("not found" in e.lower() or "not exist" in e.lower() for e in errors)


# ---------------------------------------------------------------------------
# 4. Context-pack YAML validation
# ---------------------------------------------------------------------------


class TestValidateContextPackYaml:
    def test_valid_pack(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_context_pack_yaml

        p = tmp_path / "pack.yaml"
        p.write_text(
            "context_pack_manifest:\n"
            "  id: pack_test\n"
            "  title: Test Pack\n"
            "  project_id: proj_test\n"
            "  status: draft\n"
        )
        errors = validate_context_pack_yaml(p)
        assert errors == []

    def test_missing_id(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_context_pack_yaml

        p = tmp_path / "no_id.yaml"
        p.write_text(
            "context_pack_manifest:\n"
            "  title: Test Pack\n"
            "  project_id: proj_test\n"
            "  status: draft\n"
        )
        errors = validate_context_pack_yaml(p)
        assert any("id" in e for e in errors)

    def test_invalid_yaml(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_context_pack_yaml

        p = tmp_path / "bad.yaml"
        p.write_text("context_pack_manifest:\n  id: [\n broken\n")
        errors = validate_context_pack_yaml(p)
        assert any("parse" in e.lower() or "YAML" in e for e in errors)


# ---------------------------------------------------------------------------
# 5. validate_registry top-level
# ---------------------------------------------------------------------------


class TestValidateRegistry:
    def test_missing_registry_dir(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_registry

        errors = validate_registry(registry_dir=tmp_path / "nonexistent")
        assert any("not found" in e.lower() for e in errors)

    def test_missing_required_jsonl(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_registry

        # Create registry dir but only put one of the required files
        reg = tmp_path / "registry"
        reg.mkdir()
        (reg / "projects.jsonl").write_text(
            json.dumps(
                {"id": "p1", "name": "P", "slug": "p", "status": "active"}
            )
            + "\n"
        )
        errors = validate_registry(registry_dir=reg)
        # assets.jsonl, bom.jsonl, templates.jsonl are all missing
        assert any("assets.jsonl" in e for e in errors)

    def test_valid_minimal_registry(self, tmp_path: Path) -> None:
        from app.repositories.registry_validation import validate_registry

        reg = tmp_path / "registry"
        reg.mkdir()

        (reg / "projects.jsonl").write_text(
            json.dumps({"id": "p1", "name": "P", "slug": "p", "status": "active"}) + "\n"
        )
        (reg / "assets.jsonl").write_text(
            json.dumps(
                {
                    "id": "a1",
                    "title": "Asset",
                    "source_kind": "local",
                    "uri": "file://x",
                    "status": "inbox",
                    "sensitivity": "personal",
                    "agent_access": "metadata_only",
                }
            )
            + "\n"
        )
        (reg / "bom.jsonl").write_text(
            json.dumps({"id": "b1", "project_id": "p1", "name": "BOM", "status": "active"})
            + "\n"
        )
        (reg / "templates.jsonl").write_text(
            json.dumps(
                {
                    "id": "t1",
                    "name": "T",
                    "slug": "t",
                    "template_type": "product",
                    "status": "core",
                    "version": "1.0.0",
                }
            )
            + "\n"
        )

        errors = validate_registry(registry_dir=reg)
        assert errors == [], f"Expected clean validation: {errors}"
