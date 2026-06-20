"""Generic atomic JSONL helpers for Artifact Atlas local-first storage.

Design invariants:
- Line-by-line structured parse (json.loads per line, never string-mutate).
- Atomic write via temp-file replace: write to <file>.tmp, then os.replace().
- Tombstone deletes: deleted records get ``_deleted: true`` + ``_deleted_at`` fields.
- Unknown / extra fields are preserved verbatim on round-trip.
- Graceful on missing file (returns []).
- Malformed lines: logged as warnings and skipped (configurable).
- All public functions are synchronous (local-first; no async needed in MVP).
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterator

logger = logging.getLogger(__name__)

# Sentinel field names used for tombstone deletions
_DELETED_FIELD = "_deleted"
_DELETED_AT_FIELD = "_deleted_at"


# ---------------------------------------------------------------------------
# Low-level line iteration
# ---------------------------------------------------------------------------


def _iter_lines(path: Path) -> Iterator[tuple[int, str]]:
    """Yield (line_number, stripped_line) for non-empty lines in a JSONL file.

    Returns an empty iterator if the file does not exist.
    """
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, start=1):
            stripped = raw.strip()
            if stripped:
                yield lineno, stripped


def _parse_line(
    lineno: int, raw: str, path: Path
) -> dict[str, Any] | None:
    """Parse a single JSONL line, returning None on malformed input (with a warning)."""
    try:
        obj = json.loads(raw)
        if not isinstance(obj, dict):
            logger.warning(
                "JSONL line %d in %s is not a JSON object (got %s); skipping.",
                lineno,
                path,
                type(obj).__name__,
            )
            return None
        return obj
    except json.JSONDecodeError as exc:
        logger.warning(
            "Malformed JSON at line %d in %s: %s; skipping.",
            lineno,
            path,
            exc,
        )
        return None


# ---------------------------------------------------------------------------
# Core read helpers
# ---------------------------------------------------------------------------


def read_all(
    path: Path,
    *,
    include_deleted: bool = False,
) -> list[dict[str, Any]]:
    """Read all valid records from a JSONL file.

    Args:
        path: Path to the JSONL file.
        include_deleted: If False (default), tombstoned records (_deleted=true) are excluded.

    Returns:
        List of record dicts in file order. Unknown fields are preserved.
    """
    records: list[dict[str, Any]] = []
    for lineno, raw in _iter_lines(path):
        obj = _parse_line(lineno, raw, path)
        if obj is None:
            continue
        if not include_deleted and obj.get(_DELETED_FIELD) is True:
            continue
        records.append(obj)
    return records


def read_by_id(
    path: Path,
    record_id: str,
    *,
    id_field: str = "id",
    include_deleted: bool = False,
) -> dict[str, Any] | None:
    """Read a single record by its ID field.

    Returns None if not found or if the record is tombstoned (unless include_deleted=True).
    """
    for record in read_all(path, include_deleted=include_deleted):
        if record.get(id_field) == record_id:
            return record
    return None


def read_where(
    path: Path,
    predicate: Callable[[dict[str, Any]], bool],
    *,
    include_deleted: bool = False,
) -> list[dict[str, Any]]:
    """Return all records matching a predicate."""
    return [r for r in read_all(path, include_deleted=include_deleted) if predicate(r)]


# ---------------------------------------------------------------------------
# Atomic write helpers
# ---------------------------------------------------------------------------


def _atomic_write_lines(path: Path, records: list[dict[str, Any]]) -> None:
    """Serialize *records* to JSONL and atomically replace *path*.

    Uses a sibling temp file + os.replace() to guarantee atomicity on POSIX.
    The parent directory must already exist.
    """
    dir_path = path.parent
    dir_path.mkdir(parents=True, exist_ok=True)

    fd, tmp_path_str = tempfile.mkstemp(
        prefix=path.stem + "_", suffix=".tmp", dir=dir_path
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            for record in records:
                fh.write(json.dumps(record, ensure_ascii=False, default=_json_default))
                fh.write("\n")
        os.replace(tmp_path_str, str(path))
    except Exception:
        # Clean up the orphaned temp file on failure
        try:
            os.unlink(tmp_path_str)
        except OSError:
            pass
        raise


def _json_default(obj: Any) -> Any:
    """JSON serializer for objects not serializable by default."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


# ---------------------------------------------------------------------------
# Append (create)
# ---------------------------------------------------------------------------


