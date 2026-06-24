# MVP Backlog — Artifact Atlas

> Reconciled from: source spec §20 MVP scope, §21 roadmap, §22 engineering backlog; phase-0 contracts
> (`docs/project_plans/implementation_plans/features/artifact-atlas-app-completion-v1/phase-0-decisions-contracts.md`);
> and scaffold inventory performed 2026-06-20.
>
> Vocabulary: asset status `inbox | raw | candidate | in_review | in_progress | selected | canonical | archived`;
> BOM slot status `missing | partial | in_progress | complete | stale | blocked | not_applicable`;
> sensitivity `public | personal | work_sensitive | client_sensitive | restricted`;
> agent access `none | metadata_only | preview_allowed | read_allowed | context_pack_allowed`;
> assignment status `suggested | accepted | rejected | canonical`;
> template status `core | recommended | optional | experimental | deprecated`.

---

## Baseline Inventory

Current scaffold state as of 2026-06-20. Each area is assessed across **implemented**, **partial/stub**, and **missing**.

### `api/`

| Item | State | Notes |
|---|---|---|
| FastAPI app shell (`app/main.py`) | Implemented | `/health`, `GET /api/projects` (hardcoded stub), no persistence |
| Pydantic schemas (`models/schemas.py`) | Partial | `Project`, `Asset`, `BomSlot`, `CoverageSummary` present; `Template`, `ContextPack`, `AuditEvent`, `Policy`, `IntentTreeLink` missing |
| Coverage service (`services/coverage.py`) | Stub | File exists; no JSONL/repo wiring |
| Repository layer | Missing | No JSONL readers, no SQLite models, no repository classes |
| Routers / endpoint modules | Missing | All routes live in `main.py`; no `assets`, `inbox`, `templates`, `bom`, `context_packs`, `search`, `audit` routers |
| Ingest / import endpoint | Missing | No file upload, no watched-folder worker |
| Thumbnail generation | Missing | Not started |
| MCP server | Missing | Not started |
| Tests | Stub | `tests/test_health.py` only |

### `web/`

| Item | State | Notes |
|---|---|---|
| Next.js 15 app shell | Implemented | `layout.tsx`, `globals.css`, scaffold CSS shell |
| Project Command Center page | Partial | Static stats, static lane board, no API wiring |
| Asset gallery / list view | Missing | Not started |
| Asset detail drawer | Missing | Not started |
| Inbox triage view | Missing | Not started |
| BOM overview page | Missing | Not started |
| Template library page | Missing | Not started |
| Apply template wizard | Missing | Not started |
| Context pack builder | Missing | Not started |
| Search / filter bar | Missing | Not started |
| Navigation links wired | Missing | Links render as `href="#"` stubs |
| TanStack Query / Table / Virtual | Missing | Not installed |
| dnd-kit | Missing | Not installed |

### `shared/`

| Item | State | Notes |
|---|---|---|
| `openapi.yaml` | Partial | 5 stub routes; schemas `Project` and `Asset` only; `BomSlot`, `Template`, `ContextPack`, `Coverage`, `Inbox`, `Search`, `Audit`, `Policy` missing |

### `registry/`

| Item | State | Notes |
|---|---|---|
| `projects.jsonl` | Implemented | Seed record present |
| `assets.jsonl` | Implemented | One seed asset (spec doc) |
| `bom.jsonl` | Implemented | Seed file present; structure TBD |
| `templates.jsonl` | Implemented | Seed file present |

### `templates/`

| Item | State | Notes |
|---|---|---|
| `new-product-app.yaml` | Implemented | Core template with Strategy / Product / Architecture / Frontend Design / GTM domains |
| `architecture-initiative.yaml` | Implemented | Second core template |
| Agentic OS template | Missing | Referenced in spec §21 Phase 0 |
| GTM template | Missing | Referenced in spec §21 Phase 0 (distinct from slots inside new-product-app) |
| Research template | Missing | Referenced in spec §21 Phase 0 |

### `exports/`

| Item | State | Notes |
|---|---|---|
| `context-packs/artifact-atlas-builder-context-pack.yaml` | Implemented | Manual example pack; schema TBD |
| `reports/` | Empty placeholder | `.gitkeep` only |

