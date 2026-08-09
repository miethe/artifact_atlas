---
it_schema: 1
schema_version: 2
feature_slug: reports-hub-central-lens
title: "Reports Hub — centralized cross-project /reports lens (PF-4 DI-G4, operator\
  \ ask #2) — implementation plan"
doc_type: implementation_plan
status: ready
tier: 2
priority: P1
points: 8
risk_level: medium
context_class: C3
created: '2026-08-08'
prd_ref: null
program_ref: docs/project_plans/implementation_plans/features/reports-hub-program-v1.md
intenttree_workspace: ws_01KV8VMWX9EJ6VDQKEBMYQZRXG
intenttree_tree: tree_01KYWGV76XTEM7B11GYWD7Q93Y
intenttree_node: node_01KZH6T216V98DRSSRGTQRJ2ST
spike_ref: null
adr_refs:
- docs/DECISIONS.md#D-018
- docs/DECISIONS.md#ADR-8
related_documents:
- docs/project_plans/implementation_plans/features/reports-hub-program-v1.md
- docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
- docs/project_plans/prds/features/delivery-report-hosting-v1.md
- docs/DECISIONS.md
- ../agentic_meta_dev/docs/project_plans/design-specs/delivery-report-hosting-and-linking-v1.md
- ../agentic_meta_dev/docs/project_plans/implementation_plans/delivery-report-hosting-and-linking-v1.md
- ../intenttree/docs/project_plans/implementation_plans/features/delivery-report-link-and-ui-v1.md
acceptance_criteria:
- 'NODE AC1 (verbatim): A single top-level route lists every delivery_report across
  all projects in the workspace.'
- 'NODE AC2 (verbatim): Grouping/faceting works for project, report route, truth_status,
  and date; epic grouping is either implemented or its blocker (DI-G6 / IntentTree
  read client) is recorded as a decision.'
- 'NODE AC3 (verbatim): A report with no project still appears rather than being silently
  dropped.'
- "NODE AC4 (verbatim): The lens needs no ingest or storage contract change (DI-G4:\
  \ additive UI only) — or any change it does need is recorded."
- "M1: GET /api/reports returns delivery_report assets from >=2 projects PLUS the unattributed\
  \ bucket in one call, with server-computed facet counts over the FULL filtered set\
  \ (not the returned page), and shared/openapi.yaml carries the path."
- 'M2: /reports renders every report including unattributed ones; an API 5xx renders
  an error state and NEVER fixture rows; the surface is reachable from SidebarNav and
  the command palette.'
- 'M3: group-by project / route / truth_status / date all render with server-authoritative
  counts; the unattributed group is present and pinned last; the three empty states
  are distinguishable.'
- 'M4: the AC4 contract change is recorded as a numbered decision; the epic-grouping
  blocker is recorded as a decision + DI row; the stale ADR-7 citation in web/lib/flags.ts
  is corrected to ADR-8.'
open_questions:
- "OQ-1 — RESOLVED 2026-08-09; see `decisions` (\"RESOLVES OQ-1\"). Left as a numbered\
  \ placeholder so cross-references still land. Do not re-open."
- "OQ-2 — RESOLVED 2026-08-09; see `decisions` (\"RESOLVES OQ-2\"). Left as a numbered\
  \ placeholder so cross-references still land. Do not re-open."
- "OQ-3: `reports-hub` flag default-on (ADR-8 posture: new UX is the product default)\
  \ vs default-off until the backfill sibling lands so the nav does not advertise a\
  \ 1-row page. Plan recommends default-on because AC3's empty states must be informative\
  \ regardless, and a hidden surface cannot be validated."
- "OQ-4 (upstream, blocks epic labels anywhere): what IS an 'epic'? IntentTree has\
  \ no `epic` node type and `AssetLinkTargetType` has no `epic` member (api/app/models/vocabulary.py:262-273).\
  \ 'Nearest non-atomic ancestor' is a convention, not a modeled entity. This is an\
  \ IntentTree domain decision, not an Atlas UI decision."
- "OQ-5: must the server-computed facet `total` respect policy redaction — i.e. should\
  \ a report the caller may not read still inflate a count? Affects whether facets\
  \ are computed pre- or post-policy filter."
decisions:
- decision: "AC4 is FALSE as written. DI-G4's 'Blocks: none (additive UI only)' is\
    \ contradicted by the code: there is no cross-project asset list endpoint, and\
    \ `GET /api/search` requires `q` (api/app/api/search.py:38). This feature REQUIRES\
    \ an additive API contract change — a new `GET /api/reports` collection route —\
    \ plus a shared/openapi.yaml edit."
  rationale: "AC4's escape clause ('or any change it does need is recorded') is the\
    \ clause that applies. The change is additive-only (new path, no existing route/schema\
    \ altered) and touches NO ingest or storage contract, so DI-G4's *intent* survives\
    \ — only its 'UI only' claim does not. ANNOTATED 2026-08-09: **D-019 (docs/DECISIONS.md:989,\
    \ Accepted) supersedes DI-G4's deferral**, so `GET /api/reports` is a SANCTIONED contract\
    \ change, not a violation to argue around. AC4 is satisfied by RECORDING the change\
    \ at M4 — there is nothing left to seek permission for."
  status: accepted
