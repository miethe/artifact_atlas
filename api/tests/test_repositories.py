"""DATA-002 / DATA-003: Repository tests.

Covers:
1. Seed records parse correctly through each repository.
2. create/update operations preserve JSONL validity and unknown metadata fields.
3. Malformed JSONL lines are gracefully handled (skipped with warning).
4. Missing JSONL files do not crash read operations (empty list returned).
5. Tombstone deletes mark records correctly.
6. All writes use a tmp directory — never mutate real registry/*.
7. Template YAML loading (DATA-003): domains/slots parsed from yaml files.
8. Slot generation (DATA-003): generate_bom_slots returns correct BomSlot dicts.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_DIR = REPO_ROOT / "registry"
TEMPLATES_DIR = REPO_ROOT / "templates"


@pytest.fixture()
def tmp_registry(tmp_path: Path) -> Path:
    """Copy real seed registry JSONL files into a temp directory."""
    reg = tmp_path / "registry"
    reg.mkdir()
    for jsonl in REGISTRY_DIR.glob("*.jsonl"):
        shutil.copy(jsonl, reg / jsonl.name)
    return reg


@pytest.fixture()
def empty_registry(tmp_path: Path) -> Path:
    """Return an empty registry temp directory."""
    reg = tmp_path / "registry"
    reg.mkdir()
    return reg


# ---------------------------------------------------------------------------
# 1. jsonl module — low-level
# ---------------------------------------------------------------------------


class TestJsonlHelpers:
    def test_read_all_missing_file(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import read_all

        result = read_all(tmp_path / "nope.jsonl")
        assert result == []

    def test_read_all_empty_file(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import read_all

        p = tmp_path / "empty.jsonl"
        p.write_text("")
        assert read_all(p) == []

    def test_read_all_skips_malformed(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import read_all

        p = tmp_path / "bad.jsonl"
        p.write_text('{"id": "rec_1"}\n{NOT VALID}\n{"id": "rec_3"}\n')
        records = read_all(p)
        assert len(records) == 2
        ids = {r["id"] for r in records}
        assert ids == {"rec_1", "rec_3"}

    def test_append_then_read(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import append_record, read_all

        p = tmp_path / "data.jsonl"
        rec = {"id": "rec_1", "name": "Alice", "extra_field": "preserved"}
        append_record(p, rec)
        records = read_all(p)
        assert len(records) == 1
        assert records[0]["extra_field"] == "preserved"

    def test_append_multiple(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import append_record, read_all

        p = tmp_path / "data.jsonl"
        for i in range(5):
            append_record(p, {"id": f"rec_{i}", "name": f"user_{i}"})
        records = read_all(p)
        assert len(records) == 5

    def test_update_record_merge(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import append_record, read_all, update_record

        p = tmp_path / "data.jsonl"
        append_record(p, {"id": "rec_1", "name": "Alice", "extra": "keep_me"})
        updated = update_record(p, "rec_1", {"name": "Alice Updated"})
        assert updated is not None
        assert updated["name"] == "Alice Updated"
        assert updated["extra"] == "keep_me"

        # Verify persisted
        records = read_all(p)
        assert records[0]["extra"] == "keep_me"

    def test_update_record_not_found(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import update_record

        p = tmp_path / "data.jsonl"
        result = update_record(p, "nonexistent", {"name": "X"})
        assert result is None

    def test_tombstone_record(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import append_record, read_all, tombstone_record

        p = tmp_path / "data.jsonl"
        append_record(p, {"id": "rec_1", "name": "Alice"})
        result = tombstone_record(p, "rec_1")
        assert result is not None
        assert result["_deleted"] is True

        # Tombstoned record excluded from default read
        records = read_all(p)
        assert records == []

        # But visible with include_deleted=True
        records_all = read_all(p, include_deleted=True)
        assert len(records_all) == 1
        assert records_all[0]["_deleted"] is True

    def test_tombstone_not_found(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import tombstone_record

        p = tmp_path / "data.jsonl"
        result = tombstone_record(p, "nonexistent")
        assert result is None

    def test_read_by_id(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import append_record, read_by_id

        p = tmp_path / "data.jsonl"
        append_record(p, {"id": "rec_1", "name": "Alice"})
        append_record(p, {"id": "rec_2", "name": "Bob"})
        record = read_by_id(p, "rec_2")
        assert record is not None
        assert record["name"] == "Bob"

    def test_unknown_fields_preserved_on_round_trip(self, tmp_path: Path) -> None:
        from app.repositories.jsonl import append_record, read_all, update_record

        p = tmp_path / "data.jsonl"
        original = {
            "id": "rec_1",
            "name": "Alice",
            "future_feature_field": "some_value",
            "nested_extra": {"a": 1, "b": 2},
        }
        append_record(p, original)
        update_record(p, "rec_1", {"name": "Alice Updated"})

        records = read_all(p)
        assert len(records) == 1
        r = records[0]
        assert r["future_feature_field"] == "some_value"
        assert r["nested_extra"] == {"a": 1, "b": 2}

    def test_atomic_write_does_not_leave_tmp_on_success(self, tmp_path: Path) -> None:
        """No .tmp file should remain after a successful write."""
        from app.repositories.jsonl import append_record

        p = tmp_path / "data.jsonl"
        append_record(p, {"id": "rec_1"})
        tmp_files = list(tmp_path.glob("*.tmp"))
        assert tmp_files == []


# ---------------------------------------------------------------------------
# 2. ProjectRepository
# ---------------------------------------------------------------------------


class TestProjectRepository:
    def test_list_seed_projects(self, tmp_registry: Path) -> None:
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(tmp_registry)
        projects = repo.list()
        assert len(projects) >= 1
        ids = {p.id for p in projects}
        assert "proj_artifact_atlas" in ids

    def test_get_existing(self, tmp_registry: Path) -> None:
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(tmp_registry)
        project = repo.get("proj_artifact_atlas")
        assert project is not None
        assert project.slug == "artifact-atlas"

    def test_get_nonexistent(self, tmp_registry: Path) -> None:
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(tmp_registry)
        assert repo.get("proj_nope") is None

    def test_get_by_slug(self, tmp_registry: Path) -> None:
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(tmp_registry)
        project = repo.get_by_slug("artifact-atlas")
        assert project is not None
        assert project.id == "proj_artifact_atlas"

    def test_create_project(self, empty_registry: Path) -> None:
        from app.models.project import ProjectCreate
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(empty_registry)
        create_data = ProjectCreate(
            name="My Project",
            slug="my-project",
            status="active",
        )
        project = repo.create("proj_new_001", create_data)
        assert project.id == "proj_new_001"
        assert project.name == "My Project"
        assert project.created_at is not None

        # Verify persisted
        retrieved = repo.get("proj_new_001")
        assert retrieved is not None
        assert retrieved.slug == "my-project"

    def test_update_project(self, empty_registry: Path) -> None:
        from app.models.project import ProjectCreate, ProjectUpdate
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(empty_registry)
        repo.create("proj_upd", ProjectCreate(name="Original", slug="orig", status="active"))

        from app.models.project import ProjectUpdate
        updated = repo.update("proj_upd", ProjectUpdate(name="Updated"))
        assert updated is not None
        assert updated.name == "Updated"

        # Verify persisted
        retrieved = repo.get("proj_upd")
        assert retrieved is not None
        assert retrieved.name == "Updated"

    def test_update_preserves_unknown_fields(self, empty_registry: Path) -> None:
        """Unknown fields from original record must survive an update."""
        from app.repositories.jsonl import append_record
        from app.repositories.projects import ProjectRepository
        from app.models.project import ProjectUpdate

        reg_path = empty_registry / "projects.jsonl"
        append_record(
            reg_path,
            {
                "id": "proj_extra",
                "name": "Extra",
                "slug": "extra",
                "status": "active",
                "future_field": "must_survive",
            },
        )
        repo = ProjectRepository(empty_registry)
        updated = repo.update("proj_extra", ProjectUpdate(name="Extra Updated"))
        assert updated is not None

        from app.repositories.jsonl import read_by_id
        raw = read_by_id(reg_path, "proj_extra")
        assert raw is not None
        assert raw.get("future_field") == "must_survive"

    def test_delete_project(self, empty_registry: Path) -> None:
        from app.models.project import ProjectCreate
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(empty_registry)
        repo.create("proj_del", ProjectCreate(name="Del", slug="del", status="active"))
        assert repo.delete("proj_del") is True
        assert repo.get("proj_del") is None

    def test_delete_nonexistent(self, empty_registry: Path) -> None:
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(empty_registry)
        assert repo.delete("proj_nope") is False

    def test_list_missing_file(self, tmp_path: Path) -> None:
        """list() on a non-existent JSONL must return empty list."""
        from app.repositories.projects import ProjectRepository

        repo = ProjectRepository(tmp_path / "nonexistent")
        assert repo.list() == []


# ---------------------------------------------------------------------------
# 3. AssetRepository
# ---------------------------------------------------------------------------


class TestAssetRepository:
    def test_list_seed_assets(self, tmp_registry: Path) -> None:
        from app.repositories.assets import AssetRepository

        repo = AssetRepository(tmp_registry)
        assets = repo.list()
        assert len(assets) >= 1
        ids = {a.id for a in assets}
        assert "asset_prd_uiux_spec_v0_1" in ids

    def test_get_asset(self, tmp_registry: Path) -> None:
        from app.repositories.assets import AssetRepository

        repo = AssetRepository(tmp_registry)
        asset = repo.get("asset_prd_uiux_spec_v0_1")
        assert asset is not None
        assert asset.source_kind == "local"
        assert asset.sensitivity == "personal"

    def test_asset_metadata_preserved(self, tmp_registry: Path) -> None:
        from app.repositories.assets import AssetRepository

        repo = AssetRepository(tmp_registry)
        asset = repo.get("asset_prd_uiux_spec_v0_1")
        assert asset is not None
        assert asset.metadata is not None
        assert "system_of_record" in asset.metadata

    def test_create_asset(self, empty_registry: Path) -> None:
        from app.models.asset import AssetCreate
        from app.repositories.assets import AssetRepository
        from app.models.vocabulary import AgentAccess, AssetStatus, Sensitivity, SourceKind

        repo = AssetRepository(empty_registry)
        create_data = AssetCreate(
            title="Test Asset",
            source_kind=SourceKind.local,
            uri="file:///test/doc.md",
            status=AssetStatus.inbox,
            sensitivity=Sensitivity.personal,
            agent_access=AgentAccess.metadata_only,
        )
        asset = repo.create("asset_new_001", create_data, project_id="proj_test")
        assert asset.id == "asset_new_001"
        assert asset.project_id == "proj_test"
        assert asset.captured_at is not None

    def test_update_asset(self, empty_registry: Path) -> None:
        from app.models.asset import AssetCreate, AssetUpdate
        from app.repositories.assets import AssetRepository
        from app.models.vocabulary import AgentAccess, AssetStatus, Sensitivity, SourceKind

        repo = AssetRepository(empty_registry)
        repo.create(
            "asset_upd",
            AssetCreate(
                title="Old Title",
                source_kind=SourceKind.local,
                uri="file:///x",
                status=AssetStatus.inbox,
                sensitivity=Sensitivity.personal,
                agent_access=AgentAccess.metadata_only,
            ),
        )
        updated = repo.update("asset_upd", AssetUpdate(title="New Title"))
        assert updated is not None
        assert updated.title == "New Title"

    def test_delete_asset(self, empty_registry: Path) -> None:
        from app.models.asset import AssetCreate
        from app.repositories.assets import AssetRepository
        from app.models.vocabulary import AgentAccess, AssetStatus, Sensitivity, SourceKind

        repo = AssetRepository(empty_registry)
        repo.create(
            "asset_del",
            AssetCreate(
                title="Delete Me",
                source_kind=SourceKind.local,
                uri="file:///del",
                status=AssetStatus.inbox,
                sensitivity=Sensitivity.personal,
                agent_access=AgentAccess.metadata_only,
            ),
        )
        assert repo.delete("asset_del") is True
        assert repo.get("asset_del") is None

    def test_list_by_project(self, empty_registry: Path) -> None:
        from app.models.asset import AssetCreate
        from app.repositories.assets import AssetRepository
        from app.models.vocabulary import AgentAccess, AssetStatus, Sensitivity, SourceKind

        repo = AssetRepository(empty_registry)
        kwargs = dict(
            source_kind=SourceKind.local,
            uri="file:///x",
            status=AssetStatus.inbox,
            sensitivity=Sensitivity.personal,
            agent_access=AgentAccess.metadata_only,
        )
        repo.create("a1", AssetCreate(title="A1", **kwargs), project_id="proj_a")
        repo.create("a2", AssetCreate(title="A2", **kwargs), project_id="proj_b")
        repo.create("a3", AssetCreate(title="A3", **kwargs), project_id="proj_a")

        proj_a_assets = repo.list(project_id="proj_a")
        assert len(proj_a_assets) == 2
        ids = {a.id for a in proj_a_assets}
        assert ids == {"a1", "a3"}

    def test_create_and_list_links(self, empty_registry: Path) -> None:
        from app.models.asset import AssetLinkCreate
        from app.repositories.assets import AssetRepository
        from app.models.vocabulary import AssetLinkRelationship, AssetLinkTargetType

        repo = AssetRepository(empty_registry)
        link = repo.create_link(
            "link_001",
            "asset_001",
            AssetLinkCreate(
                target_type=AssetLinkTargetType.project,
                target_id="proj_test",
                relationship=AssetLinkRelationship.reference,
            ),
        )
        assert link.id == "link_001"

        links = repo.list_links("asset_001")
        assert len(links) == 1
        assert links[0].target_id == "proj_test"

    def test_delete_link(self, empty_registry: Path) -> None:
        from app.models.asset import AssetLinkCreate
        from app.repositories.assets import AssetRepository
        from app.models.vocabulary import AssetLinkRelationship, AssetLinkTargetType

        repo = AssetRepository(empty_registry)
        repo.create_link(
            "link_del",
            "asset_001",
            AssetLinkCreate(
                target_type=AssetLinkTargetType.project,
                target_id="proj_x",
                relationship=AssetLinkRelationship.reference,
            ),
        )
        assert repo.delete_link("link_del") is True
        assert repo.list_links("asset_001") == []

    def test_create_and_list_relationships(self, empty_registry: Path) -> None:
        from app.repositories.assets import AssetRepository

        repo = AssetRepository(empty_registry)
        rel = repo.create_relationship(
            "rel_001", "asset_a", "asset_b", "derived_from"
        )
        assert rel.id == "rel_001"

        rels = repo.list_relationships("asset_a")
        assert len(rels) == 1
        assert rels[0].relationship_type == "derived_from"


# ---------------------------------------------------------------------------
# 4. BomRepository
# ---------------------------------------------------------------------------


class TestBomRepository:
    def test_list_seed_boms(self, tmp_registry: Path) -> None:
        from app.repositories.bom import BomRepository

        repo = BomRepository(tmp_registry)
        boms = repo.list()
        assert len(boms) >= 1
        assert boms[0].id == "bom_artifact_atlas_mvp"

    def test_get_bom(self, tmp_registry: Path) -> None:
        from app.repositories.bom import BomRepository

        repo = BomRepository(tmp_registry)
        bom = repo.get("bom_artifact_atlas_mvp")
        assert bom is not None
        assert bom.project_id == "proj_artifact_atlas"

    def test_get_for_project(self, tmp_registry: Path) -> None:
        from app.repositories.bom import BomRepository

        repo = BomRepository(tmp_registry)
        bom = repo.get_for_project("proj_artifact_atlas")
        assert bom is not None

    def test_create_bom(self, empty_registry: Path) -> None:
        from app.repositories.bom import BomRepository

        repo = BomRepository(empty_registry)
        bom = repo.create("bom_001", "proj_001", "My BOM", source_templates=["tmpl_1"])
        assert bom.id == "bom_001"
        assert bom.status == "active"
        assert bom.coverage_score == 0.0

    def test_update_bom(self, empty_registry: Path) -> None:
        from app.models.bom import BomUpdate
        from app.repositories.bom import BomRepository

        repo = BomRepository(empty_registry)
        repo.create("bom_upd", "proj_001", "Original BOM")
        updated = repo.update("bom_upd", BomUpdate(name="Updated BOM"))
        assert updated is not None
        assert updated.name == "Updated BOM"

    def test_update_coverage_score(self, empty_registry: Path) -> None:
        from app.repositories.bom import BomRepository

        repo = BomRepository(empty_registry)
        repo.create("bom_cov", "proj_001", "Coverage BOM")
        updated = repo.update_coverage_score("bom_cov", 0.85)
        assert updated is not None
        assert abs(updated.coverage_score - 0.85) < 0.001

    def test_delete_bom(self, empty_registry: Path) -> None:
        from app.repositories.bom import BomRepository

        repo = BomRepository(empty_registry)
        repo.create("bom_del", "proj_001", "Delete Me")
        assert repo.delete("bom_del") is True
        assert repo.get("bom_del") is None

    def test_create_and_list_slots(self, empty_registry: Path) -> None:
        from app.repositories.bom import BomRepository

        repo = BomRepository(empty_registry)
        repo.create("bom_slots", "proj_001", "BOM With Slots")
        slot = repo.create_slot(
            "slot_001",
            "bom_slots",
            "prd",
            "Product",
            required=True,
        )
        assert slot.id == "slot_001"
        assert slot.status == "missing"

        slots = repo.list_slots("bom_slots")
        assert len(slots) == 1

    def test_create_and_list_assignments(self, empty_registry: Path) -> None:
        from app.models.bom import SlotAssignRequest
        from app.repositories.bom import BomRepository

        repo = BomRepository(empty_registry)
        repo.create("bom_asgn", "proj_001", "BOM Assignments")
        repo.create_slot("slot_asgn", "bom_asgn", "prd", "Product")

        assign_req = SlotAssignRequest(
            asset_id="asset_001",
            slot_id="slot_asgn",
            assignment_status="suggested",
            confidence=0.9,
        )
        assignment = repo.create_assignment("asgn_001", assign_req, assigned_by="agent")
        assert assignment.id == "asgn_001"
        assert assignment.confidence == 0.9

        assignments = repo.list_assignments("slot_asgn")
        assert len(assignments) == 1

    def test_delete_slot(self, empty_registry: Path) -> None:
        from app.repositories.bom import BomRepository

        repo = BomRepository(empty_registry)
        repo.create("bom_sd", "proj_001", "BOM Slot Delete")
        repo.create_slot("slot_sd", "bom_sd", "prd", "Product")
        assert repo.delete_slot("slot_sd") is True
        assert repo.list_slots("bom_sd") == []


# ---------------------------------------------------------------------------
# 5. ContextPackRepository
# ---------------------------------------------------------------------------


class TestContextPackRepository:
    def test_list_no_file(self, empty_registry: Path) -> None:
        from app.repositories.context_packs import ContextPackRepository

        repo = ContextPackRepository(empty_registry)
        assert repo.list() == []

    def test_create_pack(self, empty_registry: Path) -> None:
        from app.models.context_pack import ContextPackCreate
        from app.repositories.context_packs import ContextPackRepository
        from app.models.vocabulary import (
            ContextPackAudience,
            ContextPackTargetType,
            Sensitivity,
        )

        repo = ContextPackRepository(empty_registry)
        create_data = ContextPackCreate(
            title="My Pack",
            target_type=ContextPackTargetType.project,
            audience=ContextPackAudience.agent,
            sensitivity=Sensitivity.personal,
        )
        pack = repo.create("pack_001", "proj_001", create_data, created_by="test_user")
        assert pack.id == "pack_001"
        assert pack.status == "draft"
        assert pack.created_by == "test_user"

    def test_update_pack(self, empty_registry: Path) -> None:
        from app.models.context_pack import ContextPackCreate, ContextPackUpdate
        from app.repositories.context_packs import ContextPackRepository
        from app.models.vocabulary import (
            ContextPackAudience,
            ContextPackTargetType,
            Sensitivity,
        )

        repo = ContextPackRepository(empty_registry)
        repo.create(
            "pack_upd",
            "proj_001",
            ContextPackCreate(
                title="Original",
                target_type=ContextPackTargetType.project,
                audience=ContextPackAudience.agent,
                sensitivity=Sensitivity.personal,
            ),
        )
        updated = repo.update("pack_upd", ContextPackUpdate(title="Updated"))
        assert updated is not None
        assert updated.title == "Updated"

    def test_add_and_list_items(self, empty_registry: Path) -> None:
        from app.models.context_pack import ContextPackCreate, ContextPackItemCreate
        from app.repositories.context_packs import ContextPackRepository
        from app.models.vocabulary import (
            ContextPackAudience,
            ContextPackItemType,
            ContextPackTargetType,
            IncludeMode,
            Sensitivity,
        )

        repo = ContextPackRepository(empty_registry)
        repo.create(
            "pack_items",
            "proj_001",
            ContextPackCreate(
                title="Pack With Items",
                target_type=ContextPackTargetType.project,
                audience=ContextPackAudience.agent,
                sensitivity=Sensitivity.personal,
            ),
        )
        item = repo.add_item(
            "item_001",
            "pack_items",
            ContextPackItemCreate(
                item_type=ContextPackItemType.asset,
                item_id="asset_001",
                include_mode=IncludeMode.full,
                required=True,
            ),
        )
        assert item.id == "item_001"
        assert item.context_pack_id == "pack_items"

        items = repo.list_items("pack_items")
        assert len(items) == 1

    def test_delete_pack(self, empty_registry: Path) -> None:
        from app.models.context_pack import ContextPackCreate
        from app.repositories.context_packs import ContextPackRepository
        from app.models.vocabulary import (
            ContextPackAudience,
            ContextPackTargetType,
            Sensitivity,
        )

        repo = ContextPackRepository(empty_registry)
        repo.create(
            "pack_del",
            "proj_001",
            ContextPackCreate(
                title="Delete Me",
                target_type=ContextPackTargetType.project,
                audience=ContextPackAudience.agent,
                sensitivity=Sensitivity.personal,
            ),
        )
        assert repo.delete("pack_del") is True
        assert repo.get("pack_del") is None


# ---------------------------------------------------------------------------
# 6. TemplateRepository (DATA-003)
# ---------------------------------------------------------------------------


class TestTemplateRepository:
    def test_list_seed_templates(self, tmp_registry: Path) -> None:
        from app.repositories.templates import TemplateRepository

        repo = TemplateRepository(tmp_registry, TEMPLATES_DIR)
        templates = repo.list()
        assert len(templates) >= 2
        slugs = {t.slug for t in templates}
        assert "new-product-app" in slugs
        assert "architecture-initiative" in slugs

    def test_get_template(self, tmp_registry: Path) -> None:
        from app.repositories.templates import TemplateRepository

        repo = TemplateRepository(tmp_registry, TEMPLATES_DIR)
        tmpl = repo.get("tmpl_new_product_app_v1")
        assert tmpl is not None
        assert tmpl.status == "core"

    def test_get_by_slug(self, tmp_registry: Path) -> None:
        from app.repositories.templates import TemplateRepository

        repo = TemplateRepository(tmp_registry, TEMPLATES_DIR)
        tmpl = repo.get_by_slug("architecture-initiative")
        assert tmpl is not None
        assert tmpl.template_type == "architecture"

    def test_get_detail_loads_yaml(self, tmp_registry: Path) -> None:
        """get_detail should populate domains from YAML."""
        from app.repositories.templates import TemplateRepository

        repo = TemplateRepository(tmp_registry, TEMPLATES_DIR)
        detail = repo.get_detail("tmpl_new_product_app_v1")
        assert detail is not None
        assert detail.domains is not None
        assert len(detail.domains) > 0

        domain_names = {d.name for d in detail.domains}
        assert "Strategy" in domain_names
        assert "Product" in domain_names

    def test_get_detail_slots_populated(self, tmp_registry: Path) -> None:
        from app.repositories.templates import TemplateRepository

        repo = TemplateRepository(tmp_registry, TEMPLATES_DIR)
        detail = repo.get_detail("tmpl_new_product_app_v1")
        assert detail is not None
        assert detail.domains is not None

        # Find Strategy domain
        strategy = next(d for d in detail.domains if d.name == "Strategy")
        assert strategy.slots is not None
        assert len(strategy.slots) >= 1

        # Each slot must have an artifact_type_id
        for slot in strategy.slots:
            assert slot.artifact_type_id
            assert slot.template_id == "tmpl_new_product_app_v1"

    def test_generate_bom_slots(self, tmp_registry: Path) -> None:
        from app.repositories.templates import TemplateRepository

        repo = TemplateRepository(tmp_registry, TEMPLATES_DIR)
        slots = repo.generate_bom_slots("tmpl_new_product_app_v1", "bom_test")
        assert len(slots) > 0

        for slot in slots:
            assert slot["bom_id"] == "bom_test"
            assert slot["id"].startswith("slot_")
            assert "artifact_type_id" in slot
            assert "domain" in slot
            assert "required" in slot
            assert slot["status"] == "missing"

    def test_generate_bom_slots_architecture(self, tmp_registry: Path) -> None:
        from app.repositories.templates import TemplateRepository

        repo = TemplateRepository(tmp_registry, TEMPLATES_DIR)
        slots = repo.generate_bom_slots("tmpl_architecture_initiative_v1", "bom_arch")
        assert len(slots) > 0
        # Check all have unique IDs
        ids = [s["id"] for s in slots]
        assert len(ids) == len(set(ids))

    def test_create_template(self, empty_registry: Path) -> None:
        from app.models.template import TemplateCreate
        from app.repositories.templates import TemplateRepository
        from app.models.vocabulary import TemplateStatus, TemplateType

        repo = TemplateRepository(empty_registry)
        create_data = TemplateCreate(
            name="Custom Template",
            slug="custom-tmpl",
            template_type=TemplateType.custom,
            status=TemplateStatus.experimental,
            version="0.1.0",
        )
        tmpl = repo.create("tmpl_custom_001", create_data)
        assert tmpl.id == "tmpl_custom_001"
        assert tmpl.slug == "custom-tmpl"

    def test_update_template(self, empty_registry: Path) -> None:
        from app.models.template import TemplateCreate, TemplateUpdate
        from app.repositories.templates import TemplateRepository
        from app.models.vocabulary import TemplateStatus, TemplateType

        repo = TemplateRepository(empty_registry)
        repo.create(
            "tmpl_upd",
            TemplateCreate(
                name="Old Name",
                slug="old-slug",
                template_type=TemplateType.product,
                status=TemplateStatus.experimental,
                version="0.1.0",
            ),
        )
        updated = repo.update("tmpl_upd", TemplateUpdate(name="New Name"))
        assert updated is not None
        assert updated.name == "New Name"

    def test_delete_template(self, empty_registry: Path) -> None:
        from app.models.template import TemplateCreate
        from app.repositories.templates import TemplateRepository
        from app.models.vocabulary import TemplateStatus, TemplateType

        repo = TemplateRepository(empty_registry)
        repo.create(
            "tmpl_del",
            TemplateCreate(
                name="Delete Me",
                slug="del-tmpl",
                template_type=TemplateType.product,
                status=TemplateStatus.optional,
                version="1.0.0",
            ),
        )
        assert repo.delete("tmpl_del") is True
        assert repo.get("tmpl_del") is None

    def test_generate_bom_slots_no_yaml(self, empty_registry: Path) -> None:
        """Without a templates_dir, generate_bom_slots returns empty list."""
        from app.models.template import TemplateCreate
        from app.repositories.templates import TemplateRepository
        from app.models.vocabulary import TemplateStatus, TemplateType

        repo = TemplateRepository(empty_registry)  # no templates_dir
        repo.create(
            "tmpl_no_yaml",
            TemplateCreate(
                name="No YAML",
                slug="no-yaml",
                template_type=TemplateType.product,
                status=TemplateStatus.experimental,
                version="1.0.0",
            ),
        )
        slots = repo.generate_bom_slots("tmpl_no_yaml", "bom_test")
        assert slots == []


# ---------------------------------------------------------------------------
# 7. Settings singleton
# ---------------------------------------------------------------------------


class TestSettings:
    def test_settings_loads_workspace_yaml(self) -> None:
        from app.settings import Settings

        s = Settings()
        assert s.workspace_id == "ws_artifact_atlas_local"
        assert s.registry_dir.name == "registry"
        assert s.default_sensitivity == "personal"
        assert s.default_agent_access == "metadata_only"

    def test_registry_dir_is_absolute(self) -> None:
        from app.settings import Settings

        s = Settings()
        assert s.registry_dir.is_absolute()

    def test_context_packs_dir_is_absolute(self) -> None:
        from app.settings import Settings

        s = Settings()
        assert s.context_packs_dir.is_absolute()

    def test_registry_file_helper(self) -> None:
        from app.settings import Settings

        s = Settings()
        p = s.registry_file("projects.jsonl")
        assert p.name == "projects.jsonl"
        assert p.is_absolute()

    def test_get_settings_singleton(self) -> None:
        from app.settings import _reset_settings, get_settings

        _reset_settings()
        s1 = get_settings()
        s2 = get_settings()
        assert s1 is s2

    def test_reset_settings(self) -> None:
        from app.settings import _reset_settings, get_settings

        _reset_settings()
        s1 = get_settings()
        _reset_settings()
        s2 = get_settings()
        # Both should work and have same values even if different instances
        assert s1.workspace_id == s2.workspace_id
