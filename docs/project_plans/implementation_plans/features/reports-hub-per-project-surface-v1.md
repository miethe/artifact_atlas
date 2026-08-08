---
it_schema: 1
schema_version: 2
feature_slug: reports-hub-per-project-surface
title: "Per-project Reports surface (PF-4: reports-only lens on the Atlas project\
  \ page) — implementation plan"
doc_type: implementation_plan
status: draft
tier: 2
priority: P1
points: 5
risk_level: medium
context_class: C2
created: '2026-08-08'
prd_ref: null
intenttree_workspace: ws_01KV8VMWX9EJ6VDQKEBMYQZRXG
intenttree_tree: tree_01KYWGV76XTEM7B11GYWD7Q93Y
intenttree_node: node_01KZH6T1X0Q13XR1C66SD1CM1K
spike_ref: null
adr_refs:
- 'docs/DECISIONS.md line 910 — DI-G4, "Reports lens / cross-scope dashboard (OQ-2,
  Tier-2 follow-on)"'
- 'docs/DECISIONS.md line 837 — D-018, Delivery-Report Hosting (Asset Ownership +
  Catalog Principles)'
- '../agentic_meta_dev/docs/project_plans/design-specs/delivery-report-hosting-and-linking-v1.md
  §14.1 "cross-scope Reports lens"'
related_documents:
- docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
- docs/project_plans/prds/features/delivery-report-hosting-v1.md
- .claude/worknotes/delivery-report-hosting/implementation-notes.md
- docs/mvp-backlog.md
acceptance_criteria:
- A project page surfaces its delivery reports only, with route / revision / truth_status
  / source commit visible.
- Each row opens the hosted report HTML and shows the tracker node(s) it is linked
  to.
- 'Empty state distinguishes "this project has no reports" from "reports exist but
  are unattributed".'
open_questions:
- "OQ-1 (truth_status vocabulary): Atlas stores `truth_status` free-form (`import_index.py:698`\
  \ reads it via `.get()`, no enum, no validation). VERIFY the value set the upstream\
  \ `delivery-report` skill actually emits at M1 start; do NOT hard-enum it in the\
  \ narrowed TS type — an unknown value must render verbatim, never be dropped."
- "OQ-2 (open action): does a row open the hosted HTML in the house asset modal (`useAssetModal`\
  \ -> Preview tab, URL-shareable via `?item=&tab=preview`) or in a new tab at the\
  \ API-origin preview URL? RECOMMEND both — title opens the modal (house pattern),\
  \ an explicit \"Open full report\" affordance opens the API-origin URL, because a\
  \ program-route report wants full width. Confirm with the operator at M2."
- "OQ-3 (flag + ADR citation): RECOMMEND no feature flag (see decision D4). Separately,\
  \ `web/lib/flags.ts:16-19` attributes the default-on cutover to **ADR-7** while the\
  \ project memory index says ADR-8, and `docs/DECISIONS.md` numbers decisions `D-0xx`\
  \ not `ADR-x`. This plan cites what the code comment says (ADR-7). Reconciling the\
  \ numbering is out of scope here and must not be done by editing `docs/DECISIONS.md`\
  \ from this node."
- "OQ-4 (banner placement): the unattributed count is a workspace-global number. Repeating\
  \ it on 26 project pages is noise. RECOMMEND rendering it ONLY when the project has\
  \ zero reports — which is exactly AC3's literal wording — not alongside\
  \ a populated list."
- "OQ-5 (`searchApi.search` is broken): `web/lib/api.ts:371-378` POSTs to `/api/search`,\
  \ but the backend exposes only `GET /api/search` (`api/app/api/search.py:36`) plus\
  \ `POST /api/search/semantic` (:71) — so that accessor 405s, and `web/components/shell/GlobalSearch.tsx:62`\
  \ already depends on it. RECOMMEND adding a separate GET accessor for M3 and filing\
  \ the POST bug as a `DI-` row; do NOT fix it opportunistically, because that changes\
  \ global-search behavior outside this node's ACs."