- decision: "Route choice: new `GET /api/reports`, NOT a generic `GET /api/assets`\
    \ list. Implemented as a thin composition over `AssetService.search_assets(project_id=None)`\
    \ (api/app/services/assets.py:325-353), which already returns cross-project assets\
    \ because `AssetRepository.list` skips the project filter when `project_id is None`\
    \ (api/app/repositories/assets.py:37-46)."
  rationale: "A generic cross-project asset list opens EVERY asset in EVERY project\
    \ through one call — a materially larger policy surface than a list scoped to one\
    \ artifact type whose sensitivity/access defaults are known and fixed at ingest\
    \ (`personal` / `preview_allowed`, api/app/services/import_index.py:735-741). A\
    \ report-shaped route can also carry report-shaped facets and an `include=links`\
    \ expansion without widening the generic Asset list contract."
  status: proposed
- decision: Facet and group counts are computed SERVER-side over the full filtered
    set before pagination, and the client never derives a count from the loaded page.
  rationale: "The existing client-side facet derivation (web/features/assets/AssetLibrary.tsx:166-173)\
    \ only sees the returned page. In a project-scoped library that is merely imprecise;\
    \ in a cross-project lens it is WRONG — 'Project X: 3' when X has 40. The project-assets\
    \ endpoint already materializes the full filtered list before paging (api/app/api/assets.py:94-101\
    \ -> api/app/api/_deps.py:57-94, where `total` is the full count), so full-set\
    \ facet computation costs one extra pass, not a new query engine."
  status: proposed
- decision: "Epic grouping is NOT implemented in v1. The blocker is recorded instead\
    \ (AC2's second clause). v1 ships group-by-tracker-node using the `intenttree_node`\
    \ AssetLinks Atlas already holds."
  rationale: "An epic label requires asking IntentTree for a linked node's ancestors,\
    \ i.e. an IntentTree read client inside Atlas — explicitly parked behind a policy\
    \ review by DI-LinkTarget (docs/DECISIONS.md, 'requires a policy review to grant\
    \ Atlas an IntentTree client') and crossing the CLAUDE.md boundary 'IntentTree\
    \ owns task hierarchy'. Compounded by OQ-4: 'epic' is not a modeled entity in either\
    \ system. Tracker-node grouping delivers most of the value with data already local."
  status: proposed
- decision: "The lens lives at a NEW top-level route `web/app/reports/` that mounts\
    \ `<AppShell>` itself, outside the `(projects)` group."
  rationale: "`web/app/layout.tsx:41-56` renders only `<Providers>{children}</Providers>`\
    \ — it does NOT render AppShell — so every top-level page mounts the shell itself.\
    \ `web/app/page.tsx:13-19` is the shipped precedent. `AppShell`'s `projectId` is\
    \ already optional (web/components/shell/AppShell.tsx:26,34)."
  status: proposed
- decision: "The new `useReports` hook MUST NOT fall back to fixtures, and MUST NOT\
    \ set `placeholderData` to a fixture page."
  rationale: "`useAssets` swallows every error into `fixtureAssetsPage(projectId)`\
    \ (web/lib/hooks/useAssets.ts:53-58) and even seeds the loading state from fixtures\
    \ (:61). A reports lens built on that pattern would render FAKE reports during\
    \ an API outage — indistinguishable from real ones, and worse than an error."
  status: proposed
- decision: "RESOLVES OQ-1: the cross-project lens is served by a NEW purpose-built `GET\
    \ /api/reports`. Relaxing `q` to optional on `GET /api/search` is ruled OUT, and a\
    \ generic `GET /api/assets` cross-project list is declined."
  rationale: "Operator call 2026-08-09, on the evidence already in this plan: `GET /api/search`\
    \ returns `SearchResult`, whose projection DROPS `metadata` (api/app/api/search.py:24-35),\
    \ and this lens is entirely metadata-driven (`route`, `truth_status`, `revision`, `subject`,\
    \ `generated_from` all live in `metadata`). A generic asset list is a wider contract\
    \ and a wider policy surface than this run needs. OQ-1 no longer blocks M1."
  status: accepted
- decision: "RESOLVES OQ-2: v1 applies NO workspace filter, and `workspace_id: null` is\
    \ treated as IN-SCOPE."
  rationale: "Operator call 2026-08-09. Deployment is single-workspace (`ws_artifact_atlas_local`,\
    \ api/app/settings.py:80) and pre-fix reports carry `workspace_id: null`, so a workspace\
    \ filter would be a SECOND silent-drop path on top of `project_id` — the exact failure\
    \ NODE AC3 exists to forbid. OQ-2 no longer blocks M1."
  status: accepted
