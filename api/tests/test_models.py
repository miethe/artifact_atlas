"""Tests for DATA-001: model parsing and round-trip fidelity against seed data.

Verifies:
1. Every registry/*.jsonl record parses into its model without error.
2. Round-trip (parse → serialize) preserves all fields (no data loss).
3. Enum values equal the canonical strings from D-008 / openapi.yaml.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_DIR = REPO_ROOT / "registry"


def load_jsonl(filename: str) -> list[dict[str, Any]]:
    """Load all non-empty records from a registry JSONL file."""
    path = REGISTRY_DIR / filename
    records: list[dict[str, Any]] = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            records.append(json.loads(line))
    return records


def assert_round_trip(model_instance: Any, original: dict[str, Any]) -> None:
    """Assert that re-serialising a model preserves all original fields."""
    serialized = model_instance.model_dump(mode="json")
    for key, value in original.items():
        assert key in serialized, f"Field '{key}' lost after round-trip"
        # For simple scalar/dict/list comparisons — datetime fields may be
        # re-serialized to ISO strings so compare string representations
        serialized_val = serialized[key]
        if isinstance(value, dict) and isinstance(serialized_val, dict):
            # Nested dict: all original keys must survive
            for sub_key in value:
                assert sub_key in serialized_val, (
                    f"Sub-field '{key}.{sub_key}' lost after round-trip"
                )
        else:
            assert str(serialized_val) == str(value) or serialized_val == value, (
                f"Field '{key}': expected {value!r}, got {serialized_val!r}"
            )


# ---------------------------------------------------------------------------
# Registry seed-data round-trip tests
# ---------------------------------------------------------------------------


class TestProjectRoundTrip:
    def test_projects_jsonl_parses(self) -> None:
        from app.models.project import Project

        records = load_jsonl("projects.jsonl")
        assert records, "projects.jsonl is empty"
        for record in records:
            instance = Project.model_validate(record)
            assert instance.id == record["id"]
            assert instance.name == record["name"]
            assert instance.slug == record["slug"]

    def test_projects_round_trip(self) -> None:
        from app.models.project import Project

        for record in load_jsonl("projects.jsonl"):
            instance = Project.model_validate(record)
            assert_round_trip(instance, record)


class TestAssetRoundTrip:
    def test_assets_jsonl_parses(self) -> None:
        from app.models.asset import Asset

        records = load_jsonl("assets.jsonl")
        assert records, "assets.jsonl is empty"
        for record in records:
            instance = Asset.model_validate(record)
            assert instance.id == record["id"]
            assert instance.title == record["title"]

    def test_assets_metadata_preserved(self) -> None:
        """The 'metadata' dict must survive round-trip with all sub-keys."""
        from app.models.asset import Asset

        for record in load_jsonl("assets.jsonl"):
            if "metadata" in record and record["metadata"]:
                instance = Asset.model_validate(record)
                serialized = instance.model_dump(mode="json")
                for k in record["metadata"]:
                    assert k in serialized["metadata"], (
                        f"metadata.{k} lost after round-trip for asset {record['id']}"
                    )

    def test_assets_round_trip(self) -> None:
        from app.models.asset import Asset

        for record in load_jsonl("assets.jsonl"):
            instance = Asset.model_validate(record)
            assert_round_trip(instance, record)


class TestTemplateRoundTrip:
    def test_templates_jsonl_parses(self) -> None:
        from app.models.template import Template

        records = load_jsonl("templates.jsonl")
        assert records, "templates.jsonl is empty"
        for record in records:
            instance = Template.model_validate(record)
            assert instance.id == record["id"]
            assert instance.slug == record["slug"]

    def test_templates_round_trip(self) -> None:
        from app.models.template import Template

        for record in load_jsonl("templates.jsonl"):
            instance = Template.model_validate(record)
            assert_round_trip(instance, record)


class TestBomRoundTrip:
    def test_bom_jsonl_parses(self) -> None:
        from app.models.bom import Bom

        records = load_jsonl("bom.jsonl")
        assert records, "bom.jsonl is empty"
        for record in records:
            instance = Bom.model_validate(record)
            assert instance.id == record["id"]
            assert instance.project_id == record["project_id"]

    def test_bom_round_trip(self) -> None:
        from app.models.bom import Bom

        for record in load_jsonl("bom.jsonl"):
            instance = Bom.model_validate(record)
            assert_round_trip(instance, record)


# ---------------------------------------------------------------------------
# Enum canonical string value tests (D-008)
# ---------------------------------------------------------------------------


class TestAssetStatusEnum:
    def test_canonical_values(self) -> None:
        from app.models.vocabulary import AssetStatus

        assert AssetStatus.inbox == "inbox"
        assert AssetStatus.raw == "raw"
        assert AssetStatus.candidate == "candidate"
        assert AssetStatus.in_review == "in_review"
        assert AssetStatus.in_progress == "in_progress"
        assert AssetStatus.selected == "selected"
        assert AssetStatus.canonical == "canonical"
        assert AssetStatus.archived == "archived"

    def test_all_members_present(self) -> None:
        from app.models.vocabulary import AssetStatus

        expected = {"inbox", "raw", "candidate", "in_review", "in_progress", "selected", "canonical", "archived"}
        assert {e.value for e in AssetStatus} == expected


class TestBomSlotStatusEnum:
    def test_canonical_values(self) -> None:
        from app.models.vocabulary import BomSlotStatus

        assert BomSlotStatus.missing == "missing"
        assert BomSlotStatus.partial == "partial"
        assert BomSlotStatus.in_progress == "in_progress"
        assert BomSlotStatus.complete == "complete"
        assert BomSlotStatus.stale == "stale"
        assert BomSlotStatus.blocked == "blocked"
        assert BomSlotStatus.not_applicable == "not_applicable"


class TestSensitivityEnum:
    def test_canonical_values(self) -> None:
        from app.models.vocabulary import Sensitivity

        assert Sensitivity.public == "public"
        assert Sensitivity.personal == "personal"
        assert Sensitivity.work_sensitive == "work_sensitive"
        assert Sensitivity.client_sensitive == "client_sensitive"
        assert Sensitivity.restricted == "restricted"


class TestAgentAccessEnum:
    def test_canonical_values(self) -> None:
        from app.models.vocabulary import AgentAccess

        assert AgentAccess.none == "none"
        assert AgentAccess.metadata_only == "metadata_only"
        assert AgentAccess.preview_allowed == "preview_allowed"
        assert AgentAccess.read_allowed == "read_allowed"
        assert AgentAccess.context_pack_allowed == "context_pack_allowed"


class TestAssignmentStatusEnum:
    def test_canonical_values(self) -> None:
        from app.models.vocabulary import AssignmentStatus

        assert AssignmentStatus.suggested == "suggested"
        assert AssignmentStatus.accepted == "accepted"
        assert AssignmentStatus.rejected == "rejected"
        assert AssignmentStatus.canonical == "canonical"


class TestTemplateStatusEnum:
    def test_canonical_values(self) -> None:
        from app.models.vocabulary import TemplateStatus

        assert TemplateStatus.core == "core"
        assert TemplateStatus.recommended == "recommended"
        assert TemplateStatus.optional == "optional"
        assert TemplateStatus.experimental == "experimental"
        assert TemplateStatus.deprecated == "deprecated"


class TestSourceKindEnum:
    def test_seed_data_source_kinds_are_valid(self) -> None:
        from app.models.vocabulary import SourceKind

        for record in load_jsonl("assets.jsonl"):
            kind = record.get("source_kind")
            if kind:
                assert SourceKind(kind) is not None, f"Unknown source_kind: {kind}"


class TestTemplateTypeEnum:
    def test_seed_data_template_types_are_valid(self) -> None:
        from app.models.vocabulary import TemplateType

        for record in load_jsonl("templates.jsonl"):
            t = record.get("template_type")
            if t:
                assert TemplateType(t) is not None, f"Unknown template_type: {t}"


# ---------------------------------------------------------------------------
# HealthResponse backward compatibility
# ---------------------------------------------------------------------------


class TestHealthResponse:
    def test_health_response_importable_from_schemas(self) -> None:
        from app.models.schemas import HealthResponse

        h = HealthResponse(status="ok")
        assert h.status == "ok"

    def test_health_response_importable_from_shared(self) -> None:
        from app.models.shared import HealthResponse

        h = HealthResponse(status="ok")
        assert h.status == "ok"


# ---------------------------------------------------------------------------
# CoverageService compatibility (existing service uses CoverageSummary)
# ---------------------------------------------------------------------------


class TestCoverageSummaryModel:
    def test_coverage_summary_fields(self) -> None:
        from app.models.bom import CoverageSummary

        cs = CoverageSummary(
            bom_id="bom_test",
            coverage_score=0.75,
            total_slots=8,
            required_slots=4,
            filled_slots=6,
            missing_slots=2,
            stale_slots=0,
        )
        assert cs.coverage_score == 0.75
        assert cs.total_slots == 8


# ---------------------------------------------------------------------------
# Schemas re-export surface (backward compat for main.py / other importers)
# ---------------------------------------------------------------------------


class TestSchemasReexport:
    def test_project_importable_from_schemas(self) -> None:
        from app.models.schemas import Project

        assert Project.__name__ == "Project"

    def test_asset_importable_from_schemas(self) -> None:
        from app.models.schemas import Asset

        assert Asset.__name__ == "Asset"

    def test_bom_slot_importable_from_schemas(self) -> None:
        from app.models.schemas import BomSlot

        assert BomSlot.__name__ == "BomSlot"

    def test_cursor_page_generic(self) -> None:
        from app.models.shared import CursorPage
        from app.models.project import Project

        page: CursorPage[Project] = CursorPage(
            items=[
                Project(
                    id="p1",
                    name="Test",
                    slug="test",
                    status="active",
                )
            ],
            has_more=False,
        )
        assert len(page.items) == 1
        assert page.has_more is False