def append_record(path: Path, record: dict[str, Any]) -> dict[str, Any]:
    """Append a new record to the JSONL file (atomic).

    Does NOT check for ID uniqueness — callers must do that.

    Returns the record as stored.
    """
    dir_path = path.parent
    dir_path.mkdir(parents=True, exist_ok=True)

    line = json.dumps(record, ensure_ascii=False, default=_json_default) + "\n"

    # Append atomically: write to temp then append-rename isn't truly atomic on all FSes,
    # so we read + rewrite to keep it consistent with update path.
    existing = _read_raw_lines(path)
    existing.append(record)
    _atomic_write_lines(path, existing)
    return record


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


def update_record(
    path: Path,
    record_id: str,
    updates: dict[str, Any],
    *,
    id_field: str = "id",
    merge: bool = True,
) -> dict[str, Any] | None:
    """Update a record in-place.

    Args:
        path: JSONL file path.
        record_id: ID value to locate the record.
        updates: Fields to overwrite.
        id_field: Name of the primary-key field.
        merge: If True (default), merge updates into the existing record
               (preserving unknown fields). If False, replace the record entirely.

    Returns:
        The updated record dict, or None if not found.
    """
    all_records = _read_raw_lines(path)
    updated: dict[str, Any] | None = None

    for i, record in enumerate(all_records):
        if record.get(id_field) == record_id:
            if merge:
                merged = dict(record)
                merged.update(updates)
                all_records[i] = merged
                updated = merged
            else:
                all_records[i] = updates
                updated = updates
            break

    if updated is None:
        return None

    _atomic_write_lines(path, all_records)
    return updated


# ---------------------------------------------------------------------------
# Tombstone delete
# ---------------------------------------------------------------------------


def tombstone_record(
    path: Path,
    record_id: str,
    *,
    id_field: str = "id",
    extra_fields: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """Mark a record as deleted (tombstone) without removing the line.

    Adds ``_deleted: true`` and ``_deleted_at: <iso-timestamp>`` to the record.
    Existing content is preserved; tombstoned records are excluded from read_all()
    by default.

    Returns:
        The tombstoned record dict, or None if not found.
    """
    now_iso = datetime.now(tz=timezone.utc).isoformat()
    patch: dict[str, Any] = {
        _DELETED_FIELD: True,
        _DELETED_AT_FIELD: now_iso,
    }
    if extra_fields:
        patch.update(extra_fields)
    return update_record(path, record_id, patch, id_field=id_field, merge=True)


# ---------------------------------------------------------------------------
# Hard delete (use tombstone_delete in preference)
# ---------------------------------------------------------------------------


def hard_delete_record(
    path: Path,
    record_id: str,
    *,
    id_field: str = "id",
) -> bool:
    """Permanently remove a record from the JSONL file (atomic rewrite).

    Returns True if the record was found and removed; False otherwise.
    Prefer tombstone_record() to preserve audit trails.
    """
    all_records = _read_raw_lines(path)
    filtered = [r for r in all_records if r.get(id_field) != record_id]
    if len(filtered) == len(all_records):
        return False
    _atomic_write_lines(path, filtered)
    return True


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _read_raw_lines(path: Path) -> list[dict[str, Any]]:
    """Read all lines including tombstoned records (internal use only)."""
    records: list[dict[str, Any]] = []
    for lineno, raw in _iter_lines(path):
        obj = _parse_line(lineno, raw, path)
        if obj is not None:
            records.append(obj)
    return records


# ---------------------------------------------------------------------------
# Validation helper (used by registry validation tests)
# ---------------------------------------------------------------------------


def validate_jsonl_file(
    path: Path,
    *,
    required_fields: list[str] | None = None,
) -> list[str]:
    """Validate a JSONL file; return a list of error strings (empty = valid).

    Checks:
    - Each non-empty line is valid JSON.
    - Each line is a JSON object (dict).
    - Optional: specified required fields are present and non-empty.
    """
    errors: list[str] = []
    if not path.exists():
        errors.append(f"File does not exist: {path}")
        return errors

    for lineno, raw in _iter_lines(path):
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError as exc:
            errors.append(f"{path.name}:{lineno}: malformed JSON: {exc}")
            continue

        if not isinstance(obj, dict):
            errors.append(
                f"{path.name}:{lineno}: expected JSON object, got {type(obj).__name__}"
            )
            continue

        if required_fields:
            for field in required_fields:
                if field not in obj or obj[field] in (None, "", [], {}):
                    errors.append(
                        f"{path.name}:{lineno}: missing or empty required field '{field}'"
                        f" (record id={obj.get('id', '<no-id>')})"
                    )

    return errors
