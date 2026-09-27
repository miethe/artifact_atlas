---
it_schema: 1
schema_version: 2
feature_slug: reports-hub-program
title: "Reports Hub — build the discovery surfaces (PF-4 program: foundations-apply + operator asks #1 and #2) — implementation plan"
doc_type: implementation_plan
status: ready
tier: 3
priority: P1
points: 16
risk_level: medium
context_class: C3
created: '2026-08-09'
prd_ref: null
intenttree_workspace: ws_01KV8VMWX9EJ6VDQKEBMYQZRXG
intenttree_tree: tree_01KYWGV76XTEM7B11GYWD7Q93Y
intenttree_node: node_01KZH6QVPKAN01N8JTQ09XRMXA
spike_ref: null
adr_refs:
- docs/DECISIONS.md#D-018
- docs/DECISIONS.md#D-019
- docs/DECISIONS.md#D-020
- docs/DECISIONS.md#D-021
related_documents:
- docs/project_plans/implementation_plans/features/reports-hub-per-project-surface-v1.md
- docs/project_plans/implementation_plans/features/reports-hub-central-lens-v1.md
- docs/project_plans/implementation_plans/features/reports-hub-aos-overview-v1.md
- docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
- docs/DECISIONS.md
- docs/mvp-backlog.md
acceptance_criteria:
- 'NODE AC1 (verbatim): A project''s own page lists the delivery reports linked to it,
  filterable to reports only.'
- 'NODE AC2 (verbatim): A single centralized reports surface lists every report across
  all projects with grouping by project, epic/tracker node, route, and truth_status.'
- 'NODE AC4 (verbatim): The 14 existing program-route reports are discoverable through
  the above, not only as loose files.'
- 'M0 (PARTIALLY COMPLETE as of 2026-08-11): the projects half is MET — GET /api/projects
  on 10.42.10.76:8042 returns total 25, applied by D-020 / 12a1fb3; the seeder MUST NOT
  be re-run. Remaining: run ONLY scripts/backfill_reports.py --apply so every
  delivery_report in the corpus carries a non-null project_id. Pre-state measured
  2026-08-11: 25 projects, 1 delivery_report, 0 attributed (asset_c7c088ab3c8d4639 is
  project_id: null, workspace_id: null, status: inbox; GET /api/projects/proj_artifact_atlas/assets?artifact_type_id=delivery_report
  returns total 0). The backfill INGESTS rendered report HTML via ImportService.import_report
  (scripts/backfill_reports.py --help: it scans a root for rendered HTML and requires --apply
  PLUS --all or --select), so it creates new assets rather than merely attributing the existing
  one — the post-state target is therefore >1 attributed, sourced from the ~14 ingestable
  program-route reports, which is also what makes M2''s >=2-projects criterion and NODE AC4
  satisfiable. Pre-mutation counts are re-measured and recorded at M0 start, and backfill is
  re-run once to prove idempotency.'
- 'M1: a per-project reports lens renders real reports from the API; an API failure renders
  an error, never fixtures.'
- 'M2: GET /api/reports returns delivery_report assets across >=2 projects PLUS the
  unattributed bucket in one call, with facet counts over the FULL filtered set, and
  shared/openapi.yaml carries the path.'
- 'M3: /reports renders every report including unattributed; group-by project / route
  / truth_status / date all show server-authoritative counts; reachable from SidebarNav
  and the command palette.'
- 'M4: D-022 records the API-shape and ownership decisions; every deferred item has a
  DI row; the AOS-overview plan is marked deferred with its blocking OQs resolved.'
open_questions:
- 'OQ-1 (non-blocking, decide at M1): does a report row open in the house asset modal
  (?item=&tab=preview) or a new tab at the API-origin URL? Sibling plan recommends BOTH
  — title opens the modal, an explicit "Open full report" opens full width.'
- 'OQ-2 (non-blocking, upstream): what IS an "epic"? Not modeled in IntentTree or Atlas
  (AssetLinkTargetType has 9 members, no `epic`). NODE AC2 says epic grouping is satisfied
  by implementing it OR recording the blocker. Expect: record the blocker, group by
  tracker node instead.'
