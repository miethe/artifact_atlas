#!/usr/bin/env python3
"""
QA-003: Performance Fixture Generator
======================================
Generates 1k and 10k metadata-only synthetic asset fixture sets for performance
testing the asset grid first paint and filter latency under local-first load.

Output:
  fixtures/perf/1k/assets.jsonl    — 1,000 assets
  fixtures/perf/10k/assets.jsonl   — 10,000 assets
  fixtures/perf/README.md          — how to run perf measurements

NEVER writes to the real registry/ directory.
Set ATLAS_REGISTRY_DIR=fixtures/perf/1k or fixtures/perf/10k to benchmark.

Usage:
    python3 scripts/generate_perf_fixtures.py
    python3 scripts/generate_perf_fixtures.py --out fixtures/perf --sizes 1000,10000

───────────────────────────────────────────────────────────────────────────────
PERFORMANCE MEASUREMENT APPROACH
───────────────────────────────────────────────────────────────────────────────
1. Start backend against fixture set:
       ATLAS_REGISTRY_DIR=$(pwd)/fixtures/perf/1k \
           uvicorn app.main:app --reload --port 8000

2. Start frontend (dev or prod build):
       cd web && npm run build && npm run start   # production build
   or:
       cd web && npm run dev                       # dev mode (slower)

3. Measure first paint (Playwright):
       cd web && npx playwright test e2e/perf-baseline.spec.ts --reporter=line
   Expected: asset grid renders first 100 visible assets under ~800ms LCP.

4. Measure filter latency (Chrome DevTools):
   a. Open http://localhost:3000/projects/proj_perf_1k/assets
   b. Open DevTools → Performance tab → Record
   c. Type in the search box (triggers client-side filter)
   d. Stop recording; measure time from keypress to repaint.
   Expected target: < 100ms filter response for 1k; < 300ms for 10k with
   virtualisation enabled (TanStack Virtual is configured in AssetTable).

5. Backend API latency (curl):
       time curl -s "http://localhost:8000/v0/projects/proj_perf_1k/assets?limit=50" | wc -c
   Expected: < 200ms p50 for SQLite local registry.

6. Repeat steps 1–5 with ATLAS_REGISTRY_DIR=fixtures/perf/10k and
   project id proj_perf_10k to capture 10k numbers.

TARGETS (local MacBook, no backend; fixture fallback mode):
  - First paint (LCP) for asset grid (gallery, 100 visible): < 800ms
  - Filter keypress → repaint: < 100ms (client-side, 1k); < 300ms (10k)
  - Backend /assets list (SQLite, 50 results): < 200ms p50

ACTUAL NUMBERS (captured if generator is run in an environment with Chrome):
  Run 'python3 scripts/generate_perf_fixtures.py --measure' to attempt
  automated measurement via Playwright (requires: npm run build in web/).
───────────────────────────────────────────────────────────────────────────────
"""

import argparse
import json
import random
import subprocess
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

# ── Constants ──────────────────────────────────────────────────────────────────

WORKSPACE_ID = "ws_perf_local"

SOURCE_KINDS = [
    "local", "local", "local",
    "chatgpt", "claude", "figma",
    "github", "url", "manual",
    "notion", "drive",
]

SENSITIVITIES = [
    "public", "public",
    "personal", "personal", "personal",
    "work_sensitive", "work_sensitive",
    "client_sensitive",
    "restricted",
]

STATUSES = [
    "inbox", "raw", "raw",
    "candidate", "candidate", "candidate",
    "in_review",
    "selected", "selected",
    "canonical", "canonical", "canonical",
    "archived",
]

AGENT_ACCESS_BY_SENSITIVITY = {
    "public": "read_allowed",
    "personal": "read_allowed",
    "work_sensitive": "preview_allowed",
    "client_sensitive": "metadata_only",
    "restricted": "none",
}

MIME_TYPES = [
    "text/markdown", "text/plain", "application/pdf",
    "image/png", "image/jpeg", "image/webp",
    "text/yaml", "application/json", "text/html",
]

