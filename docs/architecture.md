# Architecture

## System Shape

Artifact Atlas is a **local-first, repository-backed MVP** with three tiers: web UI, REST/MCP API, and JSONL registry.

```
┌─────────────────────────────────────┐
│    Next.js 15 Web UI (localhost:3000)
│    - Command Center (project home)
│    - Asset Gallery (grid/list view)
│    - Inbox Triage (classification)
│    - Artifact BOM (slot assignment)
│    - Coverage & Gaps (status view)
│    - Template Library (template browse/apply)
│    - Context Pack Builder (pack composition)
└─────────────────────────────────────┘
           ↓ TanStack Query ↓
┌─────────────────────────────────────┐
│  Shared OpenAPI Contract (shared/openapi.yaml)
│  - All API endpoints, schemas, enums live here
│  - Pydantic v2 models generate this contract
└─────────────────────────────────────┘
           ↓ HTTP ↓
┌─────────────────────────────────────┐
│    FastAPI Service (localhost:8000)
├────────────────────────────────────┤
│ API Routes (app/api/)
│  - /health
│  - /projects/* (CRUD, search)
│  - /assets/* (import, list, get, classify, classify-inbox)
│  - /bom/* (apply template, get slots, assign, coverage)
│  - /templates/* (list, get, create)
│  - /context-packs/* (list, create, export, preview)
│  - /audit (list events, query by type)
│  - /search (full-text, filters)
│  - /policy/* (sensitivity, access checks)
├────────────────────────────────────┤
│ MCP Server (app/mcp/)
│  - atlas_list_assets
│  - atlas_get_asset
│  - atlas_get_bom
│  - atlas_get_context_pack
│  (all read-only, policy-aware)
├────────────────────────────────────┤
│ CLI (app/cli/)
│  - atlas import
│  - atlas bom status
│  - atlas asset promote
│  - atlas context-pack export
├────────────────────────────────────┤
│ Services (app/services/)
│  - ProjectService: CRUD, search
│  - AssetService: import, classify, status transition
│  - BomService: template apply, slot management
│  - CoverageService: coverage calculation, gap detection
│  - ContextPackService: composition, export
│  - PolicyService: policy check, access gate
│  - EventService: audit logging
│  - ExportService: JSONL/YAML/Markdown export
├────────────────────────────────────┤
│ Repositories (app/repositories/)
│  - ProjectRepository: projects.jsonl
│  - AssetRepository: assets.jsonl
│  - BomRepository: bom.jsonl
│  - TemplateRepository: templates.jsonl
│  - ContextPackRepository: context-packs.jsonl
│  - EventRepository: events.jsonl
│  (all validate, enforce transitions, atomic writes)
└─────────────────────────────────────┘
           ↓ (file I/O, atomic swaps) ↓
┌─────────────────────────────────────┐
│    registry/ (JSONL, local-first)
│    - projects.jsonl
│    - assets.jsonl
│    - bom.jsonl
│    - templates.jsonl
│    - context-packs.jsonl
│    - events.jsonl (append-only audit log)
└─────────────────────────────────────┘
           ↓ ↓ ↓
    ┌──────────────────┐
    │ assets/          │
    │  thumbnails/     │ (generated on ingest)
    │  previews/       │
    └──────────────────┘
    
    ┌──────────────────┐
    │ exports/         │
    │  context-packs/  │ (YAML manifests)
    │  reports/        │ (markdown, logs)
    │  events/         │ (CCDash sync)
    └──────────────────┘
```

## Data Model

All entities are defined in `app/models/` using **Pydantic v2**:

- `Project`: Container for assets and BOM. Fields: `id`, `name`, `description`, `created_at`, `updated_at`, `metadata`.
- `Asset`: Captured or imported file/link. Fields: `id`, `project_id`, `title`, `artifact_type_id`, `status` (enum), `sensitivity` (enum), `source_kind`, `source_uri`, `thumbnail_uri`, `preview_text`, `tags`, `metadata`, `created_at`, `updated_at`.
- `BOM`: Bill of Materials for a project. Fields: `id`, `project_id`, `template_id`, `domains` (list of BomDomain), `coverage_score`, `created_at`, `updated_at`.
- `BomSlot`: A requirement within a domain. Fields: `id`, `bom_id`, `domain`, `artifact_type_id`, `required`, `min_assets`, `staleness_days`, `status` (computed).
- `SlotAssignment`: Binds an asset to a slot. Fields: `id`, `slot_id`, `asset_id`, `assignment_status` (enum), `created_at`, `updated_at`.
- `Template`: Reusable BOM blueprint. Fields: `id`, `name`, `version`, `status` (enum), `domains`, `created_at`.
- `ContextPack`: Curated asset collection with policy. Fields: `id`, `project_id`, `name`, `asset_ids`, `policy_mode` (enum), `token_estimate`, `created_at`, `updated_at`.
- `AtlasEvent`: Audit log record (append-only). Fields: `id`, `event_type`, `resource_type`, `resource_id`, `actor`, `details`, `timestamp`.