### `assets/` (thumbnails and previews)

| Item | State | Notes |
|---|---|---|
| `assets/thumbnails/` | Empty | Directory exists |
| `assets/previews/` | Empty | Directory exists |

### Mockups (PRD package PNGs)

Ten UI mockup images are present in `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/`. None are wired into the web app. They serve as implementation reference only.

---

## Epics (Canonical List)

Aligned with spec §22.1. Epic E6 (Template Builder) is elevated to its own epic vs. the original backlog which folded it into E5.

| Epic | Description | MVP Phase |
|---|---|---|
| E1 | Asset Registry — core model, ingest, metadata, links, thumbnails | 0–1 |
| E2 | Project Shell — app shell, project home, navigation, search, filters | 0–1 |
| E3 | Inbox & Triage — capture workflow, classification forms, bulk actions | 1 |
| E4 | IntentTree Linkage — node search, context view, asset-node relationships | 1–2 |
| E5 | Artifact BOM — BOM slots, coverage, drag/drop assignment, inbox-to-slot mapping | 2 |
| E6 | Template Builder — reusable project templates and artifact type library | 2 |
| E7 | Context Packs — pack builder, manifests, policy envelope, publish/export | 3 |
| E8 | Agent Gateway — MCP tools, CLI, policy-aware retrieval | 3 |
| E9 | Integrations — MeatyWiki, local vault, GitHub/Drive/Figma stubs | 1–3 |
| E10 | Governance & Audit — sensitivity, access policy, audit events | 0–3 |
| E11 | Telemetry — CCDash event export and usage metrics | 4 |
| E12 | Search & Intelligence — full-text search, semantic search, classification suggestions | 4 |

---

## Implementation Phases

### Phase 0 — Decisions, Contracts, and Schema Seed (Complete before Phase 1 build)

> Spec §21 Phase 0; phase-0-decisions-contracts.md. Duration: 1–2 weeks.

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| P0-001 | Baseline Inventory | Inventory section in docs distinguishes implemented vs missing across all scaffold directories. | — |
| P0-002 | Persistence Decision | `docs/DECISIONS.md` records chosen storage model (JSONL-repository-first) with SQLite migration path. | P0-001 |
| P0-003 | Vocabulary Canonicalization | API/storage values frozen for asset status, BOM slot status, sensitivity, agent access, assignment status, template status. | P0-001 |
| P0-004 | Policy Baseline | Policy rules documented covering sensitivity defaults, agent access gates, canonical promotion, and MCP denial logging. | P0-003 |
| P0-005 | API Contract Expansion | `shared/openapi.yaml` covers Projects, Assets, Inbox, Templates, BOM, Coverage, Context Packs, Search, Audit, and Policies. | P0-002, P0-003 |
| P0-006 | Integration Contract Notes | Each of MeatyWiki, IntentTree, SkillMeat/SAM, CCDash, and Control Plane has a documented MVP read/write boundary and export shape. | P0-004 |
| P0-007 | Backlog Reconciliation | `docs/mvp-backlog.md` reflects phase sequencing with no duplicate or conflicting epics. | P0-005 |
| P0-008 | Sample Template Completion | Agentic OS, GTM, and Research YAML templates added to `templates/`; existing templates validated. | P0-003 |

---

### Phase 1 — Web App MVP (Core Read Path)

> Spec §21 Phase 1; E1, E2, E3 partial, E9 partial. Duration: 4–6 weeks.

#### E1 — Asset Registry

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E1-001 | Repository layer — JSONL readers | CRUD methods for projects, assets, templates, BOM exist; all reads/writes go through repository classes. | P0-002 |
| E1-002 | Asset Pydantic model (full) | `Asset` model covers all spec §13 fields including `artifact_type_id`, `source_kind`, `tags`, `metadata`, canonical vocabulary enums. | P0-003 |
| E1-003 | Local file import endpoint | `POST /api/projects/{id}/assets/import` accepts file upload, saves metadata to registry, returns `Asset`. | E1-001, E1-002 |
| E1-004 | Thumbnail generation worker | Image and PDF thumbnails generated on ingest; stored in `assets/thumbnails/`; path recorded in asset metadata. | E1-003 |
| E1-005 | Asset link model | `AssetLink` schema and JSONL storage implemented; link types from spec §13 supported. | E1-001 |
| E1-006 | Asset search/filter endpoint | `GET /api/projects/{id}/assets` supports `status`, `artifact_type`, `sensitivity`, and text query filters. | E1-001 |

