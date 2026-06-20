"""Application settings resolved from config/workspace.yaml with env-var overrides.

Implements:
- Registry / export directory resolution (relative to repo root)
- Policy defaults from workspace.yaml (D-009)
- Settings singleton via get_settings() with test-friendly reset

Environment variables (all optional, override workspace.yaml values):
  ATLAS_REGISTRY_DIR          – override storage.registry_dir
  ATLAS_EXPORTS_DIR           – override exports.context_packs_dir
  ATLAS_REPORTS_DIR           – override exports.reports_dir
  ATLAS_WORKSPACE_YAML        – override path to workspace.yaml itself
  ATLAS_DEFAULT_SENSITIVITY   – override policy.default_sensitivity
  ATLAS_DEFAULT_AGENT_ACCESS  – override policy.default_agent_access
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

try:
    import yaml  # type: ignore[import-untyped]

    _YAML_AVAILABLE = True
except ImportError:  # pragma: no cover
    _YAML_AVAILABLE = False

# ---------------------------------------------------------------------------
# Locate repo root (two levels above api/app/settings.py)
# ---------------------------------------------------------------------------

_THIS_FILE = Path(__file__).resolve()
_API_DIR = _THIS_FILE.parent.parent        # api/
_REPO_ROOT = _API_DIR.parent               # repo root


def _resolve_workspace_yaml() -> Path:
    """Return the workspace.yaml path, respecting env override."""
    env_path = os.environ.get("ATLAS_WORKSPACE_YAML")
    if env_path:
        return Path(env_path)
    return _REPO_ROOT / "config" / "workspace.yaml"


def _load_workspace_yaml(path: Path) -> dict[str, Any]:
    """Load workspace.yaml; return empty dict if file absent or yaml unavailable."""
    if not path.exists():
        return {}
    if not _YAML_AVAILABLE:
        return {}
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    return data or {}


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


class Settings:
    """Flat settings object populated from workspace.yaml + env overrides."""

    def __init__(self, workspace_yaml_path: Path | None = None) -> None:
        path = workspace_yaml_path or _resolve_workspace_yaml()
        cfg = _load_workspace_yaml(path)

        storage = cfg.get("storage", {})
        exports_cfg = cfg.get("exports", {})
        policy_cfg = cfg.get("policy", {})
        workspace_cfg = cfg.get("workspace", {})

        # -- Workspace identity
        self.workspace_id: str = workspace_cfg.get("id", "ws_artifact_atlas_local")
        self.workspace_name: str = workspace_cfg.get("name", "Artifact Atlas Local")

        # -- Storage directories (relative to repo root; env overrides are absolute-safe)
        reg_dir_raw = os.environ.get("ATLAS_REGISTRY_DIR") or storage.get(
            "registry_dir", "registry"
        )
        self.registry_dir: Path = _make_absolute(reg_dir_raw, _REPO_ROOT)

        exports_dir_raw = os.environ.get("ATLAS_EXPORTS_DIR") or exports_cfg.get(
            "context_packs_dir", "exports/context-packs"
        )
        self.context_packs_dir: Path = _make_absolute(exports_dir_raw, _REPO_ROOT)

        reports_dir_raw = os.environ.get("ATLAS_REPORTS_DIR") or exports_cfg.get(
            "reports_dir", "exports/reports"
        )
        self.reports_dir: Path = _make_absolute(reports_dir_raw, _REPO_ROOT)

        thumbnails_dir_raw = storage.get("thumbnails_dir", "assets/thumbnails")
        self.thumbnails_dir: Path = _make_absolute(thumbnails_dir_raw, _REPO_ROOT)

        previews_dir_raw = storage.get("previews_dir", "assets/previews")
        self.previews_dir: Path = _make_absolute(previews_dir_raw, _REPO_ROOT)

        # -- Integration export directories (Phase 4 adapters)
        meatywiki_dir_raw = exports_cfg.get("meatywiki_dir", "exports/meatywiki")
        self.meatywiki_dir: Path = _make_absolute(meatywiki_dir_raw, _REPO_ROOT)

        ccdash_events_path_raw = exports_cfg.get(
            "ccdash_events_path", "exports/events/ccdash-events.jsonl"
        )
        self.ccdash_events_path: Path = _make_absolute(ccdash_events_path_raw, _REPO_ROOT)

        control_plane_dir_raw = exports_cfg.get("control_plane_dir", "exports/control-plane")
        self.control_plane_dir: Path = _make_absolute(control_plane_dir_raw, _REPO_ROOT)

        skillmeat_candidates_dir_raw = exports_cfg.get(
            "skillmeat_candidates_dir", "exports/skillmeat/candidates"
        )
        self.skillmeat_candidates_dir: Path = _make_absolute(
            skillmeat_candidates_dir_raw, _REPO_ROOT
        )

        intenttree_link_dir_raw = exports_cfg.get("intenttree_link_dir", "exports/intenttree")
        self.intenttree_link_dir: Path = _make_absolute(intenttree_link_dir_raw, _REPO_ROOT)

        # -- Policy defaults (D-009)
        self.default_sensitivity: str = (
            os.environ.get("ATLAS_DEFAULT_SENSITIVITY")
            or policy_cfg.get("default_sensitivity", "personal")
        )
        self.default_agent_access: str = (
            os.environ.get("ATLAS_DEFAULT_AGENT_ACCESS")
            or policy_cfg.get("default_agent_access", "metadata_only")
        )
        self.automated_promotion_allowed: bool = bool(
            policy_cfg.get("automated_promotion_allowed", False)
        )
        self.agent_full_content_sensitivity_cap: list[str] = list(
            policy_cfg.get(
                "agent_full_content_sensitivity_cap",
                ["work_sensitive", "client_sensitive", "restricted"],
            )
        )
        self.require_human_approval_for: list[str] = list(
            policy_cfg.get("require_human_approval_for", ["canonical_promotion"])
        )

        # -- Auth defaults
        auth_cfg = cfg.get("auth", {})
        self.bind_host: str = auth_cfg.get("bind_host", "127.0.0.1")
        self.bind_port: int = int(auth_cfg.get("bind_port", 8000))

    # -- Convenience path helpers ----------------------------------------

    def registry_file(self, filename: str) -> Path:
        """Return absolute path to a file inside registry_dir."""
        return self.registry_dir / filename

    def context_pack_file(self, filename: str) -> Path:
        """Return absolute path to a file inside context_packs_dir."""
        return self.context_packs_dir / filename


def _make_absolute(raw: str, base: Path) -> Path:
    """If raw is a relative path, resolve it relative to base."""
    p = Path(raw)
    if p.is_absolute():
        return p
    return (base / p).resolve()


# ---------------------------------------------------------------------------
# Singleton / getter
# ---------------------------------------------------------------------------

# Module-level cache — reset via _reset_settings() in tests
_settings_instance: Settings | None = None


@lru_cache(maxsize=1)
def _cached_settings() -> Settings:
    """LRU-cached settings instance (broken by _reset_settings)."""
    return Settings()


def get_settings() -> Settings:
    """Return the global Settings singleton.

    In production code, import and call this function.
    In tests, use ``override_settings()`` context manager or call
    ``_reset_settings()`` + set env vars before calling get_settings().
    """
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = Settings()
    return _settings_instance


def _reset_settings() -> None:
    """Clear the singleton so the next get_settings() call re-reads config.

    Intended for test isolation only.
    """
    global _settings_instance
    _settings_instance = None
    _cached_settings.cache_clear()
