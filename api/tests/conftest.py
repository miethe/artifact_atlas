"""Shared pytest fixtures for route tests.

Provides a ``tmp_registry`` fixture that:
1. Creates a temporary registry directory with seed JSONL files copied in.
2. Patches app.settings so all services use the temp directory.
3. Resets settings state after each test for isolation.
"""

from __future__ import annotations

import shutil
from pathlib import Path

import pytest

import app.settings as _settings_mod
from app.repositories import jsonl as _jl

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_DIR = REPO_ROOT / "registry"


@pytest.fixture()
def tmp_registry(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Isolated temp registry dir with seed data; patches settings singleton."""
    reg = tmp_path / "registry"
    reg.mkdir()

    # Copy seed JSONL files so the registry is not empty
    for jsonl in REGISTRY_DIR.glob("*.jsonl"):
        shutil.copy(jsonl, reg / jsonl.name)

    # Canonical registry data evolves, but report-ingest tests assert deltas
    # from an empty report corpus. Keep those tests deterministic while still
    # retaining the non-report seed data used throughout the suite.
    asset_path = reg / "assets.jsonl"
    assets = _jl.read_all(asset_path, include_deleted=True)
    report_ids = {
        record["id"]
        for record in assets
        if record.get("artifact_type_id") == "delivery_report"
    }
    if report_ids:
        _jl._atomic_write_lines(
            asset_path,
            [record for record in assets if record.get("id") not in report_ids],
        )
        for name, id_field in (("asset_links.jsonl", "asset_id"), ("events.jsonl", "target_id")):
            path = reg / name
            _jl._atomic_write_lines(
                path,
                [
                    record
                    for record in _jl.read_all(path, include_deleted=True)
                    if record.get(id_field) not in report_ids
                ],
            )

    # A canonical fleet snapshot is a runtime seed for the product surface,
    # but overview route tests own their snapshot chronology explicitly.
    # Start those isolated registries empty so newer/older and missing-state
    # assertions do not inherit today's canonical snapshot.
    fleet_snapshot_path = reg / "fleet_snapshots.jsonl"
    if fleet_snapshot_path.exists():
        _jl._atomic_write_lines(fleet_snapshot_path, [])

    # Build a minimal settings object pointing to the temp dir
    settings = _settings_mod.Settings.__new__(_settings_mod.Settings)
    settings.registry_dir = reg
    settings.context_packs_dir = tmp_path / "context-packs"
    settings.reports_dir = tmp_path / "reports"
    settings.thumbnails_dir = tmp_path / "thumbnails"
    settings.previews_dir = tmp_path / "previews"
    settings.pptx_cache_dir = tmp_path / "pptx-cache"
    settings.content_store_dir = tmp_path / "assets" / "content"
    settings.workspace_id = "ws_test"
    settings.workspace_name = "Test Workspace"
    settings.workspace_root = tmp_path
    settings.default_sensitivity = "personal"
    settings.default_agent_access = "metadata_only"
    settings.automated_promotion_allowed = False
    settings.agent_full_content_sensitivity_cap = [
        "work_sensitive", "client_sensitive", "restricted"
    ]
    settings.require_human_approval_for = ["canonical_promotion"]
    settings.bind_host = "127.0.0.1"
    settings.bind_port = 8000
    settings.public_base_url = "http://localhost:8042"
    # Phase 4 integration export dirs
    settings.meatywiki_dir = tmp_path / "exports" / "meatywiki"
    settings.ccdash_events_path = tmp_path / "exports" / "events" / "ccdash-events.jsonl"
    settings.control_plane_dir = tmp_path / "exports" / "control-plane"
    settings.skillmeat_candidates_dir = tmp_path / "exports" / "skillmeat" / "candidates"
    settings.intenttree_link_dir = tmp_path / "exports" / "intenttree"

    # Patch the singleton
    monkeypatch.setattr(_settings_mod, "_settings_instance", settings)
    _settings_mod._cached_settings.cache_clear()

    # Reset integrations cache in integrations router
    try:
        import app.api.integrations as _integ_mod
        monkeypatch.setattr(_integ_mod, "_INTEGRATIONS_CACHE", None)
    except Exception:
        pass

    yield reg

    # Cleanup
    _settings_mod._reset_settings()
