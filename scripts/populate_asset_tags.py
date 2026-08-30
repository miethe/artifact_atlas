#!/usr/bin/env python3
"""M1 — populate ``Asset.tags`` for existing registry rows, mechanically.

``Asset.tags`` (added alongside this script) defaults to ``[]`` for every row
already on disk — no schema migration is needed for a JSONL + pydantic-default
store (unlike a SQL table, a missing key just resolves to the field default on
read). What *is* missing is data: rows written before this field existed carry
no tags even where one is mechanically derivable from fields they already have.
This script is that one-time (re-runnable, idempotent) population sweep.

Two derivation sources, both already present on disk — nothing guessed:

1. ``metadata.tags`` — several hand-curated assets already carry a
   ``metadata.tags: list[str]`` sidecar (the pre-M1 informal tagging
   convention). Copied verbatim onto the new first-class ``tags`` field.
2. ``metadata.generated_from.repo`` — the M3 backfill's delivery-report
   envelope carries the owning repo's absolute path. Derived as a single
   ``repo:<basename>`` tag (e.g. ``repo:agentic_meta_dev``).

Both are read from the record as it already exists; no doc-class heuristic
is attempted where nothing on the record encodes one — an asset with neither
source present is left with ``tags: []``, not hand-authored (per the M1 AC:
"populated ... where a tag is derivable ... do not hand-author").

Dry run is the default, mirroring ``backfill_reports.py``'s discipline:
a bare invocation prints the plan and writes nothing; ``--apply`` is required
to persist. Idempotent — an asset already carrying tags is left untouched
(``--force`` to re-derive and overwrite).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[1]
_API_DIR = _REPO_ROOT / "api"
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))


def derive_tags(record: dict[str, Any]) -> list[str]:
    """Mechanically derive tags for one asset record. No guessing."""
    metadata = record.get("metadata") or {}
    tags: list[str] = []

    existing = metadata.get("tags")
    if isinstance(existing, list):
        tags.extend(str(t) for t in existing if isinstance(t, (str, int)))

    generated_from = metadata.get("generated_from")
    if isinstance(generated_from, dict):
        repo_path = generated_from.get("repo")
        if isinstance(repo_path, str) and repo_path.strip():
            repo_name = Path(repo_path.rstrip("/")).name
            if repo_name:
                tags.append(f"repo:{repo_name}")

    # Dedupe, preserve order.
    seen: set[str] = set()
    ordered: list[str] = []
    for t in tags:
        if t not in seen:
            seen.add(t)
            ordered.append(t)
    return ordered


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--registry",
        help="Registry directory override (default: the app's configured one).",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Persist derived tags. Default is dry-run (print only).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-derive and overwrite assets that already carry tags.",
    )
    args = parser.parse_args(argv)

    from app.repositories.assets import AssetRepository
    from app.settings import get_settings

    registry_dir = Path(args.registry).expanduser() if args.registry else get_settings().registry_dir
    repo = AssetRepository(registry_dir)

    assets = repo.list()
    planned = 0
    unchanged = 0
    underivable = 0

    for asset in assets:
        if asset.tags and not args.force:
            unchanged += 1
            continue
        record = repo.get(asset.id)
        if record is None:
            continue
        raw = {"id": record.id, "metadata": record.metadata}
        derived = derive_tags(raw)
        if not derived:
            underivable += 1
            continue
        planned += 1
        verb = "WOULD TAG" if not args.apply else "TAGGED"
        print(f"{verb:10s} {asset.id} -> {derived}")
        if args.apply:
            from app.models.asset import AssetUpdate

            repo.update(asset.id, AssetUpdate(tags=derived))

    print(
        f"\n{planned} asset(s) {'tagged' if args.apply else 'would be tagged'}, "
        f"{unchanged} already tagged, {underivable} have no derivable tag."
    )
    if not args.apply:
        print("Dry run — nothing was written. Re-run with --apply to persist.")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
