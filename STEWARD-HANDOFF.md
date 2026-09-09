# STEWARD HANDOFF — PF-4 Reports Hub

PR title: **feat(reports): per-project surface, cross-project /reports lens, AOS overview page (PF-4)**

Target: `main`. No commit, push, or PR was attempted. All four nodes are `waiting_review`.

## Commit-equivalent block 1 — node_01KZH6T1X0Q13XR1C66SD1CM1K

Per-project, reports-only route with API cursor paging, metadata/tracker columns, hosted HTML, and honest error/empty states.

AC status:

- AC1 PASS — reports-only metadata table: `web/features/reports/ReportsTable.tsx:21`.
- AC2 PASS — tracker nodes and hosted HTML: `web/features/reports/ReportsTable.tsx:79`.
- AC3 PASS — project-empty versus unattributed state: `web/features/reports/ProjectReportsView.tsx:49`.

Changed paths:

- `web/app/(projects)/projects/[projectId]/reports/page.tsx`
- `web/features/reports/ProjectReportsView.tsx`
- `web/features/reports/ReportsTable.tsx`
- `web/features/reports/useProjectReports.ts`

Focused test: `cd web && npm run test -- reports-surface` — PASS, 8/8.

## Commit-equivalent block 2 — node_01KZH6T216V98DRSSRGTQRJ2ST

Server-filtered/faceted/cursor-paged `GET /api/reports` and grouped top-level `/reports`; unattributed reports remain visible. V1 records actual tracker-node links as the epic proxy.

AC status:

- AC1 PASS — cross-project collection/route: `api/app/services/reports.py:85`, `web/app/reports/page.tsx:1`.
- AC2 PASS — project/route/truth/date/tracker grouping and decision: `web/features/reports/ReportsHub.tsx:50`, `docs/DECISIONS.md:1231`.
- AC3 PASS — unattributed facet/retention: `api/app/services/reports.py:152`.
- AC4 PASS — required API contract change recorded: `docs/DECISIONS.md:1231`.

Changed paths:

- `api/app/api/reports.py`
- `api/app/models/report.py`
- `api/app/services/reports.py`
- `api/tests/test_routes_reports.py`
- `web/app/reports/page.tsx`
- `web/features/reports/CentralReportsTable.tsx`
- `web/features/reports/ReportsHub.tsx`
- `web/features/reports/index.ts`
- `web/features/reports/types.ts`
- `web/features/reports/useReports.ts`
- `web/__tests__/reports-surface.test.tsx`

Focused test: `cd api && python3 -m pytest -q tests/test_routes_reports.py tests/test_routes_overview.py tests/test_fleet_collector.py tests/test_content_upload.py tests/test_backfill_reports.py tests/test_report_revision.py tests/test_openapi_parity.py` — PASS, 72/72.

## Commit-equivalent block 3 — node_01KZH6VA1PKE7C6NDERQPRKNCC

Typed persisted fleet snapshot, laptop collector/measurement, zero-live-call API composition, latest report links, provenance, age/staleness, and historical narrative labeling.

AC status:

- AC1 PASS — dynamic API-backed overview names source/age and never falls back to fixtures: `web/features/overview/OverviewView.tsx:135`, `api/app/services/overview.py:69`.
- AC2 PASS — all 14 rows resolve newest program/dossier reports in one registry scan: `api/app/services/overview.py:74`; canonical smoke returned 14/14 links.
- AC3 PASS — current remeasurement and data-source decision: `docs/measurements/fleet-snapshot-2026-09-09.json:1`, `docs/DECISIONS.md:1184`.
- AC4 PASS — `:8099` retired; upstream files explicitly retained/queued for coordinated removal: `docs/DECISIONS.md:1219`.

Changed paths:

- `api/app/api/overview.py`
- `api/app/models/overview.py`
- `api/app/repositories/fleet_snapshots.py`
- `api/app/services/overview.py`
- `api/tests/test_fleet_collector.py`
- `api/tests/test_routes_overview.py`
- `docs/measurements/fleet-snapshot-2026-09-09.json`
- `docs/measurements/tracker-divergence-2026-09-08.md`
- `registry/fleet_snapshots.jsonl`
- `scripts/collect_fleet_snapshot.py`
- `scripts/measure_tracker_divergence.py`
- `web/app/overview/page.tsx`
- `web/features/overview/OverviewView.tsx`
- `web/features/overview/index.ts`
- `web/features/overview/useOverview.ts`
- `web/__tests__/overview-surface.test.tsx`

Focused tests: the 72-test API command above — PASS, 72/72; `cd web && npm run test -- overview-surface` — PASS, 3/3.

## Commit-equivalent block 4 — node_01KZH6QVPKAN01N8JTQ09XRMXA

Umbrella integration and canonical backfill metadata for all 14 prototype program reports. Managed report URIs are workspace-relative; identical reingest repairs absent runtime blobs.

AC status:

