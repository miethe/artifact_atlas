---
it_schema: 1
schema_version: 2
feature_slug: reports-hub-aos-overview
title: "Reports Hub — dynamic AOS-wide overview with per-project latest status (PF-4, operator ask #3) — implementation plan"
doc_type: implementation_plan
status: draft
tier: 3
priority: P2
points: 13
risk_level: medium
context_class: C3
created: '2026-08-08'
prd_ref: null
intenttree_workspace: ws_01KV8VMWX9EJ6VDQKEBMYQZRXG
intenttree_tree: tree_01KYWGV76XTEM7B11GYWD7Q93Y
intenttree_node: node_01KZH6VA1PKE7C6NDERQPRKNCC
spike_ref: null
adr_refs:
- docs/DECISIONS.md#D-018
- docs/DECISIONS.md#ADR-8
related_documents:
- docs/project_plans/implementation_plans/features/reports-hub-per-project-surface-v1.md
- docs/project_plans/implementation_plans/features/reports-hub-central-lens-v1.md
- docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
- docs/project_plans/prds/features/delivery-report-hosting-v1.md
- docs/DECISIONS.md
- ../agentic_meta_dev/.claude/reports/aos-atlas/README.md
- ../agentic_meta_dev/.claude/reports/aos-atlas/_build/collect.py
- ../agentic_meta_dev/.claude/reports/aos-atlas/_build/atlas_data.py
- ../agentic_meta_dev/docs/05-app-registry.yaml
- ../agentic_meta_dev/docs/project_plans/design-specs/delivery-report-hosting-and-linking-v1.md
acceptance_criteria:
- 'NODE AC1 (verbatim): An AOS-wide overview renders from live data in the app (not
  a hand-run static build) and states its data source.'
- 'NODE AC2 (verbatim): It links to the latest program/dossier-route report for each
  AOS project.'
- 'NODE AC3 (verbatim): The git-before-tracker premise from the prototype README is
  re-measured and the resulting data-source decision is recorded.'
- 'NODE AC4 (verbatim): The static :8099 build is retired or explicitly kept as a fallback
  with a stated reason.'
- 'M1: the re-measurement is a COMMITTED, re-runnable script whose output carries per-figure
  provenance; its 2026-08-08 result is recorded verbatim alongside the prototype README''s
  original numbers, and the DELTA between two same-day runs is explained rather than
  hidden; the data-source decision is a numbered decision in docs/DECISIONS.md.'
- 'M2: a collector emits a versioned fleet snapshot with `derived` and `authored` separated
  at the top level, no secrets in the payload, and Atlas exposes it through one typed
  read route whose response carries `generated_at`; the render path makes zero git, zero
  IntentTree, and zero LAN-probe calls.'
- 'M3: a top-level /overview route renders every fleet project from the snapshot, states
  its data source and snapshot age inline, goes visibly stale past a threshold, links
  each project to its newest program/dossier report, and renders an ERROR — never fixtures
  — when the snapshot read fails.'
- 'M4: the :8099 retire-or-keep recommendation is recorded as a numbered decision naming
  which parts retire and which survive and why; DI rows exist for every deferred piece;
  docs/mvp-backlog.md is updated.'
open_questions:
- "OQ-1 (BLOCKS M2 — needs sign-off before code): WHERE does the collector run? The
  prototype's collector reads 14 working git checkouts under /Users/miethe/dev/homelab/development
  (collect.py:20) — including `git worktree list` and `status --porcelain`, which are
  checkout-local and CANNOT be reproduced from a bare mirror on the agentic node. The
  Atlas API container has none of those repos. Plan recommends: the collector runs where
  the checkouts are (operator laptop) and pushes its snapshot to Atlas over HTTP; Atlas
  never shells git."