#### E2 — Project Shell

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E2-001 | Next.js API integration setup | TanStack Query installed; `api/` client module fetches from FastAPI; env var for API base URL. | P0-005 |
| E2-002 | Project home — live KPI cards | KPI cards (asset count, canonical count, BOM coverage) fetch from real API endpoints. | E2-001, E1-001 |
| E2-003 | Asset gallery view | Grid/list view of project assets with status badges, sensitivity indicators, and type icons. | E2-001, E1-006 |
| E2-004 | Asset detail drawer | Drawer showing all asset fields, thumbnail preview, and metadata; opens from gallery row. | E2-003 |
| E2-005 | Navigation — all sections wired | Sidebar nav links route to real pages (Assets, Artifact BOM, Templates, Context Packs, Coverage). | E2-001 |
| E2-006 | Basic metadata search bar | Top search bar filters asset gallery by title/tag; no semantic search. | E2-003 |

#### E3 — Inbox & Triage

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E3-001 | Watched-folder CLI proof of concept | `atlas watch <path>` detects new files and imports them as `inbox` assets. | E1-003 |
| E3-002 | Inbox view | Dedicated inbox page lists assets with `inbox` and `raw` status; filterable. | E2-003 |
| E3-003 | Classification form | Single-asset form sets artifact type, project, sensitivity, and initial status; saves via API. | E2-004, E1-002 |
| E3-004 | Bulk metadata assignment | Select multiple inbox assets and apply shared artifact type or project assignment in one action. | E3-002, E3-003 |

#### E9 — Integrations (MeatyWiki sync, Phase 1 scope)

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E9-001 | MeatyWiki asset card export | `GET /api/assets/{id}/export/meatywiki` returns Markdown asset card in MeatyWiki folder convention. | E1-002 |
| E9-002 | MeatyWiki writeback note stub | Export endpoint accepts optional note string appended to card; no live API call. | E9-001 |

---

### Phase 2 — Artifact BOM and Templates

> Spec §21 Phase 2; E4, E5, E6. Duration: 4–6 weeks.

#### E4 — IntentTree Linkage

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E4-001 | IntentTree node link model | `IntentTreeLink` schema stored in JSONL; links asset to IntentTree node ID by reference. | E1-001 |
| E4-002 | Node context view scaffold | Page or panel showing linked assets for a given node ID; fetches from API. | E4-001, E2-003 |
| E4-003 | Create context pack from node | UI action creates draft context pack pre-seeded with assets linked to a given node. | E4-001, E7-001 |

#### E5 — Artifact BOM

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E5-001 | BOM Pydantic models | `Template`, `ArtifactType`, `BOM`, `BomSlot`, `SlotAssignment` models cover spec §13 fields with canonical enum values. | P0-003 |
| E5-002 | BOM repository | CRUD for BOMs and slot assignments stored in JSONL; slot status transitions are validated. | E5-001, E1-001 |
| E5-003 | BOM overview page | Project BOM page displays domains, slot statuses, and coverage score. | E5-002, E2-001 |
| E5-004 | Slot assignment API | `POST /api/projects/{id}/bom/slots/{slotId}/assign` accepts asset ID; stores `SlotAssignment`. | E5-002 |
| E5-005 | Inbox-to-BOM mapping UI | Classification form or drag/drop surface lets user assign an inbox asset to a BOM slot. | E3-003, E5-004 |
| E5-006 | Coverage & gaps calculation | Coverage score endpoint counts required complete vs total; gap list returns missing required slots. | E5-002 |
| E5-007 | `atlas bom status` CLI command | CLI outputs BOM coverage score and list of missing required slots for a project. | E5-006 |