decisions:
- decision: 'A bespoke `web/app/(projects)/projects/[projectId]/reports` route, NOT
    a saved/pinned filter on the existing AssetLibrary. Resolves DI-G4''s OQ-2 for
    the per-project case only.'
  rationale: "Four reasons, in force order. (1) Every report column lives in `Asset.metadata`\
    \ (`web/lib/types.ts:273`, `Record<string, unknown> | null`) and `AssetTable`'s\
    \ columns are `Asset` accessors (`AssetTable.tsx:61-148`) whose \"Type\" column\
    \ renders `mime_type`, not `artifact_type_id` — there is no home for route/revision/truth_status/commit\
    \ without either four always-empty columns for the project's 63 non-report assets\
    \ or a conditional column set, both of which make the shared table worse. (2) A\
    \ saved filter is a bookmark, not a lens: `useAssetFilters` makes the URL the sole\
    \ source of filter truth (`useAssetFilters.ts:28-41`) and the FilterBar can clear\
    \ it, so `?artifact_type_id=delivery_report` is one click from becoming \"all assets\"\
    \ — AC1's word \"only\" is unenforceable there. (3) AssetLibrary derives its\
    \ artifact-type facet client-side from the loaded page (`AssetLibrary.tsx:166-173`),\
    \ so the `delivery_report` chip does not exist unless a report happens to be in\
    \ that page — the filter is undiscoverable precisely when a project has few\
    \ reports. (4) AC3's dual empty state is report-domain semantics; an \"unattributed\
    \ reports exist\" banner inside the generic library is a domain leak. Cost is bounded\
    \ because the route reuses AssetLibrary's PARTS (`useAssetModal`, `AssetLink`,\
    \ `PageHeader`, `EmptyState`, `StatusBadge`) and does not fork AssetLibrary —\
    \ leaving the shipped library at zero regression surface."
  status: proposed
- decision: "AC3's \"reports exist but are unattributed\" is answered by a cross-project\
    \ probe against the EXISTING `GET /api/search` with a deliberately empty `q`, wrapped\
    \ in a `reportsApi.countUnattributedReports()` seam. This node ships NO new backend\
    \ collection endpoint."
  rationale: "`GET /api/search` takes `project_id` as OPTIONAL (`search.py:37`) and\
    \ the repository filters project only when it is not None (`repositories/assets.py:44-45`),\
    \ so omitting it spans every project; `search_assets` guards the keyword filter\
    \ with `if query:` (`services/assets.py:355`), so `?q=` (empty) skips matching\
    \ entirely and returns everything the other filters allow; and `SearchResult` carries\
    \ `project_id` (`api/app/models/search.py:54`). That is a working cross-project\
    \ report list TODAY with zero backend change. The clean answer — a real cross-project\
    \ collection route — is the sibling node's deliverable (node_01KZH6T216V98DRSSRGTQRJ2ST);\
    \ building it here would pre-empt its facet/pagination/epic-grouping design. The\
    \ seam exists so the banner is repointed with a one-line change when that lands."
  status: proposed
- decision: 'Tracker nodes are read from `GET /api/assets/{assetId}/links` (`assets.py:200-212`),
    NOT from `metadata.tracker_links`.'
  rationale: "`metadata.tracker_links` is the envelope's *claim*, copied verbatim at\
    \ ingest (`import_index.py:701`). `/links` is what Atlas actually created —\
    \ and it additionally contains the `subject`-derived link, which `tracker_links[]`\
    \ never carries (ingest resolves subject AND each tracker entry separately, `import_index.py:1061-1108`).\
    \ Rendering metadata would silently omit the subject link and would display targets\
    \ ingest may have refused. Metadata is a labelled fallback only, used if `/links`\
    \ errors."
  status: proposed
- decision: Ship the route unflagged.
  rationale: "It is a new additive route with no shared-surface replacement, so the\
    \ staged-cutover purpose `FLAG_DEFAULTS` exists for (`flags.ts:20`, ADR-7 cutover)\
    \ does not apply — and every shipped flag there is default-on anyway. A default-false\
    \ flag would be actively worse: env can only turn flags ON (`flags.ts:73-75`),\
    \ so a route behind a default-off flag ships a dead nav item until someone sets\
    \ a build-time `NEXT_PUBLIC_FLAGS`. If staging is wanted anyway, name it `reports-lens`\
    \ and default it TRUE, and move the e2e spec into `web/e2e/flags-on/` per convention."
  status: proposed
- decision: "The surface uses a dedicated, fixture-free data hook. It MUST NOT call\
    \ `useAssets`/`useAsset`."
  rationale: "`web/lib/hooks/useAssets.ts:53-58` and `:80-83` swallow API errors and\
    \ return demo fixtures. On this surface that is not a graceful degradation, it\
    \ is fabrication: a down API would render plausible fake reports, and AC3's \"\
    this project has no reports\" would become unreachable and untrue. The hook must\
    \ expose `isError` and the UI must distinguish error from empty."
  status: proposed