**Canonical vocabularies** are frozen in `app/models/vocabulary.py`:
- `AssetStatus`: inbox, raw, candidate, in_review, in_progress, selected, canonical, archived
- `BomSlotStatus`: missing, partial, in_progress, complete, stale, blocked, not_applicable
- `Sensitivity`: public, personal, work_sensitive, client_sensitive, restricted
- `AgentAccess`: none, metadata_only, preview_allowed, read_allowed, context_pack_allowed
- `AssignmentStatus`: suggested, accepted, rejected, canonical
- `TemplateStatus`: core, recommended, optional, experimental, deprecated

## Repository Layer

All data access goes through **repository classes** in `app/repositories/`. This enforces:
- Validation before write
- Atomic file operations (temp-file swap to `registry/*.jsonl`)
- Status transition guards (e.g., asset can only move `inbox -> raw -> candidate -> ...`)
- Query methods (filter, search) without exposing direct file access

**Protocol**: `RepositoryProtocol` defines the interface. Each repository (`AssetRepository`, `BomRepository`, etc.) implements CRUD + specialized queries. **Backing store is swappable**: JSONL for MVP; SQLAlchemy for SQLite promotion (Phase 6).

## Policy & Access Control

**Personal-mode trusted loopback** (D-009):
- API binds to `127.0.0.1:8000` by default
- No user authentication; all loopback requests are the owner
- Assets default to `sensitivity: personal`, `agent_access: metadata_only`
- Sensitive content (work_sensitive, client_sensitive, restricted) never returns full content to agents

**Canonical promotion gate**: Status `canonical` requires explicit human approval. Service checks `require_human_approval_for: canonical_promotion` (always true in MVP).

**Audit log** (append-only `events.jsonl`): Every asset change, sensitivity change, agent query, and policy denial is logged with timestamp, actor, and details.

## Integration Boundaries

(See `docs/DECISIONS.md` section D-010 for full contracts. Summary below.)

All MVP integrations are **file/export/ref-based only**. No live API calls or OAuth tokens.

| System | MVP Read | MVP Write | Export Format | Future |
|---|---|---|---|---|
| **MeatyWiki** | Read vault markdown files | Write asset cards as YAML+Markdown | YAML frontmatter | Live API (Phase 2+) |
| **IntentTree** | Read node exports (YAML/JSON) | Write node-link manifests | YAML list | Live API (Phase 3+) |
| **SkillMeat/SAM** | Read bundle reference files | Write candidate packs | YAML frontmatter | Live API (Phase 4+) |
| **CCDash** | (read not in MVP) | Write event JSONL to export | JSON-per-line | Live event push (Phase 4+) |
| **Control Plane** | (read not in MVP) | Write project snapshot YAML | YAML manifest | Live signal push (Phase 3+) |
| **Local folders** | Watch for new files | (never destructive; ref only) | Original URI + copy thumbnail/preview | Bidirectional sync (Phase 2+) |

## Testing & Validation

**469 tests** (as of Phase 4 completion):
- Unit tests for models, services, repositories
- Integration tests for API routes (happy path and error cases)
- Policy regression tests (denied access, sensitive publish gate, canonical promotion gate)
- OpenAPI parity tests (endpoints and schemas match `shared/openapi.yaml`)
- E2E smoke tests (web app loads, import → classify → assign → export workflow)
- Registry format validation tests

## Ownership Boundaries

| Data | System of Record | Access Pattern |
|---|---|---|
| Asset metadata | Artifact Atlas | JSONL repo → API → UI/MCP |
| Original files | Source system or local folder | Referenced by `source_uri`; not copied to registry |
| Project rationale & decisions | MeatyWiki | Read from vault; write-back as Markdown cards |
| Task hierarchy & node definitions | IntentTree | Read from export; link via node_id |
| Reusable templates | Artifact Atlas (MVP) + SkillMeat (Phase 4+) | Applied via API; exported as reference |
| Execution telemetry | CCDash | Event export JSONL; no read in MVP |
| Routing decisions | Agentic Control Plane | Snapshot export YAML; no read in MVP |

## Deployment & Local-First Guarantees

**No external dependencies** for core MVP workflows:
- No cloud storage (uploads are local file references)
- No remote database (JSONL is local and portable)
- No external APIs for core ops (imports, classification, packing are local)
- No authentication service (loopback trust)

**Atomicity**: All JSONL writes use temp-file swap; no partial/corrupt state.

**Portability**: `registry/*.jsonl` is human-readable and can be diffed, versioned, or migrated to SQLite independently.

**Future scalability** (Phase 6+): SQLite migration replaces JSONL repositories without changing API, UI, or service logic.
