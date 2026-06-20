"""Integrations router.

Routes:
  GET  /api/integrations
  POST /api/integrations/{integrationId}/sync
  GET  /api/integrations/{integrationId}/status
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter

from app.api._deps import not_found
from app.models.integration import IntegrationStatus
from app.models.vocabulary import IntegrationSyncMode, IntegrationSyncStatus

router = APIRouter(prefix="/api", tags=["integrations"])

# ---------------------------------------------------------------------------
# Config loader — reads config/integrations.yaml once at module level
# ---------------------------------------------------------------------------

_INTEGRATIONS_CACHE: dict[str, IntegrationStatus] | None = None


def _load_integrations() -> dict[str, IntegrationStatus]:
    """Load integration statuses from config/integrations.yaml."""
    global _INTEGRATIONS_CACHE
    if _INTEGRATIONS_CACHE is not None:
        return _INTEGRATIONS_CACHE

    result: dict[str, IntegrationStatus] = {}

    try:
        import yaml  # type: ignore[import-untyped]
        config_path = Path(__file__).resolve().parents[4] / "config" / "integrations.yaml"
        if config_path.exists():
            with config_path.open("r", encoding="utf-8") as fh:
                data = yaml.safe_load(fh) or {}
            for name, cfg in data.get("integrations", {}).items():
                status_raw = cfg.get("status", "mvp_file_based")
                enabled = status_raw != "disabled"
                # Determine sync mode
                mvp_write = cfg.get("mvp_write", {})
                if mvp_write.get("enabled", False):
                    sync_mode = IntegrationSyncMode.file_export
                else:
                    sync_mode = IntegrationSyncMode.disabled
                export_path = mvp_write.get("export_path") or mvp_write.get("events_export_path")
                result[name] = IntegrationStatus(
                    id=name,
                    name=name.replace("_", " ").title(),
                    enabled=enabled,
                    sync_mode=sync_mode,
                    last_sync_status=None,
                    export_path=export_path,
                )
    except Exception:
        pass

    # Fallback — always include known integrations even if config missing
    defaults = {
        "meatywiki": ("MeatyWiki", True, IntegrationSyncMode.file_export),
        "intenttree": ("IntentTree", True, IntegrationSyncMode.file_export),
        "skillmeat": ("SkillMeat", True, IntegrationSyncMode.file_export),
        "ccdash": ("CCDash", True, IntegrationSyncMode.file_export),
        "control_plane": ("Control Plane", True, IntegrationSyncMode.file_export),
        "local_folders": ("Local Folders", True, IntegrationSyncMode.disabled),
    }
    for key, (name, enabled, mode) in defaults.items():
        if key not in result:
            result[key] = IntegrationStatus(
                id=key,
                name=name,
                enabled=enabled,
                sync_mode=mode,
            )

    _INTEGRATIONS_CACHE = result
    return result


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/integrations")
def list_integrations() -> dict:
    """List configured integrations and their status."""
    integrations = list(_load_integrations().values())
    return {"integrations": [i.model_dump(mode="json") for i in integrations]}


@router.post("/integrations/{integrationId}/sync", status_code=202)
def trigger_integration_sync(integrationId: str) -> dict:
    """Trigger a sync for an integration."""
    integrations = _load_integrations()
    if integrationId not in integrations:
        return not_found(f"Integration '{integrationId}' not found.")  # type: ignore[return-value]

    task_id = f"task_{uuid.uuid4().hex[:12]}"
    return {"task_id": task_id, "integration_id": integrationId}


@router.get("/integrations/{integrationId}/status", response_model=IntegrationStatus)
def get_integration_status(integrationId: str) -> IntegrationStatus:
    """Get the current status of an integration."""
    integrations = _load_integrations()
    integration = integrations.get(integrationId)
    if integration is None:
        return not_found(f"Integration '{integrationId}' not found.")  # type: ignore[return-value]
    return integration
