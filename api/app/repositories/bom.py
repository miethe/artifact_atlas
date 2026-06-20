"""BOM repository: CRUD over registry/bom.jsonl, bom_slots.jsonl, bom_assignments.jsonl."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.bom import (
    Bom,
    BomAssignment,
    BomSlot,
    BomUpdate,
    SlotAssignRequest,
)
from app.repositories import jsonl as _jl

_BOM_FILE = "bom.jsonl"
_SLOTS_FILE = "bom_slots.jsonl"
_ASSIGNMENTS_FILE = "bom_assignments.jsonl"


class BomRepository:
    """CRUD operations for Bom, BomSlot, and BomAssignment records."""

    def __init__(self, registry_dir: Path) -> None:
        self._bom_path = registry_dir / _BOM_FILE
        self._slots_path = registry_dir / _SLOTS_FILE
        self._assignments_path = registry_dir / _ASSIGNMENTS_FILE

    # ------------------------------------------------------------------
    # Bom – read
    # ------------------------------------------------------------------

    def list(
        self,
        *,
        project_id: str | None = None,
        include_deleted: bool = False,
    ) -> list[Bom]:
        """Return all non-tombstoned BOMs, optionally filtered by project_id."""
        records = _jl.read_all(self._bom_path, include_deleted=include_deleted)
        if project_id is not None:
            records = [r for r in records if r.get("project_id") == project_id]
        return [Bom.model_validate(r) for r in records]

    def get(self, bom_id: str) -> Bom | None:
        """Return a single BOM by ID, or None."""
        record = _jl.read_by_id(self._bom_path, bom_id)
        if record is None:
            return None
        return Bom.model_validate(record)

    def get_for_project(self, project_id: str) -> Bom | None:
        """Return the first active BOM for a project, or None."""
        matches = _jl.read_where(
            self._bom_path,
            lambda r: r.get("project_id") == project_id,
        )
        if not matches:
            return None
        return Bom.model_validate(matches[0])

    # ------------------------------------------------------------------
    # Bom – create / update / delete
    # ------------------------------------------------------------------

    def create(
        self,
        bom_id: str,
        project_id: str,
        name: str,
        *,
        source_templates: list[str] | None = None,
    ) -> Bom:
        """Persist a new BOM header record."""
        now = datetime.now(tz=timezone.utc).isoformat()
        record: dict[str, Any] = {
            "id": bom_id,
            "project_id": project_id,
            "name": name,
            "status": "active",
            "source_templates": source_templates or [],
            "coverage_score": 0.0,
            "created_at": now,
            "updated_at": now,
        }
        _jl.append_record(self._bom_path, record)
        return Bom.model_validate(record)

    def update(self, bom_id: str, data: BomUpdate) -> Bom | None:
        """Partially update a BOM header.  Preserves unknown fields.

        Returns updated Bom or None if not found.
        """
        patch: dict[str, Any] = {
            k: v
            for k, v in data.model_dump(mode="json").items()
            if v is not None
        }
        patch["updated_at"] = datetime.now(tz=timezone.utc).isoformat()
        updated = _jl.update_record(self._bom_path, bom_id, patch)
        if updated is None:
            return None
        return Bom.model_validate(updated)

    def update_coverage_score(self, bom_id: str, score: float) -> Bom | None:
        """Update coverage_score on a BOM."""
        patch = {
            "coverage_score": score,
            "updated_at": datetime.now(tz=timezone.utc).isoformat(),
        }
        updated = _jl.update_record(self._bom_path, bom_id, patch)
        if updated is None:
            return None
        return Bom.model_validate(updated)

    def delete(self, bom_id: str) -> bool:
        """Tombstone a BOM record.

        Returns True if found and tombstoned.
        """
        result = _jl.tombstone_record(self._bom_path, bom_id)
        return result is not None

    # ------------------------------------------------------------------
    # BomSlot – read
    # ------------------------------------------------------------------

    def list_slots(
        self,
        bom_id: str,
        *,
        include_deleted: bool = False,
    ) -> list[BomSlot]:
        """Return all slots for a given BOM."""
        records = _jl.read_where(
            self._slots_path,
            lambda r: r.get("bom_id") == bom_id,
            include_deleted=include_deleted,
        )
        return [BomSlot.model_validate(r) for r in records]

    def get_slot(self, slot_id: str) -> BomSlot | None:
        """Return a single BOM slot by ID."""
        record = _jl.read_by_id(self._slots_path, slot_id)
        if record is None:
            return None
        return BomSlot.model_validate(record)

    # ------------------------------------------------------------------
    # BomSlot – create / update / delete
    # ------------------------------------------------------------------

    def create_slot(
        self,
        slot_id: str,
        bom_id: str,
        artifact_type_id: str,
        domain: str,
        *,
        required: bool = True,
        phase: str | None = None,
        min_assets: int = 1,
        max_assets: int | None = None,
        staleness_days: int | None = None,
        guidance: str | None = None,
        linked_intenttree_node_id: str | None = None,
    ) -> BomSlot:
        """Persist a new BOM slot."""
        record: dict[str, Any] = {
            "id": slot_id,
            "bom_id": bom_id,
            "artifact_type_id": artifact_type_id,
            "domain": domain,
            "required": required,
            "status": "missing",
            "min_assets": min_assets,
        }
        if phase is not None:
            record["phase"] = phase
        if max_assets is not None:
            record["max_assets"] = max_assets
        if staleness_days is not None:
            record["staleness_days"] = staleness_days
        if guidance is not None:
            record["guidance"] = guidance
        if linked_intenttree_node_id is not None:
            record["linked_intenttree_node_id"] = linked_intenttree_node_id
        _jl.append_record(self._slots_path, record)
        return BomSlot.model_validate(record)

    def update_slot(self, slot_id: str, patch: dict[str, Any]) -> BomSlot | None:
        """Apply a partial patch to a BOM slot.

        Returns updated BomSlot or None if not found.
        """
        updated = _jl.update_record(self._slots_path, slot_id, patch)
        if updated is None:
            return None
        return BomSlot.model_validate(updated)

    def delete_slot(self, slot_id: str) -> bool:
        """Tombstone a BOM slot."""
        result = _jl.tombstone_record(self._slots_path, slot_id)
        return result is not None

    # ------------------------------------------------------------------
    # BomAssignment – read / create / update / delete
    # ------------------------------------------------------------------

    def list_assignments(
        self,
        slot_id: str,
        *,
        include_deleted: bool = False,
    ) -> list[BomAssignment]:
        """Return all assignments for a slot."""
        records = _jl.read_where(
            self._assignments_path,
            lambda r: r.get("slot_id") == slot_id,
            include_deleted=include_deleted,
        )
        return [BomAssignment.model_validate(r) for r in records]

    def get_assignment(self, assignment_id: str) -> BomAssignment | None:
        """Return a single assignment by ID."""
        record = _jl.read_by_id(self._assignments_path, assignment_id)
        if record is None:
            return None
        return BomAssignment.model_validate(record)

    def create_assignment(
        self,
        assignment_id: str,
        data: SlotAssignRequest,
        *,
        assigned_by: str = "user",
    ) -> BomAssignment:
        """Persist a new slot assignment."""
        now = datetime.now(tz=timezone.utc).isoformat()
        record: dict[str, Any] = {
            "id": assignment_id,
            "slot_id": data.slot_id or "",
            "asset_id": data.asset_id,
            "assignment_status": data.assignment_status,
            "assigned_by": assigned_by,
            "assigned_at": now,
        }
        if data.confidence is not None:
            record["confidence"] = data.confidence
        if data.notes is not None:
            record["notes"] = data.notes
        _jl.append_record(self._assignments_path, record)
        return BomAssignment.model_validate(record)

    def update_assignment_status(
        self, assignment_id: str, status: str
    ) -> BomAssignment | None:
        """Update the assignment_status of an existing assignment."""
        patch = {"assignment_status": status}
        updated = _jl.update_record(self._assignments_path, assignment_id, patch)
        if updated is None:
            return None
        return BomAssignment.model_validate(updated)

    def delete_assignment(self, assignment_id: str) -> bool:
        """Tombstone an assignment record."""
        result = _jl.tombstone_record(self._assignments_path, assignment_id)
        return result is not None