- decision: "PROGRAM: this plan is program milestones **M2 (the `GET /api/reports` route)\
    \ and M3 (the `/reports` lens UI)**. Program M1 is the sibling per-project plan and\
    \ ships FIRST."
  rationale: "Recorded in reports-hub-program-v1.md `wave_plan`. The lens is a client of\
    \ a contract that does not exist until M2, and of a module that does not exist until\
    \ M1 — so the sequence is a real data/code dependency, not house style."
  status: accepted
- decision: "PROGRAM: this plan REUSES the canonical report-metadata type and parser that\
    \ program M1 mints in `web/features/reports/`. It MUST NOT create a `DeliveryReportMetadata`\
    \ type. Every reference to `DeliveryReportMetadata` in this document means \"the type\
    \ M1 owns\"."
  rationale: "This plan's own rule already says whichever plan ships first owns `web/features/reports/`;\
    \ the program fixes that as M1. Two types over one field set is a duplicate-parser\
    \ divergence — the same failure this plan's \"do not let two report tables exist\"\
    \ rule guards against."
  status: accepted
- decision: "PROGRAM: this plan ALONE widens `SidebarNav`'s `NavItem.href` from `(projectId:\
    \ string) => string` to accept a non-project route (`web/components/shell/SidebarNav.tsx:22,35`),\
    \ and ALONE edits `CommandPalette` (`web/components/shell/CommandPalette.tsx:61-100`).\
    \ It also owns the `web/lib/flags.ts:16-19` ADR-7 -> ADR-8 comment correction."
  rationale: "Resolves the sibling AOS-overview plan's OQ-7 and keeps program M1 off those\
    \ files. All three PF-4 plans need the identical signature change to the identical\
    \ file; doing it twice is a merge conflict, not a style issue. The flags.ts comment\
    \ correction is one edit to the same shared file and belongs with the same owner."
  status: accepted
routing_constraints:
- "The AC4 contract decision + the `GET /api/reports` shape (M1, C3) MUST stay claude-primary.\
  \ It adds a cross-project read surface with a policy dimension; getting the filter/facet\
  \ semantics wrong produces confidently wrong counts, which is worse than a missing\
  \ feature."
- "The unattributed-bucket semantics (M1/M3, AC3) stay claude-verified — a silent drop\
  \ is the exact failure mode the AC exists to prevent, and there are TWO drop paths\
  \ (project_id null AND workspace_id null)."
- "Table/grouping UI, column rendering, and the metadata narrowing type (M2/M3, C2)\
  \ resolve to a workhorse-class executor; mechanical sub-steps are offload-eligible\
  \ with re-run gates — but the fixture-fallback regression test and the facet-count\
  \ correctness test stay claude-verified."
- "Decision records, DI rows, and the ADR-7 -> ADR-8 comment correction (M4, C1) are\
  \ offload-eligible to an economy / free-tier model."
- 'No plan-time model/agent pins: delegation-router resolves provider+model per leg
  at dispatch against the live registry.'
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
    title: Cross-project reports collection route
    depends_on: []
    exit_criteria:
    - GET /api/reports returns reports from >=2 projects plus the unattributed bucket
      in one call; facet counts are full-set, not page-set; shared/openapi.yaml carries
      the path.
  - id: M2
    title: The /reports surface exists and lists everything
    depends_on:
    - M1
    exit_criteria:
    - Top-level /reports route renders every report incl. unattributed; an API 5xx
      renders an error, never fixtures; reachable from nav + command palette.
  - id: M3
    title: Grouping and faceting
    depends_on:
    - M2
    exit_criteria:
    - Group-by project/route/truth_status/date with server-authoritative counts; unattributed
      group pinned last; three distinguishable empty states.
  - id: M4
    title: Decisions, DI rows, docs
    depends_on:
    - M1
    exit_criteria:
    - AC4 contract change recorded as a numbered decision; epic blocker recorded; flags.ts
      ADR citation corrected to ADR-8.
updated: '2026-08-09'
---

# Implementation Plan — Reports Hub: centralized cross-project `/reports` lens

PF-1 made a delivery report *hostable* and *linkable*; PF-4 makes it *findable*. Today a hosted
report is reachable only from the IntentTree node it was attached to, because every Atlas web route
is nested under `(projects)/projects/[projectId]` and there is no cross-project surface anywhere in
the app. When this is done there is one top-level `/reports` page that lists every `delivery_report`
in the workspace — including the ones that belong to no project — grouped and faceted by project,
route, `truth_status`, date, and tracker node, with counts that are actually correct.