#### E6 — Template Builder

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E6-001 | Template library API | `GET /api/templates` lists available templates; `GET /api/templates/{id}` returns full slot definitions. | E5-001, E1-001 |
| E6-002 | Template library UI | Browse and preview available project templates in the web app. | E6-001, E2-001 |
| E6-003 | Apply template wizard | Wizard applies a template to a project creating a BOM with empty slots; handles conflicts. | E6-001, E5-002 |
| E6-004 | Template Builder v0 | Basic editor to create or copy/modify a template (domains, artifact types, required flags). | E6-001 |

---

### Phase 3 — Context Packs and Agent Interface

> Spec §21 Phase 3; E7, E8, E9 remainder. Duration: 3–5 weeks.

#### E7 — Context Packs

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E7-001 | Context pack Pydantic model | `ContextPack` schema covers manifest, included assets, policy envelope, token estimate fields. | P0-003 |
| E7-002 | Context pack YAML manifest exporter | `GET /api/context-packs/{id}/export` returns YAML manifest; sensitive assets are excluded unless policy permits. | E7-001, P0-004 |
| E7-003 | Policy envelope on pack | Pack manifest includes sensitivity summary, access mode, and agent access fields from policy baseline. | E7-002, P0-004 |
| E7-004 | Pack preview endpoint | `GET /api/context-packs/{id}/preview` returns estimated token count and asset list without full content. | E7-001 |
| E7-005 | Context Pack Builder UI | UI to compose a context pack from selected assets, set policy mode, preview, and export. | E7-002, E7-004, E2-001 |

#### E8 — Agent Gateway

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E8-001 | Read-first MCP tool stubs | MCP server with tools: `atlas_list_assets`, `atlas_get_asset`, `atlas_get_bom`, `atlas_get_context_pack`; all read-only. | E1-001, E5-002, E7-001 |
| E8-002 | `atlas bom status` CLI service path | CLI command hits the same coverage endpoint as the web app; no hardcoded logic. | E5-007 |
| E8-003 | Policy-aware retrieval | MCP tools enforce `agent_access` field; `metadata_only` mode returns no content fields; `none` returns 403. | E8-001, P0-004 |
| E8-004 | Audit log — access and denial events | Every MCP tool call and policy denial is appended to audit JSONL; `GET /api/audit` returns recent events. | E8-003 |

#### E9 — Integrations (Remainder)

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E9-003 | SkillMeat template reference export | Template metadata can be exported as a SkillMeat-compatible reference block. | E6-001, P0-006 |
| E9-004 | CCDash basic event export | `context_pack_published` and `asset_classified` events written to JSONL export on each action. | P0-006, E7-002 |
| E9-005 | Control Plane routing signal stub | Project snapshot YAML exported on project state change; no live push. | P0-006 |
| E9-006 | GitHub/Drive/Figma link import | Manual link import endpoint accepts a URL and source kind; no OAuth connector. | E1-003 |

#### E10 — Governance & Audit (Phase 3 items)

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E10-001 | Sensitivity enforcement in API | All asset reads check sensitivity vs caller context; `restricted` assets return 403 outside approved paths. | P0-004 |
| E10-002 | Canonical promotion gate | Promoting an asset to `canonical` status requires an explicit API call and records an audit event. | E8-004, P0-004 |
| E10-003 | Agent access policy log | All MCP and CLI access attempts are logged with policy decision (allow/deny/mask). | E8-004 |

---

### Phase 4 — Intelligence and Telemetry

> Spec §21 Phase 4; E11, E12. Duration: 4–8 weeks.

| ID | Title | One-Line AC | Depends On |
|---|---|---|---|
| E11-001 | CCDash event integration (full) | All defined CCDash event types from spec §24.3 are emitted and verifiable in the export. | E9-004 |
| E11-002 | Context pack performance feedback | Agent can submit a feedback event tied to a context pack; stored in audit/telemetry JSONL. | E8-001 |
| E11-003 | Staleness and gap recommendations | Endpoint returns assets flagged as stale (by date heuristic) or slots with status `stale`. | E5-006 |
| E12-001 | Full-text search | `GET /api/search?q=` searches asset title, tags, and metadata across the registry. | E1-006 |
| E12-002 | AI-assisted classification suggestions | Ingested assets receive a suggested artifact type based on file name / content heuristics; displayed in inbox. | E3-003 |
| E12-003 | Semantic search | Vector embedding of asset metadata; `GET /api/search?q=&mode=semantic` uses embeddings. | E12-001 |
| E12-004 | Duplicate/variant detection | Ingest step checks for near-duplicate assets by title and content hash; prompts user to link or deduplicate. | E1-003, E12-003 |