routing_constraints:
- "AC3's two-mode empty state and the probe's degradation rule (an unknown count must\
  \ NEVER render as zero) are correctness-class — claude-primary, no offload.\
  \ A wrong \"0 unattributed\" is the same failure mode as PF-1's silent misattribution:\
  \ confidently wrong beats visibly unknown only in appearance."
- "Authoring the fixture-free data hook (and the assertion that a rejected fetch surfaces\
  \ an error rather than fixtures) stays claude-primary — it is the difference\
  \ between honest and fabricated data on the operator's first ask."
- "The narrowed report-metadata parser, the reports table component, and nav/palette\
  \ registration are workhorse-class and offload-eligible with a re-run gate —\
  \ but the split-origin assertion (href resolves to the API origin, not a relative\
  \ path) stays claude-verified."
- Docs, decision record, and DI- rows (M4, C1) are offload-eligible to an economy /
  free-tier model.
- 'No plan-time model/agent pins: delegation-router resolves provider+model per leg
  at dispatch against the live registry.'
deferred_items_spec_refs: []
findings_doc_ref: null
changelog_required: true
wave_plan:
  waves:
  - - M1
  - - M2
    - M3
  - - M4
  phases:
  - id: M1
    title: A reports-only route that lists this project's reports honestly
    depends_on: []
    exit_criteria:
    - "`/projects/{projectId}/reports` renders only `delivery_report` assets with route\
      \ / revision / truth_status / short source commit; a rejected fetch renders an\
      \ error state, never fixtures."
  - id: M2
    title: Rows open the hosted HTML and show their tracker links
    depends_on:
    - M1
    exit_criteria:
    - "Each row exposes an API-origin hosted-report URL built via `assetHtmlUrl`, and\
      \ renders the tracker node ids returned by `GET /api/assets/{id}/links`."
  - id: M3
    title: The two-mode empty state
    depends_on:
    - M1
    exit_criteria:
    - "Zero-report state distinguishes \"no reports\" from \"N unattributed reports\
      \ exist\", and renders NO unattributed claim when the probe fails."
  - id: M4
    title: Decision record + docs + deferrals
    depends_on:
    - M1
    exit_criteria:
    - "D-019 in `docs/DECISIONS.md`; backlog row updated; `DI-` rows for the `searchApi`\
      \ POST bug, the empty-`q` contract reliance, and the fixture-fallback hazard."
updated: '2026-08-08'
---

# Implementation Plan — Per-project Reports surface (PF-4, operator ask #1)

PF-1 made delivery reports hostable, linkable, and servable (D-018, merge `0d3ebc2`). It did not
make them **findable**. Today a report is an ordinary row in a 63-asset library whose only visible
type column is `mime_type` — its route, revision, verification status, and source commit are all
sitting in `Asset.metadata`, which the frontend never reads. When this is done, a project's own page
has a reports-only lens: one row per delivery report, with route / revision / truth_status / source
commit on the row, the hosted HTML one click away, and the tracker node(s) it is attached to visible
— and an empty state that tells the truth about *why* it is empty.

> **This plan is HELD, not deferred.** The operator explicitly held implementation on
> node_01KZH6T1X0Q13XR1C66SD1CM1K for this run as too large to land alongside its three sibling
> nodes. Nothing here is implemented. `status: draft` is accurate and load-bearing.

## Scope boundary

**In:** one new per-project route (`web/app/(projects)/projects/[projectId]/reports`), a narrowed
report-metadata parser, a fixture-free `useProjectReports` hook, a reports table rendering the four
report columns, a per-row hosted-HTML affordance, per-row tracker-link display from
`GET /api/assets/{assetId}/links`, the two-mode empty state, nav + command-palette registration, and
a D-019 decision record. All by **composing shipped primitives** — existing endpoints only, no new
backend routes, no schema change, no ingest change.

**Out (stated, not dropped):** the cross-project `/reports` lens and its real collection endpoint ->
**node_01KZH6T216V98DRSSRGTQRJ2ST** (this node ships an interim probe behind a seam and must not
build that endpoint); the AOS-wide overview -> **node_01KZH6VA1PKE7C6NDERQPRKNCC**; epic grouping ->
blocked on `DI-G6` (`AssetLinkTargetType` has no `epic`) and on granting Atlas an IntentTree read
client (`DI-LinkTarget`); server-side facets/counts -> non-goal (there is no facet endpoint today and
this surface does not need one); fixing `searchApi.search`'s POST-vs-GET bug -> `DI-` row, not this
node (see OQ-5); any change to `AssetLibrary` -> explicit non-goal, so the shipped library carries
zero regression risk.