> **The AC4 finding — read this first.** Node AC4 asserts "The lens needs no ingest or storage
> contract change (DI-G4: additive UI only)". **The "additive UI only" half is false, and this is the
> plan's most important finding.** There is no cross-project asset list route in the API:
> `api/app/api/assets.py` exposes only `GET /api/projects/{projectId}/assets` (:71) and
> `GET /api/assets/{assetId}` (:154), and the repository filters on exact `project_id` equality
> (`api/app/repositories/assets.py:44-46`). The one route that *does* span projects,
> `GET /api/search` (`api/app/api/search.py:36`), takes `q` as a **required** parameter (:38,
> mirrored `required: true` in `shared/openapi.yaml:1456-1460`) and returns `SearchResult` — a
> projection that drops `metadata` entirely (`search.py:24-35`), which is fatal here because
> `route`, `truth_status`, `revision`, `subject`, and `generated_from` all live in `metadata`.
> **AC4 is therefore satisfied via its own escape clause** ("or any change it does need is
> recorded"): this plan records an additive API contract change — a new `GET /api/reports` — and
> confirms the *substantive* half of AC4 holds: **no ingest and no storage contract changes.**
> DI-G4's "Blocks: none (additive UI only)" line should be corrected when M4 records the decision.
>
> **ANNOTATED 2026-08-09 — the finding stands, the tension does not.** D-019
> (`docs/DECISIONS.md:989`, Accepted, shipped in `456fdf1`) **supersedes DI-G4's deferral**. The new
> `GET /api/reports` path is therefore a **sanctioned** additive contract change, not a violation
> being argued past. AC4 is satisfied by **recording** it at M4 (now **D-020** — D-019 is taken); no
> further permission is outstanding.

## Scope boundary

**In:** one additive backend collection route (`GET /api/reports`) with server-computed facet counts
and an `include=links` expansion; one new top-level `/reports` route mounting `AppShell`; a narrowed
`DeliveryReportMetadata` type + runtime narrowing; grouping/faceting by project, route,
`truth_status`, date, and tracker node; the explicit **unattributed** bucket; nav + command-palette
registration; the `reports-hub` flag; and the decision/DI records including the AC4 correction.

**Out (stated, not dropped):** epic *labels* (blocked — see the epic decision and OQ-4; v1 groups by
tracker node instead); a generic `GET /api/assets` cross-project list (deliberately not added —
policy-surface rationale in the route decision); server-side `group_by` returning pre-grouped
payloads (client groups the page, server owns the counts — revisit if the report population outgrows
one page); result pinning (DI-G4 mentions it; not in the node ACs); the per-project reports surface
(sibling `node_01KZH6T1X0Q13XR1C66SD1CM1K`); the AOS-wide overview (sibling
`node_01KZH6VA1PKE7C6NDERQPRKNCC`); and backfilling report content (sibling
`node_01KZH6VA655DBTKDS99RZW76Y9`).

## Rubric — what "good" looks like

A reviewer should see **one** new backend route that is a thin composition over
`AssetService.search_assets` — not a second query path, and not a new repository. Every count on the
page traces to a server-computed full-set facet; nowhere does the UI count the array it just
rendered. A report with `project_id: null` is visibly present and labelled, never absent. An API
failure looks like a failure. The report-specific columns read through one narrowing function, so a
malformed `metadata` dict degrades to "unknown route" instead of crashing the group-by. And nothing
in `api/app/services/import_index.py` or the content store is touched.

## Current state (verified 2026-08-08)

**There is no cross-project surface and no reports route, anywhere.**

- `web/app/` has exactly two top-level segments: the `(projects)` route group, and
  `web/app/page.tsx:13-19`, which renders `<AppShell><ProjectsIndexView/></AppShell>`. That file is
  the **precedent for any new top-level route**, because `web/app/layout.tsx:41-56` renders only
  `<Providers>{children}</Providers>` — the root layout does **not** mount `AppShell`.
- Every asset view lives under `web/app/(projects)/projects/[projectId]/assets/`. There is no
  reports route at any level, per-project or top-level.
- `web/features/` has 12 feature dirs (`assets`, `board`, `bom`, ...) and **no** `reports` dir.

**The project-scoped library cannot be reused as-is.**

- `AssetLibrary` takes only `{ projectId: string }` (`web/features/assets/AssetLibrary.tsx:109-113`)
  — project scope is hard-baked into its signature.
- `artifact_type_id` is a **single** string filter (`AssetLibrary.tsx:145`) forwarded to
  `GET /api/projects/{projectId}/assets?artifact_type_id=` (`api/app/api/assets.py:79`).
- Facets are derived **client-side from the loaded page only**
  (`AssetLibrary.tsx:166-173`: it walks `allAssets` and collects `artifact_type_id`). There is no
  server-side facet or count endpoint anywhere in the API.
- The table's "Type" column shows `mime_type`, not `artifact_type_id`
  (`web/features/assets/components/AssetTable.tsx:61-148`).

**Report metadata is entirely invisible to the frontend today.**

- Grepping `truth_status`, `generated_from`, and `delivery_report` across `web/**` returns **zero**
  hits.
- The backend populates all of it: `api/app/services/import_index.py:688-703` writes
  `envelope_version, artifact_type, target, route, title, subject, instance_key, link_identity,
  revision, truth_status, generated_from, generated_at, tracker_links[], item_count`, and sets
  `artifact_type_id="delivery_report"` (`:736`).
- Frontend typing is unnarrowed: `Asset.metadata?: Record<string, unknown> | null`
  (`web/lib/types.ts:274`). `Asset` does already carry `workspace_id` and `project_id` (`:249-250`),
  so no type change is needed for those.

**The API can span projects at the service layer, but exposes no route that does.**

- `AssetRepository.list(project_id=None)` skips the project filter and returns everything
  (`api/app/repositories/assets.py:37-46`).
- `AssetService.search_assets(project_id=None, ...)` therefore already returns cross-project assets
  and supports `artifact_type_filter` (`api/app/services/assets.py:325-353, 384-386`).
- The project-scoped list route materializes the whole filtered set (`limit=10000`,
  `api/app/api/assets.py:94-101`), post-filters, then pages via `apply_cursor_page`
  (`api/app/api/_deps.py:57-94`), whose `total` is the **full** filtered count (`:93`). So full-set
  facet computation fits the shape the codebase already uses.

**Traps this plan must design around.**

- **Fixture fallback (sharpest UI trap).** `useAssets` returns `fixtureAssetsPage(projectId)` on any
  error (`web/lib/hooks/useAssets.ts:53-58`) and seeds loading state from fixtures (`:61`);
  `useAsset` does the same (`:80-83`). Building the lens on these hooks means an API outage renders
  **fake reports**.
- **Split origin.** Web and API are on different origins and there is no rewrite/proxy in
  `web/next.config.mjs`; every API path must go through `apiAbsoluteUrl` / `assetHtmlUrl`
  (`web/lib/api.ts:41-64`, rule documented at `:57-64`).
- **Nav signature.** `NavItem.href` is `(projectId: string) => string`
  (`web/components/shell/SidebarNav.tsx:35`), and all 11 items in `NAV_SECTIONS` (`:46-113`)
  interpolate a project id. `CommandPalette` does the same
  (`web/components/shell/CommandPalette.tsx:61-100`). A cross-project link cannot be expressed
  without widening one of these.
- **Flags + stale ADR citation.** `web/lib/flags.ts` has `FLAG_DEFAULTS` (`:20-48`), env-only
  turn-on via `NEXT_PUBLIC_FLAGS` (`:50-62`), and `isFlagEnabled` (`:73-76`). Its header comment
  (`:16-19`) credits **ADR-7** for the default-on cutover, but `docs/DECISIONS.md:521-522` records
  ADR-7 as **superseded by ADR-8 (2026-06-21)**, and ADR-8 (`:525`) is the actual default-on
  cutover. **This plan cites ADR-8**; correcting the stale comment is an M4 item.
- **Renderer.** Hosted report HTML already renders through a sandboxed iframe —
  `web/features/assets/components/AssetViewer/HtmlRenderer.tsx` (`sandbox="allow-scripts"` at `:79`;
  `allow-same-origin` is never set, documented `:7`). No renderer work needed.
- **Modal pattern.** `useAssetModal` is URL-driven (`?item=&tab=`,
  `web/features/assets/hooks/useAssetModal.tsx:46`), triggered by `AssetLink`
  (`web/features/assets/components/AssetLink.tsx:31`), tabs from
  `web/features/assets/components/EntityModal/AssetTabRegistry.ts`. `AssetLibrary` predates the hook
  and inlines the pattern — **new surfaces use the hook.**

## References

Backend, in the order M1 touches them:
- Compose, don't rewrite: `api/app/services/assets.py:325-353` (`search_assets`, `project_id=None`
  spans projects), `api/app/repositories/assets.py:37-46` (`list`).
