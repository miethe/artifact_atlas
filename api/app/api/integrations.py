"""Integrations router.

Routes:
  GET  /api/integrations
  POST /api/integrations/{integrationId}/sync
  GET  /api/integrations/{integrationId}/status
  POST /api/integrations/control-plane/snapshot
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)

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
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Could not load integrations.yaml (path=%s): %s — using built-in defaults.",
            config_path if "config_path" in dir() else "unknown",
            exc,
        )

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
def trigger_integration_sync(
    integrationId: str,
    project_id: str | None = Query(default=None, alias="projectId"),
    confirm: bool = Query(default=False),
) -> dict:
    """Trigger a sync for an integration.

    For file-based integrations, executes the local export adapter.
    - meatywiki: exports asset cards for all project assets (draft by default)
    - ccdash: flushes pending audit events to ccdash-events.jsonl
    - control_plane: generates a project snapshot YAML
    - intenttree: exports the node-link manifest
    - skillmeat: no active export (read-only in MVP)
    """
    integrations = _load_integrations()
    if integrationId not in integrations:
        return not_found(f"Integration '{integrationId}' not found.")  # type: ignore[return-value]

    task_id = f"task_{uuid.uuid4().hex[:12]}"
    result: dict[str, Any] = {
        "task_id": task_id,
        "integration_id": integrationId,
        "status": "queued",
    }

    try:
        from app.settings import get_settings
        settings = get_settings()

        if integrationId == "control_plane" and project_id:
            from app.services.control_plane import ControlPlaneExporter
            exporter = ControlPlaneExporter(settings.control_plane_dir)
            export_result = exporter.export_from_services(
                project_id=project_id,
                registry_dir=settings.registry_dir,
            )
            result["status"] = "completed"
            result["export_path"] = export_result.get("path")

        elif integrationId == "meatywiki" and project_id:
            from app.repositories.assets import AssetRepository
            from app.services.meatywiki_sync import MeatyWikiSync
            asset_repo = AssetRepository(settings.registry_dir)
            assets = asset_repo.list(project_id=project_id)
            sync = MeatyWikiSync(settings.meatywiki_dir)
            batch_results = sync.export_asset_cards_batch(assets, confirm=confirm)
            result["status"] = "completed"
            result["exported"] = sum(1 for r in batch_results if r.get("written"))
            result["skipped"] = sum(1 for r in batch_results if r.get("skipped"))

        elif integrationId == "ccdash":
            # Report the events file path — events are emitted inline by services
            events_path = settings.ccdash_events_path
            result["status"] = "completed"
            result["events_path"] = str(events_path)
            if events_path.exists():
                with events_path.open("r", encoding="utf-8") as fh:
                    result["event_count"] = sum(1 for line in fh if line.strip())

        else:
            result["status"] = "completed"
            result["note"] = f"Integration '{integrationId}' sync is file-based; no active export triggered."

    except Exception as exc:  # noqa: BLE001
        result["status"] = "error"
        result["error"] = str(exc)

    return result


@router.post("/integrations/control-plane/snapshot", status_code=201)
def create_control_plane_snapshot(
    project_id: str = Query(..., alias="projectId"),
    node_id: str | None = Query(default=None, alias="nodeId"),
) -> dict:
    """Generate a Control Plane routing signal snapshot for a project.

    Reads live Atlas state (BOM, context packs, canonical assets, policy)
    and writes a snapshot YAML to exports/control-plane/.
    """
    try:
        from app.settings import get_settings
        settings = get_settings()
        from app.services.control_plane import ControlPlaneExporter
        exporter = ControlPlaneExporter(settings.control_plane_dir)
        result = exporter.export_from_services(
            project_id=project_id,
            registry_dir=settings.registry_dir,
            active_node_id=node_id,
        )
        return {
            "path": result["path"],
            "project_id": project_id,
            "snapshot": result["snapshot"],
        }
    except Exception as exc:
        return {"error": str(exc), "project_id": project_id}


@router.get("/integrations/{integrationId}/status", response_model=IntegrationStatus)
def get_integration_status(integrationId: str) -> IntegrationStatus:
    """Get the current status of an integration."""
    integrations = _load_integrations()
    integration = integrations.get(integrationId)
    if integration is None:
        return not_found(f"Integration '{integrationId}' not found.")  # type: ignore[return-value]
    return integration
