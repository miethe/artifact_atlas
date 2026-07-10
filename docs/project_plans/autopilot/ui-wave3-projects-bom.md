# Autopilot Wave Plan — UI Wave 3: Projects, BOM, Library/Detail Polish

- **Status**: completed (2026-07-10 — all 5 workstreams landed; web tsc clean, vitest 106/106, api 631 passed/2 skipped; see D-017)
- **Branch**: `autopilot/ui-wave3-projects-bom`
- **Date**: 2026-07-10
- **Tier**: 2 (multi-wave, ~5 workstreams)
- **Mode**: C per workstream (autonomous sprint within contract scope); no Mode-D surface (UI + additive backend endpoints only, no auth/payments/migrations of existing data)

## Request (resolved)

1. **WS-1 (bug)**: PPTX previews don't show on asset cards; they DO render in the detail view. Fix card thumbnails for PPTX (and any other convertible types).
2. **WS-2**: Asset detail view enrichment per `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/artifact_atlas_dashboard_with_system_architecture.png` — significantly more detail fields, populated + visualized.
3. **WS-3**: Asset library cards + expanded filter/search/sort bar per `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/asset_library_dashboard_interface_snapshot.png`.
4. **WS-4**: Projects surface — all Projects as cards, easy create-Project; Project detail = command center per `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/artifact_atlas_command_center_interface.png`; every pane expandable to full screen.
5. **WS-5**: BOM tab on Project view per `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/artifact_bom_project_dashboard_interface.png` + BOM Builder per `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/artifact_atlas_project_template_interface.png`.

Completion directive: validate, squash-merge to `main`, push.

## Mockup-derived UI specs (authoritative targets — agents MUST also view the referenced PNG)

### WS-2 — Asset Detail (mockup: `artifact_atlas_dashboard_with_system_architecture.png`)

Layout: breadcrumb (Projects > {project} > Assets > {asset}) · "Back to assets" · title row with lifecycle chip (Raw/Candidate/Selected/Canonical) · top-right actions: Open Original, Link to Node, Add to Context Pack, Compare Variants · lifecycle stage tab strip (Raw | Candidate | Selected | Canonical).

Three-column body:
- **Left/center**: large preview pane (zoom +/- and fullscreen controls); below it **Provenance** card (Source Conversation w/ user-prompt excerpt, Model, Temperature, Generated timestamp, Run ID) and **Version History** card (v3/v2/v1 rows: version chip, lifecycle chip, author, timestamp, "Current" marker, View all versions link); **Related Assets** strip (thumbnail cards, View all).
- **Middle column**: Details / Metadata / Tags tab group. Details tab: Source (icon + name + timestamp), Type, Format, Dimensions, Size, Created by (avatar), Last modified. **IntentTree Links** card (node id chip, title, status chip; Manage + View in IntentTree). **Associations** card (Project, Topic, Feature, Epic rows; Edit).
- **Right rail**: Summary/Comments/Activity tab strip. **AI-Generated Summary** card (paragraph + Key Components bullets + Regenerate button). **Agent Access Policy** card (Classification chip, Access, Allow in Context Packs, Allow for Training, PII/Sensitive Data, Auto-Redact; Edit). **Annotations** card (avatar, timestamp, note; Add annotation).

Data notes: extend asset metadata model where fields are missing (provenance, access-policy, associations, annotations, ai_summary). Populate from real fields where they exist; render tasteful empty states ("Not set", add actions) where not.

### WS-3 — Asset Library (mockup: `asset_library_dashboard_interface_snapshot.png`)

- Header: page title + description, Add Asset (primary, split), Export, Import.
- **Filter bar**: labeled dropdown chips — Project, Source, Type, Status, Topic, Feature, IntentTree Node, Date, Sensitivity, "+ More filters". Each dropdown = label caption over value.
- **View tabs**: Gallery | Table | Board | Timeline (Gallery + Table functional; Board/Timeline may be stubs with tasteful "coming soon" only if time-boxed out — prefer functional Board grouped by lifecycle status).
- Right of tabs: "Sort by {Recently updated}" dropdown, asset count ("482 assets"), grid/list density toggle.
- **Cards**: large thumbnail (real preview — ties into WS-1), source-type badge overlay (PDF/Figma/etc.), filename, source icon + origin label, tag chips (≤3), lifecycle status chip (color-coded: In Progress/In Review/Canonical/Proposed), relative time, star toggle, comment count, overflow menu.
- **Detail drawer** (right side, opens on card select): preview carousel w/ thumbnails, title, source, status chip, Description (Show more), Details (Source, Type, Size, Uploaded, Updated, Created by), Tags, IntentTree Node chip, Sensitivity chip, Quick Actions (Open in {source}, Share, overflow).

