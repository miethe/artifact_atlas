#!/usr/bin/env python3
"""Verified export of the deployed node's live registry into the git-tracked `registry/` dir.

Decision (Nick, 2026-08-26, evidence on node_01M0ZM87FGG2BDXX55CJBYCDEW): the node's live
registry (deployed, running, health-checked at 10.42.10.76:8042) is CANONICAL. The laptop-git
`registry/*.jsonl` tree is a **verified export** of that live state, satisfying constraint 2
(files are canonical; every derived store is mechanically rebuildable from its authority) — the
export IS the canonical file, refreshed on a cadence, with `check_registry_drift.py` as the
staleness detector.

Reads each registry file directly off the node's running container (`podman exec
artifact-atlas_api_1 cat /data/registry/<file>`) over the existing `agentic-nuc` SSH alias — the
same reach-the-node pattern already used for the atlas MCP stdio wiring
(`~/.claude.json` → `ssh agentic-nuc podman exec -i -w /app/api artifact-atlas_api_1 …`). This
reads the JSONL bytes verbatim rather than reconstructing them from the list APIs, which drop
fields not needed for list rendering (e.g. `storage_uri`, `hash_sha256`) and paginate.

Usage:
    python3 scripts/export_node_registry.py                 # dry-run: report what would change
    python3 scripts/export_node_registry.py --apply          # write + verify by SHA256
    python3 scripts/export_node_registry.py --apply --file assets.jsonl   # single file

Exit codes:
    0  — dry-run completed, or apply succeeded and every written file verified byte-identical
    1  — SSH/exec failure, or a written file failed SHA256 verification (never left half-written:
         the temp file is written first and only renamed into place after its hash matches)
"""

from __future__ import annotations

import argparse
import hashlib
import subprocess
import sys
from pathlib import Path

SSH_HOST = "agentic-nuc"
CONTAINER = "artifact-atlas_api_1"
REMOTE_REGISTRY_DIR = "/data/registry"

# The registry files this export manages. `projects.jsonl.bak-preseed-*` is a one-time
# migration artifact on the node, not part of the live registry contract — deliberately excluded.
REGISTRY_FILES = [
    "projects.jsonl",
    "assets.jsonl",
    "asset_links.jsonl",
    "events.jsonl",
    "bom.jsonl",
    "bom_slots.jsonl",
    "templates.jsonl",
]

REPO_ROOT = Path(__file__).resolve().parent.parent
LOCAL_REGISTRY_DIR = REPO_ROOT / "registry"


def _remote_cat(filename: str) -> bytes:
    """Return the raw bytes of a registry file as it exists on the node, or raise."""
    remote_path = f"{REMOTE_REGISTRY_DIR}/{filename}"
    proc = subprocess.run(
        ["ssh", SSH_HOST, "podman", "exec", CONTAINER, "cat", remote_path],
        capture_output=True,
        timeout=30,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"remote cat failed for {filename} (rc={proc.returncode}): "
            f"{proc.stderr.decode('utf-8', 'replace').strip()}"
        )
    return proc.stdout


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true", help="Write the exported files (default: dry-run report only).")
    ap.add_argument("--file", help="Limit to a single registry filename (e.g. assets.jsonl).")
    args = ap.parse_args()

    targets = [args.file] if args.file else REGISTRY_FILES
    unknown = [f for f in targets if f not in REGISTRY_FILES]
    if unknown:
        print(f"ERROR: unknown registry file(s): {unknown}. Known: {REGISTRY_FILES}", file=sys.stderr)
        return 1

    LOCAL_REGISTRY_DIR.mkdir(parents=True, exist_ok=True)

    had_error = False
    changed = 0
    unchanged = 0

    for filename in targets:
        local_path = LOCAL_REGISTRY_DIR / filename
        try:
            remote_bytes = _remote_cat(filename)
        except (RuntimeError, subprocess.TimeoutExpired) as exc:
            print(f"ERROR: {filename}: {exc}", file=sys.stderr)
            had_error = True
            continue

        remote_hash = _sha256(remote_bytes)
        local_bytes = local_path.read_bytes() if local_path.exists() else b""
        local_hash = _sha256(local_bytes)

        if remote_hash == local_hash:
            print(f"  unchanged  {filename}  ({len(remote_bytes)} bytes, sha256:{remote_hash[:12]})")
            unchanged += 1
            continue

        remote_lines = remote_bytes.count(b"\n") or (1 if remote_bytes else 0)
        local_lines = local_bytes.count(b"\n") or (1 if local_bytes else 0)
        print(
            f"  DRIFT      {filename}  local={local_lines} lines/sha256:{local_hash[:12]} "
            f"-> node={remote_lines} lines/sha256:{remote_hash[:12]}"
        )
        changed += 1

        if not args.apply:
            continue

        # Write-then-verify: never leave a half-written or unverified file in place.
        tmp_path = local_path.with_suffix(local_path.suffix + ".export-tmp")
        tmp_path.write_bytes(remote_bytes)
        written_hash = _sha256(tmp_path.read_bytes())
        if written_hash != remote_hash:
            tmp_path.unlink(missing_ok=True)
            print(f"ERROR: {filename}: post-write verification failed — refusing to replace local file", file=sys.stderr)
            had_error = True
            continue
        tmp_path.replace(local_path)
        print(f"    -> applied and verified ({filename})")

    print()
    print(f"Summary: {unchanged} unchanged, {changed} drifted{' (dry-run; pass --apply to write)' if changed and not args.apply else ''}.")
    if had_error:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
