# CAPTURE-LEDGER — estate-coherence M0 (Atlas honest states)

Real Chromium PNGs (Playwright `chromium-headless-shell` v1228, viewport 1440×900), captured
2026-09-30 from branch `exec/estate-coherence-m0-atlas-p2` (P1 + P2 working tree).
Produced by a scripted run (`.leg/probe/run.py` + `capture.mjs`, scratch-only, not committed). Every file
below is a PNG whose magic bytes were checked when this ledger was generated. None is an HTML dump.

## Environment (the live :3040 / :8042 were not touched)

| Piece | Value |
|---|---|
| API | `uv run … uvicorn app.main:app` on `127.0.0.1:8099`, from this worktree's `api/` |
| Web | `next dev -p 3099`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:8099`, **no** `NEXT_PUBLIC_ATLAS_DEMO_DATA` (production semantics; demo banner count = 0 on every shot) |
| Registry | **Scratch copy** of this worktree's `registry/*.jsonl` plus **400 synthetic assets** (`asset_m0probe_*`, tag `m0-probe-synthetic`, spread over proj_artifact_atlas / proj_intenttree / proj_meatywiki). The synthetic rows push the population past the browse page's 200-row cap. Counts in these screenshots are therefore probe values, **not** live-catalog values. |
| Exports / reports / content store | redirected to scratch dirs |
| Forced error | `page.route(API/**) → abort("connectionrefused")` |
| Loading | `page.route(API/**)` held unanswered, screenshot after 1.5 s |

API cross-check from the same run: `GET /api/search?limit=200` → 200 results, `total` 479;
`POST /api/search/semantic {limit:200}` → 200 results, `total` 479 (same semantics). Audit
events carry `timestamp` (and no `created_at`).
Browse header text as rendered: **"Showing 200 of 479 assets"**.

## Shots

| File | State | Route | Size | sha256[:12] | "NaN" in page text | Demo banner | What it shows |
|---|---|---|---|---|---|---|---|
| `01-browse-live-total.png` | live | `/assets` | 1440×900 | `8ce10c124b99` | no | 0 | Browse Assets header reads "Showing 200 of 479 assets" (API total before the 200-row cap). |
| `02-browse-empty-filter.png` | empty | `/assets + tag filter` | 1440×900 | `6e731e7411db` | no | 0 | Tag filter with no match → "No assets found"; header "0 assets across 0 projects". |
| `03-browse-loading.png` | loading | `/assets` | 1440×900 | `450571216892` | no | 0 | All API requests held → "Loading…"; no fixture rows are painted first. |
| `04-browse-forced-error.png` | forced error | `/assets` | 1440×900 | `a69564774d58` | no | 0 | API requests aborted → "Asset count unavailable" plus "Failed to load assets. The API is unavailable. No fallback data is being shown." with Retry. |
| `05-command-center-live.png` | live | `/projects/proj_artifact_atlas` | 1440×900 | `46935cfebd78` | no | 0 | Live KPIs; IntentTree panels say "not connected"; Agent Activity shows relative dates. |
| `06-agent-activity-dates.png` | live (element) | `/projects/proj_artifact_atlas` | 390×502 | `e937e86faa3a` | no | 0 | Agent Activity panel reads `timestamp`: "21d ago" / "2mo ago", no NaN. |
| `07-command-center-forced-error.png` | forced error | `/projects/proj_artifact_atlas` | 1440×900 | `1d4fbe0b2f2e` | no | 0 | Every panel shows "Couldn't load …" with Retry; KPIs show "—"/unavailable, not zeros. |
| `08-command-center-loading.png` | loading | `/projects/proj_artifact_atlas` | 1440×900 | `8232f37b8d9f` | no | 0 | Requests held → skeletons; no fixture values. |
| `09-bom-404-no-bom.png` | 404 / empty | `/projects/proj_knitwit/bom` | 1440×900 | `12cb92334025` | no | 0 | "No BOM found for this project — API returned 404 (not_found)… No fallback data is being shown." with Retry and Apply template. |
| `10-bom-live.png` | live | `/projects/proj_artifact_atlas/bom` | 1440×900 | `7ad418178c1f` | no | 0 | Live BOM from the API. |
| `11-projects-forced-error.png` | forced error | `/` | 1440×900 | `fab5d9bdbbb5` | no | 0 | "Couldn't load projects" with Retry; no fixture projects are listed. |
| `12-projects-live.png` | live | `/` | 1440×900 | `dd71479fcea1` | no | 0 | Live project list from the scratch registry. |
| `13-intent-nodes-not-connected.png` | empty (no live source) | `/projects/proj_artifact_atlas/intent-nodes` | 1440×900 | `245381fd8446` | no | 0 | "IntentTree not connected"; DEMO_NODES are not listed. |

`results.json` (next to this file) holds the per-shot machine record: text excerpt, alert count,
NaN check, and banner count.

## Observations made during the probe (out of M0 scope; filed as findings)

- The Recent Assets panel subtitle reads "Showing 6 of 50". The 50 is the `useAssets` page size, not
  the population. This is the same page-vs-population defect class as T2, on the project dashboard.
- The Candidate Assets KPI shows 0 while the Candidate Assets panel says "15 in pipeline". The
  dashboard stats and the asset list disagree on the candidate count.
- The Missing Context / Attention Needed rows render with blank slot titles (only "High · Missing").