---

### Phase 5 — MVP Hardening and Delivery (v1.0)

> Final integration, testing, documentation, and local-first deployment. **COMPLETE** as of 2026-06-20.

| ID | Title | Status | Notes |
|---|---|---|---|
| H5-001 | End-to-end ingest-to-BOM-to-pack test | ✓ Complete | Implemented; 469 tests pass including E2E smoke tests |
| H5-002 | API test coverage | ✓ Complete | 469 tests across models, routes, services, policy, integrations |
| H5-003 | UI smoke test | ✓ Complete | Playwright E2E tests cover core workflows; visual QA via mockups |
| H5-004 | `config/workspace.yaml` policy defaults | ✓ Complete | Workspace config implemented; defaults enforced on startup |
| H5-005 | Docker Compose local deployment | ⏭ Deferred (V1) | `docker-compose.yml` not published in MVP; local-first runs via `uvicorn` + `npm run dev`. Packaging tracked under V1-007 (hosted/Docker mode). |
| H5-006 | User documentation — quick start | ✓ Complete | README.md updated with install/run/test; docs/user-workflows.md covers 8 workflows |
| H5-007 | `docs/DECISIONS.md` final pass | ✓ Complete | D-001 through D-011 documented with rationale, consequences, and integration boundaries |
| DOC-001 | README Setup Update | ✓ Complete | Install, run, test commands for API/web; local-first caveats; project structure |
| DOC-002 | Developer Architecture Guide | ✓ Complete | Architecture.md covers system tiers, data model, repositories, policy, integrations |
| DOC-003 | User Workflow Guide | ✓ Complete | user-workflows.md documents 8 core workflows with CLI/UI examples |
| DOC-004 | ADR And Backlog Closeout | ✓ Complete | DECISIONS.md and mvp-backlog.md updated; Phases 0–5 marked done; Phase 6 deferred |
| REL-001 | Demo Fixture Pack | ✓ Complete | Sample registry fixtures seeded; templates and demo data available |
| REL-002 | Pilot Checklist | ✓ Complete | docs/pilot-checklist.md created; 11-part comprehensive checklist for 25 ChatGPT images |

---

### Phase UI — UI Polish Pass (In Progress)

> Tier 3 feature sprint. ~55 story points across 6 phases. Status: **In Progress** — core pillars (P1–P5) complete; P6 hardening in progress. Gated on `@miethe/ui@0.6.0` publish (publish-from-source prerequisite) and token-bridge integration (ADR-1, D-012).
>
> PRD: `docs/project_plans/prds/features/ui-polish-pass-v1.md`
> Plan: `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md`

| ID | Phase | Title | Status | Notes |
|---|---|---|---|---|
| UI-P1 | Design System Foundation | CSS-var + Tailwind token bridge; @miethe/ui v0.6.0 subpath import wiring | ✓ Complete | ADR-1 (D-012) |
| UI-P2 | Tabbed Modal Pattern | Shared tab registry; tabbed modal (preview) + full-page route; URL-driven `?item=&tab=`; replaces 5 bespoke detail surfaces | ✓ Complete | ADR-2 (D-012) |
| UI-P3 | Preview Cards | Zone-composition card pattern; full-width top thumbnail with real per-format preview | ✓ Complete | ADR-3 (D-012) |
| UI-P4 | Multi-Format Asset Viewer | AssetViewer dispatcher; next/image, react-pdf, @miethe/ui ContentPane, docx-preview; PPTX→PDF server-side seam; untrusted-file security posture | ✓ Complete | ADR-4 (D-012) |
| UI-P5 | Facelift | P0 a11y/correctness fixes; P1 high-impact visual improvements; dark mode deferred | ✓ Complete | ADR-5 (D-012) |
| UI-P6 | Hardening | Upstream/local component split finalized; @miethe/ui gap contributions; integration QA and regression tests | In Progress | ADR-6 (D-012) |

#### UI Polish Pass — Deferred Items

Items descoped during the UI Polish Pass sprint. Each has a design-spec stub for future promotion.