- Route + pagination shape to mirror: `api/app/api/assets.py:71-131`
  (`list_project_assets` — filter set, post-filters, `apply_cursor_page`);
  `api/app/api/_deps.py:57-94` (page envelope, `total` = full count).
- Cross-project precedent and its limits: `api/app/api/search.py:36-70` (spans projects via optional
  `project_id`; `q` required at `:38`; `_asset_to_result` at `:24-35` drops `metadata`).
- Report metadata + attribution source of truth: `api/app/services/import_index.py:688-703`
  (metadata written), `:736` (`artifact_type_id`), `:605-613` + `_resolve_report_project_id`
  (attribution chain, terminal `None`), `_stamp_report_attribution` (`workspace_id` stamping).
- Contract file (quality gate, CLAUDE.md): `shared/openapi.yaml` — 3,915 lines; nearest template for
  a new collection path with array/enum query params is `/api/search` at `:1450-1533`.
- Link vocabulary (why epic is blocked): `api/app/models/vocabulary.py:262-273` —
  `AssetLinkTargetType` = `project, topic, feature, intenttree_node, meatywiki_page, bom_slot,
  context_pack, skillbom, execution_event`. **No `epic`.**

Frontend:
- Precedent to copy for the route: `web/app/page.tsx:13-19`; shell contract
  `web/components/shell/AppShell.tsx:24-42` (optional `projectId`, falls back to
  `DEFAULT_PROJECT_ID` for shortcuts at `:41`).
