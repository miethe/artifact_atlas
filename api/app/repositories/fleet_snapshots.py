"""Atomic persistence for the latest laptop-collected fleet snapshot."""

from __future__ import annotations

from pathlib import Path

from app.models.overview import FleetSnapshot
from app.repositories import jsonl as _jl

_ID = "fleet_snapshot_latest"


class FleetSnapshotRepository:
    def __init__(self, registry_dir: Path) -> None:
        self._path = registry_dir / "fleet_snapshots.jsonl"

    def get_latest(self) -> FleetSnapshot | None:
        record = _jl.read_by_id(self._path, _ID)
        if record is None:
            return None
        return FleetSnapshot.model_validate({k: v for k, v in record.items() if k != "id"})

    def put_if_newer(self, snapshot: FleetSnapshot) -> FleetSnapshot:
        current = self.get_latest()
        if current is not None and current.generated_at >= snapshot.generated_at:
            return current
        record = {"id": _ID, **snapshot.model_dump(mode="json")}
        if current is None:
            _jl.append_record(self._path, record)
        else:
            _jl.update_record(self._path, _ID, record, merge=False)
        return snapshot