- 'OQ-3 (non-blocking, M2): should facet totals respect policy redaction (pre- vs post-policy
  counts)? Reports default to sensitivity=personal / agent_access=preview_allowed.'
decisions:
- decision: "Scope is operator asks #1 and #2 only; ask #3 (AOS-wide overview) is deferred with its plan intact."
  rationale: "Operator call 2026-08-09. Asks #1+#2 are the two Tier-2 plans (13 pts) and one coherent UI story; ask #3 is Tier 3 (13 pts) and carries a cross-repo collector plus its own re-measurement milestone."
  status: accepted
- decision: "The cross-project lens is served by a NEW purpose-built `GET /api/reports`."
  rationale: "Operator call, resolving central-lens OQ-1. Relaxing GET /api/search is ruled out on evidence — _asset_to_result drops `metadata` (api/app/api/search.py:24-35) and the lens is entirely metadata-driven. A generic GET /api/assets was declined as a wider contract than this run needs."
  status: accepted
- decision: "v1 applies NO workspace filter; `workspace_id: null` is treated as in-scope."
  rationale: "Resolves central-lens OQ-2 on evidence. Deployment is single-workspace (api/app/settings.py:80) and pre-fix reports carry workspace_id: null, so a workspace filter is a second silent-drop path on top of project_id — the exact failure NODE AC3 forbids."
  status: accepted
- decision: "M1 OWNS `web/features/reports/` and the single canonical report-metadata type and parser. M2/M3 reuse them and MUST NOT introduce a second type."
  rationale: "The two sibling plans independently specify the same field set under different names (`ReportMetadata` vs `DeliveryReportMetadata`). M1 ships first, so it owns the module; central-lens's own rule already says whichever ships first owns the directory."
  status: accepted
- decision: "M3 alone widens `SidebarNav`'s `NavItem.href` from `(projectId) => string` to accept a non-project route, and alone edits CommandPalette."
  rationale: "Resolves AOS-overview OQ-7, which the plan itself calls a sequencing call, not a design call. All three plans need the same widening of the same file; doing it twice is a merge conflict. M1 registers a project-scoped item only and needs no signature change."
  status: accepted
- decision: "The foundations are applied to the live instance (M0) BEFORE any surface is built."
  rationale: "456fdf1 shipped seed_fleet_projects.py and backfill_reports.py as code but neither was ever run --apply; measured 2026-08-09 the live node held 1 project and 1 report with project_id: null. HALF DISCHARGED as of 2026-08-11: the seeder was applied under D-020 (12a1fb3) and GET /api/projects now returns total 25, so M0 reduces to the backfill alone. Without that backfill every surface ships structurally complete and demonstrably empty, and NODE AC4 is unverifiable."
  status: accepted
- decision: "The next free decision number is D-022."
  rationale: "D-019 was the latest decision when this plan was authored (2026-08-09), which is why the sibling plans' D-018 claim was already false. Two more landed afterward: D-020 (fleet seeding scope — commit recency, not layer or report history — AND fleet seeding applied to the live instance, 12a1fb3) and D-021 (project write models declare workspace_id + canonical registry seed, fc9809d). docs/DECISIONS.md now ends at D-021 (line 1150), so D-022 is the next free number. Re-verify at M4 start: this number has already moved twice."
  status: accepted
- decision: "For the DEFERRED AOS-overview plan: its collector runs laptop-side where the checkouts are and pushes a versioned `fleet_snapshot` asset to Atlas over HTTP; Atlas never shells git."
  rationale: "Operator call, resolving AOS OQ-1. The prototype collector needs `git worktree list` / `status --porcelain` across 14 checkouts, impossible from the API container. Recorded now so the deferred plan is unblocked when picked up. AOS OQ-2 follows: a distinct `fleet_snapshot` type, precisely so fleet snapshots do NOT surface in the two lenses this program builds."
  status: accepted