## Rubric — what "good" looks like

A reviewer opens the diff and sees a small new route that **borrows** from the asset library rather
than forking it: `useAssetModal`, `AssetLink`, `PageHeader`, `EmptyState`, `StatusBadge` imported,
`AssetLibrary.tsx` untouched. The report metadata is *parsed*, never cast — every field optional,
because ingest writes it defensively via `.get()`. No API path is hand-built as a string; every one
goes through `assetHtmlUrl` / `apiAbsoluteUrl`. The surface never lies: a failed list renders an
error, a failed probe renders no claim, an unknown `truth_status` renders as itself. And the word
"only" in AC1 is structural — the route cannot be widened to all assets by clicking a chip.

## Named risks

- **The fixture-fallback trap (sharpest).** `web/lib/hooks/useAssets.ts:53-58` and `:80-83` catch
  API errors and return `FIXTURE_ASSETS`. Reusing those hooks here would render *fabricated reports*
  when the API is down, and would make AC3's "this project has no reports" both unreachable and
  false. M1's AC pins this: a rejected fetch must produce an error state, asserted in vitest.
- **AC3 rests on an undocumented behavior.** The whole reason `?q=` means "match everything" is
  `if query:` at `api/app/services/assets.py:355` treating `""` as falsy. `shared/openapi.yaml:1456-1460`
  marks `q` **required** and says nothing about empty meaning "match all". A future refactor to
  `if query is not None:` silently zeroes the banner with no test failing. M3 must pin it with a
  backend contract test and a one-line openapi description note.
- **Unknown rendered as zero.** If the probe 405s, times out, or returns an unexpected shape, the
  banner must render *nothing* — not "0 unattributed". This is the same class of error as PF-1's
  silent misattribution: a confident wrong number is worse than a visible gap.
- **Deep-linking tracker nodes into a fixture page.** `web/app/(projects)/projects/[projectId]/intent-nodes/page.tsx:8`
  imports `DEMO_NODES` from `web/features/node/NodeDemoFixtures` — the intent-node pages are
  fixture-backed. Linking a real `node_01K…` id there lands the operator on a page that does not
  contain that node. Render ids as copyable text; no internal deep link.
- **Split-origin regression.** Web and API are on different origins and there is no rewrite in
  `web/next.config.mjs` (documented at `web/lib/api.ts:57-64`). Any hand-built `/api/preview/...`
  string works locally and breaks on the deployed node.
- **Empty on arrival.** This surface is only non-empty if the three sibling nodes actually attributed
  reports to projects. If they under-deliver, this page ships *correct and empty* — which is the
  honest state, not a defect of this node. M1's AC is asserted against seeded fixtures; one live
  smoke against `proj_artifact_atlas` is required before calling it done.
- **Casting metadata would lie.** `Asset.metadata` is `Record<string, unknown> | null`
  (`web/lib/types.ts:273`) and ingest can write nulls for every field. An `as ReportMetadata` cast
  makes optional-null fields look guaranteed and moves the crash to render time.

## References

Code first — the gap is a missing surface, not missing plumbing (all paths repo-relative):

**Where a new top-level-ish route may live.** `web/app/` has exactly two segments: the `(projects)`
route group, and `web/app/page.tsx:13-18` (`RootPage` -> `<AppShell><ProjectsIndexView/></AppShell>`),
which is the precedent for shell-wrapping a page because `web/app/layout.tsx:44-61` renders only
`<html>/<head>/<body><Providers>{children}` and **not** `AppShell`. This node's route is per-project,
so it lives inside `(projects)` and inherits `web/app/(projects)/layout.tsx` — the shell question is
the *sibling* `/reports` node's problem, not this one's.

**Endpoints that suffice as-is (no backend change):**
- `GET /api/projects/{projectId}/assets?artifact_type_id=delivery_report` —
  `api/app/api/assets.py:70-79`; `artifact_type_id` is a single string (`:79`) wrapped into a
  one-element list (`:91`), which is exactly the shape needed. Returns full `Asset` objects
  **including `metadata`**. Server `limit` is capped at 200 (`:74`) with cursor paging; the internal
  search runs at `limit=10000` (`:101`) before paging, so >200 reports in one project requires cursor
  follow — spec it, but no project is near that.