- "OQ-2 (BLOCKS M2): what artifact type carries the snapshot? A new `fleet_snapshot`
  type (vocabulary change, api/app/models/vocabulary.py) vs an untyped asset read through
  a bespoke route vs reusing `delivery_report` (WRONG — it is not a rendered report and
  would pollute both sibling reports surfaces' counts). Plan recommends a distinct type
  precisely so it does NOT appear in the sibling lenses."
- "OQ-3: does the overview live at a new `/overview`, or replace `web/app/page.tsx`'s
  ProjectsIndexView at `/`? Plan recommends `/overview` in v1 (reversible, no regression
  on the shipped root), with promotion to `/` as a later, separate decision."
- "OQ-4: snapshot cadence and trigger — manual `atlas overview collect`, a laptop cron/launchd
  timer, or an in-app refresh button. An in-app button requires the collector to be reachable
  FROM the API, which OQ-1's recommendation deliberately forbids. Plan recommends manual
  plus a documented timer in v1; the page's job is to state the age honestly, not to hide
  it."
- "OQ-5: is the fleet snapshot policy-sensitive? It aggregates commit subjects, branch
  names, and service health across 14 repos. The single-user LAN deployment argues no
  — but the sensitivity / agent_access defaults it inherits at ingest must be a stated
  choice, not an accident (mirrors DI-Sensitivity)."
- "OQ-6: AC2 says \"latest program/dossier-route report\". When a project has both a
  `program` and a `dossier` report, which wins? Plan recommends: newest by `metadata.generated_at`
  across both routes, with the route shown on the link so the operator is never guessing."
- "OQ-7: does this node widen `SidebarNav`'s `href: (projectId: string) => string`
  (web/components/shell/SidebarNav.tsx:22), or consume a widening already made by
  node_01KZH6T216V98DRSSRGTQRJ2ST? Both nodes need the same signature change; doing it
  twice is a merge conflict. This needs a sequencing call, not a design call."
decisions:
- decision: "AC3 re-measured 2026-08-08. The git-before-tracker premise HOLDS; the gap
    widened rather than closed. Therefore the overview CANNOT be a page that simply reads
    IntentTree — a COLLECTOR remains required, and the collector's git lane stays the
    primary source with the tracker as a second source shown side by side."
  rationale: "Prototype README:14-24 measured 1,880 commits/30d against 735 open tracker
    nodes, four projects with no tree bound, and knitwit at 609 commits/30d against 1
    tracker node. The 2026-08-08 re-run: 1,901 commits/30d, 743 open nodes, knitwit 616
    against 1 node, and the same four treeless projects — drifted, not improved. An
    independent reproduction of collect.py:122's exact command in this session returned
    704 for knitwit, and knitwit's tree now holds 2 nodes (one off-tree side_quest), which
    means the figures are RUN-SENSITIVE. That strengthens the conclusion and is why the
    measurement must be a committed script, not a transcribed number."
  status: proposed
- decision: "The overview is an ATLAS PAGE reading a DERIVED SNAPSHOT — not a periodically
    regenerated hosted delivery_report that Atlas merely serves, and not a page that
    queries git/IntentTree/LAN at render time."
  rationale: "A regenerated HTML capsule is a static build with a different host, which
    AC1 forbids in as many words (\"not a hand-run static build\"). It would also render
    inside the sandboxed iframe (web/features/assets/components/AssetViewer/HtmlRenderer.tsx,
    `allow-same-origin` never set), so it cannot link into Atlas routes, share nav, or
    participate in the app's URL state — killing AC2's \"links to\" in any useful sense.
    Conversely a live-querying page violates AOS constraint 4's spirit (nothing expensive
    on the render path) and is physically impossible in the deployed API container, which
    has no git checkouts. Snapshot-in / page-out satisfies both constraints at once."
  status: proposed
- decision: "The prototype's strict separation of hand-authored narrative from derived
    numbers is PRESERVED as a schema invariant: the snapshot has exactly two top-level
    payload keys, `derived` (collector output, every figure carrying `measured_by`) and
    `authored` (the atlas_data.py narrative layer). The page may never render an authored
    string in a numeric slot."
  rationale: "This is the prototype's single best idea (README:38 — \"Numbers are never
    hand-transcribed — if a figure looks wrong, fix the collector, not the prose\"). Keeping
    it as a SCHEMA boundary rather than a convention means a regression is a validation
    failure, not a code review miss."
  status: proposed
- decision: "The authored layer stays a FILE in agentic_meta_dev (`_build/atlas_data.py`
    or a YAML successor), human-edited and git-reviewed. Atlas holds a derived copy only
    and never becomes its editor."
  rationale: "AOS constraint 2 (files canonical, DBs derived) and the Atlas boundary in
    CLAUDE.md (\"Artifact Atlas should index and relate artifacts; it should not become
    the canonical system of record\"). It is also what makes the narrative reviewable —
    a 59 KB judgement layer belongs in a diff, not in a form."
  status: proposed
- decision: "AC4: RETIRE the served surface, KEEP the producer. `serve.sh` and the
    `index.html` homepage retire once M3 renders. `_build/collect.py` is PROMOTED (it
    becomes this feature's collector contract) and `_build/build_reports.py` is KEPT
    with a stated reason: it is the producer of the 14 program reports that AC2 links
    to. Retiring it would break the link targets."
  rationale: "Two live surfaces answering \"what are we working on?\" with independently
    drifting numbers is the failure mode to avoid — that is the whole reason AC4 exists.
    But the :8099 tree is not one thing: the SERVER is redundant once the app renders,
    while the COLLECTOR and the REPORT RENDERER are upstream dependencies of the
    replacement. Retire the surface, harvest the chain."
  status: proposed
- decision: "The overview's data hook MUST NOT fall back to fixtures and MUST NOT seed
    `placeholderData` from fixtures."
  rationale: "`useAssets` swallows every error into `fixtureAssetsPage(projectId)`
    (web/lib/hooks/useAssets.ts:53-58) and seeds the loading state from fixtures (:63).
    A fleet STATUS page built on that pattern would render a plausible, fabricated picture
    of 14 projects during an API outage — the worst possible failure for this specific
    surface, because its entire value proposition is being believed."
  status: proposed
- decision: "The overview route is top-level (`web/app/overview/`) and mounts `<AppShell>`
    itself, outside the `(projects)` group."
  rationale: "`web/app/layout.tsx:41` renders only `<Providers>{children}</Providers>` —
    not AppShell — so every top-level page mounts the shell itself; `web/app/page.tsx:13`
    is the shipped precedent. Identical structural choice to the sibling central-lens
    node, deliberately, so the two surfaces do not diverge."
  status: proposed
routing_constraints:
- "The AC3 re-measurement and the data-source decision (M1, C3) MUST stay claude-primary.
  It is the architectural pivot for the whole feature: getting it wrong produces a page
  built on a source that is known-unreliable, dressed as authoritative."
- "The snapshot schema boundary — `derived` vs `authored`, and the no-secrets assertion
  (M2, C3) — stays claude-verified. A leaked token in a hosted snapshot is a security
  failure, and a number rendered from the authored side is the exact class of lie this
  feature is supposed to eliminate."
- "Collector plumbing, snapshot ingest composition, and the overview table/card rendering
  (M2/M3, C2) resolve to a workhorse-class executor; mechanical sub-steps are offload-eligible
  with re-run gates — but the fixture-fallback regression test, the staleness-threshold
  test, and the zero-render-path-calls assertion stay claude-verified."
- "Decision records, DI rows, backlog and README edits (M4, C1) are offload-eligible to
  an economy / free-tier model."
- "MUST-stay classes (cross-repo edits into agentic_meta_dev, final synthesis, verdict)
  are never offloaded — resolved to claude unconditionally. Note that retiring `serve.sh`
  is a SIBLING-REPO mutation and therefore an explicit coordination point, not a unilateral
  edit from this repo."
- 'No plan-time model/agent pins: delegation-router resolves provider+model per leg at
  dispatch against the live registry.'
deferred_items_spec_refs:
- docs/DECISIONS.md#DI-G4
- docs/DECISIONS.md#DI-G6
- docs/DECISIONS.md#DI-LinkTarget
findings_doc_ref: null
changelog_required: true
wave_plan:
  waves:
  - - M1
  - - M2
  - - M3
  - - M4
  phases:
  - id: M1
    title: The re-measurement is re-runnable and the data-source decision is recorded
    depends_on: []
    exit_criteria:
    - A committed script reproduces the git-vs-tracker comparison with per-figure provenance;
      2026-08-08 numbers recorded next to the prototype's originals; same-day run delta
      explained; data-source decision written to docs/DECISIONS.md.
  - id: M2
    title: A fleet snapshot exists and Atlas serves it through one typed route
    depends_on:
    - M1
    exit_criteria:
    - Collector emits a versioned snapshot with `derived`/`authored` separated and no
      secrets; one Atlas read route returns it with `generated_at`; render path makes
      zero git / IntentTree / LAN calls.
  - id: M3
    title: The /overview surface renders the fleet and links to each latest report
    depends_on:
    - M2
    exit_criteria:
    - Top-level /overview renders every fleet project from the snapshot, states source
      and age, goes visibly stale past threshold, links each project's newest program/dossier
      report, and errors rather than fabricating on read failure.
  - id: M4
    title: Retire-or-keep decision, DI rows, docs
    depends_on:
    - M1
    exit_criteria:
    - :8099 recommendation recorded as a numbered decision naming what retires and what
      survives; DI rows for every deferral; docs/mvp-backlog.md updated.
updated: '2026-08-08'
---

# Implementation Plan — Reports Hub: dynamic AOS-wide overview

PF-1 made a delivery report hostable and servable (D-018, merge `0d3ebc2`). The two sibling PF-4
nodes make reports findable *per project* (`node_01KZH6T1X0Q13XR1C66SD1CM1K`) and *across projects*
(`node_01KZH6T216V98DRSSRGTQRJ2ST`). This node answers a different question, one level up: **"what is
the whole Agentic OS doing right now, and where do I go next on each project?"** That question already
has a good answer — it is just not in the app. It lives in a hand-run static build at
`agentic_meta_dev/.claude/reports/aos-atlas/`, served by `python3 -m http.server 8099` on loopback,
and it is stale the moment `build.sh` exits.

When this is done there is one top-level `/overview` route in Atlas that renders all 14 fleet projects
from a versioned snapshot produced by a promoted version of the prototype's collector; each project
row states where it stands, when that was measured, and links straight to its newest `program`- or
`dossier`-route delivery report. The static `:8099` surface is gone, its collector is the new
contract, and the page tells you how old its numbers are instead of implying they are live.

> **This plan is HELD, not deferred.** The operator explicitly held implementation on
> `node_01KZH6VA1PKE7C6NDERQPRKNCC` for this run. Nothing here is implemented; `status: draft` is
> accurate and load-bearing. This document exists so the *next* run starts from a settled
> architecture and a measured premise rather than re-litigating both.

## Scope boundary

**In:** the AC3 re-measurement as a committed, re-runnable script; a promoted collector producing a
versioned fleet snapshot (`derived` + `authored`, per-figure provenance, no secrets); one Atlas ingest
path and one typed read route for that snapshot; a new top-level `web/app/overview/` route rendering
every fleet project with staleness disclosure; per-project "latest program/dossier report" resolution
and links; nav + command-palette registration; the `:8099` retire-or-keep decision record; DI rows for
every deferral.

**Out (stated, not dropped):** the per-project reports surface -> **`node_01KZH6T1X0Q13XR1C66SD1CM1K`**;
the cross-project `/reports` lens and its `GET /api/reports` collection route ->
**`node_01KZH6T216V98DRSSRGTQRJ2ST`** (this node CONSUMES that route if it exists and falls back to
per-project fan-out if it does not — it must not build it); an IntentTree read client inside Atlas ->
blocked on `DI-LinkTarget` policy review; epic grouping -> `DI-G6`; **any interactive rebuild of the
prototype's three client-side views** (seams / streams / telemetry) — v1 ships the fleet table and the
per-project links, and the seam map (23 edges) is explicitly a v2 candidate with its own DI row; live
service-health probing from the browser -> non-goal, probes belong to the collector; making Atlas the
editor of the authored narrative -> explicit non-goal (it stays a reviewed file in `agentic_meta_dev`);
promoting `/overview` to `/` -> separate later decision (OQ-3).

## Rubric — what "good" looks like

A reviewer opens the diff and sees a page that **cannot lie about its own freshness**: `generated_at`
is rendered, not buried; an old snapshot is visually degraded, not silently presented; a failed read
is an error state, not 14 plausible fake rows. The snapshot schema makes the prototype's best
invariant mechanical — every number carries `measured_by`, and the authored narrative sits in a
separate top-level key that the numeric renderers cannot reach. Nothing on the render path shells git,
opens a socket to `10.42.10.76`, or asks IntentTree anything. Every API path goes through
`apiAbsoluteUrl` / `assetHtmlUrl`. And the AC3 measurement is a script someone can re-run in a year to
find out whether the premise still holds — not a paragraph asserting it did once.

## AC3 — the git-before-tracker re-measurement (read this first)

AC3 is the crux of this node, not a formality. It decides whether the overview needs a collector at
all: if the tracker had become a faithful picture of current work, this feature collapses into a thin
page over IntentTree's API and most of the rest of this plan evaporates. **It has not.**

### What the prototype claimed, and why

`agentic_meta_dev/.claude/reports/aos-atlas/README.md:12-24` justifies reading git *before* the tracker
with four measured claims, all as of the first build:

| Claim (README:14-24) | Figure |
|---|---|
| Fleet commit volume vs open tracker load | **1,880 commits / 30d** vs **735 open nodes** |
| Projects with no IntentTree tree bound at all | **4** |
| IntentTree's ranked queue returning already-shipped work as `not_started` | qualitative |
| Sharpest single case | **knitwit: 609 commits / 30d vs 1 tracker node** |

### The 2026-08-08 re-measurement

Re-run on 2026-08-08. **The premise holds and the gap widened. Nothing improved.**

| Metric | Prototype (first build) | 2026-08-08 | Direction |
|---|---|---|---|
| Fleet commits / 30d | 1,880 | **1,901** | drifted up |
| Open tracker nodes | 735 | **743** | drifted up |
| knitwit commits / 30d vs nodes | 609 vs 1 | **616 vs 1** (`by_status {"not_started": 1}`) | unchanged in kind |
| Projects with no tree bound | 4 | **4** — `meatyskills`, `signal-to-system`, `meatywiki-portal`, `hermes` | reproduces exactly |

The four treeless projects are verifiable by inspection, not just by re-run: `collect.py`'s `REPOS`
map holds 14 slugs (`collect.py:23-38`) and its `TREES` map holds 10 (`collect.py:40-51`). The
set difference is exactly those four.

### The part that matters more than the numbers

While drafting this plan, an independent reproduction of `collect.py:122`'s exact command
(`git log --all --since="30 days ago" --format=%h | wc -l`, run in `/Users/miethe/dev/homelab/development/knitwit`)
returned **704**, not 616 and not 609. And a direct tree read of knitwit's tracker tree
(`tree_01KXXZ9BJK5BD3Z15MHASXECSJ`) returned **2** nodes, not 1 — a `work_package` from 2026-07-19 and
an off-tree `side_quest` captured 2026-08-04 with `parent_id: null`.

Neither discrepancy weakens the conclusion; both sharpen it:

1. **`--all` makes the git figure fetch-state-sensitive.** It counts every ref present in the local
   checkout, so a `git fetch` inflates "commits in 30 days" without a single new commit being written.
   The metric measures *refs visible here now*, not *work done*.
2. **"Open tracker nodes" depends on whether off-tree captures count.** knitwit is 1 node or 2
   depending on whether `parent_id: null` side-quest captures are in scope — a definitional choice the
   prototype never had to state because it only ever ran once.
3. Therefore **a transcribed number is not evidence.** Three runs of nominally the same measurement
   produced 609 / 616 / 704 for one project. The ratio (hundreds of commits against 1-2 nodes) is
   robust across all three; the absolute figure is not.

**This is the finding that shapes AC3's deliverable.** AC3 says "is re-measured and the resulting
data-source decision is recorded". Recording a number satisfies the letter and fails the intent,
because the number decays and nobody will know when it stopped being true. M1 therefore ships a
**script**, and the recorded decision cites the script plus the run that produced its figures.

### The re-runnable measurement (M1's deliverable)

`scripts/measure_tracker_divergence.py` — Atlas-side, read-only, no network writes:

- For each fleet repo in `agentic_meta_dev/docs/05-app-registry.yaml` (the same registry the sibling
  `scripts/seed_fleet_projects.py` already reads — do not introduce a second fleet list), emit
  `commits_30d` from `git log --all --since="30 days ago"` **and** `commits_30d_head` from
  `git rev-list --count --since=30.days HEAD`, labelled distinctly, because they differ by ~5x on
  knitwit (704 vs 132) and only the second is immune to fetch state.
- For each repo, emit the bound tracker tree (or `null`), `open` and `total` node counts, **and**
  `off_tree` separately, so the definitional choice in finding #2 is visible in the output rather than
  buried in an aggregate.
- Emit a per-figure `measured_by` string carrying the literal command or endpoint. This is the
  prototype's invariant (`README:38`) expressed as data.
- Emit `divergence_ratio = commits_30d_head / max(open_nodes, 1)` per repo and fleet-wide, sorted
  descending. **This ratio, not any absolute count, is the recorded premise.**
- Write `docs/measurements/tracker-divergence-<ISO-date>.json` plus a one-screen markdown summary.
  Committed output means the next re-run produces a **diff**, which is the only form in which
  "has this improved?" is answerable.

**Contract test:** re-running the script twice in one session produces byte-identical output apart
from timestamps — the measurement must be deterministic with respect to repo state, or its diffs are
noise.

### The conclusion AC3 records

A **collector service is still required.** The overview cannot read IntentTree and be honest, for four
independent reasons, any one of which is sufficient:

1. **Coverage.** 4 of 14 fleet projects have no tree at all. A tracker-only page renders four
   permanently blank rows for projects that are, per git, actively worked.
2. **Fidelity.** Hundreds of commits against single-digit node counts means node status is not
   tracking reality, and IntentTree's own ranked queue has been observed returning shipped work as
   `not_started` (README:20-21).
3. **Access.** Atlas has no IntentTree read client, and granting one is parked behind a policy review
   (`DI-LinkTarget`) and cuts against the CLAUDE.md boundary "IntentTree owns task hierarchy".
4. **Locality.** The signals that make the prototype useful — `git worktree list`, `status --porcelain`,
   unmerged stream ages — are properties of a *working checkout*. They do not exist in a bare mirror
   and they do not exist inside the Atlas API container at all.

Points 1-3 argue the tracker is insufficient. Point 4 argues the alternative source cannot live in the
API process. Together they force exactly one shape: **something outside Atlas measures; Atlas hosts
and renders the measurement.**

## The hosting decision — Atlas page, or hosted regenerated asset?

The node's framing offers two shapes. They are weighed here against the two AOS constraints that
apply, and the answer is a specific hybrid.

**Option A — a periodically regenerated hosted `delivery_report`, Atlas merely serves it.** Cheap:
PF-1 already ingests and serves report HTML, and the prototype already renders a homepage. Zero new
frontend. **Rejected as the primary surface**, on three grounds:

- AC1 says the overview must render "from live data in the app (**not a hand-run static build**)". A
  regenerated capsule is a static build with a nicer host. Automating `build.sh` on a timer removes
  "hand-run" but not "static build" — and the AC names both.
- It renders inside the sandboxed iframe (`web/features/assets/components/AssetViewer/HtmlRenderer.tsx`,
  `sandbox="allow-scripts"` with `allow-same-origin` deliberately never set). So it cannot link into
  Atlas routes, cannot share nav or URL state, and cannot participate in the command palette. AC2's
  "links to the latest report for each project" degrades to links that leave the app — which is what
  `:8099` already does.
- It cannot go stale-aware. A static capsule has no way to say "these numbers are 9 days old" unless
  the generator hardcodes an age at build time, which is wrong by definition one second later.

**Option B — an Atlas page querying live sources at render time.** **Rejected as impossible, not
merely undesirable.** The API container has no fleet checkouts (OQ-1), so git is unreachable; Atlas has
no IntentTree client (`DI-LinkTarget`); and the prototype's 14 LAN health probes on the render path
would put 14 network round-trips in front of every page load. This also brushes AOS **constraint 4**
(nothing expensive — and certainly no model call — on the render path).

**Chosen: Atlas page over a derived snapshot.** The collector runs outside Atlas, writes a snapshot
file, and pushes it in; Atlas exposes it through one typed read route; a real Next.js page renders it.

| Concern | How the hybrid answers it |
|---|---|
| AC1 "in the app" | It is a first-class route with the app's shell, nav, and URL state — not an iframe. |
| AC1 "not a static build" | The rendered artifact is a React page over a data API. Refreshing the *data* does not rebuild the *page*. |
| AC1 "states its data source" | The read route returns `generated_at` + collector version + per-figure `measured_by`; the page renders them. |
| AC2 "links to latest report" | Report links are resolved from Atlas's own asset rows at request time, so they follow re-ingest without a snapshot rebuild. |
| AOS constraint 4 (no model call, nothing costly on render) | The render path is one JSON read. Zero git, zero IntentTree, zero probes, zero model calls — asserted in a test. |
| AOS constraint 2 (files canonical, DBs derived) | `facts.json` and the authored narrative file remain canonical in `agentic_meta_dev`; the Atlas row is a derived pointer, exactly as D-018 established for reports. |

**Honest counter-argument.** The hybrid needs a new ingest path, a new read route, and a new frontend
route — materially more than Option A's zero. **Mitigation:** the ingest path is a thin composition
over the shipped content store (the same primitive PF-1 and `scripts/backfill_reports.py` use), the read
route is one endpoint returning one JSON document, and the page reuses `AppShell`, `PageHeader`,
`EmptyState`, `StatusBadge`, and the sibling nodes' report-metadata parser. No new subsystem.

**Where each piece lives:**

- **Collector** — promoted from `_build/collect.py`, runs on the operator laptop where the 14 checkouts
  are (OQ-1). Reads the fleet list from `agentic_meta_dev/docs/05-app-registry.yaml`, the same source
  the sibling `scripts/seed_fleet_projects.py` uses, so Atlas projects and snapshot rows key off one
  registry.
- **Authored narrative** — stays a reviewed file in `agentic_meta_dev` (`atlas_data.py` today; a YAML
  successor is a fine refactor but not this node's job). Collected in, never edited in Atlas.
- **Snapshot** — one versioned JSON document, `{schema_version, generated_at, collector_version,
  derived: {...}, authored: {...}}`, pushed to Atlas as an asset of its own artifact type (OQ-2) so it
  never appears in either sibling reports lens.
- **Atlas** — one ingest endpoint (or CLI verb reusing the content store), one typed read route
  returning the latest snapshot, one page.

## Current state (verified 2026-08-08)

**The prototype chain, harvest targets marked.** All paths under
`agentic_meta_dev/.claude/reports/aos-atlas/`:

| File | Role | Disposition |
|---|---|---|
| `_build/collect.py` | Computes every number: per-repo git streams/worktrees/commit counts, IntentTree node graphs paginated to completion, 14 LAN health probes, CCDash sessions at `:8090`. Writes `facts.json`. | **PROMOTE** — becomes the collector contract |
| `_build/atlas_data.py` (59 KB) | The only hand-authored layer: per project `slug, name, layer, repo, role, stands, primary_domains[], next_step, items[]` (each with `id, kind, title, domains[], status_label, verified_by, note?, handoff{command, repo, paths[], gates[]?, tracker?, trigger?, prompt}?`), plus `REVISIONS, CORRECTIONS, DOSSIERS, DOMAINS, CONSTRAINTS, LAYERS, SEAMS` (23 edges), `DORMANT_GROUPS`. **No numbers.** | **HARVEST as `authored`** — stays canonical upstream |
| `_build/build_reports.py` | Merges the two into 14 `route=program` manifests, renders + validates each through the `delivery-report` CLI. | **KEEP** — produces AC2's link targets |
| `_build/build_home.py` + `home.css` + `home.js` | The `index.html` homepage: three switchable views (seams / streams / telemetry), group filter, click-through inspector with copyable handoffs, sortable divergence tables. | **RETIRE** — superseded by `/overview`; views are v2 candidates |
| `serve.sh` | `python3 -m http.server 8099 --bind 127.0.0.1`, pidfile in `/tmp`. | **RETIRE** (AC4) |
| `_build/build.sh` | `collect.py` -> `build_reports.py` -> `build_home.py`. | **SPLIT** — collect + reports survive; home step drops |

**`facts.json` keys (the derived contract to type against — do not invent names):** `generated_at`,
`generated_date`, `node`, `repos{slug}{present, integration, current_branch, commit, commit_full,
subject, age, iso, head_*, streams[{branch, ahead, age, iso}], stream_count, recent_streams, worktrees,
dirty, commits_7d, commits_30d, subjects_7d[]}`, `trees{slug}{tree_id, http, total, fetched, pages,
by_status{}, open, completed, complete_scan}`, `services{label}{url, http, up}`,
`ccdash{active_projects[], sessions[], session_count, ...}`, `live_delegations[]`.

**Atlas-side facts (verified, do not re-derive):**

- `web/app/` contains only the `(projects)` route group plus `web/app/page.tsx:13`, which mounts
  `AppShell` itself because `web/app/layout.tsx:41` does not. **That is the precedent for a new
  top-level route** — the same precedent the sibling central-lens node relies on.
- **There is no cross-project asset list endpoint.** No `GET /api/assets`; `GET /api/search` requires
  `q`. AC2's per-project "latest report" resolution therefore either consumes the sibling node's
  `GET /api/reports` or fans out over `GET /api/projects/{projectId}/assets?artifact_type_id=delivery_report`
  (14 calls). Spec both; prefer the sibling route when present.
- **Split-origin rule** (`web/lib/api.ts:57-64`): web and API are on different origins with no rewrite.
  Every API path must go through `apiAbsoluteUrl` / `assetHtmlUrl` (`web/lib/api.ts:48-50`).
- Hosted report HTML renders in a sandboxed iframe
  (`web/features/assets/components/AssetViewer/HtmlRenderer.tsx`, `allow-same-origin` never set).
- `SidebarNav`'s item `href` is `(projectId: string) => string`
  (`web/components/shell/SidebarNav.tsx:22`) — a cross-project link needs that signature widened
  (OQ-7, shared cost with the sibling node).
- **`web/lib/hooks/useAssets.ts:53-58` silently falls back to demo fixtures on API error**, and seeds
  `placeholderData` from fixtures too. A fleet status page built on that hook would show FAKE data.
  This is the sharpest named risk below.
- Report metadata field set already written by ingest: `api/app/services/import_index.py` (~:687-702) —
  `envelope_version, artifact_type, target, route, title, subject, instance_key, link_identity,
  revision, truth_status, generated_from, generated_at, tracker_links[], item_count`, every field read
  via `.get()` and therefore nullable.
- Commands: frontend from `web/` — `npm run test | typecheck | lint`; backend — `cd api && python3 -m pytest -q`.

**Cross-node context digest** (so an executor needs no tree fetch). Parent work package: **PF-4**
`node_01KZH6QVPKAN01N8JTQ09XRMXA`.

| Node | What it gives this plan | Blocking? |
|---|---|---|
| `node_01KZH6RXGGDSWGSFJP4VH15EZG` — report project attribution (**landed this run**) | Reports resolve a canonical `project_id`, stamp `workspace_id`, ingest at `status=candidate` | **HARD (data).** Without it AC2 cannot resolve "this project's latest report" for any project |
| `node_01KZH6RXMYHRSK18E9QT60D1PA` — fleet project seeding (**landed this run**) | `scripts/seed_fleet_projects.py` seeds an Atlas project row per fleet repo from `agentic_meta_dev/docs/05-app-registry.yaml` | **HARD (data + contract).** It establishes the fleet registry as the single project list; this node's collector must read the same file, not a second one |
| `node_01KZH6VA655DBTKDS99RZW76Y9` — DI-Backfill (**landed this run**) | `scripts/backfill_reports.py` backfills the 14 `aos-atlas` `route=program` reports | **HARD (content).** These 14 reports *are* AC2's link targets. Without them AC2 has nothing to link to |
| `node_01KZH6T216V98DRSSRGTQRJ2ST` — cross-project `/reports` lens | Owns `GET /api/reports`; also owns the `SidebarNav` href widening | **SOFT.** Consume if present, fan out per-project if not. Coordinate OQ-7 rather than duplicating the widening |
| `node_01KZH6T1X0Q13XR1C66SD1CM1K` — per-project reports surface | The report-metadata parser and fixture-free hook pattern to copy | **SOFT** (pattern reuse only) |

Upstream shipped: **PF-1** (`node_01KYWGWKHF5BWAQYACK46NC1TC`, D-018, merge `0d3ebc2`, plus `e6705a0`
DI-SubjectCollapse) supplies the servable preview URL, the report metadata field set, and the link rows.

## Named risks

- **Fabricated fleet status (sharpest).** `web/lib/hooks/useAssets.ts:53-58` returns `FIXTURE_ASSETS`
  on any API error and `:63` seeds `placeholderData` from fixtures. Reusing that hook — or copying its
  shape — would render a *complete, plausible, entirely fictional* picture of 14 projects during an
  outage, indistinguishable from the real thing. For a per-project asset library that is annoying; for
  the fleet's single source of orientation it is the worst failure mode available. M3's AC pins it: a
  rejected read renders an error, asserted in vitest, and `FIXTURE_ASSETS` must never appear in the
  overview's import graph.
- **A stale snapshot presented as current.** This is Option A's flaw reintroduced by neglect. The
  snapshot is by construction point-in-time; the page must render `generated_at` and a relative age
  inline, and degrade visibly past a threshold (recommend: warn > 24h, prominent stale banner > 7d).
  Any figure whose provenance is missing renders as unknown, never as zero.
- **Measurement drift mistaken for progress.** Documented above: 609 / 616 / 704 for the same project,
  and 1 vs 2 tracker nodes depending on whether off-tree captures count. Mitigation is structural —
  the committed script emits both git variants and `off_tree` separately, and the recorded premise is
  the **ratio**, not an absolute.
- **The collector cannot run where the API runs.** `git worktree list` and `status --porcelain` are
  checkout-local. A well-meaning "just add an endpoint that shells git" would return empty results in
  the deployed container and, worse, would look like a healthy fleet with no activity. If the collector
  is ever moved node-side, it must FAIL LOUD on a missing checkout, never emit zeros.
- **Secrets in a hosted payload.** The collector reads `CCDASH_TOKEN` (and potentially others) from
  `~/.config/aos/secrets.env` to probe services. The snapshot is hosted and preview-servable. A token,
  bearer header, or full probe URL with credentials landing in `derived.services` is a security defect.
  M2's AC pins an explicit assertion that no snapshot value matches a secret-shaped pattern.
- **Authored prose drifting into numeric slots.** The prototype's invariant is a convention enforced by
  its author. As a schema boundary it survives handoff; as a convention it will not. Hence
  `derived`/`authored` as top-level keys and a validation test that the numeric renderers read only
  from `derived`.
- **Split-origin regression.** No rewrite in `web/next.config.mjs` (documented at `web/lib/api.ts:57-64`).
  Any hand-built `/api/...` string works locally and breaks on the deployed node (web `:3040`, api `:8042`).
- **Two surfaces, two answers.** Until `:8099` actually retires, both exist and drift apart. AC4 is not
  bookkeeping — it is the mitigation. M4 must land in the same change window as M3, and the retirement
  is a **sibling-repo edit** requiring explicit coordination, not a unilateral deletion from this repo.
- **Empty or thin on arrival.** The overview is only convincing if the three landed sibling nodes really
  attributed reports to fleet projects. If a project has no report, its row must say so plainly rather
  than render a dead link — a correct empty row, not a broken one.
- **Scope creep via the prototype's views.** `home.js` is 24 KB of seams/streams/telemetry interaction
  with a 23-edge map. Rebuilding it is a feature in its own right. v1 renders the fleet table plus links;
  the views get a DI row.

## References

Code and data, in the order an executor needs them:

**The measurement (M1).** Prototype claims at
`agentic_meta_dev/.claude/reports/aos-atlas/README.md:12-24`; the commands they came from at
`_build/collect.py:107` (`git rev-list --count {integration}..{branch}` per stream), `:121-122`
(`git log --all --since=…` for `commits_7d` / `commits_30d`), the `REPOS` map at `:23-38` (14 slugs) and
the `TREES` map at `:40-51` (10 trees — the set difference is AC3's four treeless projects). The fleet
registry is `agentic_meta_dev/docs/05-app-registry.yaml`, already consumed by
`scripts/seed_fleet_projects.py`.

**The snapshot (M2).** Existing content-store ingest is the primitive to compose over — the same one
`scripts/backfill_reports.py` documents itself as composing (`ImportService.import_report`'s signature
`(html_path, envelope, *, project_id, sensitivity, on_duplicate, actor_id)`); the snapshot needs the
JSON-payload analogue, not the report path. Storage lives on the `atlas-assets` volume per the
content-store persistence fix; `PUT /content` requires `;type=<mime>` on the multipart part.
Artifact-type vocabulary lives in `api/app/models/vocabulary.py` (OQ-2). Serving surface:
`api/app/api/preview.py` (`get_asset_content` / `get_asset_html`) — a JSON snapshot should be read
through a typed route, not scraped out of the preview surface by the client.

**The page (M3).** New top-level route `web/app/overview/page.tsx` mounting `<AppShell>` itself,
precedent `web/app/page.tsx:13` (because `web/app/layout.tsx:41` does not mount it). Reuse
`PageHeader`, `EmptyState`, `StatusBadge`, `useAssetModal` (`web/features/assets/hooks/useAssetModal.tsx`)
and `AssetLink` (`web/features/assets/components/AssetLink.tsx`) rather than forking them. Report links go
through `assetHtmlUrl` (`web/lib/api.ts:48-50`). Nav registration in
`web/components/shell/SidebarNav.tsx:46` (`NAV_SECTIONS`; `href` signature at `:22` — OQ-7) and
`web/components/shell/CommandPalette.tsx`. Types extend `web/lib/types.ts`. Tests in `web/__tests__/`
following `asset-filters.test.tsx` + `test-utils.tsx`; e2e in `web/e2e/`.

**Governing docs.** `docs/DECISIONS.md` (D-018 report hosting; ADR-8 flag posture); AOS constraint set
(2: files canonical / DBs derived; 4: no model call on the render path); repo boundary statement in
`CLAUDE.md` ("Atlas owns asset metadata, relationships, BOM state… IntentTree owns task hierarchy").

## Milestones

> A milestone is a reviewable state of the system, not a batch of tasks.

### M1 — The re-measurement is re-runnable and the data-source decision is recorded  (AC3, C3)

**This milestone gates the architecture and must complete before any code in M2/M3.** If the
measurement had come back the other way, M2 and M3 would be a different feature.

Ship `scripts/measure_tracker_divergence.py`: read-only, deterministic with respect to repo state, no
writes outside `docs/measurements/`. It reads the fleet list from
`agentic_meta_dev/docs/05-app-registry.yaml` (never a second hardcoded list), and for each repo emits:

```
{ "slug": "knitwit",
  "commits_30d_all":  704,   "measured_by": "git log --all --since='30 days ago' --format=%h | wc -l",
  "commits_30d_head": 132,   "measured_by": "git rev-list --count --since=30.days HEAD",
  "tree_id": "tree_01KXXZ9BJK5BD3Z15MHASXECSJ",
  "nodes_total": 2, "nodes_open": 2, "nodes_off_tree": 1,
  "by_status": {"not_started": 2},
  "measured_by": "GET 10.42.10.76:8032 /trees/{tree_id}/nodes (paginated to completion)",
  "divergence_ratio": 66.0 }
```

Both git variants are emitted because they disagree by ~5x on knitwit and only the `HEAD` variant is
immune to fetch state. `nodes_off_tree` is emitted separately because it is the difference between
"1 node" and "2 nodes" for the same project. A repo with no bound tree emits `tree_id: null` and
`divergence_ratio: null` — **never `0`**, which would read as "no divergence".

Output: `docs/measurements/tracker-divergence-<ISO-date>.json` plus a one-screen markdown summary
carrying the comparison table against the prototype README's originals. Both committed, so the next
run yields a diff.

Then record the decision in `docs/DECISIONS.md`: the premise holds, a collector is required, and the
git lane leads with the tracker shown as a second source — citing the script and the run, not a bare
figure.

**Exit criteria**
- The script runs clean from a fresh shell and produces byte-identical output across two runs in one
  session, timestamps excepted.
- Output covers all 14 fleet repos; the 4 treeless projects appear with `tree_id: null` and a null
  ratio; no `0` stands in for "unknown" anywhere.
- The committed summary states the prototype's four original claims, the 2026-08-08 figures, **and**
  the same-day 609/616/704 divergence with its explanation.
- A numbered decision exists in `docs/DECISIONS.md` recording the data-source conclusion and citing the
  script path.
- `cd api && python3 -m pytest -q` passes, including a determinism test for the script.

### M2 — A fleet snapshot exists and Atlas serves it through one typed route  (AC1 data source, C3)

Promote `_build/collect.py` into a collector that emits the versioned snapshot, and give Atlas exactly
one way to receive and one way to serve it.

Snapshot envelope:

```
{ "schema_version": 1,
  "generated_at": "2026-08-08T…Z",
  "collector_version": "…",
  "derived":  { "repos": {…}, "trees": {…}, "services": {…}, "ccdash": {…} },   // every figure carries measured_by
  "authored": { "projects": {…}, "layers": […], "seams": […], "constraints": […] } }
```

`derived` and `authored` are top-level siblings and the numeric renderers may read only from `derived`
— the prototype's invariant (`README:38`) promoted from convention to schema. The `authored` payload is
collected from the reviewed upstream file; Atlas never edits it.

Ingest composes over the shipped content store — no new storage, hashing, or identity logic — under its
own artifact type (OQ-2) so the snapshot never appears in either sibling reports lens. Ingest is
idempotent on re-push: a new snapshot supersedes by `generated_at`, and the read route returns the
newest. Secret scrubbing happens in the collector, before the payload ever leaves the laptop: probe
URLs are recorded without credentials and no token value is serialized.

One read route returns the latest snapshot with `generated_at` and `collector_version` at the top level.
`shared/openapi.yaml` carries the path.

**Exit criteria**
- A collector run produces a schema-valid snapshot for all 14 fleet repos with `derived`/`authored`
  separated and every `derived` figure carrying `measured_by`.
- A pytest asserts no snapshot value matches a secret-shaped pattern (bearer/token/key), run against a
  fixture snapshot built from a real collector run.
- The read route returns the newest snapshot; a second push with a later `generated_at` supersedes; a
  push with an older one does not regress the served document.
- A pytest asserts the read path issues **zero** subprocess calls and **zero** outbound HTTP — the
  render path is a database/file read and nothing else.
- `shared/openapi.yaml` carries the route; `cd api && python3 -m pytest -q` passes.

### M3 — The `/overview` surface renders the fleet and links to each latest report  (AC1 + AC2, C2)

New top-level route `web/app/overview/page.tsx` (server shell + `PageHeader` + `Suspense`) delegating to
a client `OverviewView` under `web/features/overview/`. Data comes from a new `useFleetSnapshot()` hook
calling M2's route — **no fixture fallback, no fixture `placeholderData`, `isError` surfaced.**

One row (or card) per fleet project: name, layer, where it stands, next step (from `authored`), and the
derived signals (current branch, unmerged stream count, commits 7d/30d, tracker open count or "no tree
bound", service health). Every derived figure exposes its `measured_by` on hover/expand. A figure whose
provenance is absent renders as unknown — never as `0`.

The data-source disclosure is part of the page, not a footnote: source name, `generated_at`, relative
age, and collector version in the header region; a warning treatment past 24h and a prominent stale
banner past 7d.

AC2's link per project: the newest `delivery_report` whose `metadata.route` is `program` or `dossier`,
by `metadata.generated_at` (OQ-6), with the route shown on the link. Resolution prefers the sibling
node's `GET /api/reports` and falls back to per-project fan-out over
`GET /api/projects/{projectId}/assets?artifact_type_id=delivery_report`. Behind a one-function seam so
the swap is a single edit. Links go through `assetHtmlUrl`. A project with no report renders an explicit
"no report yet" state, never a dead link.

Register in `SidebarNav` (OQ-7 — coordinate the `href` widening with the sibling node, do not duplicate
it) and the command palette.

**Exit criteria**
- All 14 fleet projects render from a fixture snapshot; a project with `tree_id: null` renders "no tree
  bound" rather than `0` open nodes.
- Data source, `generated_at`, and relative age render inline; asserted warn-at-24h and stale-at-7d
  treatments.
- A rejected snapshot read renders an error state; `FIXTURE_ASSETS` appears nowhere in the overview's
  import graph (asserted).
- Each project's report link resolves to the newest `program`/`dossier` report and its href carries the
  API origin (not a relative `/api/...`); a report-less project renders the explicit empty state.
- Reachable from `SidebarNav` and the command palette.
- `cd web && npm run test && npm run typecheck && npm run lint` clean; one e2e spec passes.

### M4 — Retire-or-keep decision, DI rows, docs  (AC4, C1)

Record the `:8099` recommendation as a numbered decision in `docs/DECISIONS.md`, naming the split
explicitly: **retire** `serve.sh`, `build_home.py`, `home.css`, `home.js`, and the generated
`index.html`; **keep** `collect.py` (promoted to this feature's collector) and `build_reports.py` with
the stated reason that it produces the 14 `route=program` reports AC2 links to. `build.sh` loses its
home-page step. Retiring the sibling-repo files is a **coordination point** — this repo's decision
record states the recommendation; the upstream deletion is an `agentic_meta_dev` change and must not be
made unilaterally from here.

DI rows for every deferral: the prototype's three interactive views and the 23-edge seam map; the
in-app refresh trigger (OQ-4); promotion of `/overview` to `/` (OQ-3); the snapshot's sensitivity
posture if OQ-5 resolves to "revisit"; the `atlas_data.py` -> YAML refactor. Update
`docs/mvp-backlog.md`.

**Exit criteria**
- A numbered decision in `docs/DECISIONS.md` names each retired file and each kept file with its reason.
- A DI row exists for every deferred item listed above; none is left implicit.
- `docs/mvp-backlog.md` reflects this node's state.
- The upstream retirement is filed as a coordination item, not performed here.

## AC -> command -> evidence

| AC | Command | Evidence of pass |
|---|---|---|
| M1 measurement is re-runnable | `python3 scripts/measure_tracker_divergence.py --out docs/measurements/` twice | two runs byte-identical apart from timestamps |
| M1 covers the fleet honestly | `cd api && python3 -m pytest -q -k tracker_divergence` | 14 repos present; 4 treeless repos have `tree_id: null` and `divergence_ratio: null`; no `0`-for-unknown |
| M1 both git variants emitted | `grep -c commits_30d_head docs/measurements/tracker-divergence-*.json` | non-zero; `_all` and `_head` both present per repo |
| **AC3** decision recorded | `grep -n "tracker-divergence" docs/DECISIONS.md` | numbered decision cites the script path and the run, not a bare figure |
| M2 snapshot schema boundary | `cd api && python3 -m pytest -q -k fleet_snapshot_schema` | `derived` + `authored` top-level; every `derived` figure has `measured_by` |
| M2 no secrets in payload | `cd api && python3 -m pytest -q -k snapshot_no_secrets` | no value matches bearer/token/key patterns in a snapshot from a real collector run |
| M2 supersede semantics | `cd api && python3 -m pytest -q -k snapshot_supersede` | newer `generated_at` wins; older push does not regress the served document |
| **AC1** render path is cheap | `cd api && python3 -m pytest -q -k render_path_isolation` | read route issues zero subprocess and zero outbound HTTP calls |
| M2 contract published | `grep -n "overview" shared/openapi.yaml` | the read path is present |
| M3 fleet renders | `cd web && npm run test -- overview` | 14 projects from a fixture snapshot; `tree_id: null` renders "no tree bound" |
| **AC1** states its data source | `cd web && npm run test -- overview` | source name + `generated_at` + relative age asserted in the rendered header |
| M3 staleness honesty | `cd web && npm run test -- overview` | warn treatment at >24h, stale banner at >7d, both asserted |
| M3 no fabricated data | `cd web && npm run test -- overview` | rejected read -> error state; `FIXTURE_ASSETS` absent from the import graph |
| **AC2** latest report per project | `cd web && npm run test -- overview` | newest `program`/`dossier` by `generated_at` chosen; route shown; report-less project renders explicit empty state |
| **AC2** right origin | `cd web && npm run test -- overview` | link href contains the API origin, not a relative `/api/...` |
| M3 real render across origins | `cd web && npm run test:e2e -- overview` | `/overview` loads, a project's report link lands on the API-origin preview URL |
| M3 types + lint | `cd web && npm run typecheck && npm run lint` | clean (per `.claude/rules/lsp-diagnostics.md` this is the authoritative check, not LSP reminders) |
| **AC4** retire-or-keep | `grep -n "8099" docs/DECISIONS.md` | decision names each retired and each kept file with reasons |
| M4 deferrals recorded | `grep -n "^### DI-" docs/DECISIONS.md` | a row per deferred item; `docs/mvp-backlog.md` updated |
| Live smoke (once, before done) | collector run, then load `/overview` against the deployed API | 14 real project rows; at least one report link returns `200` |

Frontend commands run from `web/` (there is no root `package.json`). Component tests live in
`web/__tests__/`; e2e in `web/e2e/`.

## Test plan

**M1's determinism test is the load-bearing one** — it is what makes AC3 a measurement rather than a
claim. Two runs, byte-identical modulo timestamps; a treeless repo yields nulls, not zeros; both git
variants present.

**Backend pytest (`cd api && python3 -m pytest -q`)** covers four things: snapshot schema validity with
the `derived`/`authored` split, the no-secrets assertion against a snapshot produced by a real collector
run (not a hand-written fixture — a hand-written fixture cannot contain the leak it is meant to catch),
supersede-by-`generated_at`, and the **render-path isolation** test asserting zero subprocess and zero
outbound HTTP on the read route. That last one is the mechanical form of AOS constraint 4 and of the
"collector cannot run where the API runs" risk.

**Vitest component tests are the frontend gate**, in one `web/__tests__/overview.test.tsx`: the 14-row
render from a fixture snapshot; `tree_id: null` -> "no tree bound"; a null derived figure -> unknown, not
`0`; the data-source header; the two staleness thresholds; the rejected-read error state; the
`FIXTURE_ASSETS`-absent assertion; the newest-`program`/`dossier` selection including the both-routes
tiebreak; the report-less project's empty state; and the API-origin href.

**One e2e spec is warranted** — not for the render matrix (vitest's job) but because AC2 crosses the
split-origin boundary and the sandboxed iframe, neither of which jsdom models. Keep it thin: load
`/overview`, assert rows render, follow one project's report link, assert the API-origin preview URL.

**One manual live smoke before calling it done**: run the collector against the real 14 checkouts, push,
load `/overview` on the deployed instance (web `:3040`, api `:8042`), confirm real rows and one working
report link. Fixtures cannot prove the collector reads the actual fleet.

## Sequencing (load-bearing)

**M1 strictly before M2 and M3** — this is not house style. M1 decides whether a collector is needed at
all; building M2 first would be committing to an architecture before measuring its premise, which is the
exact failure AC3 exists to prevent.

**M2 before M3** — M3 renders M2's snapshot and cannot be built against a schema that does not exist.
M3's report-link resolution is independent of the snapshot and could start early, but the seam is one
function; splitting the milestone to parallelize it is not worth the coordination.

**M4 needs only M1's decision plus M3's surface existing** — but it must land in the same change window
as M3, because the window where both `/overview` and `:8099` are live is precisely the two-answers risk.

**Cross-node:** all three HARD sibling dependencies have landed in this worktree, so nothing here is
blocked on them — but AC2 has no link targets unless `scripts/backfill_reports.py` has actually been run
with `--apply` against the target instance. Verify that before starting M3, not during it. OQ-7 (the
`SidebarNav` href widening) must be settled with `node_01KZH6T216V98DRSSRGTQRJ2ST` before M3 touches nav.

## Execution ledger

Deviations logged to `.claude/worknotes/reports-hub/implementation-notes.md`, reviewed at each milestone
boundary. **Blockers still stop.**

No Mode-D surface in the Atlas repo: this node adds read-only UI, one read route, and one derived-asset
ingest — no auth, payments, migrations, deletion, or canonical-file mutation. Four escalation triggers,
though:

1. **AC3 comes back the other way.** If a re-measurement shows the tracker has become sufficient, the
   architecture in this plan is wrong and the node halts for re-planning rather than proceeding on a
   stale premise. That is the point of putting M1 first.
2. **OQ-1 resolves node-side.** Running the collector on `rocket-fedora` means provisioning 14 checkouts
   there — an infrastructure change with its own deploy story. Halt for a routing decision.
3. **OQ-2 needs a vocabulary/schema change.** A new artifact type touches
   `api/app/models/vocabulary.py` and the registry exports. Additive, but it is a contract change and
   gets a decision record before code.
4. **The `:8099` retirement.** Deleting files in `agentic_meta_dev` is a cross-repo mutation. This plan
   records the recommendation; the upstream edit is coordinated, never unilateral.