routing_constraints:
- "M0 is a live-instance mutation and MUST stay claude-primary — never offloaded, never batched with build work."
- "The GET /api/reports contract (M2) — route shape, facet semantics, policy redaction — MUST stay claude-primary."
- "Fixture-fallback removal and the metadata parser are correctness-critical; claude-primary."
- "Grouping/faceting UI assembly and openapi path authoring (M3) are offload-eligible once M2's contract is fixed."
- "Doc/DI/backlog sweeps (M4) are offload-eligible."

wave_plan:
  waves: [["M0"], ["M1"], ["M2"], ["M3"], ["M4"]]
  phases:
    - id: M0
      title: "Apply the remaining foundation (report backfill) to the live instance — seeding already applied"
      depends_on: []
      exit_criteria:
      - "PARTIALLY COMPLETE 2026-08-11: seeding is DONE (GET /api/projects -> total 25, applied by D-020 / 12a1fb3) and seed_fleet_projects.py --apply MUST NOT be re-run. Remaining: re-measure and record pre-mutation counts (expected 25 projects, 1 delivery_report, 0 attributed), then run ONLY scripts/backfill_reports.py --apply (which needs --all or --select, and an explicit --collection since it has no default) against 10.42.10.76:8042. Post target: >1 delivery_report, every one carrying a non-null project_id, sourced from the ~14 ingestable program-route reports. Re-run the backfill once to prove it does not double-ingest."
      gate_lens: [security, validator]
      gate_lens_reason: irreversible-outward
    - id: M1
      title: "Per-project reports surface (operator ask #1) — owns web/features/reports/"
      depends_on: ["M0"]
      exit_criteria:
      - "A project page lists its delivery reports with route / revision / truth_status / source commit; rows open the hosted HTML and show linked tracker nodes; error state is distinguishable from both empty states; zero fixture fallback."
      gate_lens: [validator]
    - id: M2
      title: "GET /api/reports — cross-project collection route + openapi"
      depends_on: ["M1"]
      exit_criteria:
      - "Route returns reports from >=2 projects plus the unattributed bucket in one call, with facet counts over the full filtered set, and does not leak assets past the policy layer; shared/openapi.yaml carries the path."
      gate_lens: [security, validator]
      gate_lens_reason: authz-boundary
    - id: M3
      title: "/reports centralized lens (operator ask #2) — owns nav + palette"
      depends_on: ["M2"]
      exit_criteria:
      - "/reports renders all reports including unattributed (pinned last); group-by project / route / truth_status / date show server counts; reachable from SidebarNav and command palette; API 5xx renders an error, never fixtures."
      gate_lens: [validator]
    - id: M4
      title: "Close-out — D-022, DI rows, backlog, AOS deferral"
      depends_on: ["M3"]
      exit_criteria:
      - "D-022 recorded (re-verify it is still the next free number — D-020/D-021 landed after this plan was authored); a DI row exists for every deferred item; docs/mvp-backlog.md updated; the AOS-overview plan is marked deferred carrying its resolved OQ-1/OQ-2."
      gate_lens: [validator]
---

# Implementation Plan — Reports Hub discovery surfaces

`456fdf1` shipped the attribution/seeding/backfill code but never ran it, so measured 2026-08-09 the
live node held **1 project and 1 report with `project_id: null`**, reachable from no page of the app.
**Re-measured 2026-08-11: fleet seeding HAS since been applied** — `GET /api/projects` returns
**total 25** (D-020, `12a1fb3`) — **but the report backfill has NOT.** `GET /api/assets/asset_c7c088ab3c8d4639`
still returns `project_id: null`, `workspace_id: null`, `status: inbox`, and
`GET /api/projects/proj_artifact_atlas/assets?artifact_type_id=delivery_report` returns `total: 0`:
exactly one `delivery_report` exists in the corpus and it is unattributed. So M0 is **partially
complete** and reduces to the backfill alone. Done means: the backfill applied, a project page lists
its own reports, and a top-level `/reports` lists every report across every project with
server-authoritative grouping.

## Scope boundary

**In:** the remaining foundation script (`backfill_reports.py`) applied live — the seeder is already
applied and is explicitly OUT; the per-project reports lens; `GET /api/reports` with
an `include=links` expansion that avoids an N+1; the top-level `/reports` surface (mounting `AppShell`
itself, outside the `(projects)` group) with grouping and facets; the `SidebarNav`/`CommandPalette`
widening a non-project route requires. Milestone detail lives in `wave_plan`/`acceptance_criteria`.