- Anti-pattern to *not* copy: `web/features/assets/AssetLibrary.tsx:166-173` (page-derived facets).
- Hooks to write around: `web/lib/hooks/useAssets.ts:44-63`.
- Origin helpers: `web/lib/api.ts:41-64`.

**Dependencies (sibling PF-4 nodes, all under `node_01KZH6QVPKAN01N8JTQ09XRMXA`).** All three land in
the same run as this plan; treat their output as available, and treat each as a *verification*
dependency rather than a code dependency — the lens must function (degraded) without any of them.

| Sibling node | What it gives this feature | Blocking? |
|---|---|---|
| `node_01KZH6RXGGDSWGSFJP4VH15EZG` — report project attribution | Reports now resolve a canonical `project_id` (subject slug, else `generated_from.repo` basename), stamp `workspace_id`, and ingest at `status=candidate`. Without it every report is unattributed and group-by-project is one bucket. | **Blocks AC2 verification** (cannot demonstrate project grouping); does **not** block AC1/AC3 — AC3 exists precisely because attribution can still terminate at `None`. |
| `node_01KZH6RXMYHRSK18E9QT60D1PA` — `scripts/seed_fleet_projects.py` | An Atlas project row per AOS fleet repo (seeded from `agentic_meta_dev/docs/05-app-registry.yaml`). Without it `GET /api/projects` has one row and "group by project" has one group. | **Blocks AC2 verification.** Also determines the workspace shape OQ-2 depends on. |
| `node_01KZH6VA655DBTKDS99RZW76Y9` — `scripts/backfill_reports.py` | The 14 rendered `aos-atlas` program reports. Without it the lens ships with ~1 row, which is indistinguishable from broken and gives no way to judge whether the grouping design works. | **Blocks the M3 demo**, not the M1/M2 code. |

Adjacent (shares code, does not block): `node_01KZH6T1X0Q13XR1C66SD1CM1K` (per-project reports
surface, operator ask #1) needs the *same* report-metadata type, the same report columns, and
the same row-to-hosted-HTML open. **SETTLED 2026-08-09: that sibling is program M1 and it ships
first, so IT owns `web/features/reports/` and the single canonical report-metadata type and parser.**
This plan imports from it and creates no `DeliveryReportMetadata` of its own. Do not let two report
tables or two metadata types exist.

Downstream consumer: `node_01KZH6VA1PKE7C6NDERQPRKNCC` (AOS overview) needs "latest
`program`/`dossier` report per project". M1's filter set must not preclude that (`route=program` +
`sort=captured_at:desc` + the project facet answers it) — no extra work now, just don't design it out.

## Named risks

- **R1 — The fixture fallback makes a broken lens look empty-but-fine (sharpest).**
  `useAssets.ts:53-58` and `:80-83` swallow errors into demo fixtures, and `:61` seeds loading state
  from them. A reports lens on these hooks shows plausible fake reports during an outage. Mitigation
  is an explicit AC + test in M2, not a code comment.
- **R2 — Confidently wrong counts.** Client-derived facets (`AssetLibrary.tsx:166-173`) see only the
  returned page. A cross-project lens that copies this shows "Project X: 3" when X has 40 — worse
  than no counts, because a wrong number is trusted. Mitigation: server facets over the full filtered
  set (M1), and a test that asserts facet counts with `limit=1` so page != total.
- **R3 — Two silent-drop paths, not one.** AC3 names `project_id`, but `workspace_id` is the second:
  pre-fix reports carry `workspace_id: null`, so a naive `workspace_id == settings.workspace_id`
  filter drops exactly the reports AC3 protects. Mitigation: OQ-2 decision + a regression test with a
  `workspace_id: null` fixture.
- **R4 — Cross-project read is a policy surface.** One call now returns assets from every project.
  Reports default to `sensitivity=personal` / `agent_access=preview_allowed`
  (`import_index.py:735-741`), but the same route is reachable by agents, and a `client_sensitive`
  report must not leak into a cross-project list. Mitigation: assert the policy layer applies to
  `GET /api/reports` identically to the project-scoped list; explicit test. (Not Mode D — no auth,
  payments, migration, or deletion — but it is the reason M1 stays claude-primary.)
- **R5 — Epic scope creep.** Implementing epic labels pulls an IntentTree client into Atlas, crossing
  the CLAUDE.md boundary ("IntentTree owns task hierarchy") and the DI-LinkTarget policy review, for
  a concept neither system models (OQ-4). Mitigation: the epic decision above — record the blocker,
  ship tracker-node grouping.