### WS-4 — Projects (mockup: `artifact_atlas_command_center_interface.png`)

- **/projects index**: every Project as a card (name, description, tag chips, asset counts, updated); prominent "New Project" button + create dialog (name, description, tags, status).
- **Project detail (command center)**: breadcrumb; title + star; description; tag chips (Strategic Initiative / Platform / In Progress style); actions: Add Asset, Create Context Pack, Open in MeatyWiki (external-link style); "Last synced Xm ago" line.
- **KPI stat cards row**: All Assets, Candidate Assets, Canonical Assets, Linked Intent Nodes, Open Tasks — each icon + count + weekly delta.
- **Pane grid**: Active IntentTree Nodes (list w/ node-id chips, status chips, task counts, View all/Open in IntentTree), Recent Assets (thumbnail grid, Browse all), Canonical Artifacts (rows w/ thumb, Canonical chip, age, owner, View all/Manage canonical), Candidate Assets (thumbnail strip, Browse candidates), Missing Context / Attention Needed (warning rows w/ node chip + priority chip, Requested-by, Open all), Context Packs (icon rows w/ Ready/Building chips, asset counts, Create new pack).
- **Every pane expandable**: expand affordance on each pane header → full-screen view (modal/route) of that pane's full content list.
- Footer collaboration strip is out of scope (multi-user presence not in product yet).

### WS-5 — BOM tab + Builder (mockups: `artifact_bom_project_dashboard_interface.png`, `artifact_atlas_project_template_interface.png`)

**BOM tab (project-scoped)**:
- Header actions: Apply Template, Add Domain Template, More.
- Stat cards: Total Expected Types (across N domains), Filled (% of expected), Missing, Coverage % (progress bar), Active Templates.
- Domain tab chips (All Domains + per-domain w/ icons + "+" to add), Group-by dropdown (Domain/Phase), Grid/list view toggle, expand-fullscreen icon.
- Per-domain section: header (icon, name, filled/total + %, View details); grid of **filled slot cards** (thumbnail, artifact-type name, status chip Complete/In Progress, version, age, overflow) and **missing slot cards** (dashed border, icon, type name, "Missing" chip, "Drop asset here" — clicking opens asset picker to fill).
- Right rail: Quick Actions (Review Gaps, Auto-label from Inbox, Open Asset Library, Compare Coverage), Template Sources (source + Active chip + expected-type counts, Edit), Insights bullets, Legend (Complete/In Progress/Missing/Draft).

**BOM Builder (template editor)**:
- Breadcrumb Projects > {project} > Templates > BOM Builder; actions: Duplicate from Template, Create Section, Preview BOM, Save Template, Apply to Project.
- Three panels: **(1) Artifact Library** palette — searchable, grouped (Strategy & Discovery / Architecture & Design / Implementation / Research & Validation) list of artifact types. **(2) BOM Structure Canvas** — sections per domain, columns per phase (Discovery/Design/Build/Launch), slot chips (type name + Required/Optional) placeable into cells, "Drop artifact type here to add to selected phase" affordance, Group by Domain|Phase toggle, zoom controls. **(3) Artifact Properties** — for selected slot: Artifact Type, Required toggle, Domain select, Phase select, Linked IntentTree Node, Accepted File Types chips, Max file size, Naming Convention pattern, Auto-label Rules chips, Guidance textarea, Status select. Footer: template version, created-by, View change history.
- dnd-kit for palette→canvas placement (spec stack already includes dnd-kit). Persist templates via backend.

## Waves