- AC1 PASS via block 1: `web/features/reports/ProjectReportsView.tsx:49`.
- AC2 PASS via block 2: `web/features/reports/ReportsHub.tsx:81`.
- AC3 PASS via block 3: `web/features/overview/OverviewView.tsx:145`.
- AC4 PASS — 14/14 canonical rows, relative URIs, and locally previewable blobs: `registry/assets.jsonl:67`, `api/app/services/import_index.py:1451`.

Changed paths:

- `.claude/worknotes/reports-hub/implementation-notes.md`
- `.operator/runs/op_run_20260909_033840_execute-existing-artifac/.runrecord.lock`
- `.operator/runs/op_run_20260909_033840_execute-existing-artifac/run.json`
- `STEWARD-HANDOFF.md`
- `api/app/api/__init__.py`
- `api/app/api/_deps.py`
- `api/app/services/import_index.py`
- `api/tests/conftest.py`
- `api/tests/test_content_upload.py`
- `api/tests/test_report_revision.py`
- `docs/DECISIONS.md`
- `docs/mvp-backlog.md`
- `registry/asset_links.jsonl`
- `registry/assets.jsonl`
- `registry/events.jsonl`
- `shared/openapi.yaml`
- `web/components/shell/CommandPalette.tsx`
- `web/components/shell/SidebarNav.tsx`
- `web/lib/api.ts`
- `web/lib/types.ts`

Focused test: the 72-test API command above — PASS, 72/72. Canonical local smoke — PASS: 16 total reports, 14 backfills with relative URIs, overview 200/14 rows/14 report links, all linked previews 200.

## Runtime blobs and activation

The 14 ignored content blobs below are runtime data, not commit candidates:

- `assets/content/22/22b037c78e6899721b2692ec54985ad4eb72fbea0e9feb101000a8deb43708a3`
- `assets/content/42/421d741fc69ce277f1875949f43536740eb9d0991200c3c5d4ee634d0912c411`
- `assets/content/44/4463211a5e5f930675c152574b4f8f27e4006c1529f95bcdd0a8fa7a5331efb7`
- `assets/content/57/57e52b8f2ea413c5ead966b2978294898a954f4544d6baba68b31cd5b81b3f1a`
- `assets/content/59/59919a8f678ee0742321ce550b92d8afb2c8b854c371cffed59fafa831032863`
- `assets/content/60/60da653a0daeb0e988ac402fc3e38dfde7c545b4d8ece52068941d1530fb57c8`
- `assets/content/77/77afa35d759a7a543f3dafb42c4efe337c8691fd50b91072ad0b7251337e3f2f`
- `assets/content/7e/7e02f5c71dfba2a76be7a933454e8e8fa5dccdfc9cf07986bce318553f686b0b`
- `assets/content/82/826cc1ac9ad7606fe5e24c788ffad3f5a70dedfae98c2c47941a96e894799147`
- `assets/content/89/8932799dedbd621dbc57774680cc0eb3e8fb1584d3270c3fe639d2ed6fcf100f`
- `assets/content/97/97bbf5e12796aac71380b95f214a54874b367e01469d3bbd12a511554c53eb1c`
- `assets/content/9d/9d502c325ba7a9917937a3ececc743663ef61248fa10f851cf01d2c3d5124923`
- `assets/content/e1/e18f7cab6acc1a42ed65d5154665eb96d48d404b0c9ea9b8a64e638ebdde4179`
- `assets/content/fd/fd20299b558c1e813454aa68a22752af98dd1cd6b1bc05f2ac9d37b8f09e3231`

After merge/deploy, the native steward must run the idempotent report backfill in the application container against persistent `/data/registry` and `/app/assets`, using the mounted prototype root with `--collection aos-atlas --apply --all`, then smoke `GET /api/reports`, `GET /api/overview`, and each returned preview URL. Do not copy linked-worktree absolute URIs into the registry.

## Final verification

- `make test` — PASS after all fixes: API 816 passed, 2 skipped; web 121 passed.
- `make typecheck` — PASS.
- `cd web && npm run build` — PASS; `/overview`, `/reports`, and `/projects/[projectId]/reports` emitted.
- `git diff --check` — PASS.
- `node .agents/skills/skillmeat-cli/scripts/analyze-project.js .` — no additional artifacts recommended.
- Independent review — PASS: receipt/snapshot exact 14/14, no host/secret strings, all 14 blobs hash/size-valid, all overview links and previews 200.

Out-of-scope nodes: `node_01M2242NJKCRBKTP2G5YK24W2M` (fixture isolation, fixed here); `node_01M226PQC1QSB8CX3300M07NM6` (cursor hardening); overview follow-ups `node_01M226V9JNKYEWQM9EK3BPBT54`, `node_01M226V9XHMK632XAB69FA4AFD`, `node_01M226VABZ5749NV44GRFQ3HA9`, `node_01M226VANCGSVK605A4VYNZBVT`, `node_01M226VB254G3QGVV950E79SVC`.