| Item ID | Title | Reason Deferred | Trigger for Promotion | Design Spec |
|---------|-------|-----------------|-----------------------|-------------|
| DEFER-1 | Dark Mode (AA) | AA intentionally light-only; dark mode requires a whole new token axis in `@miethe/ui` | AA product direction change | [dark-mode-aa.md](docs/project_plans/design-specs/dark-mode-aa.md) |
| DEFER-2 | Leg-5 P2 Facelift Items | Filter-bar, view-mode labels, board add-card, and other polish items deferred after P1 landed | Post-P1 polish sprint decision | [facelift-p2-items.md](docs/project_plans/design-specs/facelift-p2-items.md) |
| DEFER-3 | Leg-5 P3 Facelift Items | Facepile, provenance ribbon, Board Group By, and deeper visual work deferred | Product priority decision | [facelift-p3-items.md](docs/project_plans/design-specs/facelift-p3-items.md) |
| DEFER-4 | Asset Viewer Extensions | Preview formats beyond the 6 defined (video, audio, ZIP, etc.) blocked on verified-compatible libraries | New verified-compatible library available | [asset-viewer-extensions.md](docs/project_plans/design-specs/asset-viewer-extensions.md) |

---

## Phase 6 — v1 Expansion (Deferred)

> Spec §21 Phase 5 (enterprise hardening) + v1 growth features. These items are out of scope for MVP.

| ID | Title | Notes |
|---|---|---|
| V1-001 | RBAC / ABAC | Role-based access control for multi-user or team deployments. |
| V1-002 | SSO / OIDC | External identity provider integration. |
| V1-003 | Postgres + pgvector backend | Production-grade storage replacing JSONL/SQLite. |
| V1-004 | External connectors (GitHub, Figma, Drive) | OAuth-based live connector workers, not manual link import. |
| V1-005 | Browser extension | Capture assets from browser directly. |
| V1-006 | Multi-workspace administration | Manage multiple workspaces from a single control plane. |
| V1-007 | Hosted deployment (homelab/server mode) | Docker Compose with Postgres, MinIO, Redis worker queue. |
| V1-008 | Audit reporting dashboard | Governance dashboard with policy denial trends and access heatmaps. |
| V1-009 | Approval workflows | Human approval required for canonical promotion in team context. |
| V1-010 | Advanced context pack analytics | CCDash-backed pack performance metrics and agent output quality feedback loop. |
| V1-011 | Asset content upload & storage pipeline | **✅ SHIPPED 2026-06-24** (`feat/v1-011-content-upload`). Content-addressed managed store under `workspace_root` (`assets/content/<hash[:2]>/<hash>`, gitignored) + `ImportService.import_content`/`attach_content` (streamed hashing, dedup-by-hash, atomic commit). Parity delivered across all four surfaces: HTTP (`POST /api/projects/{id}/inbox/upload` multipart, `PUT /api/assets/{id}/content`), CLI (`atlas import --store`, `atlas attach <id> <path>`), MCP (`content.upload` — write-gated: denies sensitive content, lands assets as `metadata_only`/inbox suggestion-only), and Web (Inbox picker + drag-drop send real bytes). Proxy unchanged — it already prefers `storage_uri` and confines to `workspace_root`, so blobs serve through the existing LFI/SSRF guard. See D-013. — **Original spec:** **Enhancement (DI).** Today the content proxy (`GET /api/preview/asset/{id}/content`) can only serve files that already exist under the API container's `workspace_root`; browser-picked files are registered metadata-only (no bytes), so their preview legitimately 404s. Enhance ingestion so asset *content* can be uploaded into a managed store under `workspace_root` (or object storage) **seamlessly from anywhere** with parity across surfaces: CLI (`atlas` import), HTTP API (multipart/streamed upload endpoint), MCP tool (if a write-capable content tool is in scope per agent policy), and the Web app (Inbox file picker / drag-drop sending bytes, not just a basename). Must respect the metadata-vs-blob boundary (Atlas indexes; opt-in content storage), sensitivity/agent-access gating, dedup-by-hash (already in `ImportService`), and the LFI/SSRF guards (already in the proxy). Originates from the inbox-import / preview fix (commit `44a4829`). |
