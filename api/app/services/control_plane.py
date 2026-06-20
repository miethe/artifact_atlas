"""Control Plane signal export adapter (CP-CTRL-001).

Responsibilities:
- Generate project snapshot/routing signal YAML from BOM coverage, gaps,
  available context packs, canonical assets, and policy state.
- Export to exports/control-plane/snapshot-{project_id}-{timestamp}.yaml.
- Matches the routing input format from spec §16.6 and config/integrations.yaml.
- No live API calls; no read of Control Plane data in MVP.

Hard rules:
- Exports are YAML snapshots on demand; never pushed to a live endpoint.
- Sensitive asset IDs are included (IDs only — no content).
- Each snapshot uses a deterministic filename with project_id + timestamp.
"""

from __future__ import annotations

import logging
import os
import tempfile
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
from pathlib import Path
from typing import Any

try:
    import yaml as _yaml  # type: ignore[import-untyped]
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False

_SCHEMA_VERSION = "v1"


# ---------------------------------------------------------------------------
# Snapshot builder
# ---------------------------------------------------------------------------


def build_snapshot(
    *,
    project_id: str,
    active_node_id: str | None = None,
    bom_coverage: dict[str, float] | None = None,
    critical_gaps: list[str] | None = None,
    available_context_packs: list[str] | None = None,
    canonical_assets: list[str] | None = None,
    policy_flags: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a control plane routing signal snapshot dict.

    Matches the spec §16.6 artifact_context_signal format.

    Args:
        project_id: Project this snapshot covers.
        active_node_id: Active IntentTree node (nullable).
        bom_coverage: Per-domain coverage scores e.g. {"frontend_design": 0.75}.
        critical_gaps: List of slot IDs with missing/blocked/stale status.
        available_context_packs: List of published context pack IDs.
        canonical_assets: List of canonical asset IDs.
        policy_flags: Optional policy state flags.
        metadata: Optional additional metadata.

    Returns:
        Snapshot dict matching spec format.
    """
    return {
        "artifact_context_signal": {
            "project_id": project_id,
            "active_node_id": active_node_id,
            "bom_coverage": bom_coverage or {},
            "critical_gaps": critical_gaps or [],
            "available_context_packs": available_context_packs or [],
            "canonical_assets": canonical_assets or [],
            "policy_flags": policy_flags or {},
            "metadata": metadata or {},
            "generated_at": datetime.now(tz=timezone.utc).isoformat(),
            "schema_version": _SCHEMA_VERSION,
        }
    }


def _snapshot_filename(project_id: str, ts: str) -> str:
    """Build deterministic snapshot filename."""
    safe_pid = project_id.replace("/", "_")[:40]
    return f"snapshot-{safe_pid}-{ts}.yaml"


def _serialize_snapshot(data: dict[str, Any]) -> str:
    """Serialize snapshot to YAML (or JSON fallback)."""
    if _YAML_AVAILABLE:
        return _yaml.dump(data, allow_unicode=True, sort_keys=False, default_flow_style=False)
    import json
    return json.dumps(data, indent=2, default=str) + "\n"


# ---------------------------------------------------------------------------
# ControlPlaneExporter
# ---------------------------------------------------------------------------


class ControlPlaneExporter:
    """Generates and exports project routing signal snapshots.

    Usage:
        exporter = ControlPlaneExporter(export_dir=settings.control_plane_dir)
        result = exporter.export_snapshot(project_id="proj_123", ...)
    """

    def __init__(self, export_dir: Path) -> None:
        self._export_dir = export_dir

    def export_snapshot(
        self,
        *,
        project_id: str,
        active_node_id: str | None = None,
        bom_coverage: dict[str, float] | None = None,
        critical_gaps: list[str] | None = None,
        available_context_packs: list[str] | None = None,
        canonical_assets: list[str] | None = None,
        policy_flags: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate and export a project snapshot YAML.

        Returns dict with: path (str), snapshot (dict).
        """
        ts = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        snapshot = build_snapshot(
            project_id=project_id,
            active_node_id=active_node_id,
            bom_coverage=bom_coverage,
            critical_gaps=critical_gaps,
            available_context_packs=available_context_packs,
            canonical_assets=canonical_assets,
            policy_flags=policy_flags,
            metadata=metadata,
        )

        filename = _snapshot_filename(project_id, ts)
        dest = self._export_dir / filename
        dest.parent.mkdir(parents=True, exist_ok=True)

        content = _serialize_snapshot(snapshot)
        fd, tmp = tempfile.mkstemp(
            prefix=f"snapshot-{project_id[:20]}_", suffix=".tmp", dir=dest.parent
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(content)
            os.replace(tmp, str(dest))
        except Exception:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

        return {
            "path": str(dest),
            "snapshot": snapshot,
            "project_id": project_id,
        }

    def export_from_services(
        self,
        *,
        project_id: str,
        registry_dir: Path,
        active_node_id: str | None = None,
    ) -> dict[str, Any]:
        """Build a snapshot by querying live Atlas service state.

        Reads BOM coverage, gaps, context packs, and canonical assets
        from the registry. Falls back gracefully if data is unavailable.

        Args:
            project_id: Project to snapshot.
            registry_dir: Path to Atlas registry directory.
            active_node_id: Optional active IntentTree node.

        Returns:
            Same as export_snapshot().
        """
        bom_coverage: dict[str, float] = {}
        critical_gaps: list[str] = []
        available_context_packs: list[str] = []
        canonical_assets: list[str] = []
        policy_flags: dict[str, Any] = {}

        # -- BOM coverage and gaps
        try:
            from app.repositories.bom import BomRepository
            bom_repo = BomRepository(registry_dir)
            boms = bom_repo.list(project_id=project_id)
            for bom in boms:
                slots = bom_repo.list_slots(bom.id)
                if not slots:
                    continue
                # Group by domain for per-domain coverage
                domain_totals: dict[str, list[str]] = {}
                domain_complete: dict[str, int] = {}
                for slot in slots:
                    sv = slot.status.value if hasattr(slot.status, "value") else str(slot.status)
                    domain = slot.domain
                    domain_totals.setdefault(domain, [])
                    domain_totals[domain].append(sv)
                    if sv in ("complete",):
                        domain_complete[domain] = domain_complete.get(domain, 0) + 1
                    if sv in ("missing", "stale", "blocked"):
                        critical_gaps.append(slot.id)
                for domain, statuses in domain_totals.items():
                    total = len(statuses)
                    complete = domain_complete.get(domain, 0)
                    bom_coverage[domain] = round(complete / total, 3) if total > 0 else 0.0
        except Exception as exc:  # noqa: BLE001
            logger.warning("BOM coverage read failed for project %s: %s", project_id, exc)

        # -- Available context packs (published)
        try:
            from app.repositories.context_packs import ContextPackRepository
            cp_repo = ContextPackRepository(registry_dir)
            packs = cp_repo.list(project_id=project_id)
            for pack in packs:
                sv = pack.status.value if hasattr(pack.status, "value") else str(pack.status)
                if sv == "published":
                    available_context_packs.append(pack.id)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Context pack read failed for project %s: %s", project_id, exc)

        # -- Canonical assets
        try:
            from app.repositories.assets import AssetRepository
            asset_repo = AssetRepository(registry_dir)
            assets = asset_repo.list(project_id=project_id)
            for asset in assets:
                sv = asset.status.value if hasattr(asset.status, "value") else str(asset.status)
                if sv == "canonical":
                    canonical_assets.append(asset.id)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Canonical assets read failed for project %s: %s", project_id, exc)

        # -- Policy flags from settings
        try:
            from app.settings import get_settings
            settings = get_settings()
            policy_flags = {
                "automated_promotion_allowed": settings.automated_promotion_allowed,
                "default_sensitivity": settings.default_sensitivity,
                "default_agent_access": settings.default_agent_access,
            }
        except Exception as exc:  # noqa: BLE001
            logger.warning("Policy flags read failed: %s", exc)

        return self.export_snapshot(
            project_id=project_id,
            active_node_id=active_node_id,
            bom_coverage=bom_coverage,
            critical_gaps=critical_gaps,
            available_context_packs=available_context_packs,
            canonical_assets=canonical_assets,
            policy_flags=policy_flags,
        )