ARTIFACT_TYPES = [
    "artifact_type_prd", "artifact_type_plan", "artifact_type_architecture",
    "artifact_type_wireframe", "artifact_type_api_spec", "artifact_type_mockup",
    "artifact_type_research", "artifact_type_test_plan", "artifact_type_runbook",
    "artifact_type_reference", "artifact_type_diagram", "artifact_type_adr",
    "artifact_type_notes", "artifact_type_checklist", "artifact_type_data_model",
]

TITLE_WORDS = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
    "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi",
    "Platform", "Module", "Component", "Service", "Gateway", "Layer",
    "Schema", "Model", "View", "Controller", "Adapter", "Factory",
    "Strategy", "Observer", "Decorator", "Command", "Iterator",
    "Sprint", "Release", "Version", "Iteration", "Cycle", "Phase",
]

DOC_KINDS = [
    "Requirements", "Spec", "Plan", "Brief", "Report", "Analysis",
    "Design", "Review", "Audit", "Assessment", "Summary", "Draft",
    "Notes", "Diagram", "Mockup", "Wireframe", "Prototype", "Reference",
]


# ── Generators ─────────────────────────────────────────────────────────────────

def _rand_date(start: datetime, end: datetime, rng: random.Random) -> str:
    delta = end - start
    seconds = rng.randint(0, int(delta.total_seconds()))
    return (start + timedelta(seconds=seconds)).strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_perf_assets(
    n: int,
    project_id: str,
    seed: int = 0,
) -> list[dict[str, Any]]:
    """
    Generate n metadata-only synthetic assets.

    "Metadata-only" means: no large content blobs, no previews, no descriptions
    longer than ~100 chars. The goal is to stress the list/filter path, not
    content serving.
    """
    rng = random.Random(seed)
    now = datetime(2026, 6, 20, tzinfo=timezone.utc)
    one_year_ago = now - timedelta(days=365)

    assets: list[dict[str, Any]] = []
    for i in range(n):
        source_kind = rng.choice(SOURCE_KINDS)
        sensitivity = rng.choice(SENSITIVITIES)
        status = rng.choice(STATUSES)
        artifact_type_id = rng.choice(ARTIFACT_TYPES)
        mime_type = rng.choice(MIME_TYPES)
        agent_access = AGENT_ACCESS_BY_SENSITIVITY[sensitivity]

        # Short synthetic title: "Alpha Requirements v3.1"
        word1 = rng.choice(TITLE_WORDS)
        word2 = rng.choice(DOC_KINDS)
        version = f"v{rng.randint(1, 5)}.{rng.randint(0, 9)}"
        title = f"{word1} {word2} {version}"

        captured_at = _rand_date(one_year_ago, now, rng)

        asset: dict[str, Any] = {
            "id": f"asset_perf_{n}_{i:06d}",
            "workspace_id": WORKSPACE_ID,
            "project_id": project_id,
            "title": title,
            "artifact_type_id": artifact_type_id,
            "source_kind": source_kind,
            "uri": f"file:///synthetic/perf/{i:06d}.md",
            "mime_type": mime_type,
            "status": status,
            "sensitivity": sensitivity,
            "agent_access": agent_access,
            "generated_by": rng.choice(["human", "agent", "agent", "chatgpt", None]),
            "captured_at": captured_at,
            "metadata": {},
        }
        # Add size_bytes for ~70% of assets (local/file assets have size)
        if source_kind in ("local", "chatgpt", "claude", "drive") and rng.random() < 0.7:
            asset["size_bytes"] = rng.randint(512, 2_000_000)

        assets.append(asset)

    return assets


