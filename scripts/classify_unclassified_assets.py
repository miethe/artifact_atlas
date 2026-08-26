#!/usr/bin/env python3
"""Mechanically classify unclassified assets (artifact_type_id: None) by mime/extension.

No model calls — a fixed extension/mime -> artifact_type_id table, exactly the kind of
inference the finding this closes (node_01M0ZNQFBATWEQ8J77V8J8NTHE AC3) calls "metadata
inference, not new capture". Writes via the live API (PATCH /assets/{id}) against
--api-base (default: the deployed node), since the node's registry is canonical — classifying
a local copy instead would just re-diverge it from the node the next time
export_node_registry.py runs.

Usage:
    python3 scripts/classify_unclassified_assets.py --project proj_artifact_atlas
    python3 scripts/classify_unclassified_assets.py --project proj_artifact_atlas --apply

Exit codes:
    0  — dry-run completed, or apply succeeded for every asset it attempted
    1  — one or more assets could not be classified (unmapped mime/extension, or API error)
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

# extension (lowercased, no dot) -> artifact_type_id. Mirrors the existing id convention
# already live in the registry (artifact_type_presentation, artifact_type_diagram, ...).
EXTENSION_MAP = {
    "pptx": "artifact_type_presentation",
    "ppt": "artifact_type_presentation",
    "png": "artifact_type_image",
    "jpg": "artifact_type_image",
    "jpeg": "artifact_type_image",
}

# Fallback keyed on mime_type when the URI carries no recognizable extension.
MIME_MAP = {
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "artifact_type_presentation",
    "image/png": "artifact_type_image",
    "image/jpeg": "artifact_type_image",
}


def _classify(asset: dict) -> str | None:
    uri = asset.get("uri") or ""
    ext = uri.rsplit(".", 1)[-1].lower() if "." in uri else ""
    if ext in EXTENSION_MAP:
        return EXTENSION_MAP[ext]
    mime = asset.get("mime_type") or ""
    return MIME_MAP.get(mime)


def _get(api_base: str, path: str) -> dict:
    with urllib.request.urlopen(f"{api_base}{path}", timeout=15) as resp:  # noqa: S310 — fixed LAN host
        return json.loads(resp.read())


def _patch(api_base: str, asset_id: str, artifact_type_id: str) -> None:
    body = json.dumps({"artifact_type_id": artifact_type_id}).encode("utf-8")
    req = urllib.request.Request(
        f"{api_base}/api/assets/{asset_id}",
        data=body,
        method="PATCH",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310 — fixed LAN host
        if resp.status not in (200, 204):
            raise RuntimeError(f"unexpected status {resp.status}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", required=True, help="Project id, e.g. proj_artifact_atlas.")
    ap.add_argument("--api-base", default="http://10.42.10.76:8042", help="Atlas API base (default: deployed node).")
    ap.add_argument("--apply", action="store_true", help="Actually PATCH assets (default: dry-run report only).")
    args = ap.parse_args()

    try:
        data = _get(args.api_base, f"/api/projects/{args.project}/assets?limit=200")
    except (urllib.error.URLError, OSError) as exc:
        print(f"ERROR: could not reach {args.api_base}: {exc}", file=sys.stderr)
        return 1

    items = data.get("items", [])
    unclassified = [a for a in items if a.get("artifact_type_id") is None]
    print(f"{len(unclassified)} unclassified asset(s) in {args.project} (of {len(items)} total).")

    unmapped: list[str] = []
    applied = 0
    for asset in unclassified:
        artifact_type_id = _classify(asset)
        if artifact_type_id is None:
            print(f"  UNMAPPED  {asset['id']}  uri={asset.get('uri')!r} mime={asset.get('mime_type')!r}")
            unmapped.append(asset["id"])
            continue
        print(f"  {'->' if args.apply else '(dry-run) would set'}  {asset['id']}  {artifact_type_id}  (from {asset.get('uri')!r})")
        if args.apply:
            try:
                _patch(args.api_base, asset["id"], artifact_type_id)
                applied += 1
            except (urllib.error.URLError, RuntimeError, OSError) as exc:
                print(f"    ERROR patching {asset['id']}: {exc}", file=sys.stderr)
                unmapped.append(asset["id"])

    print()
    if args.apply:
        print(f"Applied {applied}/{len(unclassified)}.")
    if unmapped:
        print(f"{len(unmapped)} asset(s) could not be classified: {unmapped}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
