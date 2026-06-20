"""Project service (SVC-001): project CRUD/list + dashboard aggregate counts.

Thin business-logic wrapper over ProjectRepository and AssetRepository.
Dashboard aggregate counts are computed in-memory from repository reads (local-first).
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from app.models.project import Project, ProjectCreate, ProjectUpdate
from app.repositories.assets import AssetRepository
from app.repositories.bom import BomRepository
from app.repositories.projects import ProjectRepository


class DashboardCounts:
    """Aggregate counts for a project dashboard tile."""

    __slots__ = (
        "total_assets",
        "inbox_assets",
        "canonical_assets",
        "archived_assets",
        "bom_coverage_score",
        "missing_slots",
    )

    def __init__(
        self,
        *,
        total_assets: int = 0,
        inbox_assets: int = 0,
        canonical_assets: int = 0,
        archived_assets: int = 0,
        bom_coverage_score: float = 0.0,
        missing_slots: int = 0,
    ) -> None:
        self.total_assets = total_assets
        self.inbox_assets = inbox_assets
        self.canonical_assets = canonical_assets
        self.archived_assets = archived_assets
        self.bom_coverage_score = bom_coverage_score
        self.missing_slots = missing_slots

    def as_dict(self) -> dict[str, Any]:
        return {
            "total_assets": self.total_assets,
            "inbox_assets": self.inbox_assets,
            "canonical_assets": self.canonical_assets,
            "archived_assets": self.archived_assets,
            "bom_coverage_score": self.bom_coverage_score,
            "missing_slots": self.missing_slots,
        }


class ProjectService:
    """CRUD + dashboard aggregates for projects."""

    def __init__(self, registry_dir: Path) -> None:
        self._projects = ProjectRepository(registry_dir)
        self._assets = AssetRepository(registry_dir)
        self._boms = BomRepository(registry_dir)

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def list_projects(self) -> list[Project]:
        """Return all active (non-tombstoned) projects."""
        return self._projects.list()

    def get_project(self, project_id: str) -> Project | None:
        """Return a project by ID, or None."""
        return self._projects.get(project_id)

    def get_project_by_slug(self, slug: str) -> Project | None:
        """Return the first project with a matching slug."""
        return self._projects.get_by_slug(slug)

    def create_project(self, data: ProjectCreate, *, project_id: str | None = None) -> Project:
        """Create a new project.

        Args:
            data: Validated create payload.
            project_id: Optional pre-generated ID. If omitted, one is generated.

        Returns:
            The persisted Project.
        """
        pid = project_id or f"proj_{uuid.uuid4().hex[:16]}"
        return self._projects.create(pid, data)

    def update_project(self, project_id: str, data: ProjectUpdate) -> Project | None:
        """Partially update a project. Returns None if not found."""
        return self._projects.update(project_id, data)

    def delete_project(self, project_id: str) -> bool:
        """Tombstone a project. Returns True if found and deleted."""
        return self._projects.delete(project_id)

    # ------------------------------------------------------------------
    # Dashboard aggregate counts
    # ------------------------------------------------------------------

    def get_dashboard_counts(self, project_id: str) -> DashboardCounts:
        """Compute aggregate dashboard counts for a project.

        Scans assets and BOM slots in-memory (local-first, no DB).
        Returns DashboardCounts with zero values if project has no data yet.

        Args:
            project_id: The project to aggregate.

        Returns:
            DashboardCounts with fields populated from live registry data.
        """
        assets = self._assets.list(project_id=project_id)

        total = len(assets)
        inbox = sum(1 for a in assets if a.status.value == "inbox")
        canonical = sum(1 for a in assets if a.status.value == "canonical")
        archived = sum(1 for a in assets if a.status.value == "archived")

        # BOM coverage
        bom = self._boms.get_for_project(project_id)
        coverage_score = 0.0
        missing_slots = 0
        if bom is not None:
            coverage_score = bom.coverage_score or 0.0
            slots = self._boms.list_slots(bom.id)
            missing_slots = sum(1 for s in slots if s.status.value == "missing")

        return DashboardCounts(
            total_assets=total,
            inbox_assets=inbox,
            canonical_assets=canonical,
            archived_assets=archived,
            bom_coverage_score=coverage_score,
            missing_slots=missing_slots,
        )
