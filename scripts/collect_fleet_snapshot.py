#!/usr/bin/env python3
"""Compose and optionally publish the laptop-side Atlas fleet snapshot."""

from __future__ import annotations

import argparse
import json
import os
import re
import urllib.request
from pathlib import Path
from typing import Any

_SECRET_KEY = re.compile(
    r"(?i)(?:^|[_-])(?:api[_-]?key|access[_-]?token|auth[_-]?token|token|secret|password|credential|private[_-]?key|authorization)$"
)
_SECRET_VALUE = re.compile(
    r"(?i)(?:bearer\s+[a-z0-9._~+/=-]{12,}|(?:token|api[_-]?key|password)\s*[:=]\s*\S+|github_pat_[a-z0-9_]{12,}|gh[pousr]_[a-z0-9]{12,}|(?:AKIA|ASIA)[A-Z0-9]{16}|xox[baprs]-[a-z0-9-]{10,}|sk-[a-z0-9]{16,}|://[^/\s:@]+:[^/\s@]+@)"
)


def _contains_secret(value: Any) -> bool:
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(key, str) and _SECRET_KEY.search(key) and item not in (None, "", False):
                return True
            if _contains_secret(item):
                return True
        return False
    if isinstance(value, list):
        return any(_contains_secret(item) for item in value)
    return isinstance(value, str) and _SECRET_VALUE.search(value) is not None


def build_snapshot(
    measurement: dict[str, Any], authored: dict[str, Any], collector_version: str
) -> dict[str, Any]:
    projects: dict[str, Any] = {}
    for row in measurement["projects"]:
        slug = row["slug"]
        projects[slug] = {
            "project_id": row.get("project_id") or f"proj_{slug.replace('-', '_')}",
            "slug": slug,
            "name": row.get("name") or slug,
            "tree_id": row.get("tree_id"),
            "metrics": {
                key: row[key]
                for key in (
                    "commits_30d_all",
                    "commits_30d_head",
                    "nodes_total",
                    "nodes_open",
                    "tree_status",
                )
            },
        }
    if set(projects) != set(authored["projects"]):
        raise ValueError("derived and authored project membership must match")
    payload = {
        "schema_version": 1,
        "generated_at": measurement["generated_at"],
        "collector_version": collector_version,
        "derived": {"projects": projects},
        "authored": {"projects": authored["projects"]},
    }
    if _contains_secret(payload):
        raise ValueError("refusing to serialize secret-shaped snapshot content")
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--measurement", type=Path, required=True)
    parser.add_argument("--authored", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--collector-version", default="atlas-fleet/1")
    parser.add_argument("--atlas-url", help="Optional Atlas base URL for PUT publish")
    args = parser.parse_args()
    payload = build_snapshot(
        json.loads(args.measurement.read_text()),
        json.loads(args.authored.read_text()),
        args.collector_version,
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    if args.atlas_url:
        request = urllib.request.Request(
            args.atlas_url.rstrip("/") + "/api/overview/snapshot",
            data=json.dumps(payload).encode(),
            method="PUT",
            headers={"Content-Type": "application/json"},
        )
        token = os.environ.get("ATLAS_API_TOKEN")
        if token:
            request.add_header("Authorization", f"Bearer {token}")
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status >= 300:
                raise RuntimeError(f"Atlas publish failed: HTTP {response.status}")
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