**Out, stated not silently dropped.** Operator ask #3, the AOS-wide overview — deferred; its plan
stays pickup-ready with both blocking OQs resolved (see `decisions`). Epic grouping — `epic` is not a
modeled entity anywhere (`AssetLinkTargetType` has 9 members, no `epic`); NODE AC2 permits recording
the blocker, so expect tracker-node grouping. ADR-7 vs ADR-8 renumbering — `web/lib/flags.ts:16-19`
credits ADR-7 while `docs/DECISIONS.md:521-525` records it superseded by ADR-8; M3 corrects the code
comment only. Fixing `searchApi.search` — it POSTs to a GET-only endpoint (`web/lib/api.ts:371-378`
vs `api/app/api/search.py:36`) and `GlobalSearch.tsx:62` depends on it; add a working GET accessor for
our own use and file a DI row, do not refactor the existing caller.

## Rubric — what "good" looks like

**A silent drop is the defining failure of this feature** — the unattributed report, the project with
no reports, and an unrecognized `truth_status` must all reach the screen; `truth_status` is free-form
in the backend (`import_index.py:698`, read via `.get()`, no enum), so render it verbatim and prefer
an extra visible bucket over a clean-looking list. **An error must never look like emptiness** — the
shipped hooks swallow API failures into fixtures (`useAssets.ts:53-58`, `:80-83`), which is how a
broken lens looks healthy; new hooks return an error state a reviewer can see by killing the API.
**Counts are server-authoritative or they are wrong** — the library derives facets from the loaded
page only (`AssetLibrary.tsx:166-173`), which cross-project means numbers that change as you scroll;
facets come from the full filtered set (`_deps.py:57-94` already returns a full filtered `total`).

## Named risks

- **M0 mutates a live store, and the backfill is not obviously idempotent.** `instance_key` still
  varies with the invocation — `--collection` selects the anchor rule and the `repo_root` prefix
  depends on which checkout the path is reached through (ITT `node_01KZHNHBMQSR87X6D8ZX25T5MA`). Snapshot
  the `atlas-assets` volume first, record pre-counts, run seeding before backfill, and re-run backfill
  once to prove it does not double-ingest.
- **Seeding creates many project rows but few produce reports** (ITT `node_01KZHNGY48EVDTR4G814048QNX`;
  the estimate here was ~41 — the applied D-020 scoping (commit recency) produced **25**),
  so group-by-project ships mostly-empty groups. That is a presentation decision, not a bug — decide
  at M3 whether empty project groups are hidden, collapsed, or shown.
- **`AssetLink.target_id` stores a project SLUG while `asset.project_id` now stores a canonical `proj_*` id**
  (ITT `node_01KZHJX2Z3FCQBP9Q36J93FTFJ`). Any join between links and projects must not assume one key space.
- **`GET /api/reports` is an authorization surface.** It is the first route to return assets outside a
  project scope, and reports default to `sensitivity=personal` (`import_index.py:735-741`). Cross-project
  must not mean cross-policy — hence the `security` lens on M2.
- **Three plans, one `SidebarNav.tsx`.** Ownership is assigned in `decisions`; violating it is a merge
  conflict, not a style issue.
- **Main moved three commits while this plan sat unexecuted** — D-020 (`12a1fb3`, which also applied
  fleet seeding), D-021 (`fc9809d`, which changed the project write models to declare `workspace_id`
  and seeded `registry/projects.jsonl`), plus a workflows sync. Re-measure every live count at M0 start
  rather than trusting any figure in this plan, because these numbers have already gone stale once.

## References