- `GET /api/assets/{assetId}/links` — `api/app/api/assets.py:200-212`, returns cursor-paged
  `AssetLink` rows (`target_type` / `target_id` / `relationship`,
  `api/app/models/asset.py:110-120`). **No frontend client exists**: `assetsApi`
  (`web/lib/api.ts:181-215`) has no `links` accessor. New accessor required.
- `assetHtmlUrl(assetId)` — `web/lib/api.ts:48-50` -> `GET /api/preview/asset/{id}/html`, the PF-1 M1
  servable URL. Renders in a sandboxed iframe (`web/features/assets/components/AssetViewer/HtmlRenderer.tsx:79`,
  `sandbox="allow-scripts"`; `allow-same-origin` is never set, documented at `:7`).
- `GET /api/search?q=&artifact_type=delivery_report` — `api/app/api/search.py:36-38`; optional
  `project_id` (`:37`) spans projects, `artifact_type: list[str]` (`:42`) filters, and empty `q`
  skips keyword matching (`api/app/services/assets.py:353-361`). Returns `SearchResult`
  (`api/app/models/search.py:42-58`) carrying `project_id` (`:54`) and `artifact_type_id` (`:53`) —
  enough for the unattributed count, though **not** `metadata`.

**What the backend already writes (the field set to type against — do not invent names):**
`api/app/services/import_index.py:687-702` builds the report metadata dict —
`envelope_version, artifact_type, target, route, title, subject, instance_key, link_identity,
revision, truth_status, generated_from, generated_at, tracker_links[], item_count` — every one read
via `.get()`, so every one can be `None`. `artifact_type_id="delivery_report"` is set at `:736`.

**Patterns to reuse, not reinvent:**
- Asset modal: `web/features/assets/hooks/useAssetModal.tsx:46` (URL-driven `?item=&tab=`), trigger
  `web/features/assets/components/AssetLink.tsx:31`, tabs
  `web/features/assets/components/EntityModal/AssetTabRegistry.ts`. `AssetLibrary` predates the hook
  and inlines the pattern (`AssetLibrary.tsx:124-126`) — the new surface uses the hook.
- Filter/URL state, if any is needed: `web/features/assets/hooks/useAssetFilters.ts:28-41`.
- Nav: `web/components/shell/SidebarNav.tsx:46` `NAV_SECTIONS`; every item's `href` is already
  `(projectId: string) => string` (`:22`), so a **per-project** reports route needs **no signature
  widening** (that widening is the sibling cross-project node's cost, not this one's). Also register
  in `web/components/shell/CommandPalette.tsx:61`.
- Types to extend: `web/lib/types.ts:247-274` (`Asset`, `metadata` at `:273`), `:308-315`
  (`AssetLink`), `:504-511` (`SearchResult` — currently missing `project_id` and
  `artifact_type_id`, so it needs widening for M3).

**Cross-node context digest** (so an executor needs no tree fetch). Parent work package: **PF-4**
`node_01KZH6QVPKAN01N8JTQ09XRMXA`. Siblings:

| Node | What it gives this plan | Blocking? |
|---|---|---|
| `node_01KZH6RXGGDSWGSFJP4VH15EZG` — report project attribution (lands this run) | Reports resolve a canonical `project_id` (subject slug, else `generated_from.repo` basename), stamp `workspace_id`, ingest at `status=candidate` | **HARD (data).** Without it every report is `project_id: null` and this page is empty for every project |
| `node_01KZH6RXMYHRSK18E9QT60D1PA` — fleet project seeding (lands this run) | `scripts/seed_fleet_projects.py` creates an Atlas project row per AOS repo from `agentic_meta_dev/docs/05-app-registry.yaml` | **HARD (data).** Without it the only browsable project is `proj_artifact_atlas` |
| `node_01KZH6VA655DBTKDS99RZW76Y9` — DI-Backfill (lands this run) | `scripts/backfill_reports.py` ingests the 14 rendered `aos-atlas` program reports | **SOFT (content).** Without it there is ~1 report to show; the surface is correct but unconvincing |
| `node_01KZH6T216V98DRSSRGTQRJ2ST` — DI-G4 cross-project `/reports` lens | Owns the real cross-project collection endpoint that M3's probe stands in for | **NON-blocking successor.** M3 ships behind a seam so its banner repoints in one line. This node must NOT build that endpoint |
| `node_01KZH6VA1PKE7C6NDERQPRKNCC` — AOS-wide overview | Consumer of the same data, later | No |

