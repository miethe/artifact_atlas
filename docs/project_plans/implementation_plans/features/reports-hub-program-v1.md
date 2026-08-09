---
it_schema: 1
schema_version: 2
feature_slug: reports-hub-program
title: "Reports Hub — build the discovery surfaces (PF-4 program: foundations-apply + operator asks #1 and #2) — implementation plan"
doc_type: implementation_plan
status: draft
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
- 'M0: the live instance at 10.42.10.76:8042 reports >1 project AND >1 delivery_report
  with non-null project_id, measured by command, with the pre-mutation counts recorded.'
- 'M1: a per-project reports lens renders real reports from the API; an API failure renders
  an error, never fixtures.'
- 'M2: GET /api/reports returns delivery_report assets across >=2 projects PLUS the
  unattributed bucket in one call, with facet counts over the FULL filtered set, and
  shared/openapi.yaml carries the path.'
- 'M3: /reports renders every report including unattributed; group-by project / route
  / truth_status / date all show server-authoritative counts; reachable from SidebarNav
  and the command palette.'
- 'M4: D-020 records the API-shape and ownership decisions; every deferred item has a
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
  rationale: "456fdf1 shipped seed_fleet_projects.py and backfill_reports.py as code but neither was ever run --apply. Measured 2026-08-09: the live node holds 1 project and 1 report with project_id: null. Without M0 every surface ships structurally complete and demonstrably empty, and NODE AC4 is unverifiable."
  status: accepted
- decision: "The next free decision number is D-020."
  rationale: "All three sibling plans assert D-018 is the latest decision. FALSE as of 456fdf1 — D-019 exists at docs/DECISIONS.md:989 and is Accepted."
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
      title: "Apply the shipped foundations to the live instance"
      depends_on: []
      exit_criteria:
      - "Pre-mutation counts recorded; seed_fleet_projects.py --apply and backfill_reports.py --apply run against 10.42.10.76:8042; post counts show >1 project and >1 attributed delivery_report."
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
      title: "Close-out — D-020, DI rows, backlog, AOS deferral"
      depends_on: ["M3"]
      exit_criteria:
      - "D-020 recorded; a DI row exists for every deferred item; docs/mvp-backlog.md updated; the AOS-overview plan is marked deferred carrying its resolved OQ-1/OQ-2."
      gate_lens: [validator]
---

# Implementation Plan — Reports Hub discovery surfaces

Three sibling plans (PF-1/2/3) made a delivery report generatable, hostable, and link-attachable, and
`456fdf1` shipped the attribution/seeding/backfill code. But nothing was ever applied to the live
instance and no discovery surface exists: measured 2026-08-09, the node holds **1 project and 1 report
with `project_id: null`**, reachable from no page of the app. When this is done the foundations are
live, a project page lists its own reports, and a top-level `/reports` lists every report across every
project with server-authoritative grouping.

## Scope boundary

**In:** applying the two foundation scripts to the live instance; the per-project reports lens; the
`GET /api/reports` collection route; the top-level `/reports` surface with grouping and facets; the
`SidebarNav`/`CommandPalette` widening that a non-project route requires.

**Out (stated, not silently dropped):**
- **Operator ask #3, the AOS-wide overview** — deferred by operator call. Its plan stays in place with
  its two blocking OQs now resolved (see `decisions`), so it is pickup-ready, not restarted.
- **Epic grouping** — `epic` is not a modeled entity anywhere (`AssetLinkTargetType` has 9 members and
  no `epic`). NODE AC2 permits recording the blocker instead; expect grouping by tracker node.
- **The ADR-7 vs ADR-8 numbering reconciliation** — `web/lib/flags.ts:16-19` credits ADR-7 for the
  default-on cutover while `docs/DECISIONS.md:521-525` records ADR-7 superseded by ADR-8. M3 corrects
  the code comment only; renumbering `docs/DECISIONS.md` is not in scope.
- **Fixing `searchApi.search`** — it POSTs to a GET-only endpoint (`web/lib/api.ts:371-378` vs
  `api/app/api/search.py:36`), so it is broken today and `GlobalSearch.tsx:62` already depends on it.
  Add a working GET accessor for our own use and file a DI row; do not refactor the existing caller.

