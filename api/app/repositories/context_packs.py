"""ContextPack repository: CRUD over registry/context_packs.jsonl and items."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.context_pack import (
    ContextPack,
    ContextPackCreate,
    ContextPackItem,
    ContextPackItemCreate,
    ContextPackUpdate,
)
from app.repositories import jsonl as _jl

_PACKS_FILE = "context_packs.jsonl"
_ITEMS_FILE = "context_pack_items.jsonl"


class ContextPackRepository:
    """CRUD operations for ContextPack and ContextPackItem records."""

    def __init__(self, registry_dir: Path) -> None:
        self._packs_path = registry_dir / _PACKS_FILE
        self._items_path = registry_dir / _ITEMS_FILE

    # ------------------------------------------------------------------
    # ContextPack – read
    # ------------------------------------------------------------------

    def list(
        self,
        *,
        project_id: str | None = None,
        include_deleted: bool = False,
    ) -> list[ContextPack]:
        """Return all non-tombstoned context packs."""
        records = _jl.read_all(self._packs_path, include_deleted=include_deleted)
        if project_id is not None:
            records = [r for r in records if r.get("project_id") == project_id]
        return [ContextPack.model_validate(r) for r in records]

    def get(self, pack_id: str) -> ContextPack | None:
        """Return a single context pack by ID, or None."""
        record = _jl.read_by_id(self._packs_path, pack_id)
        if record is None:
            return None
        return ContextPack.model_validate(record)

    # ------------------------------------------------------------------
    # ContextPack – create / update / delete
    # ------------------------------------------------------------------

    def create(
        self,
        pack_id: str,
        project_id: str,
        data: ContextPackCreate,
        *,
        created_by: str = "user",
    ) -> ContextPack:
        """Persist a new context pack header."""
        now = datetime.now(tz=timezone.utc).isoformat()
        # Dump the create payload but exclude the 'items' key — those go in the items file.
        payload = data.model_dump(mode="json", exclude={"items"})
        record: dict[str, Any] = {
            "id": pack_id,
            "project_id": project_id,
            "status": "draft",
            "created_by": created_by,
            "created_at": now,
            "updated_at": now,
            **payload,
        }
        _jl.append_record(self._packs_path, record)
        return ContextPack.model_validate(record)

    def update(self, pack_id: str, data: ContextPackUpdate) -> ContextPack | None:
        """Partially update a context pack header.  Excludes 'items' key."""
        patch: dict[str, Any] = {
            k: v
            for k, v in data.model_dump(mode="json", exclude={"items"}).items()
            if v is not None
        }
        patch["updated_at"] = datetime.now(tz=timezone.utc).isoformat()
        updated = _jl.update_record(self._packs_path, pack_id, patch)
        if updated is None:
            return None
        return ContextPack.model_validate(updated)

    def update_status(self, pack_id: str, status: str) -> ContextPack | None:
        """Update the status field of a context pack."""
        patch = {
            "status": status,
            "updated_at": datetime.now(tz=timezone.utc).isoformat(),
        }
        updated = _jl.update_record(self._packs_path, pack_id, patch)
        if updated is None:
            return None
        return ContextPack.model_validate(updated)

    def delete(self, pack_id: str) -> bool:
        """Tombstone a context pack."""
        result = _jl.tombstone_record(self._packs_path, pack_id)
        return result is not None

    # ------------------------------------------------------------------
    # ContextPackItem – read / create / delete
    # ------------------------------------------------------------------

    def list_items(
        self,
        pack_id: str,
        *,
        include_deleted: bool = False,
    ) -> list[ContextPackItem]:
        """Return all items for a context pack, ordered by display_order."""
        records = _jl.read_where(
            self._items_path,
            lambda r: r.get("context_pack_id") == pack_id,
            include_deleted=include_deleted,
        )
        # Sort by display_order ascending
        records.sort(key=lambda r: r.get("display_order", 0))
        return [ContextPackItem.model_validate(r) for r in records]

    def get_item(self, item_id: str) -> ContextPackItem | None:
        """Return a single pack item by ID."""
        record = _jl.read_by_id(self._items_path, item_id)
        if record is None:
            return None
        return ContextPackItem.model_validate(record)

    def add_item(
        self,
        item_id: str,
        pack_id: str,
        data: ContextPackItemCreate,
        *,
        auto_order: bool = True,
    ) -> ContextPackItem:
        """Append an item to a context pack.

        Args:
            item_id: Pre-generated ID for the new item.
            pack_id: Parent context pack ID.
            data: Validated item create payload.
            auto_order: If True and data.display_order is None, auto-assigns
                        max(existing display_order)+1.
        """
        display_order = data.display_order
        if display_order is None and auto_order:
            existing = self.list_items(pack_id)
            display_order = max((i.display_order for i in existing), default=-1) + 1
        elif display_order is None:
            display_order = 0

        record: dict[str, Any] = {
            "id": item_id,
            "context_pack_id": pack_id,
            "item_type": data.item_type,
            "item_id": data.item_id,
            "include_mode": data.include_mode,
            "display_order": display_order,
            "required": data.required,
        }
        _jl.append_record(self._items_path, record)
        return ContextPackItem.model_validate(record)

    def remove_item(self, item_id: str) -> bool:
        """Tombstone a context pack item."""
        result = _jl.tombstone_record(self._items_path, item_id)
        return result is not None

    def replace_items(
        self,
        pack_id: str,
        items: list[ContextPackItemCreate],
        *,
        generate_id: Any | None = None,
    ) -> list[ContextPackItem]:
        """Replace all items for a context pack.

        Tombstones existing items and creates new ones.

        Args:
            pack_id: Target context pack.
            items: New ordered list of items.
            generate_id: Optional callable returning a new unique ID string.
                         Defaults to a simple counter-based generator.
        """
        # Tombstone existing
        existing = self.list_items(pack_id)
        for item in existing:
            self.remove_item(item.id)

        # Create replacements
        if generate_id is None:
            import uuid
            def generate_id() -> str:  # type: ignore[misc]
                return f"item_{uuid.uuid4().hex[:12]}"

        result: list[ContextPackItem] = []
        for idx, item_data in enumerate(items):
            ordered = ContextPackItemCreate(
                item_type=item_data.item_type,
                item_id=item_data.item_id,
                include_mode=item_data.include_mode,
                display_order=item_data.display_order if item_data.display_order is not None else idx,
                required=item_data.required,
            )
            new_item = self.add_item(generate_id(), pack_id, ordered, auto_order=False)
            result.append(new_item)
        return result