Upstream shipped: **PF-1** (`node_01KYWGWKHF5BWAQYACK46NC1TC`, D-018, merge `0d3ebc2`, plus `e6705a0`
DI-SubjectCollapse) supplies the servable URL, the metadata field set, and the link rows.

## The design decision — bespoke route, resolved

DI-G4 leaves this open as OQ-2 ("saved filter for `artifact_type_id=delivery_report` **OR** a new
`/reports` route"). **Recommendation: bespoke route.** Full reasoning is in the frontmatter decision
record; the short version, in force order:

1. **The columns have nowhere to go.** `AssetTable`'s columns are `Asset` field accessors
   (`AssetTable.tsx:61-148`) and its one "Type" column renders `mime_type`. Route / revision /
   truth_status / commit all live in `metadata`, invisible to the frontend today (grep for
   `truth_status`, `generated_from`, `delivery_report` across `web/**` returns **zero** hits).
   Adding them to the shared table means four always-empty columns for the project's other 63
   assets, or a conditional column set — both make `AssetTable` worse for every other caller.
2. **A saved filter is a bookmark, not a lens.** `useAssetFilters` puts filter state in the URL
   (`useAssetFilters.ts:28-41`) and the FilterBar can clear it. `?artifact_type_id=delivery_report`
   is one click away from "all assets". AC1 says "surfaces its delivery reports **only**" — that
   word is unenforceable on a shared, user-clearable filter.
3. **The filter is undiscoverable when it matters most.** The artifact-type facet is derived
   client-side from the loaded page (`AssetLibrary.tsx:166-173`), so the `delivery_report` chip does
   not exist unless a report is already visible — the exact case a project with two reports fails.
4. **AC3 does not belong in a generic library.** An "unattributed reports exist" banner is
   report-domain semantics; putting it in `AssetLibrary` leaks one artifact type's policy into the
   shared surface.

**Honest counter-argument:** a bespoke route duplicates a table and a toolbar. **Mitigation:** it
reuses the primitives (`useAssetModal`, `AssetLink`, `PageHeader`, `EmptyState`, `StatusBadge`) and
does **not** fork `AssetLibrary` — which is also why the shipped library keeps a zero regression
surface. Discoverability bridge goes one direction only: the reports page links out to the filtered
library; the library is not modified to link in.

## Milestones

> A milestone is a reviewable state of the system, not a batch of tasks.

### M1 — A reports-only route that lists this project's reports honestly  (AC1, C2)

New route `web/app/(projects)/projects/[projectId]/reports/page.tsx` (server shell + `PageHeader` +
`Suspense`, mirroring `assets/page.tsx`) delegating to a client `ReportsView` under
`web/features/reports/`. Data comes from a new `useProjectReports(projectId)` hook calling
`GET /api/projects/{projectId}/assets?artifact_type_id=delivery_report` — **with no fixture
fallback** and with `isError` surfaced. Metadata is read through a new runtime parser, not a cast:

```ts
// web/features/reports/types.ts  (field names verified against import_index.py:687-702)
export type ReportRoute = "feature" | "dossier" | "program" | "phase" | "readiness";
/** Free-form upstream (import_index.py:698 stores it via .get(), no enum) — OQ-1. */
export type TruthStatus = string;

export interface ReportGeneratedFrom {
  repo?: string | null;
  ref?: string | null;
  commit?: string | null;
}

export interface ReportTrackerLink {
  tracker?: string | null;
  [k: string]: unknown;
}

export interface ReportMetadata {
  envelope_version?: string | null;
  artifact_type?: string | null;
  target?: string | null;
  route?: ReportRoute | string | null;
  title?: string | null;
  subject?: string | null;
  instance_key?: string | null;
  link_identity?: string | null;
  revision?: string | null;
  truth_status?: TruthStatus | null;
  generated_from?: ReportGeneratedFrom | null;
  generated_at?: string | null;
  tracker_links?: ReportTrackerLink[] | null;
  item_count?: number | null;
}

export interface ReportAsset extends Omit<Asset, "metadata"> {
  metadata: ReportMetadata | null;
}

/** Runtime-narrow an Asset.metadata bag. Never throws; unknown keys preserved. */
export function asReportMetadata(
  raw: Record<string, unknown> | null | undefined,
): ReportMetadata { /* ... */ }
```

Every field is optional **because ingest writes it defensively via `.get()`** — a cast that promised
otherwise would move the failure to render time. Table columns: Title, Route, Revision,
Truth status, Source commit (short `generated_from.commit`, with `repo`/`ref` on hover or in the
modal), Generated. An unknown `truth_status` renders verbatim; a missing field renders an em dash.
Registered in `SidebarNav` `NAV_SECTIONS` (Content section) and `CommandPalette`.

**AC:** the route lists only `delivery_report` assets for that project, with route / revision /
truth_status / short source commit visible on the row; a rejected list fetch renders a distinct
**error** state (not empty, not fixtures); `AssetLibrary.tsx` is unmodified.

### M2 — Rows open the hosted HTML and show their tracker links  (AC2, C2)

Each row gets an "open" affordance resolving to `assetHtmlUrl(asset.id)` — via the helper, never a
hand-built path (split-origin rule, `api.ts:57-64`) — plus, per OQ-2's recommendation, the row title
opening the house asset modal (`useAssetModal` -> Preview tab, URL-shareable). Tracker links come from
a new `assetsApi.links(assetId)` GET accessor over `GET /api/assets/{assetId}/links` (cursor-paged),
rendered as the `target_type:target_id` pairs the row is actually linked to, as **copyable text**.
A row with zero links says so explicitly rather than rendering blank.

**AC:** the open affordance's URL resolves to the **API origin**, not a relative path; the tracker
node ids rendered are those returned by `/links` (not `metadata.tracker_links`); a report with no
links shows an explicit "no linked nodes" rather than an empty cell; tracker ids are **not**
deep-linked into `/projects/{id}/intent-nodes/{nodeId}` (fixture-backed, `intent-nodes/page.tsx:8`).

### M3 — The two-mode empty state  (AC3, C3 — the correctness milestone)

A `reportsApi.countUnattributedReports()` seam calls
`GET /api/search?q=&artifact_type=delivery_report&limit=200` (no `project_id`) and counts rows whose
`project_id` is null. `SearchResult` in `web/lib/types.ts:504-511` is widened with `project_id` and
`artifact_type_id`. A **new GET accessor** is required — `searchApi.search` POSTs to a GET-only route
(OQ-5) and must not be reused. States, exhaustively:

| Project reports | Probe result | Render |
|---|---|---|
| 0 | `N > 0` | "This project has no reports yet. **N** delivery reports exist but are not attributed to any project." + link to the cross-project view (or, until the sibling node lands, to the filtered library) |
| 0 | `0` | "This project has no reports yet." — no unattributed claim |
| 0 | failed / unknown | "This project has no reports yet." — banner **absent**, no number, no zero |
| >=1 | any | the list; no banner (OQ-4) |

Backed by a backend contract test pinning the behavior M3 depends on: `GET /api/search?q=` with
`artifact_type=delivery_report` returns reports across more than one project **including** one with
`project_id=None`. One-line note added to the `/api/search` `q` description in `shared/openapi.yaml`
recording that empty means "no keyword filter".

**AC:** all four rows of the table above are covered by vitest tests; a failing probe renders **no**
unattributed claim (the "unknown is not zero" assertion); the backend contract test passes.

### M4 — Decision record + docs + deferrals  (docs, C1)

Record **D-019** in `docs/DECISIONS.md` (bespoke-route decision, the interim-probe decision and its
successor seam, links-over-metadata, no-flag, no-fixture-fallback), cross-referencing DI-G4 as
partially discharged (per-project case only; the cross-project case stays open under
`node_01KZH6T216V98DRSSRGTQRJ2ST`). Update `docs/mvp-backlog.md`. New `DI-` rows for: the
`searchApi.search` POST-vs-GET bug and its live consumer `GlobalSearch.tsx:62`; the empty-`q`
contract reliance; the `useAssets` fixture-fallback hazard as a repo-wide pattern risk, not just
here. Worknotes ledger at `.claude/worknotes/reports-hub/implementation-notes.md`.

**AC:** `grep D-019 docs/DECISIONS.md` hits; DI-G4 is annotated as partially discharged with the
successor node id; each deferred item is a tracked `DI-` row.

## AC -> command -> evidence

| AC | Command | Evidence of pass |
|---|---|---|
| M1 reports-only + columns | `cd web && npm run test -- reports-surface` | route renders route/revision/truth_status/short-commit from fixture metadata; unknown `truth_status` verbatim; missing fields em dash |
| M1 no fabricated data | `cd web && npm run test -- reports-surface` | rejected list fetch -> error state asserted; `FIXTURE_ASSETS` never rendered |
| M1 library untouched | `git diff --stat web/features/assets/AssetLibrary.tsx` | empty output |
| M1 types compile | `cd web && npm run typecheck && npm run lint` | clean (per `.claude/rules/lsp-diagnostics.md`, this is the authoritative check, not LSP reminders) |
| M2 hosted HTML, right origin | `cd web && npm run test -- reports-surface` | open affordance href contains the API origin (not a relative `/api/...`) |
| M2 tracker links from `/links` | `cd web && npm run test -- reports-surface` | mocked `/links` ids render; `metadata.tracker_links`-only rows render "no linked nodes" |
| M2 real render across the iframe | `cd web && npm run test:e2e -- reports-surface` | row action lands on the API-origin preview URL / iframe `src` matches |
| M3 empty-state matrix | `cd web && npm run test -- reports-surface` | all four table rows asserted, including probe-failed -> banner absent |
| M3 probe contract | `cd api && python3 -m pytest -q -k report_search_unattributed` | `?q=` + `artifact_type=delivery_report` spans projects and includes a `project_id=None` row |
| M3 project scoping | `cd api && python3 -m pytest -q -k project_reports_scope` | `?artifact_type_id=delivery_report` returns only that project's reports |
| M4 decision + deferrals | `grep -n "D-019" docs/DECISIONS.md` | D-019 present; DI- rows exist; DI-G4 annotated partially-discharged |
| Live smoke (once, before done) | `curl -s "$ATLAS_API/api/projects/proj_artifact_atlas/assets?artifact_type_id=delivery_report"` then load `/projects/proj_artifact_atlas/reports` | at least one real report row renders and its hosted URL returns `200` |

Frontend commands run from `web/` (there is no root `package.json` and no pnpm workspace; `web/`
carries both `package-lock.json` and `pnpm-lock.yaml`). Component tests live in `web/__tests__/`
following `asset-filters.test.tsx` + `test-utils.tsx`; e2e in `web/e2e/` (`flags-on/` only for specs
needing non-default flags — which, per decision D4, this is not).

## Test plan

**Vitest component tests are the primary gate** — nine assertions in one
`web/__tests__/reports-surface.test.tsx`: (1) the four report columns render from fixture metadata;
(2) an unrecognized `truth_status` renders verbatim, not dropped; (3) all-null metadata renders an em
dash without crashing; (4) the open affordance's href resolves to the API origin; (5) tracker ids
from a mocked `/links` render; (6) a link-less report says so; (7-9) the three zero-report states,
with the probe-failed case asserting the banner is **absent**. Plus a pure-function test that
`asReportMetadata` survives garbage input (string / array / null / nested-null `generated_from`).

**Two backend pytest tests** (`cd api && python3 -m pytest -q`): the empty-`q` cross-project contract
pin, and per-project artifact-type scoping.

**One e2e spec is warranted** — not for the empty-state matrix (vitest's job), but because AC2's
"opens the hosted report HTML" crosses two boundaries jsdom cannot model: the split-origin URL and
the sandboxed iframe (`HtmlRenderer.tsx:79`, `sandbox="allow-scripts"` with `allow-same-origin`
deliberately never set, `:7`). Keep it thin: navigate to `/projects/proj_artifact_atlas/reports`,
assert the table renders, trigger the open action, assert the resulting URL / iframe `src` is the
API-origin preview URL. Lives in `web/e2e/` (root) under decision D4; moves to `web/e2e/flags-on/`
if a flag is adopted after all.

## Sequencing (load-bearing)

**M1 before M2 and M3** — both need the route, the hook, and the parsed metadata M1 mints; this is a
real data dependency, not house style. **M2 and M3 are independent of each other** and run
concurrently. M4 needs only M1's shape settled.

**Cross-node:** the two HARD sibling dependencies gate the *live smoke*, not the code. M1-M3 are
fully testable against seeded fixtures before attribution and fleet seeding land; only the final
"at least one real report row renders" evidence requires them. Do not block M1 on them.

## Execution ledger

Deviations logged to `.claude/worknotes/reports-hub/implementation-notes.md`, reviewed at each
milestone boundary. **Blockers still stop.** No Mode-D surface: this node touches no auth, payments,
migrations, deletion, or canonical-file mutation — it is additive read-only UI over existing GET
endpoints. Two escalation triggers, though: (a) if M3's probe turns out to need a new backend
collection route after all, that is scope belonging to `node_01KZH6T216V98DRSSRGTQRJ2ST` and halts
for a routing decision rather than being absorbed here; (b) if AC2's tracker display turns out to
need an IntentTree read client to be useful, that is a policy review (`DI-LinkTarget`) and halts.
