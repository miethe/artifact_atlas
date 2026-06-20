"""Project repository: CRUD over registry/projects.jsonl."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.project import Project, ProjectCreate, ProjectUpdate
from app.repositories import jsonl as _jl

_REGISTRY_FILE = "projects.jsonl"


class ProjectRepository:
    """CRUD operations for Project records stored in a JSONL registry file."""

    def __init__(self, registry_dir: Path) -> None:
        self._path = registry_dir / _REGISTRY_FILE

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def list(self, *, include_deleted: bool = False) -> list[Project]:
        """Return all non-tombstoned projects."""
        records = _jl.read_all(self._path, include_deleted=include_deleted)
        return [Project.model_validate(r) for r in records]

    def get(self, project_id: str) -> Project | None:
        """Return a single project by ID, or None if not found."""
        record = _jl.read_by_id(self._path, project_id)
        if record is None:
            return None
        return Project.model_validate(record)

    def get_by_slug(self, slug: str) -> Project | None:
        """Return the first project whose slug matches, or None."""
        matches = _jl.read_where(
            self._path, lambda r: r.get("slug") == slug
        )
        if not matches:
            return None
        return Project.model_validate(matches[0])

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create(self, project_id: str, data: ProjectCreate) -> Project:
        """Persist a new project record.

        Args:
            project_id: Pre-generated ID (caller's responsibility to ensure uniqueness).
            data: Validated create payload.

        Returns:
            The persisted Project.
        """
        now = datetime.now(tz=timezone.utc).isoformat()
        record: dict[str, Any] = {
            "id": project_id,
            **data.model_dump(mode="json", exclude_none=False),
            "created_at": now,
            "updated_at": now,
        }
        _jl.append_record(self._path, record)
        return Project.model_validate(record)

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    def update(self, project_id: str, data: ProjectUpdate) -> Project | None:
        """Partially update an existing project record.

        Only non-None fields in *data* are written. Unknown / extra fields
        already stored are preserved.

        Returns:
            The updated Project, or None if not found.
        """
        patch: dict[str, Any] = {
            k: v
            for k, v in data.model_dump(mode="json").items()
            if v is not None
        }
        patch["updated_at"] = datetime.now(tz=timezone.utc).isoformat()
        updated = _jl.update_record(self._path, project_id, patch)
        if updated is None:
            return None
        return Project.model_validate(updated)

    # ------------------------------------------------------------------
    # Delete (tombstone)
    # ------------------------------------------------------------------

    def delete(self, project_id: str) -> bool:
        """Tombstone a project record.

        Returns True if the record existed and was tombstoned; False otherwise.
        """
        result = _jl.tombstone_record(self._path, project_id)
        return result is not None
