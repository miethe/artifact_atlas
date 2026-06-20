#!/usr/bin/env python3
"""QA-004: Registry and export portability validation.

Parses the following artifact files in a clean subprocess-safe process and
exits non-zero on any parse error:

  registry/*.jsonl           — one JSON object per line
  templates/*.yaml           — YAML template definitions
  exports/context-packs/*.yaml  — context pack manifests
  exports/events/*.jsonl     — JSONL event logs (if present)
  exports/control-plane/*.yaml  — control-plane snapshot YAML (if present)

Usage:
    python3 scripts/validate_registry_exports.py [--verbose] [--repo-root PATH]

Exit codes:
    0  — all files parsed without error
    1  — one or more parse failures detected
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _find_repo_root(start: Path) -> Path:
    """Walk up from *start* to find the repo root (contains registry/ dir)."""
    candidate = start.resolve()
    for _ in range(10):
        if (candidate / "registry").is_dir() or (candidate / "templates").is_dir():
            return candidate
        parent = candidate.parent
        if parent == candidate:
            break
        candidate = parent
    return start.resolve()


def _parse_jsonl(path: Path, verbose: bool) -> list[str]:
    """Parse a JSONL file; return list of error messages (empty = OK)."""
    errors: list[str] = []
    try:
        with path.open("r", encoding="utf-8") as fh:
            for lineno, line in enumerate(fh, start=1):
                stripped = line.strip()
                if not stripped:
                    continue  # blank lines are allowed
                try:
                    obj = json.loads(stripped)
                    if not isinstance(obj, dict):
                        errors.append(
                            f"{path}:{lineno}: expected JSON object, got {type(obj).__name__}"
                        )
                except json.JSONDecodeError as exc:
                    errors.append(f"{path}:{lineno}: JSON parse error — {exc}")
    except OSError as exc:
        errors.append(f"{path}: cannot open — {exc}")
    if verbose and not errors:
        print(f"  OK  {path}")
    return errors


def _parse_yaml(path: Path, verbose: bool) -> list[str]:
    """Parse a YAML file; return list of error messages (empty = OK)."""
    errors: list[str] = []
    try:
        import yaml  # type: ignore[import-untyped]
    except ImportError:
        errors.append(
            "PyYAML is not installed. Install it with: pip install pyyaml"
        )
        return errors

    try:
        with path.open("r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        if data is None:
            errors.append(f"{path}: YAML file is empty or all-comment")
        elif not isinstance(data, (dict, list)):
            errors.append(
                f"{path}: unexpected YAML root type {type(data).__name__} "
                f"(expected dict or list)"
            )
    except yaml.YAMLError as exc:
        errors.append(f"{path}: YAML parse error — {exc}")
    except OSError as exc:
        errors.append(f"{path}: cannot open — {exc}")

    if verbose and not errors:
        print(f"  OK  {path}")
    return errors


# ---------------------------------------------------------------------------
# File-set scanners
# ---------------------------------------------------------------------------


def _scan_glob(
    base: Path,
    pattern: str,
    parser,
    label: str,
    verbose: bool,
) -> tuple[int, int, list[str]]:
    """Scan all files matching *pattern* under *base* with *parser*.

    Returns (file_count, error_count, error_messages).
    """
    all_errors: list[str] = []
    file_count = 0
    for path in sorted(base.glob(pattern)):
        if path.name.startswith("."):
            continue  # skip .gitkeep and similar
        file_count += 1
        errs = parser(path, verbose)
        all_errors.extend(errs)
    return file_count, len(all_errors), all_errors


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate Artifact Atlas registry and export files."
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Print OK for each successfully parsed file.",
    )
    parser.add_argument(
        "--repo-root",
        default=None,
        help="Explicit path to the repo root. Auto-detected if not provided.",
    )
    args = parser.parse_args(argv)

    repo_root = (
        Path(args.repo_root).resolve()
        if args.repo_root
        else _find_repo_root(Path(__file__).parent)
    )

    print(f"Validating Artifact Atlas artifacts in: {repo_root}")
    print()

    total_files = 0
    total_errors = 0
    all_error_messages: list[str] = []

    # ---------------------------------------------------------------------------
    # 1. registry/*.jsonl
    # ---------------------------------------------------------------------------
    registry_dir = repo_root / "registry"
    if registry_dir.is_dir():
        print(f"[registry] Scanning {registry_dir} ...")
        fc, ec, errs = _scan_glob(registry_dir, "*.jsonl", _parse_jsonl, "registry", args.verbose)
        total_files += fc
        total_errors += ec
        all_error_messages.extend(errs)
        print(f"  {fc} file(s), {ec} error(s)")
    else:
        print(f"[registry] Directory not found: {registry_dir} — skipping")

    print()

    # ---------------------------------------------------------------------------
    # 2. templates/*.yaml
    # ---------------------------------------------------------------------------
    templates_dir = repo_root / "templates"
    if templates_dir.is_dir():
        print(f"[templates] Scanning {templates_dir} ...")
        fc, ec, errs = _scan_glob(templates_dir, "*.yaml", _parse_yaml, "templates", args.verbose)
        # Also scan .yml
        fc2, ec2, errs2 = _scan_glob(templates_dir, "*.yml", _parse_yaml, "templates", args.verbose)
        fc += fc2; ec += ec2; errs.extend(errs2)
        total_files += fc
        total_errors += ec
        all_error_messages.extend(errs)
        print(f"  {fc} file(s), {ec} error(s)")
    else:
        print(f"[templates] Directory not found: {templates_dir} — skipping")

    print()

    # ---------------------------------------------------------------------------
    # 3. exports/context-packs/*.yaml
    # ---------------------------------------------------------------------------
    cp_dir = repo_root / "exports" / "context-packs"
    if cp_dir.is_dir():
        print(f"[context-packs] Scanning {cp_dir} ...")
        fc, ec, errs = _scan_glob(cp_dir, "*.yaml", _parse_yaml, "context-packs", args.verbose)
        fc2, ec2, errs2 = _scan_glob(cp_dir, "*.yml", _parse_yaml, "context-packs", args.verbose)
        fc += fc2; ec += ec2; errs.extend(errs2)
        total_files += fc
        total_errors += ec
        all_error_messages.extend(errs)
        print(f"  {fc} file(s), {ec} error(s)")
    else:
        print(f"[context-packs] Directory not found: {cp_dir} — skipping")

    print()

    # ---------------------------------------------------------------------------
    # 4. exports/events/*.jsonl
    # ---------------------------------------------------------------------------
    events_dir = repo_root / "exports" / "events"
    if events_dir.is_dir():
        print(f"[events] Scanning {events_dir} ...")
        fc, ec, errs = _scan_glob(events_dir, "*.jsonl", _parse_jsonl, "events", args.verbose)
        total_files += fc
        total_errors += ec
        all_error_messages.extend(errs)
        print(f"  {fc} file(s), {ec} error(s)")
    else:
        print(f"[events] Directory not found: {events_dir} — skipping (no events yet)")

    print()

    # ---------------------------------------------------------------------------
    # 5. exports/control-plane/*.yaml
    # ---------------------------------------------------------------------------
    cp_plane_dir = repo_root / "exports" / "control-plane"
    if cp_plane_dir.is_dir():
        print(f"[control-plane] Scanning {cp_plane_dir} ...")
        fc, ec, errs = _scan_glob(
            cp_plane_dir, "*.yaml", _parse_yaml, "control-plane", args.verbose
        )
        fc2, ec2, errs2 = _scan_glob(
            cp_plane_dir, "*.yml", _parse_yaml, "control-plane", args.verbose
        )
        fc += fc2; ec += ec2; errs.extend(errs2)
        total_files += fc
        total_errors += ec
        all_error_messages.extend(errs)
        print(f"  {fc} file(s), {ec} error(s)")
    else:
        print(f"[control-plane] Directory not found: {cp_plane_dir} — skipping (no snapshots yet)")

    print()

    # ---------------------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------------------
    print("=" * 60)
    print(f"Total files scanned : {total_files}")
    print(f"Total parse errors  : {total_errors}")

    if all_error_messages:
        print()
        print("ERRORS:")
        for msg in all_error_messages:
            print(f"  ERROR: {msg}")
        print()
        print("RESULT: FAIL — one or more files failed to parse.")
        return 1
    else:
        print()
        print("RESULT: PASS — all files parsed successfully.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