- **Wave 0**: scout (done via Explore agent) + this plan.
- **Wave 1 (parallel, disjoint files)**: WS-1 (bugfix), WS-3 (library), WS-2 (detail), WS-4a (backend: projects/BOM/template endpoints as needed — additive only).
- **Wave 2**: WS-4b (projects UI), WS-5 (BOM tab + builder) — depend on WS-4a contracts.
- **Wave 3**: integration pass, validation (tsc/lint/tests/build), reviewer gate (Mode E), fix loop.
- **Merge**: squash to `main`, push origin.

## Validation gates

- `npx tsc --noEmit` (filter known pre-existing a11y test errors), frontend lint/build.
- Backend: pytest (scoped), flake8/mypy if configured.
- Reviewer: task-completion-validator vs this plan; code-reviewer on diff.

## Code touchpoints (from scout)

- Frontend `web/` (Next.js App Router); routes under `web/app/(projects)/projects/[projectId]/` — `page.tsx` (command center, `features/dashboard/CommandCenterView.tsx`), `assets/`, `assets/[assetId]/`, `templates/`, `bom/`, `bom-mapping/`, `context-packs/`, `coverage/`, `inbox/`, `board/`, `intent-nodes/`. Projects landing: `web/app/page.tsx`.
- Asset components: `web/features/assets/` — `AssetLibrary.tsx`, `AssetDetail.tsx`, `components/{AssetCard,AssetTable,AssetThumbnail,FilterBar,SortMenu,AssetDrawerContent}.tsx`, renderers in `components/AssetViewer/`.
- **WS-1 root cause**: `web/features/assets/components/AssetViewer/PptxRenderer.tsx:105-122` — thumbnail mode short-circuits to a static icon (AC P4C-D), never calls `POST /api/preview/convert/pptx`; full mode uses `PptxConversionView` → cached PDF (`GET /api/preview/cache/{assetId}`) → `PdfRenderer`.
- Backend `api/` (FastAPI, JSONL repos): Projects/BOM/Templates/Assets routers ALL exist (`api/app/api/{projects,bom,templates,assets,preview}.py`), models in `api/app/models/`, vocab enums in `models/vocabulary.py`. Asset model already carries status/sensitivity/agent_access/generated_by/source_kind/metadata-dict. `shared/openapi.yaml` already covers projects/BOM/templates.
- Validation: `make test-api` (pytest, ~612), `cd web && npm run typecheck && npm run test` (vitest, ~75). `next lint` is a dead gate (no ESLint config).
- Gotchas: `@miethe/ui@0.6.0` subpath imports only; HSL-triplet token bridge in `globals.css` + shadcn keys in `tailwind.config.ts`; flags DEFAULT-ON via `web/lib/flags.ts` `FLAG_DEFAULTS` (ADR-8); style light+dark via tokens.

## Wave 1 file ownership (parallel agents, same checkout — do NOT cross boundaries, do NOT git commit)

| WS | Owns | Must not touch |
|---|---|---|
| WS-1 | `web/features/assets/components/AssetViewer/**` | AssetCard, AssetDetail, FilterBar |
| WS-2 | `web/features/assets/AssetDetail.tsx`, new `web/features/assets/components/detail/**` | AssetViewer internals, AssetCard, AssetLibrary, drawer |
| WS-3 | `web/features/assets/AssetLibrary.tsx`, `components/{AssetCard,AssetTable,FilterBar,SortMenu,AssetDrawerContent}.tsx`, new board/timeline views, `web/lib/hooks/useAssets.ts` | AssetViewer internals, AssetDetail |
| WS-4 | `web/app/page.tsx`, `web/features/dashboard/**`, new `web/features/projects/**`, new `web/components/ui/ExpandablePane.tsx`, `api/app/models/project.py`+router (additive) | assets feature dirs, bom/templates |
| WS-5 | `web/app/(projects)/projects/[projectId]/{bom,bom-mapping,templates}/**`, new `web/features/{bom,templates}/**`, `api/app/{models/template.py,api/templates.py,api/bom.py,services}` (additive) | assets feature dirs, dashboard |

Shared-file rule: prefer feature-local API helper files over editing `web/lib/api.ts`; if `api.ts` must change, append-only new exports. New UI primitives go in NEW files under `web/components/ui/`.
