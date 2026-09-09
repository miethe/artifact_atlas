"""Persist collector snapshots and compose the read-only fleet overview."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.overview import (
    FleetSnapshot,
    LatestReport,
    OverviewDerived,
    OverviewProject,
    OverviewResponse,
    OverviewSource,
)
from app.repositories.fleet_snapshots import FleetSnapshotRepository
from app.repositories.projects import ProjectRepository
from app.services.reports import ReportService

_SECRET_KEY = re.compile(
    r"(?i)(?:^|[_-])(?:api[_-]?key|access[_-]?token|auth[_-]?token|token|secret|password|credential|private[_-]?key|authorization)$"
)
_SECRET_VALUE = re.compile(
    r"(?i)(?:bearer\s+[a-z0-9._~+/=-]{12,}|(?:token|api[_-]?key|password)\s*[:=]\s*\S+|github_pat_[a-z0-9_]{12,}|gh[pousr]_[a-z0-9]{12,}|(?:AKIA|ASIA)[A-Z0-9]{16}|xox[baprs]-[a-z0-9-]{10,}|sk-[a-z0-9]{16,}|://[^/\s:@]+:[^/\s@]+@)"
)


def _contains_secret(value: Any) -> bool:
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(key, str) and _SECRET_KEY.search(key) and item not in (None, "", False):
                return True
            if _contains_secret(item):
                return True
        return False
    if isinstance(value, list):
        return any(_contains_secret(item) for item in value)
    return isinstance(value, str) and _SECRET_VALUE.search(value) is not None


def _report_generated_at(asset: Any) -> datetime:
    raw = (asset.metadata or {}).get("generated_at")
    if isinstance(raw, str):
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            pass
    return asset.captured_at or datetime.min.replace(tzinfo=timezone.utc)


class OverviewService:
    def __init__(self, registry_dir: Path) -> None:
        self._snapshots = FleetSnapshotRepository(registry_dir)
        self._reports = ReportService(registry_dir)
        self._projects = ProjectRepository(registry_dir)

    def ingest(self, snapshot: FleetSnapshot) -> FleetSnapshot:
        if _contains_secret(snapshot.model_dump(mode="json")):
            raise ValueError("fleet snapshot contains secret-shaped content")
        if set(snapshot.derived.projects) != set(snapshot.authored.projects):
            raise ValueError("derived and authored project membership must match")
        return self._snapshots.put_if_newer(snapshot)

    def get_overview(self) -> OverviewResponse | None:
        """Read persisted files only: no subprocess, tracker, or network calls."""
        snapshot = self._snapshots.get_latest()
        if snapshot is None:
            return None
        reports, _ = self._reports.list_reports(routes=["program", "dossier"])
        registered_project_ids = {project.id for project in self._projects.list()}
        latest_by_project: dict[str, Any] = {}
        latest_by_subject: dict[str, Any] = {}
        for report in reports:
            if report.project_id and report.project_id not in latest_by_project:
                latest_by_project[report.project_id] = report
            subject = (report.metadata or {}).get("subject")
            if isinstance(subject, str) and subject and subject not in latest_by_subject:
                latest_by_subject[subject] = report

        projects: list[OverviewProject] = []
        for slug, derived in sorted(snapshot.derived.projects.items()):
            authored = snapshot.authored.projects.get(slug)
            if authored is None:
                continue
            candidates = [
                report
                for report in (
                    latest_by_project.get(derived.project_id),
                    latest_by_subject.get(derived.slug),
                )
                if report is not None
            ]
            report = max(candidates, key=_report_generated_at) if candidates else None
            latest = None
            if report is not None:
                route = str((report.metadata or {}).get("route") or "program")
                latest = LatestReport(
                    asset_id=report.id,
                    title=report.title,
                    route=route,
                    generated_at=_report_generated_at(report),
                    href=f"/api/preview/asset/{report.id}/html",
                )
            projects.append(
                OverviewProject(
                    id=derived.project_id,
                    slug=derived.slug,
                    name=derived.name,
                    project_href=(
                        f"/projects/{derived.project_id}"
                        if derived.project_id in registered_project_ids
                        else None
                    ),
                    authored=authored,
                    derived=OverviewDerived(
                        tree_id=derived.tree_id, metrics=derived.metrics
                    ),
                    latest_report=latest,
                )
            )
        return OverviewResponse(
            schema_version=snapshot.schema_version,
            generated_at=snapshot.generated_at,
            source=OverviewSource(
                collector_version=snapshot.collector_version,
                snapshot_id="fleet_snapshot_latest",
            ),
            projects=projects,
        )
