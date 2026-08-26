#!/usr/bin/env python3
"""Read-only drift check: does the git-tracked `registry/` match the node's live registry?

The node's live registry is canonical (Nick, 2026-08-26, evidence on
node_01M0ZM87FGG2BDXX55CJBYCDEW); `registry/*.jsonl` in this repo is a verified export of it
(`export_node_registry.py`). This script never writes anything — it is the staleness detector
constraint 2 requires alongside a derived-but-canonical export: run it on a cadence (manually, or
from a cron/CI job) and re-run `export_node_registry.py --apply` when it reports drift.

Usage:
    python3 scripts/check_registry_drift.py [--verbose]

Exit codes:
    0  — every tracked registry file's SHA256 matches the node's live copy
    1  — at least one file has drifted, or the node could not be reached
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_node_registry import REGISTRY_FILES, LOCAL_REGISTRY_DIR, _remote_cat, _sha256  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    drifted: list[str] = []
    unreachable: list[str] = []

    for filename in REGISTRY_FILES:
        local_path = LOCAL_REGISTRY_DIR / filename
        local_bytes = local_path.read_bytes() if local_path.exists() else b""
        local_hash = _sha256(local_bytes)
        try:
            remote_bytes = _remote_cat(filename)
        except Exception as exc:  # noqa: BLE001 — report and continue, don't crash the whole sweep
            print(f"  UNREACHABLE  {filename}  ({exc})", file=sys.stderr)
            unreachable.append(filename)
            continue
        remote_hash = _sha256(remote_bytes)
        if remote_hash == local_hash:
            if args.verbose:
                print(f"  OK     {filename}")
        else:
            print(f"  DRIFT  {filename}  local sha256:{local_hash[:12]} != node sha256:{remote_hash[:12]}")
            drifted.append(filename)

    print()
    if unreachable:
        print(f"UNREACHABLE: could not compare {unreachable} — node registry state is UNKNOWN for these, not clean.")
    if drifted:
        print(f"DRIFT DETECTED in {len(drifted)} file(s): {drifted}. Run: python3 scripts/export_node_registry.py --apply")
    if not drifted and not unreachable:
        print(f"CLEAN — all {len(REGISTRY_FILES)} registry files match the node's live copy.")

    return 1 if (drifted or unreachable) else 0


if __name__ == "__main__":
    raise SystemExit(main())
