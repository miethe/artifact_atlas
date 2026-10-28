"""Append-only revision ledger. No update, tombstone, or delete operation exists."""
import json
import os
from pathlib import Path

from app.models.revision import ContentRevision
from app.repositories.locking import registry_writer


class RevisionRepository:
    def __init__(self, registry_dir: Path) -> None:
        self.path = registry_dir / "content_revisions.jsonl"

    def writer(self):
        return registry_writer(self.path.parent)

    def list(self, asset_id: str) -> list[ContentRevision]:
        if not self.path.exists():
            return []
        # A reader must not observe a large JSON line halfway through append.
        # The lease is reentrant when append() checks uniqueness inside a writer.
        with self.writer():
            # Fail closed on a damaged ledger; never silently skip immutable history.
            with self.path.open(encoding="utf-8") as stream:
                revisions = []
                for line in stream:
                    if line.strip():
                        row = ContentRevision.model_validate_json(line)
                        if row.asset_id == asset_id:
                            revisions.append(row)
                return revisions

    def get(self, asset_id: str, selector: str) -> ContentRevision | None:
        return next((r for r in self.list(asset_id)
                     if r.id == selector or r.sha256 == selector), None)

    def append(self, revision: ContentRevision) -> None:
        """Caller holds writer(). Append and fsync before publishing the pointer."""
        if self.get(revision.asset_id, revision.id) is not None:
            raise ValueError("Revision ID already exists")
        line = json.dumps(revision.model_dump(mode="json"), ensure_ascii=False) + "\n"
        with self.path.open("a", encoding="utf-8") as stream:
            stream.write(line)
            stream.flush()
            os.fsync(stream.fileno())