- Detail for M1: `docs/project_plans/implementation_plans/features/reports-hub-per-project-surface-v1.md`
- Detail for M2+M3: `docs/project_plans/implementation_plans/features/reports-hub-central-lens-v1.md`
- Deferred, pickup-ready: `docs/project_plans/implementation_plans/features/reports-hub-aos-overview-v1.md`
- Foundations shipped: `456fdf1`; decision `docs/DECISIONS.md#D-019`; scripts `scripts/seed_fleet_projects.py` (**already applied live** — D-020, `12a1fb3`), `scripts/backfill_reports.py` (**not applied** — this is M0's only remaining action)
- Landed after this plan was authored: `docs/DECISIONS.md#D-020` (fleet seeding scope + applied seeding, `12a1fb3`), `docs/DECISIONS.md#D-021` (project write-model `workspace_id` + canonical registry seed, `fc9809d`)
- Live instance: `http://10.42.10.76:8042` (health at `/health`, unprefixed — **not** `/api/health`); web `:3040`

> **Two different list envelopes, measured 2026-08-11 — this shapes M2.** `GET /api/search` returns
> `{results, total}` and its `total` **equals the returned page size**, not the full filtered count
> (`limit=20` → `total` 20; `limit=200` → `total` 64). `GET /api/projects/{id}/assets` returns
> `{items, total, next_cursor}` and its `total` IS the full filtered count (63 at every limit).
> So `/api/search` cannot back a facet count, which is independent confirmation of the decision to
> build `GET /api/reports`. `GET /api/reports` MUST use the `{items, total, next_cursor}` shape and a
> full-set `total`; a third envelope would be a defect. Any snippet reaching for `.items[]` on
> `/api/search` is wrong and will silently yield nothing.

## AC -> command -> evidence

| AC | Command | Evidence of pass |
|---|---|---|
| M0 counts | `curl -s http://10.42.10.76:8042/api/projects \| jq .total` ; `curl -s "http://10.42.10.76:8042/api/search?q=&artifact_type=delivery_report&limit=200" \| jq '[.results[].project_id]'` | `total` is 25 **already** (seeding applied, D-020 — do not re-run the seeder); the project_id array holds non-null values **only after the backfill** (pre-state 2026-08-11: one entry, `null`). Note `q=` is REQUIRED (422 without it) and the envelope key is **`results`**, not `items` — see the envelope warning in References. |
| M0 idempotent | re-run `scripts/backfill_reports.py --apply` | report total unchanged between the two runs |
| M1 no fixtures | stop the API, load the project reports lens | error state renders; no `FIXTURE_ASSETS` rows |
| M2 cross-project | `curl -s http://10.42.10.76:8042/api/reports \| jq '[.items[].project_id] \| unique'` | >=2 distinct ids AND a `null` present |
| M2 facets | compare `facets` totals against `total` for the same filter | facet sum reconciles to the full filtered total, not the page size |
| M2 contract | `grep -n "/api/reports" shared/openapi.yaml` | path present |
| M3 groupings | load `/reports`, switch all four group-by modes | each renders; unattributed group last |
| M3 reachable | click through from `SidebarNav`; open the command palette | both reach `/reports` |
| M4 docs | `grep -nE "^## D-022" docs/DECISIONS.md` | decision present (D-020/D-021 already exist — confirm D-022 is still free before writing) |

## Sequencing (load-bearing)

Order matters for three reasons, and only these: **(1)** M0 precedes everything because every surface
AC is a claim about real data — building first means verifying against a one-row instance. **(2)** M1
precedes M2/M3 because it owns `web/features/reports/` and the canonical metadata type; reversing this
produces the duplicate-type conflict the sibling plans independently walked into. **(3)** M3 follows M2
because the lens is a client of a contract that does not exist yet, and M3 alone owns the `SidebarNav`
widening all three plans need.

## Execution ledger

Deviations and conservative choices are logged with rationale to
`.claude/worknotes/reports-hub-program/implementation-notes.md` and reviewed at each milestone
boundary rather than halting on them. **Blockers still stop** (a failing test on current work, an
unsatisfiable declared artifact, exhausted recovery); beyond those, mid-milestone halts are only for
destructive action, real scope change, or input only the operator has. **Mode-D boundaries are
unchanged and non-negotiable** — auth · payments/billing · schema migrations · data deletion · secret
rotation · infrastructure. M0 mutates a deployed instance's asset store: operator-approved as of
2026-08-09, but it snapshots first and halts on any pre-count mismatch against the figures above.