- **R6 — N+1 on links.** Tracker-node grouping needs each report's links, and links are per-asset
  (`GET /api/assets/{id}/links`). Fetching them row-by-row from the lens is an N+1 across every page.
  Mitigation: `include=links` on `GET /api/reports` in M1 (mirrors the existing `include` convention
  on `/api/search`), so M3 needs no extra round trips.
- **R7 — IA collision.** Top-level `/reports` and a future `/projects/[id]/reports` (sibling node)
  will coexist. Mitigation: name the scope in the page heading and the nav section ("Workspace" vs
  "Project"), and keep both — they answer different questions.

## Milestones

> A milestone is a reviewable state of the system, not a batch of tasks.

### M1 — Cross-project reports collection route  (backend + contract, C3)

`GET /api/reports` returns full `Asset` objects (not `SearchResult`) for
`artifact_type_id == "delivery_report"` across **all** projects, as a thin composition over
`AssetService.search_assets(project_id=None, artifact_type_filter=["delivery_report"])`.

Query params: `project_id` (repeatable; plus a distinguished value selecting `project_id is None` —
a missing param cannot mean both "no filter" and "filter to null"), `route`, `truth_status`,
`captured_after` / `captured_before`, `q` (**optional**), `cursor`, `limit`, `include=links`.
Response extends the existing page envelope with a `facets` block:
`{items, has_more, next_cursor, total, facets: {project: [{value, count}], route: [...],
truth_status: [...], date_bucket: [...]}}` — every count computed over the **full filtered set
before paging**, per the facet decision. `shared/openapi.yaml` gains the path (template:
`/api/search` at `:1450`).

**AC:** one call returns reports from >=2 projects **and** the unattributed report; facet counts
equal full-set counts when `limit=1` (page != total); a `workspace_id: null` report is present; a
`client_sensitive` report is handled per the policy layer identically to the project-scoped list;
`grep -n "/api/reports" shared/openapi.yaml` hits; **no diff in
`api/app/services/import_index.py` or the content store.**

### M2 — The `/reports` surface exists and lists everything  (frontend route + nav, C2)

New `web/app/reports/page.tsx` mounting `<AppShell>` itself (per `web/app/page.tsx:13`), rendering a
new `web/features/reports/ReportsHub.tsx`. New `web/lib/hooks/useReports.ts` — **no fixture fallback,
no fixture `placeholderData`** — and a `DeliveryReportMetadata` type plus a *runtime narrowing
function* (not a cast) over `Asset.metadata` so a malformed dict degrades to "unknown" instead of
throwing. Columns: title, project, route, `truth_status`, revision, `generated_from.commit`, captured
date. Rows open the hosted HTML through the existing `useAssetModal` + `AssetLink` pattern and
`assetHtmlUrl` (split-origin rule) — **not** a new inline viewer. Reachable from a new
**"Workspace"** `NAV_SECTIONS` group whose items carry a plain `href: string` (the minimal widening
of `SidebarNav.tsx:35`, leaving the 11 project-scoped items unchanged) and from a static
command-palette entry (`CommandPalette.tsx:61`). Gated by a new `reports-hub` flag in `FLAG_DEFAULTS`
(`web/lib/flags.ts:20`), default per OQ-3.

**AC:** the route lists every report including unattributed ones; a mocked API **5xx renders an error
state and zero fixture rows** (the R1 regression test); nav item and palette entry both navigate
there; `npm run typecheck` and `npm run lint` clean.

### M3 — Grouping and faceting  (the actual lens behavior, C2)

Group-by selector for **project / route / truth_status / date / tracker node**. Group headers and
facet chips display the **server** counts from M1's `facets` block; the client groups the rows it has
and, when `has_more`, says so explicitly ("showing N of M") rather than implying the page is the whole
set. The **unattributed** group is labelled as such, pinned last, and carries a one-line explanation
of why a report has no project. Tracker-node grouping reads the inline `include=links`
`intenttree_node` targets (no per-row fetch), labelled by node id — **no epic rollup** (recorded
decision).

**AC:** all five group-by modes render; every visible count traces to a server facet, none to
`array.length`; the unattributed group is present with >=1 member when an unattributed report exists;
the **three empty states are distinguishable** — "no reports in this workspace" vs "no reports match
these filters" vs "reports exist but none are attributed to a project" (mirrors sibling
`node_01KZH6T1X0Q13XR1C66SD1CM1K` AC3).

### M4 — Decisions, DI rows, docs  (docs, C1)

