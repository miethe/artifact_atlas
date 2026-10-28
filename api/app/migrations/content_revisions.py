"""authority: migration — reversible v1 backfill; immutable history is retained on down."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from app.models.asset import Asset
from app.repositories import jsonl
from app.services.revisions import OutsideWorkspaceError, RevisionService


def migrate(registry_dir: Path, direction: str, *, apply: bool = False) -> dict:
    if direction not in {"up", "down"}:
        raise ValueError("Direction must be up or down")
    service = RevisionService(registry_dir)
    journal = registry_dir / "migrations" / "content_revisions_v1.jsonl"
    with service.revisions.writer():
        entries = jsonl.read_all(journal, include_deleted=True)
        assets = jsonl.read_all(service.assets._assets_path, include_deleted=True)
        by_id = {asset["id"]: asset for asset in assets}
        if direction == "down":
            pending = [entry for entry in entries if not entry.get("rolled_back")]
            # Whole-batch preflight: never erase intervening writes, even metadata edits.
            for entry in pending:
                if entry.get("after") is None:
                    raise ValueError("Interrupted upgrade: rerun up before down")
                if by_id.get(entry["id"]) not in (entry["after"], entry["before"]):
                    raise ValueError(f"Rollback conflict: {entry['id']}")
            if apply:
                replacements = {entry["id"]: entry["before"] for entry in pending}
                jsonl._atomic_write_lines(service.assets._assets_path,
                                          [replacements.get(a["id"], a) for a in assets])
                for entry in pending:
                    entry["rolled_back"] = True
                jsonl._atomic_write_lines(journal, entries)
            return {"direction": direction, "apply": apply, "assets": len(pending),
                    "history_retained": True}

        candidates = []
        skipped = []
        pointer_only = {"pointer_only_outside_workspace": {"count": 0, "ids": []},
                        "pointer_only_missing_blob": {"count": 0, "ids": []}}

        def classify(kind: str, asset_id: str) -> None:
            pointer_only[kind]["ids"].append(asset_id)
            pointer_only[kind]["count"] += 1
        # Validate all legacy sources before changing any asset pointers.
        for record in assets:
            asset = Asset.model_validate(record)
            if asset.current_revision_id:
                continue
            uri = asset.storage_uri or asset.uri
            if not uri.startswith("file://"):
                skipped.append(asset.id)
                continue
            try:
                path = service.resolve(uri)
            except OutsideWorkspaceError:
                classify("pointer_only_outside_workspace", asset.id)
                continue
            if not path.is_file():
                if not path.exists() and (asset.storage_uri or asset.hash_sha256):
                    classify("pointer_only_missing_blob", asset.id)
                    continue
                skipped.append(asset.id)
                continue
            if asset.hash_sha256 and hashlib.sha256(path.read_bytes()).hexdigest() != asset.hash_sha256:
                raise ValueError(f"Legacy content hash mismatch: {asset.id}")
            candidates.append(record)
        if apply:
            for record in candidates:
                entry = next((e for e in entries if e["id"] == record["id"]), None)
                if entry is None:
                    entry = {"id": record["id"]}
                    entries.append(entry)
                if entry.get("after") is not None and not entry.get("rolled_back"):
                    raise ValueError(f"Upgrade conflict: {entry['id']}")
                # Persist before-image before pointer mutation; up can resume after interruption.
                entry.update(before=record, after=None, rolled_back=False)
                jsonl._atomic_write_lines(journal, entries)
                service.preserve_current(Asset.model_validate(record))
                entry["after"] = jsonl.read_by_id(service.assets._assets_path, record["id"],
                                                 include_deleted=True)
                jsonl._atomic_write_lines(journal, entries)
            # Repair journal after a crash between pointer publication and after-image write.
            for entry in entries:
                if entry.get("after") is None and not entry.get("rolled_back"):
                    current = jsonl.read_by_id(service.assets._assets_path, entry["id"],
                                               include_deleted=True)
                    if current is None or not current.get("current_revision_id"):
                        raise ValueError(f"Incomplete upgrade: {entry['id']}")
                    expected = dict(entry["before"])
                    revision = service.revisions.get(entry["id"], current["current_revision_id"])
                    if revision is None:
                        raise ValueError("Current revision missing")
                    expected.update(current_revision_id=revision.id, hash_sha256=revision.sha256,
                                    size_bytes=revision.size_bytes, storage_uri=revision.storage_uri,
                                    mime_type=revision.mime_type)
                    if current != expected:
                        raise ValueError(f"Interrupted upgrade conflict: {entry['id']}")
                    entry["after"] = current
            jsonl._atomic_write_lines(journal, entries)
        result = {"direction": direction, "apply": apply, "assets": len(candidates),
                  "metadata_only": skipped, "pointer_only": pointer_only}
        if apply:
            report = dict(result, candidates=len(candidates),
                          generated_at=datetime.now(timezone.utc).isoformat())
            target = registry_dir / "migrations" / "content_revisions_v1_report.json"
            target.parent.mkdir(parents=True, exist_ok=True)
            tmp = target.with_suffix(".json.tmp")
            tmp.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
            tmp.replace(target)
        return result
