#!/usr/bin/env python3
"""Re-measure git activity versus an exported tracker snapshot.

The fleet YAML owns membership/topology. Tracker data is an explicit JSON export,
so credentials and network access never enter the output or Atlas render path.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml


def _git_count(path: Path, args: list[str]) -> int | None:
    result = subprocess.run(
        ["git", "-C", str(path), *args], capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        return None
    lines = [line for line in result.stdout.splitlines() if line.strip()]
    return len(lines)


def _git_root(path: Path) -> Path:
    result = subprocess.run(
        ["git", "-C", str(path), "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
        timeout=60,
    )
    return Path(result.stdout.strip()).resolve() if result.returncode == 0 else path


def measure(
    registry_path: Path,
    tracker_path: Path,
    *,
    generated_at: str | None = None,
) -> dict[str, Any]:
    registry = yaml.safe_load(registry_path.read_text(encoding="utf-8"))
    tracker_document = json.loads(tracker_path.read_text(encoding="utf-8"))
    tracker = tracker_document.get("projects", tracker_document)
    fleet_provenance = registry.get("source_ref") or registry_path.name
    tracker_provenance = tracker_document.get("source_ref") or tracker_path.name
    apps: list[dict[str, Any]] = registry.get("apps", [])
    rows: list[dict[str, Any]] = []
    seen_repos: set[Path] = set()
    repo_owners: dict[Path, str] = {}
    for app in apps:
        repo = Path(str(app.get("path", ""))).expanduser().resolve()
        root = _git_root(repo)
        duplicate_repo = root in seen_repos
        seen_repos.add(root)
        shared_with = repo_owners.get(root)
        repo_owners.setdefault(root, app["id"])
        all_count = None if duplicate_repo else _git_count(
            repo, ["log", "--all", "--since=30 days ago", "--format=%H"]
        )
        head_count = None if duplicate_repo else _git_count(
            repo, ["log", "HEAD", "--since=30 days ago", "--format=%H"]
        )
        tracked = tracker.get(app["id"], {})
        if tracked.get("status") == "archived":
            raise ValueError(
                f"refusing archived tracker binding for {app['id']}: "
                f"{tracked.get('tree_id')}"
            )
        rows.append(
            {
                "slug": app["id"],
                "name": app.get("name") or app["id"],
                "project_id": f"proj_{app['id'].replace('-', '_')}",
                # Host checkout paths are deliberately excluded from the
                # portable snapshot. Registry id + resolved-repo equality are
                # enough to reproduce/deduplicate the measurement safely.
                "shares_repo_with": shared_with if duplicate_repo else None,
                "commits_30d_all": {
                    "value": all_count,
                    "measured_by": "git log --all --since=30 days ago --format=%H",
                    "provenance": f"{fleet_provenance}#apps/{app['id']}:git",
                },
                "commits_30d_head": {
                    "value": head_count,
                    "measured_by": "git log HEAD --since=30 days ago --format=%H",
                    "provenance": f"{fleet_provenance}#apps/{app['id']}:git",
                },
                "tree_id": tracked.get("tree_id"),
                "nodes_total": {
                    "value": tracked.get("total"),
                    "measured_by": "IntentTree exported full node set",
                    "provenance": f"{tracker_provenance}#{tracked.get('tree_id') or app['id']}",
                },
                "nodes_open": {
                    "value": tracked.get("open"),
                    "measured_by": "IntentTree exported statuses excluding completed/archived",
                    "provenance": f"{tracker_provenance}#{tracked.get('tree_id') or app['id']}",
                },
                "tree_status": {
                    "value": tracked.get("status"),
                    "measured_by": "IntentTree tree metadata export",
                    "provenance": f"{tracker_provenance}#{tracked.get('tree_id') or app['id']}",
                },
            }
        )
    return {
        "schema_version": 1,
        "generated_at": generated_at
        or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fleet_registry": fleet_provenance,
        "tracker_export": tracker_provenance,
        "projects": rows,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fleet-registry", type=Path, required=True)
    parser.add_argument("--tracker-json", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--generated-at")
    args = parser.parse_args()
    payload = measure(
        args.fleet_registry, args.tracker_json, generated_at=args.generated_at
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    print(f"wrote {args.out} ({len(payload['projects'])} registry projects)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