## Rubric — what "good" looks like

**A silent drop is the defining failure of this feature.** Every AC that matters is about something
still being visible: the unattributed report, the project with no reports, the unknown `truth_status`
value. Prefer rendering a value verbatim over validating it away; prefer an extra visible bucket over
a clean-looking list. `truth_status` is free-form in the backend (`import_index.py:698`, read via
`.get()`, no enum) — an unrecognized value must reach the screen, not a filter.

**An error must never look like emptiness.** The existing hooks swallow API failures into fixtures
(`useAssets.ts:53-58`, `:80-83`), which is exactly how a broken lens looks healthy. New hooks return
an error state. A reviewer should be able to break the API and see the difference.

**Counts are server-authoritative or they are wrong.** The existing library derives facets from the
loaded page only (`AssetLibrary.tsx:166-173`). A cross-project lens that does this reports numbers
that change as you scroll. Facets are computed over the full filtered set (`_deps.py:57-94` already
returns a full filtered `total`).

## Named risks

- **M0 mutates a live store, and the backfill is not obviously idempotent.** `instance_key` still
  varies with the invocation — `--collection` selects the anchor rule and the `repo_root` prefix
  depends on which checkout the path is reached through (ITT `node_01KZHNHBMQSR87X6D8ZX25T5MA`). Snapshot
  the `atlas-assets` volume first, record pre-counts, run seeding before backfill, and re-run backfill
  once to prove it does not double-ingest.
- **Seeding creates ~41 project rows but only ~14 produce reports** (ITT `node_01KZHNGY48EVDTR4G814048QNX`),
  so group-by-project ships mostly-empty groups. That is a presentation decision, not a bug — decide
  at M3 whether empty project groups are hidden, collapsed, or shown.
- **`AssetLink.target_id` stores a project SLUG while `asset.project_id` now stores a canonical `proj_*` id**
  (ITT `node_01KZHJX2Z3FCQBP9Q36J93FTFJ`). Any join between links and projects must not assume one key space.
- **`GET /api/reports` is an authorization surface.** It is the first route to return assets outside a
  project scope, and reports default to `sensitivity=personal` (`import_index.py:735-741`). Cross-project
  must not mean cross-policy — hence the `security` lens on M2.
- **Three plans, one `SidebarNav.tsx`.** Ownership is assigned in `decisions`; violating it is a merge
  conflict, not a style issue.

## References

- Detail for M1: `docs/project_plans/implementation_plans/features/reports-hub-per-project-surface-v1.md`
- Detail for M2+M3: `docs/project_plans/implementation_plans/features/reports-hub-central-lens-v1.md`
- Deferred, pickup-ready: `docs/project_plans/implementation_plans/features/reports-hub-aos-overview-v1.md`
- Foundations shipped: `456fdf1`; decision `docs/DECISIONS.md#D-019`; scripts `scripts/seed_fleet_projects.py`, `scripts/backfill_reports.py`
- Live instance: `http://10.42.10.76:8042` (health at `/health`, unprefixed — **not** `/api/health`); web `:3040`

> **Premise correction for all three sibling plans.** They assert D-018 is the latest decision and
> that DI-G4 constrains this work to "additive UI only". Both are false as of `456fdf1`: D-019 exists
> and supersedes those deferrals. M2's new route is a sanctioned contract change, not a violation.

## Milestones

### M0 — Foundations applied to the live instance

The scripts from `456fdf1` have run against `10.42.10.76:8042`. The fleet project rows exist and the
14 existing program-route reports are ingested and attributed. This is the only milestone that mutates
a deployed system; it runs alone, before any code.

**AC:** pre-mutation counts recorded verbatim (1 project, 1 report, 0 attributed); post-run counts show
>1 project and >1 delivery_report with non-null `project_id`, each measured by a stated command; a
second backfill run creates no duplicates.

### M1 — Per-project reports surface (owns `web/features/reports/`)

A project page has a reports-only lens showing route, revision, `truth_status`, and source commit. Rows
open the hosted report HTML and show which tracker nodes the report is linked to. This milestone
establishes the module, the canonical metadata type, and the fixture-free hook pattern its siblings reuse.

