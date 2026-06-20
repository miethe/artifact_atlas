"""CLI smoke tests (MCP-002 / CLI-001).

Invokes the CLI entry point in-process via app.cli.atlas.main().
All tests use tmp_registry fixture for isolation.
"""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from typing import Any

import pytest

import app.settings as _settings_mod
from app.cli.atlas import main as cli_main
from app.models.asset import AssetCreate
from app.models.project import ProjectCreate
from app.models.vocabulary import AgentAccess, Sensitivity, SourceKind
from app.services.assets import AssetService
from app.services.projects import ProjectService
from app.settings import get_settings

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_DIR = REPO_ROOT / "registry"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def tmp_registry(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Isolated temp registry with seed data; patches settings singleton."""
    reg = tmp_path / "registry"
    reg.mkdir()

    for jsonl in REGISTRY_DIR.glob("*.jsonl"):
        shutil.copy(jsonl, reg / jsonl.name)

    cp_dir = tmp_path / "context-packs"
    cp_dir.mkdir()

    settings = _settings_mod.Settings.__new__(_settings_mod.Settings)
    settings.registry_dir = reg
    settings.context_packs_dir = cp_dir
    settings.reports_dir = tmp_path / "reports"
    settings.thumbnails_dir = tmp_path / "thumbnails"
    settings.previews_dir = tmp_path / "previews"
    settings.workspace_id = "ws_test"
    settings.workspace_name = "Test Workspace"
    settings.default_sensitivity = "personal"
    settings.default_agent_access = "metadata_only"
    settings.automated_promotion_allowed = False
    settings.agent_full_content_sensitivity_cap = [
        "work_sensitive", "client_sensitive", "restricted"
    ]
    settings.require_human_approval_for = ["canonical_promotion"]
    settings.bind_host = "127.0.0.1"
    settings.bind_port = 8000

    monkeypatch.setattr(_settings_mod, "_settings_instance", settings)
    _settings_mod._cached_settings.cache_clear()

    yield reg

    _settings_mod._reset_settings()


@pytest.fixture()
def sample_asset_id(tmp_registry: Path) -> str:
    """Create a sample asset and return its ID."""
    settings = get_settings()
    asset_svc = AssetService(settings.registry_dir)
    data = AssetCreate(
        title="Sample Document",
        source_kind=SourceKind.local,
        uri="file:///sample/doc.md",
        sensitivity=Sensitivity.personal,
        agent_access=AgentAccess.read_allowed,
    )
    asset = asset_svc.create_asset(data, actor_id="test")
    return asset.id


@pytest.fixture()
def sample_project_slug(tmp_registry: Path) -> str:
    """Create a sample project and return its slug."""
    settings = get_settings()
    proj_svc = ProjectService(settings.registry_dir)
    project = proj_svc.create_project(ProjectCreate(name="Test Project", slug="test-project"))
    return project.slug


@pytest.fixture()
def sample_file(tmp_path: Path) -> Path:
    """Create a temporary file for import tests."""
    f = tmp_path / "sample_import.txt"
    f.write_text("Sample content for import test.")
    return f


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def run_cli(*args: str) -> int:
    """Run CLI with given args and return exit code."""
    return cli_main(list(args))


# ---------------------------------------------------------------------------
# init
# ---------------------------------------------------------------------------


class TestInit:
    def test_init_exits_zero(self, tmp_registry: Path) -> None:
        code = run_cli("init")
        assert code == 0


# ---------------------------------------------------------------------------
# import
# ---------------------------------------------------------------------------


class TestImport:
    def test_import_local_file(self, tmp_registry: Path, sample_file: Path) -> None:
        code = run_cli("import", str(sample_file))
        assert code == 0

    def test_import_missing_file_exits_nonzero(self, tmp_registry: Path) -> None:
        code = run_cli("import", "/no/such/file/at/all.txt")
        assert code != 0


# ---------------------------------------------------------------------------
# index
# ---------------------------------------------------------------------------


class TestIndex:
    def test_index_no_project(self, tmp_registry: Path) -> None:
        code = run_cli("index")
        assert code == 0

    def test_index_with_project_filter(
        self, tmp_registry: Path, sample_project_slug: str
    ) -> None:
        code = run_cli("index", "--project", sample_project_slug)
        assert code == 0


# ---------------------------------------------------------------------------
# inbox list
# ---------------------------------------------------------------------------


class TestInboxList:
    def test_inbox_list(self, tmp_registry: Path) -> None:
        code = run_cli("inbox", "list")
        assert code == 0


# ---------------------------------------------------------------------------
# asset classify
# ---------------------------------------------------------------------------


class TestAssetClassify:
    def test_classify_sensitivity(
        self, tmp_registry: Path, sample_asset_id: str
    ) -> None:
        code = run_cli(
            "asset", "classify", sample_asset_id,
            "--sensitivity", "personal",
        )
        assert code == 0

    def test_classify_nonexistent_asset(self, tmp_registry: Path) -> None:
        code = run_cli("asset", "classify", "asset_does_not_exist")
        assert code != 0


# ---------------------------------------------------------------------------
# bom status
# ---------------------------------------------------------------------------


class TestBomStatus:
    def test_bom_status_nonexistent_project(self, tmp_registry: Path) -> None:
        code = run_cli("bom", "status", "proj_does_not_exist")
        assert code != 0

    def test_bom_status_project_no_bom(
        self, tmp_registry: Path, sample_project_slug: str
    ) -> None:
        # Project exists but has no BOM — should exit 0 with informational message
        code = run_cli("bom", "status", sample_project_slug)
        assert code == 0


# ---------------------------------------------------------------------------
# bom gaps
# ---------------------------------------------------------------------------


class TestBomGaps:
    def test_bom_gaps_nonexistent_project(self, tmp_registry: Path) -> None:
        code = run_cli("bom", "gaps", "proj_missing")
        assert code != 0

    def test_bom_gaps_no_bom(
        self, tmp_registry: Path, sample_project_slug: str
    ) -> None:
        code = run_cli("bom", "gaps", sample_project_slug)
        assert code == 0


# ---------------------------------------------------------------------------
# pack build
# ---------------------------------------------------------------------------


class TestPackBuild:
    def test_pack_build_project(
        self, tmp_registry: Path, sample_project_slug: str
    ) -> None:
        code = run_cli("pack", "build", "--project", sample_project_slug)
        assert code == 0

    def test_pack_build_with_out_exports_yaml(
        self, tmp_registry: Path, sample_project_slug: str, tmp_path: Path
    ) -> None:
        out = tmp_path / "test-pack.yaml"
        code = run_cli(
            "pack", "build",
            "--project", sample_project_slug,
            "--out", str(out),
        )
        assert code == 0
        assert out.exists()
        content = out.read_text()
        assert "context_pack_manifest" in content

    def test_pack_build_from_node(self, tmp_registry: Path) -> None:
        code = run_cli(
            "pack", "build",
            "--project", "proj_test",
            "--node", "node_abc123",
            "--title", "Node Pack Test",
        )
        assert code == 0

    def test_pack_build_bom_status_works_in_local_repo_mode(
        self, tmp_registry: Path, sample_project_slug: str
    ) -> None:
        """Spec requirement: 'bom status <project-slug>' must work in local repo mode."""
        code = run_cli("bom", "status", sample_project_slug)
        assert code == 0

    def test_pack_build_exports_yaml_local_repo_mode(
        self, tmp_registry: Path, sample_project_slug: str, tmp_path: Path
    ) -> None:
        """Spec requirement: 'pack build --project <slug> --out <path>' must work."""
        out = tmp_path / "artifact-atlas-pack.yaml"
        code = run_cli(
            "pack", "build",
            "--project", sample_project_slug,
            "--out", str(out),
        )
        assert code == 0


# ---------------------------------------------------------------------------
# No args — help
# ---------------------------------------------------------------------------


class TestHelp:
    def test_no_args_exits_zero(self, tmp_registry: Path) -> None:
        # Main with no args should print help and exit 0
        code = run_cli()
        assert code == 0
