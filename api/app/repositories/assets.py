"""Asset repository: CRUD over registry/assets.jsonl, links.jsonl, relationships.jsonl."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.asset import (
    Asset,
    AssetCreate,
    AssetLink,
    AssetLinkCreate,
    AssetRelationship,
    AssetUpdate,
)
from app.repositories import jsonl as _jl

_ASSETS_FILE = "assets.jsonl"
_LINKS_FILE = "asset_links.jsonl"
_RELATIONSHIPS_FILE = "asset_relationships.jsonl"


class AssetRepository:
    """CRUD operations for Asset, AssetLink, and AssetRelationship records."""

    def __init__(self, registry_dir: Path) -> None:
        self._assets_path = registry_dir / _ASSETS_FILE
        self._links_path = registry_dir / _LINKS_FILE
        self._relationships_path = registry_dir / _RELATIONSHIPS_FILE

    # ------------------------------------------------------------------
    # Asset – read
    # ------------------------------------------------------------------

    def list(
        self,
        *,
        project_id: str | None = None,
        include_deleted: bool = False,
    ) -> list[Asset]:
        """Return all assets, optionally filtered by project_id."""
        records = _jl.read_all(self._assets_path, include_deleted=include_deleted)
        if project_id is not None:
            records = [r for r in records if r.get("project_id") == project_id]
        return [Asset.model_validate(r) for r in records]

    def get(self, asset_id: str) -> Asset | None:
        """Return a single asset by ID, or None if not found."""
        record = _jl.read_by_id(self._assets_path, asset_id)
        if record is None:
            return None
        return Asset.model_validate(record)

    # ------------------------------------------------------------------
    # Asset – create / update / delete
    # ------------------------------------------------------------------

    def create(self, asset_id: str, data: AssetCreate, *, project_id: str | None = None) -> Asset:
        """Persist a new asset record.

        Args:
            asset_id: Pre-generated ID (caller ensures uniqueness).
            data: Validated create payload.
            project_id: Optional project scope to embed in the record.

        Returns:
            The persisted Asset.
        """
        now = datetime.now(tz=timezone.utc).isoformat()
        record: dict[str, Any] = {
            "id": asset_id,
            **data.model_dump(mode="json", exclude_none=False),
            "captured_at": now,
            "last_indexed_at": now,
        }
        if project_id is not None:
            record["project_id"] = project_id
        _jl.append_record(self._assets_path, record)
        return Asset.model_validate(record)

    def update(self, asset_id: str, data: AssetUpdate) -> Asset | None:
        """Partially update an asset.  Preserves unknown fields.

        Returns:
            Updated Asset or None if not found.
        """
        patch: dict[str, Any] = {
            k: v
            for k, v in data.model_dump(mode="json").items()
            if v is not None
        }
        patch["last_indexed_at"] = datetime.now(tz=timezone.utc).isoformat()
        updated = _jl.update_record(self._assets_path, asset_id, patch)
        if updated is None:
            return None
        return Asset.model_validate(updated)

    def delete(self, asset_id: str) -> bool:
        """Tombstone an asset record.

        Returns True if the record existed and was tombstoned; False otherwise.
        """
        result = _jl.tombstone_record(self._assets_path, asset_id)
        return result is not None

    # ------------------------------------------------------------------
    # AssetLink – read / create / delete
    # ------------------------------------------------------------------

    def list_links(self, asset_id: str) -> list[AssetLink]:
        """Return all non-tombstoned links for a given asset."""
        records = _jl.read_where(
            self._links_path, lambda r: r.get("asset_id") == asset_id
        )
        return [AssetLink.model_validate(r) for r in records]

    def get_link(self, link_id: str) -> AssetLink | None:
        """Return a single link by ID."""
        record = _jl.read_by_id(self._links_path, link_id)
        if record is None:
            return None
        return AssetLink.model_validate(record)

    def create_link(
        self, link_id: str, asset_id: str, data: AssetLinkCreate
    ) -> AssetLink:
        """Persist a new AssetLink record."""
        now = datetime.now(tz=timezone.utc).isoformat()
        record: dict[str, Any] = {
            "id": link_id,
            "asset_id": asset_id,
            **data.model_dump(mode="json"),
            "created_at": now,
        }
        _jl.append_record(self._links_path, record)
        return AssetLink.model_validate(record)

    def delete_link(self, link_id: str) -> bool:
        """Tombstone a link record."""
        result = _jl.tombstone_record(self._links_path, link_id)
        return result is not None

    # ------------------------------------------------------------------
    # AssetRelationship – read / create / delete
    # ------------------------------------------------------------------

    def list_relationships(
        self,
        asset_id: str,
        *,
        direction: str = "both",
    ) -> list[AssetRelationship]:
        """Return relationships involving the given asset.

        Args:
            asset_id: Asset to filter by.
            direction: "source" | "target" | "both"
        """
        def _matches(r: dict[str, Any]) -> bool:
            if direction == "source":
                return r.get("source_asset_id") == asset_id
            if direction == "target":
                return r.get("target_asset_id") == asset_id
            return (
                r.get("source_asset_id") == asset_id
                or r.get("target_asset_id") == asset_id
            )

        records = _jl.read_where(self._relationships_path, _matches)
        return [AssetRelationship.model_validate(r) for r in records]

    def get_relationship(self, rel_id: str) -> AssetRelationship | None:
        """Return a single relationship by ID."""
        record = _jl.read_by_id(self._relationships_path, rel_id)
        if record is None:
            return None
        return AssetRelationship.model_validate(record)

    def create_relationship(
        self,
        rel_id: str,
        source_asset_id: str,
        target_asset_id: str,
        relationship_type: str,
        *,
        metadata: dict[str, Any] | None = None,
    ) -> AssetRelationship:
        """Persist a new AssetRelationship record."""
        now = datetime.now(tz=timezone.utc).isoformat()
        record: dict[str, Any] = {
            "id": rel_id,
            "source_asset_id": source_asset_id,
            "target_asset_id": target_asset_id,
            "relationship_type": relationship_type,
            "created_at": now,
        }
        if metadata is not None:
            record["metadata"] = metadata
        _jl.append_record(self._relationships_path, record)
        return AssetRelationship.model_validate(record)

    def delete_relationship(self, rel_id: str) -> bool:
        """Tombstone a relationship record."""
        result = _jl.tombstone_record(self._relationships_path, rel_id)
        return result is not None