def write_jsonl(path: Path, records: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
    size_kb = path.stat().st_size // 1024
    print(f"  wrote {len(records):>7} records  ({size_kb:>5} KB) → {path}")


def write_readme(out: Path, sizes: list[int]) -> None:
    readme_path = out / "README.md"
    readme_path.parent.mkdir(parents=True, exist_ok=True)
    content = f"""\
# Performance Fixtures (QA-003)

Generated by `scripts/generate_perf_fixtures.py`. Metadata-only synthetic assets for
measuring asset grid first paint and filter latency at local scale.

## Fixture Sets

| Directory       | Assets | Purpose                         |
|-----------------|-------:|---------------------------------|
| `1k/`           |  1,000 | Realistic small local project   |
| `10k/`          | 10,000 | Target local scale stress test  |

## How to Measure

### 1. Start backend against a fixture set

```bash
# 1k set
ATLAS_REGISTRY_DIR=$(pwd)/fixtures/perf/1k \\
    uvicorn app.main:app --reload --port 8000

# 10k set
ATLAS_REGISTRY_DIR=$(pwd)/fixtures/perf/10k \\
    uvicorn app.main:app --reload --port 8000
```

### 2. Start the web app (production build recommended)

```bash
cd web
npm run build && npm run start
# Then visit http://localhost:3000
```

### 3. Measure first paint (browser)

Open Chrome DevTools → Lighthouse → Mobile/Desktop → Run audit.
Key metric: **Largest Contentful Paint (LCP)** on the asset library page.

Or use Playwright:

```bash
cd web
npx playwright test e2e/happy-path.spec.ts --reporter=line
```

### 4. Measure filter latency

Open the Asset Library page, then in Chrome DevTools:
1. Performance tab → Record
2. Type a search term in the filter bar
3. Stop recording → measure "Event (input)" → first repaint gap

### 5. Measure API latency

```bash
# 50 assets, timing only
time curl -s "http://localhost:8000/v0/projects/proj_perf_1k/assets?limit=50" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'items: {{len(d[\"items\"])}}')"
```

## Performance Targets

| Metric                           | Target (1k)  | Target (10k) |
|----------------------------------|--------------|--------------|
| Asset grid LCP (fixture fallback)| < 800ms      | < 1.5s       |
| Filter keypress → repaint        | < 100ms      | < 300ms      |
| Backend /assets list (50 items)  | < 200ms p50  | < 500ms p50  |

## Actual Numbers

*(Fill in after running measurements)*

| Metric                    | 1k result | 10k result | Date |
|---------------------------|-----------|------------|------|
| LCP (asset grid)          | TBD       | TBD        |      |
| Filter latency            | TBD       | TBD        |      |
| API /assets list p50      | TBD       | TBD        |      |

## Fixture Schema

Each `.jsonl` file contains one JSON object per line matching the
`Asset` schema from `shared/openapi.yaml`. Fields are metadata-only —
no content blobs or preview URLs — to stress the list/filter path only.

Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
"""
    readme_path.write_text(content, encoding="utf-8")
    print(f"  wrote README → {readme_path}")


def attempt_measurement(out: Path) -> dict[str, Any]:
    """
    Attempt automated perf measurement via subprocess curl.
    Returns timing results dict (values may be None if unavailable).
    """
    results: dict[str, Any] = {}

    # Check if backend is running
    try:
        import urllib.request
        import urllib.error
        req = urllib.request.Request("http://localhost:8000/health")
        with urllib.request.urlopen(req, timeout=2) as resp:
            backend_up = resp.status == 200
    except Exception:
        backend_up = False

    if not backend_up:
        print("  (backend not running — skipping API timing measurement)")
        results["backend_available"] = False
        return results

    results["backend_available"] = True
    print("  backend reachable — measuring API latency…")

    for size_label in ["1k", "10k"]:
        project_id = f"proj_perf_{size_label}"
        url = f"http://localhost:8000/v0/projects/{project_id}/assets?limit=50"
        timings: list[float] = []
        for _ in range(5):
            t0 = time.monotonic()
            try:
                with urllib.request.urlopen(url, timeout=5) as resp:
                    data = json.loads(resp.read())
                elapsed_ms = (time.monotonic() - t0) * 1000
                timings.append(elapsed_ms)
                n_items = len(data.get("items", []))
            except Exception as e:
                print(f"    {size_label}: request failed — {e}")
                break

        if timings:
            p50 = sorted(timings)[len(timings) // 2]
            results[f"api_p50_ms_{size_label}"] = round(p50, 1)
            results[f"api_items_{size_label}"] = n_items
            print(f"    {size_label}: p50={p50:.1f}ms  items={n_items}")

    return results


# ── Main ───────────────────────────────────────────────────────────────────────

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate performance fixture sets for QA-003.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--out",
        default="fixtures/perf",
        help="Output base directory (default: fixtures/perf). NEVER use registry/.",
    )
    parser.add_argument(
        "--sizes",
        default="1000,10000",
        help="Comma-separated list of asset counts (default: 1000,10000).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=0,
        help="Base random seed (default: 0). Each size uses seed+i.",
    )
    parser.add_argument(
        "--measure",
        action="store_true",
        help="Attempt to measure API latency if a backend is running.",
    )
    args = parser.parse_args(argv)

    out = Path(args.out).resolve()

    # Safety guard: refuse to write into the real registry/
    repo_root = Path(__file__).parent.parent.resolve()
    real_registry = repo_root / "registry"
    if out == real_registry or out.is_relative_to(real_registry):
        print(
            f"ERROR: refusing to write to real registry at {real_registry}. "
            "Use a different --out path.",
            file=sys.stderr,
        )
        return 1

    try:
        sizes = [int(s.strip()) for s in args.sizes.split(",") if s.strip()]
    except ValueError as exc:
        print(f"ERROR: invalid --sizes value: {exc}", file=sys.stderr)
        return 1

    print(f"Generating performance fixtures → {out}")
    print(f"  sizes={sizes}  seed={args.seed}\n")

    for i, size in enumerate(sizes):
        label = f"{size // 1000}k" if size >= 1000 else str(size)
        project_id = f"proj_perf_{label}"
        fixture_dir = out / label

        print(f"[{label}] {size:,} assets  project_id={project_id}")
        assets = generate_perf_assets(size, project_id, seed=args.seed + i)
        write_jsonl(fixture_dir / "assets.jsonl", assets)

        # Write a minimal projects.jsonl so the backend can find the project
        project_record = {
            "id": project_id,
            "workspace_id": WORKSPACE_ID,
            "name": f"Perf Test Project ({label})",
            "slug": f"perf-test-{label}",
            "status": "active",
            "meatywiki_page_ref": None,
            "intent_id": None,
            "root_intenttree_node_id": None,
        }
        write_jsonl(fixture_dir / "projects.jsonl", [project_record])
        print()

    # Write README
    write_readme(out, sizes)

    # Validate: parse every written file
    print("\nValidating output (parse round-trip)…")
    all_ok = True
    for size in sizes:
        label = f"{size // 1000}k" if size >= 1000 else str(size)
        fixture_dir = out / label
        for fname in ["assets.jsonl", "projects.jsonl"]:
            path = fixture_dir / fname
            parsed = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
            expected = size if fname == "assets.jsonl" else 1
            ok = len(parsed) == expected
            all_ok = all_ok and ok
            status = "OK" if ok else "FAIL"
            print(f"  {status}  {label}/{fname}: {len(parsed)} records (expected {expected})")

    if not all_ok:
        print("\nERROR: validation failed — some files have unexpected record counts.", file=sys.stderr)
        return 1

    # Optional measurement
    if args.measure:
        print("\nAttempting API latency measurement…")
        results = attempt_measurement(out)
        results_path = out / "perf_results.json"
        results_path.write_text(json.dumps(results, indent=2, ensure_ascii=False))
        print(f"  results written → {results_path}")

    print(
        f"\nPerformance fixtures ready at: {out}\n"
        "To benchmark:\n"
        f"  ATLAS_REGISTRY_DIR={out}/1k  uvicorn app.main:app --reload\n"
        f"  # open http://localhost:3000/projects/proj_perf_1k/assets\n"
        f"  # see {out}/README.md for full measurement guide"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