Record in `docs/DECISIONS.md`: the **AC4 correction** (DI-G4's "additive UI only" was wrong; a new
additive `GET /api/reports` path was required; ingest/storage contracts untouched), the
`GET /api/reports` vs `GET /api/assets` route choice with its policy rationale, and the
**epic-grouping blocker** (DI-G6 + the DI-LinkTarget IntentTree-client policy review + OQ-4's "epic
is not a modeled entity"). Amend the DI-G4 row to point at this plan and strike its "Blocks: none
(additive UI only)" claim. New `DI-` rows for: epic-label rollup (blocked on the policy review);
server-side `group_by` if the report population outgrows one page; the deliberately-not-added generic
`/api/assets` list. Correct the stale **ADR-7 -> ADR-8** citation in `web/lib/flags.ts:16-19`.

**AC:** **D-020** is present in `docs/DECISIONS.md` — the next free number is settled, not to be
re-derived: D-019 was taken by the Reports Hub foundations decision (`docs/DECISIONS.md:989`, shipped
in `456fdf1`), so the earlier note here that "D-018 is the latest" is corrected. Each deferral is a
tracked `DI-` row; `grep -n "ADR-8" web/lib/flags.ts` hits and `ADR-7` no longer appears as the
default-on authority.

## AC -> command -> evidence

| AC | Command | Evidence of pass |
|---|---|---|
| M1 cross-project + unattributed | `cd api && python3 -m pytest -q -k reports_collection` | one response contains assets from >=2 `project_id`s **and** one with `project_id is None` |
| M1 facet counts are full-set | `cd api && python3 -m pytest -q -k reports_facets` | with `limit=1`: `len(items)==1`, `total>1`, and each facet count equals the full-set count |
| M1 null workspace not dropped | `cd api && python3 -m pytest -q -k reports_workspace_null` | a `workspace_id=None` report appears in the default response |
| M1 policy parity | `cd api && python3 -m pytest -q -k reports_policy` | a `client_sensitive` report is treated exactly as on `GET /api/projects/{id}/assets` |
| M1 contract aligned | `grep -n "/api/reports" shared/openapi.yaml` | path present with the full param set |
| M1 no ingest/storage diff | `git diff --stat api/app/services/import_index.py` | empty |
| M2 route lists everything | `cd web && npm run test -- reports-hub` | renders rows for attributed + unattributed reports |
| M2 no fixture fallback (R1) | `cd web && npm run test -- reports-hub-error` | mocked 500 -> error state rendered, **0** fixture rows |
| M2 reachable | `cd web && npm run test:e2e -- flags-on/reports-hub` | nav item + palette entry both land on `/reports` |
| M3 grouping + counts | `cd web && npm run test -- reports-grouping` | 5 group-by modes; header counts read from the server facet block, not `array.length` |
| M3 empty states | `cd web && npm run test -- reports-empty-states` | three distinct copy variants asserted |
| M4 decisions + deferrals | `grep -n "DI-G4\|ADR-8" docs/DECISIONS.md web/lib/flags.ts` | new decision recorded, DI-G4 amended, flags.ts cites ADR-8 |

Frontend commands run from `web/` (no root `package.json`, no pnpm workspace — `web/` ships both
`package-lock.json` and `pnpm-lock.yaml`). Component tests live in `web/__tests__/`, e2e in
`web/e2e/`, with the `web/e2e/flags-on/` convention for specs needing non-default flags. Backend:
`cd api && python3 -m pytest -q`.

## Sequencing (load-bearing)

**M1 strictly before M2**, and **M2 strictly before M3** — this is a real data dependency chain, not
house style: M2 has nothing to list until the route exists, and M3's counts *are* M1's facet block, so
building M3 first would force the page-derived counts R2 exists to prevent. M4 needs only M1's
contract shape settled and can run concurrently with M3.

**Decision gate before M1 opens — DISCHARGED 2026-08-09.** OQ-1 (route choice) and OQ-2 (workspace
filtering) both had to be signed off before backend code, because both are baked into the response
contract and into `shared/openapi.yaml`. Both are now RESOLVED in `decisions` (new `GET /api/reports`;
no workspace filter, `workspace_id: null` in-scope). Do not re-litigate either at M1 start. OQ-3 (flag
default) can wait until M2. OQ-4 is upstream and blocks nothing here — the epic decision above routes
around it. OQ-5 can be settled inside M1.

The three sibling dependencies gate *verification*, not code: M1 and M2 can be built and unit-tested
against fixtures while attribution/seeding/backfill land, but **M3's acceptance demo requires at least
the attribution fix and the fleet project rows** — with one project row, "group by project" cannot be
shown to work.

## Execution ledger

Deviations logged to `.claude/worknotes/reports-hub-central-lens/implementation-notes.md`, reviewed at
each milestone boundary. **Blockers still stop.** No Mode-D surface: no auth, payments, migration, or
deletion path is touched, and `GET /api/reports` is a read. Two escalation triggers, though — if M1's
policy work turns out to need a change to the policy evaluation layer itself rather than reuse, that
is a boundary and halts for approval; and if the epic decision is overturned in favor of
*implementing* epic labels, that introduces an IntentTree client into Atlas, which is a
subsystem-boundary change requiring the DI-LinkTarget policy review and human sign-off, not an
in-flight scope adjustment.