**AC:** the three states are mutually distinguishable — populated, "this project has no reports", and
"reports exist but are unattributed"; an API failure renders an error and never fixture rows; an
unrecognized `truth_status` renders verbatim.

### M2 — `GET /api/reports`

One call returns delivery reports across every project plus the unattributed bucket, with facet counts
computed over the full filtered set and `include=links` to avoid an N+1. The policy layer still applies.

**AC:** response spans >=2 projects and includes `project_id: null` rows; facet totals match the full
filtered count, not the returned page; `shared/openapi.yaml` carries the path; no asset is returned that
the per-project route would have withheld.

### M3 — `/reports` centralized lens (owns nav + palette)

A top-level `/reports` route mounting `AppShell` lists every report, groupable by project, route,
`truth_status`, and date, with the unattributed group pinned last. Reachable from `SidebarNav` and the
command palette — which requires widening `NavItem.href` off its project-scoped signature.

**AC:** all four groupings render server-authoritative counts; the unattributed group is present and
last; the three empty states are distinguishable; an API 5xx renders an error, never fixtures.

### M4 — Close-out

**AC:** D-020 records the API-shape, ownership, and workspace-filter decisions; a DI row exists for each
deferred item (epic grouping, `searchApi.search`, slug-vs-id link keys, empty project groups);
`docs/mvp-backlog.md` updated; the AOS-overview plan marked deferred carrying its resolved OQ-1/OQ-2.

## AC -> command -> evidence

| AC | Command | Evidence of pass |
|---|---|---|
| M0 counts | `curl -s http://10.42.10.76:8042/api/projects \| jq .total` ; `curl -s "http://10.42.10.76:8042/api/search?q=&artifact_type=delivery_report&limit=200" \| jq '[.items[].project_id]'` | `total` > 1; the project_id array holds non-null values. Note `q=` is REQUIRED (422 without it). |
| M0 idempotent | re-run `scripts/backfill_reports.py --apply` | report total unchanged between the two runs |
| M1 no fixtures | stop the API, load the project reports lens | error state renders; no `FIXTURE_ASSETS` rows |
| M2 cross-project | `curl -s http://10.42.10.76:8042/api/reports \| jq '[.items[].project_id] \| unique'` | >=2 distinct ids AND a `null` present |
| M2 facets | compare `facets` totals against `total` for the same filter | facet sum reconciles to the full filtered total, not the page size |
| M2 contract | `grep -n "/api/reports" shared/openapi.yaml` | path present |
| M3 groupings | load `/reports`, switch all four group-by modes | each renders; unattributed group last |
| M3 reachable | click through from `SidebarNav`; open the command palette | both reach `/reports` |
| M4 docs | `grep -nE "^## D-020" docs/DECISIONS.md` | decision present |

## Sequencing (load-bearing)

Order matters for three reasons, and only these: **(1)** M0 precedes everything because every surface
AC is a claim about real data — building first means verifying against a one-row instance. **(2)** M1
precedes M2/M3 because it owns `web/features/reports/` and the canonical metadata type; reversing this
produces the duplicate-type conflict the sibling plans independently walked into. **(3)** M3 follows M2
because the lens is a client of a contract that does not exist yet, and M3 alone owns the `SidebarNav`
widening all three plans need.

## Execution ledger

Deviations and conservative choices are logged with rationale to
`.claude/worknotes/reports-hub-program/implementation-notes.md` and reviewed at each milestone boundary
— rather than halting on them.

**Blockers still stop** (work that cannot correctly proceed: a failing test on current work, an
unsatisfiable declared artifact, exhausted recovery). Beyond those, mid-milestone halts are only for:
destructive action, real scope change, or input only the operator has.

**Mode-D boundaries are unchanged and non-negotiable** — **auth · payments/billing · schema migrations ·
data deletion · secret rotation · infrastructure**. M0 mutates a deployed instance's asset store: it is
operator-approved as of 2026-08-09, but it snapshots first and halts on any pre-count mismatch against
the figures recorded above.
