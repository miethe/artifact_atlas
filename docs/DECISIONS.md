# Artifact Atlas Decisions

- D-001: Initialize as a T4 Agentic OS project with Operator run record `op_run_20260619_184310_artifact-atlas-project-a`.
- D-002: Use a local-first MVP architecture: readable JSONL/YAML registry exports first, database-backed services later.
- D-003: Use Next.js + React + TypeScript for the web app scaffold.
- D-004: Use FastAPI + Pydantic for API and MCP/CLI-adjacent service scaffolding.
- D-005: Keep agent retrieval policy-aware. Sensitive asset content is not broadly accessible by default.
- D-006: Deploy the `skillmeat-instance-starter` scaffold bundle (v1.0.0, source v0.55.1; 237 artifacts / 650 files — 40 skills, 64 commands, 60 agents, 16 specs, 13 context, 10 hooks, 5 rules, 5 templates) into `.claude/` to complete the T4 planning + execution methodology stack that was blocked during the original `op` scaffold. Built deterministically via `skillmeat/scripts/build-starter-bundle.py --tier all` (local API/collection path was unavailable). Project `CLAUDE.md` preserved; the bundle's generic methodology template stashed at `.claude/docs/CLAUDE.starter-template.md`. Bundle provenance under `.claude/bundles/skillmeat-instance-starter/`.

---

## D-007 — Persistence Strategy: JSONL Repository-First MVP with SQLite-Ready Models

**Status**: Accepted  
**Date**: 2026-06-20  
**Phase**: P0-002  
**Deciders**: lead-architect, backend-architect

### Context

Artifact Atlas must store asset metadata, BOM state, context-pack manifests, relationships, and audit events. The system must remain portable (readable JSONL/YAML exports), operable without a running database server for local-first workflows, and promotable to SQLite or Postgres without rewriting the API or UI layers.

Three options were considered:

1. Ad hoc file writes from service layer directly to `registry/*.jsonl` — simple but bypasses validation and makes future schema migration impossible.
2. SQLite-primary from day one — requires a migration plan for existing seed data and blocks local-only file export workflows.
3. JSONL repository-first with repository interfaces and Pydantic v2 models designed SQLite-ready — chosen.

### Decision

Use **Option 3: JSONL repository-first MVP** with the following invariants:

**Repository pattern**

- All reads and writes to `registry/*.jsonl` files go through repository classes (`AssetRepository`, `ProjectRepository`, `BomRepository`, `ContextPackRepository`, `EventRepository`). Services and API routes never touch JSONL files directly.
- Repository methods own validation, ID generation, and optimistic conflict detection.
- Each repository implements a `RepositoryProtocol` interface so the backing store can be swapped without touching callers.

**Pydantic v2 models**

- All entities defined in `app/models/` are Pydantic v2 `BaseModel` subclasses with explicit field types, validators, and `model_config`.
- Field names, types, and enum values in models match `shared/openapi.yaml` schemas exactly; no silent aliasing.
- Enum types (`AssetStatus`, `BomSlotStatus`, `Sensitivity`, `AgentAccess`, `AssignmentStatus`, `TemplateStatus`) live in `app/models/vocabulary.py` and are imported by all models and API schemas.

**JSONL file format**

- Each `registry/*.jsonl` file holds one JSON object per line representing one entity instance.
- Files are human-readable, diffable, and exportable as-is. No binary blobs embedded; large content stored as `storage_uri` references.
- JSONL files are the authoritative state store for MVP. In-process indexes (dicts, sorted lists) are derived from JSONL at startup and invalidated on write.

**SQLite migration path**

When promoted to SQLite:

1. Define SQLAlchemy 2.x mapped classes from existing Pydantic models (1-to-1 field mapping already guaranteed).
2. Replace JSONL `RepositoryProtocol` implementations with SQLAlchemy session-backed implementations.
3. Seed SQLite from JSONL export via `atlas db migrate --from jsonl --to sqlite`.
4. `registry/*.jsonl` transitions to read-only export/backup role; the SQLite file becomes authoritative.
5. No API route, service, or UI code changes required.

**Non-goals for MVP**

- No ORM in MVP — SQLAlchemy is deferred to the SQLite promotion phase.
- No Postgres or pgvector in MVP — deferred to Phase 4+ (semantic search, multi-user, hosted).
- No streaming or partial-write JSONL — files are always rewritten atomically via a temp-file swap.
- No inter-process locking beyond file-level atomic writes — MVP is single-process local.
- No in-process query language — repositories expose explicit query methods, not a filter DSL.

### Consequences

- `registry/*.jsonl` files remain human-readable and portable throughout MVP.
- Repository interfaces enforce consistent validation and enable testing with in-memory fakes.
- Pydantic v2 models are the single source of validation truth; they generate JSON Schema used in `shared/openapi.yaml`.
- SQLite promotion requires only new repository implementations plus one migration script, not a rewrite.
- Agents and CLI tools interact only through the FastAPI/MCP surface, never by reading JSONL directly.

---

## D-008 — Canonical Vocabulary: Single Source of Truth for Status and Sensitivity Enums

**Status**: Accepted  
**Date**: 2026-06-20  
**Phase**: P0-003  
**Deciders**: lead-architect, backend-architect

### Context

The source spec and mockup fixtures use several vocabulary terms inconsistently (e.g., `AOS` vs `AGS`, capitalization variants, conflicting counts). API consumers, UI tokens, agent policy rules, and JSONL storage all need stable, unambiguous string values that will not change between phases.

### Decision

The following enum vocabularies are **frozen as of this decision** and constitute the canonical single source of truth. API wire values, JSONL storage values, MCP tool schemas, and Pydantic enum literals must use these exact strings. UI display labels may differ (e.g., "In Review" for `in_review`) but must map 1-to-1 at the API boundary.

**Canonical source**: `app/models/vocabulary.py` (Python enums). This file is the authoritative definition; `shared/openapi.yaml` schemas are generated from or manually kept in sync with it.

#### Asset status (`AssetStatus`)

| Value | Meaning |
|---|---|
| `inbox` | Newly captured, not yet triaged |
| `raw` | Imported, metadata extracted, not classified |
| `candidate` | Classified and suggested for a slot |
| `in_review` | Under human or agent review |
| `in_progress` | Work in progress, assigned to a slot |
| `selected` | Approved for use, not yet canonical |
| `canonical` | Human-promoted authoritative version |
| `archived` | Soft-deleted or superseded |

Allowed transitions (enforced by `AssetRepository`):

```
inbox -> raw -> candidate -> in_review -> in_progress -> selected -> canonical
any -> archived  (requires audit event)
canonical -> archived  (requires human approval gate)
```

#### BOM slot status (`BomSlotStatus`)

| Value | Meaning |
|---|---|
| `missing` | Required slot has no assigned assets |
| `partial` | Has assets but below minimum or only suggestions |
| `in_progress` | At least one assigned asset in active work state |
| `complete` | Meets minimum asset count, status, and staleness requirements |
| `stale` | Previously complete but staleness threshold exceeded |
| `blocked` | Dependency blocker prevents completion |
| `not_applicable` | Slot explicitly marked N/A for this project |

Slot status is computed by `coverage_service.py`, not stored directly (derived from assignments).

#### Sensitivity (`Sensitivity`)

| Value | Agent access default | Meaning |
|---|---|---|
| `public` | `preview_allowed` | Safe to share externally |
| `personal` | `preview_allowed` | Personal, low-risk material |
| `work_sensitive` | `metadata_only` | Work-related sensitive content |
| `client_sensitive` | `metadata_only` | Client or customer material |
| `restricted` | `none` | Highly sensitive; no agent access |

#### Agent access (`AgentAccess`)

| Value | Capability granted |
|---|---|
| `none` | No agent access at all; metadata queries return 403 |
| `metadata_only` | Title, type, status, sensitivity, links only; no content |
| `preview_allowed` | Thumbnail and preview text additionally allowed |
| `read_allowed` | Full content allowed for trusted local agents |
| `context_pack_allowed` | May be included in context packs (subject to pack policy) |

Access levels are ordered; a higher level implies all lower capabilities.

#### Assignment status (`AssignmentStatus`)

| Value | Meaning |
|---|---|
| `suggested` | Proposed by agent or heuristic; not yet accepted |
| `accepted` | Human or trusted agent accepted the assignment |
| `rejected` | Explicitly rejected; asset not suitable for this slot |
| `canonical` | Promoted as the canonical fill for this slot |

#### Template status (`TemplateStatus`)

| Value | Meaning |
|---|---|
| `core` | Bundled standard template; always available |
| `recommended` | Promoted community or project template |
| `optional` | Available but not default |
| `experimental` | Under active development; schema may change |
| `deprecated` | Still loadable but being phased out |

### UI label mapping convention

UI layers must map API enum values to display labels at the presentation boundary and must not store display labels in JSONL or API payloads. Example mapping table lives in `web/src/lib/vocabulary.ts`.

### Consequences

- `app/models/vocabulary.py` is the single import point for all enum definitions.
- API routes and MCP tools that accept or return status/sensitivity/access values validate against these enums.
- Seed data in `registry/*.jsonl` uses these exact string values only.
- Mockup fixture inconsistencies (`AOS`/`AGS`, casing variants) are not propagated into seed data.
- Status transitions are auditable because the transition guard lives in repository methods.
- UI token system maps enum values to color tokens and display strings without inventing new vocabulary.

---

## D-009 — Policy Baseline: Personal-Mode Auth, Default Sensitivity, and Audit Requirements

**Status**: Accepted  
**Date**: 2026-06-20  
**Phase**: P0-004  
**Deciders**: backend-architect

### Context

Artifact Atlas runs locally for a single authenticated user in MVP. The system handles personal assets, work-sensitive materials, and client-sensitive content. Agents (MCP, CLI) must not gain broad filesystem or content access. Human-in-the-loop gates must be explicit and auditable.

### Decision

#### Authentication: Personal-mode trusted loopback

MVP authentication is **trusted loopback-only**. The API server binds to `127.0.0.1` by default and treats all requests from loopback as the workspace owner. There is no credential issuance, session management, or token validation in MVP.

**Explicit local-only warning**: Any network binding change (e.g., `--bind 0.0.0.0`) must emit a startup warning: "Artifact Atlas is running in personal mode with no authentication. Do not expose this port to untrusted networks." This warning is logged at `WARNING` level and printed to stderr.

Enterprise RBAC/SSO is deferred to Phase 5. No multi-user support in MVP.

#### Default sensitivity and access

- Default sensitivity for newly imported assets: `personal` (configurable per workspace, never lower than `personal` for auto-classified assets in MVP).
- Default agent access for new assets: `metadata_only`.
- Agent access may be elevated per-asset by a human action only; auto-elevation is not permitted in MVP.

#### Full-content access rules

An agent may receive full asset content only when **all** of the following are true:

1. The asset's `agent_access` field is `read_allowed` or `context_pack_allowed`.
2. The asset's `sensitivity` is `public` or `personal`.
3. The requesting agent identity is in the workspace's `trusted_agents` list.
4. The request is logged as an `agent_query` audit event before the content is returned.

Assets with `sensitivity` of `work_sensitive`, `client_sensitive`, or `restricted` may never have full content returned to agents in MVP, regardless of `agent_access` setting. These assets are capped at `preview_allowed` for agents in MVP.

#### Canonical promotion human gate

Canonical promotion (`status: canonical`) requires explicit human approval in all cases in MVP. The promotion flow:

1. Asset or slot assignment reaches `selected` or `accepted` status.
2. A promotion request is created (stored as a pending `PromotionRequest` record).
3. The system emits an audit event and surfaces a UI notification.
4. The human approves or rejects via the UI or CLI (`atlas asset promote <id> --approve`).
5. On approval, status transitions to `canonical` and a `asset_promoted` event is emitted.
6. Automated promotion is not permitted in MVP; `require_human_approval_for: canonical_promotion` is always `true`.

#### Audit requirements

The following operations must emit an `atlas_event` record before the operation completes (pre-write audit), and must emit a confirmation or failure event after:

| Operation | Event type | Retention |
|---|---|---|
| Asset add/import | `asset_added` | 365 days |
| Asset delete/archive | `asset_archived` (+ reason) | 365 days |
| Sensitivity change | `sensitivity_changed` | 365 days |
| Agent access request (any level) | `agent_query` or `policy_denied` | 90 days |
| Context pack publish with sensitive assets | `context_pack_published` | 365 days |
| BOM template apply | `bom_template_applied` | 180 days |
| Canonical promotion (request + outcome) | `asset_promoted` | 365 days |
| External sync | `sync_completed` | 90 days |
| Policy denial (any denied request) | `policy_denied` | 365 days |
| Destructive changes (delete, bulk archive) | `destructive_change` | 365 days |

Audit events are appended to `registry/events.jsonl` with the same atomic write guarantee as other JSONL files. Audit events are never deleted in MVP; archiving is out of scope.

#### Policy denial behavior

When a policy check fails:

1. The response returns HTTP 403 with a structured error body: `{"error": "policy_denied", "reason": "<human-readable>", "asset_id": "...", "requested_access": "..."}`.
2. A `policy_denied` event is written to the audit log before the 403 is returned.
3. No partial content is returned on denial.

### Consequences

- The system is safe for personal use on a local machine from day one.
- Binding to non-loopback addresses requires deliberate operator action and produces an unmissable warning.
- Policy denials are always auditable, enabling future compliance reporting.
- Canonical promotion is human-gated in all MVP paths; no agent can silently elevate an asset.
- The audit log in `registry/events.jsonl` is the source of truth for compliance and debugging.
- Phase 5 enterprise hardening can replace the loopback trust model with OIDC/RBAC without changing audit event structure.

---

## D-010 — Integration Boundaries: File/Export/Ref-Based MVP Seams

**Status**: Accepted  
**Date**: 2026-06-20  
**Phase**: P0-006  
**Deciders**: lead-architect, documentation-complex

### Context

Artifact Atlas must integrate with MeatyWiki, IntentTree, SkillMeat/SAM, CCDash, and the Agentic Control Plane. Each of these systems has its own canonical data and API surface. In MVP, live bidirectional connectors with OAuth or remote API calls would introduce unstable dependencies and scope creep. The principle of system sovereignty (each system remains the canonical store for its own domain) must be preserved.

### Decision

All MVP integrations are **file/export/ref-based only**. No OAuth tokens, no remote API calls, no live webhook subscriptions in MVP.

**Integration seam contract**: Each integration is defined by (a) what Artifact Atlas reads from the other system, (b) what Artifact Atlas writes to the other system, (c) the file/export format, and (d) the deferred live-API path.

#### MeatyWiki

- **MVP read**: Artifact Atlas reads MeatyWiki markdown files from a configured vault path (`integrations.meatywiki.vault_path`). It extracts page title, frontmatter `page_id`, and text for project page references and context-pack item resolution.
- **MVP write**: Artifact Atlas writes asset cards as YAML-frontmatter markdown files to a configured output folder (`integrations.meatywiki.export_path`). Context pack exports are written as markdown files with YAML manifest header. Decision record writebacks (on template apply, asset promotion, context-pack publish) are appended as markdown sections.
- **Export shape**: Each asset card follows the format in spec §16.1 — YAML frontmatter with `type: artifact_asset`, followed by a markdown body. Context pack exports include a YAML manifest block followed by a rendered item list.
- **Deferred**: Live MeatyWiki API (`http://127.0.0.1:8765`) with bidirectional sync, native plugin, and push notifications. Deferred to Phase 2+ pending MeatyWiki API stability.

#### IntentTree

- **MVP read**: Artifact Atlas reads IntentTree node references from a YAML/JSON export file at `integrations.intenttree.export_path` (produced by `itt export`). It extracts `node_id`, `title`, `status`, `expected_artifacts`, and `required_context` fields.
- **MVP write**: Artifact Atlas writes node link manifests — YAML files listing asset-to-node relationships — to `integrations.intenttree.link_export_path`. These are consumed by IntentTree's import tooling when available.
- **Export shape**: Node reference file is a YAML list of objects with `node_id`, `title`, `parent_id`, `expected_artifacts: [artifact_type_id]`, and `bom_slots: [slot_id]`. Link manifest is a YAML list of `{asset_id, node_id, relationship, confidence}` records.
- **Deferred**: Live IntentTree API integration, task creation from BOM gaps, and subtree context-pack generation via API. Deferred to Phase 3+.

#### SkillMeat / SAM

- **MVP read**: Artifact Atlas reads template references from a SkillMeat bundle export directory (`integrations.skillmeat.bundle_path`, defaults to `.claude/bundles/`). It extracts template slugs, context-pack candidate metadata, and SkillBOM reference IDs from YAML frontmatter.
- **MVP write**: Artifact Atlas writes context-pack candidate manifests to `integrations.skillmeat.candidates_export_path`. Golden Context Pack candidates are written as YAML files with `type: golden_context_pack_candidate` frontmatter, referencing asset IDs and pack IDs (no embedded content).
- **Export shape**: Candidate manifest is a YAML file with `id`, `title`, `source_pack_id`, `asset_ids`, `coverage_score`, `created_at`, and `rationale`. Template references use the SkillMeat `slug`/`version` identifiers.
- **Deferred**: Live SkillMeat API (`skillmeat-cli` remote mode), automatic bundle promotion, and SkillBOM gap analysis via API. Deferred to Phase 4+.

#### CCDash

- **MVP write only**: Artifact Atlas appends local event records to an export JSONL file at `integrations.ccdash.events_export_path`. CCDash can ingest this file on a schedule or via `atlas sync ccdash`.
- **Event shape**: Each line is a JSON object matching the `atlas_event` schema (spec §13.4) with an additional `ccdash_schema_version: "v1"` field. Required events: `asset_added`, `asset_classified`, `asset_promoted`, `bom_slot_filled`, `context_pack_created`, `context_pack_published`, `agent_query`, `policy_denied`.
- **No MVP read**: Artifact Atlas does not read CCDash data in MVP; telemetry is one-directional.
- **Deferred**: Live CCDash event push API, context-pack success score feedback, and usage metric pull. Deferred to Phase 4+.

#### Agentic Control Plane

- **MVP write only**: Artifact Atlas generates project snapshot YAML files at `integrations.control_plane.snapshot_export_path` on demand (`atlas sync control-plane` or via MCP `project.snapshot` tool). Snapshots include BOM coverage scores, critical gaps, available context packs, and canonical asset IDs — matching the routing input format in spec §16.6.
- **Snapshot shape**: YAML file with `artifact_context_signal` root key, `project_id`, `active_node_id`, `bom_coverage` map, `critical_gaps` list, `available_context_packs` list, and `canonical_assets` list.
- **No MVP read**: Control Plane routing decisions are not consumed by Artifact Atlas in MVP.
- **Deferred**: Live Control Plane API signal push, routing feedback, and next-best-action pull. Deferred to Phase 3+.

#### Local folders

- **MVP read/write**: Artifact Atlas watches local folder paths configured in `integrations.local_folders.watched_paths`. The file watcher (`workers/sync_external_source.py`) triggers asset import on new files. No files are moved or deleted by the watcher; it is read-only against the source folders.
- **Export shape**: Imported assets reference the original path as `original_uri` and store copies (thumbnails, previews) in `assets/thumbnails/` and `assets/previews/`. Full content is never copied; URI references are stored.
- **Deferred**: Move detection, bidirectional sync, cloud folder adapters (Drive, OneDrive). Deferred to Phase 2+.

### Non-goals

- No OAuth flows, API tokens, or remote authentication in MVP for any integration.
- Artifact Atlas does not replace MeatyWiki as rationale store, IntentTree as task hierarchy, SkillMeat as skill library, or CCDash as telemetry platform.
- Integration export files are advisory outputs; upstream systems remain the canonical record for their own domains.

### Consequences

- All integrations are safe to implement, test, and fail without network dependencies.
- Integration seams are stable contracts; live API connectors can be added later without changing the export format.
- `config/integrations.yaml` encodes the file paths and status for each integration seam.
- CI can validate export format compliance without running any external services.

---

## D-011 — MVP Documentation & Release Hardening Strategy

**Status**: Accepted  
**Date**: 2026-06-20  
**Phase**: Phase 5 (Release Hardening)  
**Deciders**: documentation-writer, lead-architect

### Context

MVP is feature-complete (Phases 0–4). Phase 5 hardens the system for pilot deployment with 25 real ChatGPT image outputs. Clear user-facing documentation and a structured pilot checklist are prerequisites for successful local-first validation.

### Decision

**User-facing documentation** is published in `docs/`:

| File | Purpose |
|---|---|
| `README.md` | Setup, installation, quick-start, local-first caveats |
| `docs/architecture.md` | Implemented system architecture, data model, layers (API, repositories, JSONL) |
| `docs/user-workflows.md` | 8 core workflows: import, classify, apply template, assign slot, view coverage, build pack, promote canonical, export |
| `docs/agent-handoff.md` | CLI commands, MCP tools, policy gates, integration patterns, troubleshooting |
| `docs/DECISIONS.md` | Architecture decisions D-001 through D-011 with rationale and consequences |
| `docs/mvp-backlog.md` | Epic list and phase schedule; Phases 0–5 marked complete; Phase 6 (deferred) listed |
| `docs/pilot-checklist.md` | 11-part checklist for pilot with ~25 ChatGPT images: import, classify, apply template, assign, coverage, pack, policy, UI, export, docs, feedback |

**Release acceptance criteria**:
- README and quick-start guide are clear and tested (first-run experience)
- Architecture docs accurately reflect implemented code (repositories, services, API routes)
- User workflows cover all MVP features with screenshots/examples
- Agent handoff documents CLI/MCP with policy enforcement rules
- Pilot checklist is executable and comprehensive
- All documentation is up-to-date with Phases 0–5 work

**Approach**:
- Documentation is written from the implemented code, not idealized or aspirational
- Code examples are tested (run tests before documenting)
- Vocabulary is consistent with canonical enums in `app/models/vocabulary.py`
- Links between docs are maintained (README → architecture → decisions → agent-handoff)

### Consequences

- New users can install and run Artifact Atlas with README alone
- Agents understand policy gates and query patterns from `docs/agent-handoff.md`
- Developers can contribute to Phases 6+ without re-learning architecture
- Pilot operator has a structured checklist to validate MVP functionality
- Phase 6 planning can reference completed Phase 5 decisions as foundation

---

## D-012 — UI Polish Pass: Design System Bridge, Detail Pattern, Preview Cards, Asset Viewer, and Facelift Strategy

**Status**: Accepted (planning; SPIKE verdict CONDITIONAL GO, gated on @miethe/ui@0.6.0 + token-bridge)
**Date**: 2026-06-21
**Phase**: UI Polish Pass
**Deciders**: lead-architect, frontend-architect

### Context

A SPIKE evaluated six architectural questions for the UI Polish Pass feature. Each question was adversarially reviewed before acceptance. The six resulting ADRs are recorded below.

### ADR-1 — Design System: CSS-Var + Tailwind Token Bridge for @miethe/ui

#### Context
Artifact Atlas uses a local Tailwind config whose token namespacing conflicts with `@miethe/ui`'s CSS custom property conventions. A clean adoption (no bridge) was adversarially evaluated and refuted — the bridge is load-bearing to reconcile the two namespacing schemes without forking either side. `@miethe/ui@0.6.0` had not yet been published and requires a publish-from-source prerequisite task before P1 can start.

#### Decision
Adopt `@miethe/ui` via a **shadcn-compatible CSS-var + Tailwind token bridge** with subpath imports only (e.g., `@miethe/ui/button`). Pin to v0.6.0. The bridge file lives in `web/src/styles/`; no upstream source is forked. The P1 ContentPane smoke screen is the hard gate — if the bridge fails, no downstream phase starts.

#### Consequences
Token bridge is a one-time integration cost; subsequent @miethe/ui upgrades follow semver. AA does not fork or vendor @miethe/ui source. The hard gate at P1 ensures downstream phases only proceed on a validated bridge.

---

### ADR-2 — Canonical Detail Pattern: Tabbed Modal + Full-Page Route with Shared Tab Registry

#### Context
Five bespoke detail surfaces (asset library, BOM slot, coverage, template, inbox) each implemented their own layout, keyboard handling, and URL behavior inconsistently. Deep-linking was absent or broken; a11y focus management varied per surface, creating a fragmented maintenance burden. (Context-packs intentionally retains its RightDrawer and is out of scope for this migration.)

#### Decision
Replace all five surfaces with one **`EntityModal` shell + full-page route pair sharing a single tab registry**, with state driven by URL query params (`?item=&tab=`). The tab registry is the sole registration point for adding tabs across all entity types.

#### Consequences
Five migration targets (P2b) converge on one pattern, reducing future maintenance to a single codebase path. Deep-linking, keyboard-close, and focus management are correct for all surfaces simultaneously. Adding a new entity type requires registering one tab set, not building a bespoke surface.

---

### ADR-3 — Preview Card Pattern: Zone-Composition Card with Full-Width Top Thumbnail

#### Context
Existing card components used generic placeholder icons and offered no per-format asset identification at a glance. The card structure was monolithic, making it difficult to compose card variants or reuse preview logic across contexts.

#### Decision
Adopt a **zone-composition card** with a full-width top thumbnail that renders a real per-format preview (re-using P4a viewer renderers for thumbnail generation). Card zones (thumbnail, header, metadata, actions) are composed from discrete slot components rather than a single template.

#### Consequences
Cards share renderer logic with the AssetViewer (no duplication). Per-format thumbnails improve at-a-glance identification. Zone composition makes card variants (compact, expanded, drag-handle) straightforward to assemble from existing slot components.

---

### ADR-4 — Asset Viewer: Dispatcher + Per-Format Libs; PPTX Server-Side Seam

#### Context
No unified asset preview component existed. Library evaluation confirmed no React 19-compatible PPTX renderer is available at the time of the SPIKE. DOCX requires `docx-preview`; PDF requires `react-pdf`. Untrusted uploaded files require a centralised security posture preventing XSS and SSRF across all formats.

#### Decision
An `AssetViewer` dispatcher routes by MIME type to per-format rendering libraries:

| Format | Library |
|---|---|
| Images | `next/image` |
| PDF | `react-pdf` |
| Rich content | `@miethe/ui ContentPane` |
| DOCX | `docx-preview` |
| PPTX | Server-side PPTX→PDF conversion seam (no React 19–compatible PPTX renderer exists) |

Only Markdown and code formats are editable; all binary formats are read-only. Untrusted-file security posture is enforced centrally in the dispatcher (`sanitize=true`, `fetchRelated:false`, SVG via `<img>`).

#### Consequences
PPTX requires a backend conversion seam (P4c); client-side PPTX preview is blocked until a React 19-compatible renderer ships. Dispatcher pattern allows new format renderers to be added by registering a MIME entry without touching existing renderers. Security posture is centrally enforced rather than duplicated per-renderer.

---

### ADR-5 — Facelift Scope: P0 A11y/Correctness First, P1 High-Impact Visual; Dark Mode Deferred

#### Context
The facelift backlog spanned critical blocking a11y failures (contrast, font stack, reduced-motion), high-impact visual improvements, and aspirational dark mode support. Dark mode requires a whole new token axis in `@miethe/ui` and is an AA product direction decision; shipping it in this sprint was assessed as out of scope.

#### Decision
Prioritize as two bands: **P0 — a11y/correctness** (font stack, contrast ≥4.5:1, `prefers-reduced-motion`, surface icons, collaboration footer) runs in parallel with P1 as it touches independent files. **P1 — high-impact visual** items follow P3. Dark mode is explicitly deferred (DEFER-1).

#### Consequences
Critical a11y issues land before any other visual work; P5-P0 is independent of the design-system gate and can start immediately. Dark mode is promoted to a dedicated design spec (`docs/project_plans/design-specs/dark-mode-aa.md`) gated on an AA product direction change. Facelift scope is bounded to prevent blocking the wider feature.

---

### ADR-6 — Upstream vs Local Split: Shared Gaps Go to @miethe/ui, AA-Specific Stays Local

#### Context
Several component gaps identified during the SPIKE (shiki syntax highlighting, CM6 language packs, dark-mode MarkdownEditor) are broadly reusable across projects beyond AA. Keeping them local would create a diverging fork; contributing them upstream unblocks other consumers of `@miethe/ui`.

#### Decision
Broadly reusable component gaps are contributed **upstream to `@miethe/ui`** (tracked separately in `docs/project_plans/upstream/miethe-ui-additions-v1.md`). AA-specific components remain local. Ambiguous cases default to local with a promotion note; the split is evaluated per-component during P6.

#### Consequences
`@miethe/ui` grows as the shared canonical library; AA avoids accumulating a diverging fork. Upstream additions are gated on `@miethe/ui` release cadence (DEFER-5). Local-only components can be promoted upstream in future sprints without changing any AA API.

### ADR-7 — Production Rollout Posture: Flag-Gated, Off-by-Default in Prod

#### Context
The canonical detail surfaces (P2b), the design-system adoption (`miethe-ui-ds`), and the
PPTX server-side conversion (`pptx-server-conversion`) are all behind feature flags
(`web/lib/flags.ts`). The dev-defaults enable `miethe-ui-ds` and `ui-tabbed-modal` only when
`NODE_ENV === "development"`; a plain `next build`/`next start` with no `NEXT_PUBLIC_FLAGS`
serves the **legacy** (flags-off) surfaces. This is by design — per R7 (migration regression
risk) the plan mandated per-surface flags for staged rollout — but it means the new UX is
**not visible in production until flags are explicitly enabled**.

#### Decision
Ship the UI Polish Pass **flag-gated and off-by-default in production**. Enablement is an
explicit, reversible operational step: set `NEXT_PUBLIC_FLAGS` at build time, e.g.
`NEXT_PUBLIC_FLAGS=miethe-ui-ds,ui-tabbed-modal` (add `ui-tabbed-modal-<surface>` for
per-surface staging, and `pptx-server-conversion` only once a LibreOffice/Gotenberg backend
is provisioned — R4). Unguarded `@miethe/ui` usages (ContentRenderer, BaseArtifactModal,
FullPageDetail) ship live regardless and are covered by the build/type/unit gates.

#### Consequences
- The feature is **engineering-complete** but intentionally dark in prod until enabled — the
  rollout/enable decision is the operator's, supporting incremental per-surface validation.
- **Recommended gate before global cutover:** one flags-ON Playwright + axe pass over the 5
  EntityModal surfaces and the DOCX/PPTX renderers (tracked as follow-up F-002), since this
  session's e2e (7/7) exercised only the flags-OFF legacy paths.
- To make the new UX the default, flip the `FLAG_DEV_DEFAULTS` gate from `NODE_ENV`-keyed to
  unconditional (`web/lib/flags.ts`) in a follow-up once validated.

> **Superseded by ADR-8 (2026-06-21):** the follow-up flip described in the last bullet has
> been executed — defaults now apply in every environment. ADR-7 is retained as the record of
> the original staged-rollout posture.

### ADR-8 — Default-On Cutover: New UX is the Product Default

#### Context
ADR-7 shipped the UI Polish Pass flag-gated and dark in prod, with an explicit documented
follow-up: "flip the `FLAG_DEV_DEFAULTS` gate from `NODE_ENV`-keyed to unconditional once
validated." All deterministic gates are green and all reviewer gates (per-phase
task-completion-validator, a11y-sheriff, final karen) APPROVED. The remaining gap (F-002 —
flags-ON live axe/Playwright) is a verification follow-up, not a code defect, and was accepted
as non-blocking by both final reviewers. The operator has elected to make the new UX the
default ahead of that live-verification pass.

#### Decision
Flip the default-on mechanism in `web/lib/flags.ts` from `NODE_ENV`-keyed to **unconditional**.
The map (renamed `FLAG_DEV_DEFAULTS` → `FLAG_DEFAULTS` for accuracy) now applies in every
environment, so a plain `next build`/`next start` with no `NEXT_PUBLIC_FLAGS` serves the new
`miethe-ui-ds` + `ui-tabbed-modal` (all 5 surfaces) UX by default. `NEXT_PUBLIC_FLAGS` still
wins by presence, so deployments can additionally opt **on** flags that default off — notably
`pptx-server-conversion`, which stays off (it is absent from `FLAG_DEFAULTS`) until a
LibreOffice/Gotenberg backend is provisioned (R4).

#### Consequences
- The new UX is now the product default in dev and prod alike; the legacy flags-off surfaces
  are no longer reachable without code changes (their bespoke panels remain in-tree for now and
  are scheduled for removal post-cutover per P2B-006).
- **F-002 residual risk is now live in prod:** the flags-ON EntityModal/DOCX/PPTX paths still
  lack a live axe + Playwright pass. Recommended as the immediate next verification step now
  that these surfaces are the default. PPTX itself remains gated off, so its risk is deferred.
- The env-presence-only resolution means a default-on flag cannot be turned **off** via
  `NEXT_PUBLIC_FLAGS` (the var only adds). A kill-switch (env-driven force-off) is a small
  future addition if a fast prod rollback of an individual surface is ever needed.

---

### References

- `docs/project_plans/spikes/ui-polish-pass-spike.md`
- `docs/project_plans/prds/features/ui-polish-pass-v1.md`
- `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md`

### Consequences

- Artifact Atlas UI adopts a consistent design language via @miethe/ui once v0.6.0 is published.
- The token bridge is a one-time integration cost; subsequent @miethe/ui upgrades follow semver.
- Five bespoke detail surfaces are consolidated into one tab-registry pattern, reducing maintenance surface.
- PPTX rendering requires a server-side conversion seam; PPTX files cannot be previewed client-side until a React 19–compatible renderer exists.
- Facelift scope is bounded; dark mode and other visual enhancements are explicitly deferred with design-spec stubs.

---

## D-013 — Asset Content Upload: Content-Addressed Managed Store Under workspace_root, storage_uri Indirection, Four-Surface Parity

**Status:** Accepted — 2026-06-24 (`feat/v1-011-content-upload`, V1-011)

### Context

The content proxy (`GET /api/preview/asset/{id}/content`, D-012/P4C-002) can only serve files
that already exist under `workspace_root`. Browser file pickers expose only a basename (OS
sandboxing), so Inbox imports register assets **metadata-only** (no bytes) and their previews
legitimately 404 (originating from commit `44a4829`). V1-011 closes this: asset *content* must be
uploadable into a managed store from any surface, while preserving the metadata-vs-blob boundary —
Atlas indexes metadata by default; content storage is explicit and opt-in.

### Decision

1. **Managed content store, content-addressed.** A new `settings.content_store_dir`
   (default `assets/content`, env `ATLAS_CONTENT_STORE_DIR`, gitignored) holds blobs at
   `<hash[:2]>/<hash>` (sha256). Stored **under `workspace_root`** so the existing proxy
   containment guard serves blobs unchanged.
2. **No proxy change — `storage_uri` indirection.** The proxy already prefers `storage_uri` over
   `uri` and confines resolved paths to `workspace_root`. Upload sets `storage_uri` to the blob;
   the LFI/SSRF guard (R6/F-002) and MIME allow-list apply at serve time with zero new code.
3. **Service is the single seam.** `ImportService.import_content(filename, bytes|stream, …)` and
   `attach_content(asset_id, …)` own streamed hashing, dedup-by-hash (reuses `_find_by_hash`),
   atomic content-addressed commit (`os.replace`), and audit emission. `attach_content` is the
   "fix the 404" path for already-registered metadata-only assets. All four surfaces call this
   seam; none re-implement storage.
4. **Four-surface parity.** HTTP (`POST …/inbox/upload` multipart, `PUT /api/assets/{id}/content`),
   CLI (`atlas import --store`, `atlas attach`), MCP (`content.upload`), Web (Inbox picker +
   drag-drop send real `File` bytes; URL import path unchanged).
5. **Agent write gating (per Agent Operating Rules).** The MCP `content.upload` tool **denies**
   uploads whose sensitivity is in the `agent_full_content_sensitivity_cap`
   (work_sensitive/client_sensitive/restricted) with a policy-denied audit event, and forces
   created assets to `agent_access=metadata_only`, `status=inbox`, `suggestion_only=true` — agent
   uploads are never auto-promoted.

### Consequences

- Browser-picked assets can now carry bytes; previews no longer 404 once content is uploaded.
- Dedup is global by content hash — identical bytes across surfaces converge on one blob and
  (by default `on_duplicate=return_existing`) one asset record.
- Blobs are runtime data, not source — `assets/content/` is gitignored (matching
  thumbnails/previews); deployments must persist this dir (the nuc deploy already mounts an
  `atlas-data` volume over `workspace_root`).
- Object storage (S3/MinIO) remains a future swap behind the same `import_content` seam and
  `storage_uri` scheme; no caller changes required.

### References

- `api/app/services/import_index.py` (`import_content`, `attach_content`, blob helpers)
- `api/app/api/inbox.py`, `api/app/api/assets.py` (HTTP), `api/app/cli/atlas.py` (CLI),
  `api/app/mcp/tools.py` (MCP `content.upload`)
- `web/lib/api.ts`, `web/features/inbox/InboxCaptureBar.tsx` (Web)
- Tests: `api/tests/test_content_upload.py`, `api/tests/test_routes_content_upload.py`,
  `TestContentUpload` (gateway), `TestImport`/`TestAttach` (CLI)
- Supersedes the metadata-only limitation noted in D-012/P4C-002; depends on the proxy
  `storage_uri` preference established there.

---

## D-014 — AssetViewer Format Promotion: CSV/TSV, Audio, Video (Native Elements + Range Streaming)

**Status:** Accepted — 2026-07-08 (WS-3)

### Context

DEFER-4 (`docs/project_plans/design-specs/asset-viewer-extensions.md`) deferred video, audio, and
spreadsheet preview support pending a verified-compatible library for Next.js 15 / React 19. CSV/TSV,
audio, and video turn out not to need a third-party rendering library at all — the promotion gate
(a verified-compatible library) is satisfied trivially by using platform-native primitives.

### Decision

1. **CSV/TSV → hand-rolled RFC 4180-ish parser + `@tanstack/react-table`.** No new parsing
   dependency (`CsvRenderer.tsx`); the parser handles quoted fields with embedded delimiters/
   newlines and `""`-escaped quotes. Rendered rows are capped at `MAX_RENDERED_ROWS = 1000` with a
   truncation notice — large files never fully materialize into the DOM. All cell values are plain
   React text nodes (JSX-escaped), never `dangerouslySetInnerHTML`.
2. **Audio/Video → native `<audio controls>` / `<video controls>`.** No third-party player
   library. `src` always points at the safe asset-content proxy URL (`fetchRelated:false`
   semantics — no auto-fetched linked/remote resources). Thumbnail mode renders a static
   icon/filename tile and never mounts the media element, so grid/list views don't fire N
   playback/metadata requests at once. `onError` falls back to the shared `ErrorTile` with a
   download link.
3. **Range-request streaming in the content proxy.** `GET /api/preview/asset/{id}/content`
   (P4C-002) relies on Starlette's `FileResponse`, which natively implements RFC 7233 single-range
   handling (`Accept-Ranges: bytes` always emitted; `206 Partial Content` + `Content-Range` for a
   satisfiable `Range` header; `416` for an out-of-bounds range). No custom range-parsing code was
   needed — audio/video MIME types were added to the proxy's allow-list and inline-safe set so
   `<audio>`/`<video>` can stream them directly instead of being forced to
   `Content-Disposition: attachment`.
4. **Dispatcher wiring.** `AssetViewer/index.tsx` resolves CSV/TSV by MIME (`text/csv`,
   `text/tab-separated-values`) or extension (`.csv`, `.tsv`) before the generic `text/*` branch
   (otherwise `text/csv` would be swallowed by the ContentRenderer path); audio/video by MIME
   prefix or extension set. `CsvRenderer` is lazy-loaded (`next/dynamic`, `ssr:false`) to keep
   `@tanstack/react-table` out of the initial bundle, matching the `ContentRenderer`/`DocxRenderer`
   precedent; `AudioRenderer`/`VideoRenderer` are lightweight enough to import eagerly.

### Consequences

- Three of the four DEFER-4 candidate formats (video, audio, spreadsheet-as-CSV/TSV) are promoted
  without adding a single new runtime dependency — `docs/mvp-backlog.md` reflects this as a WS-3
  entry; DEFER-4 remains open only for ZIP/archive and true spreadsheet (`.xlsx`) formats.
  `asset-viewer-extensions.md` is left as-is (still tracks the still-deferred formats).
  Placeholder text updates there are a candidate follow-up but out of scope for this pass.
- Range support is generic on the proxy (Starlette-level), so it also benefits any other
  already-allow-listed MIME type (e.g. resuming a large PDF download), not just audio/video.
- Tests: `web/__tests__/asset-viewer-extensions.test.tsx` (renderer smoke tests — quoted-CSV
  parsing, row-cap truncation notice, TSV, media error fallback, thumbnail-mode no-media-mount);
  `api/tests/test_routes_preview.py::TestGetAssetContentRange` (206/416/open-ended-range/no-header
  cases).

### References

- `web/features/assets/components/AssetViewer/{CsvRenderer,AudioRenderer,VideoRenderer,index}.tsx`
- `api/app/api/preview.py` (`get_asset_content`, `_PROXY_ALLOWED_MIMES`, `_INLINE_SAFE_MIMES`)
- `shared/openapi.yaml` (`/api/preview/asset/{assetId}/content`: `Range` request header,
  `206`/`416` responses, `Accept-Ranges`/`Content-Range` response headers)
- Builds on D-012 (P4C-002 proxy security invariants) without modifying its SSRF/LFI guards.

## D-015 — Full-Surface Preview Rendering: AssetViewer Everywhere, Scrollable PDF, PPTX Default-On, Sandboxed Inline HTML Route

**Status:** Accepted — 2026-07-09 (WS-4)

### Context

After seeding the deployed instance with real multi-format assets, library cards rendered true
previews but the preview modal, both detail routes, and the drawer still showed filetype icons:
those surfaces predated the AssetViewer dispatcher (D-012 ADR-4) and still mounted the legacy
`AssetPreview` placeholder, which never fetches content. PPTX rendered nowhere (the
`pptx-server-conversion` flag was off and `soffice` was intentionally absent from the API image),
and HTML assets could not be hosted/previewed live because the content proxy deliberately serves
`text/html` with `Content-Disposition: attachment` (D-012 R6 XSS hardening).

### Decision

1. **AssetViewer is the single preview surface.** `AssetPreviewTabPanel` (modal + full-page detail
   via the shared tab registry), `AssetDetail`, and `AssetDrawerContent` mount
   `<AssetViewer mode="full">`; the legacy `AssetPreview` is no longer used on those surfaces.
2. **PdfRenderer full mode is a continuous multi-page scroll.** All pages stack in one scrollable
   container (mouse-wheel paging), lazily rendered via IntersectionObserver; a floating
   bottom-right pill provides prev/next arrows and a `n / m` page indicator. The converted-PPTX
   path inherits the same experience. Thumbnail mode stays first-page-only.
3. **PPTX server conversion is default-on.** `pptx-server-conversion` joins `FLAG_DEFAULTS`;
   `deploy/Dockerfile.api` now installs `libreoffice-impress` (+ fonts, PyMuPDF) so the existing
   converter seam (D-012) is live in deployment rather than 503-unavailable.
4. **Inline HTML gets its own hardened route, not a weakened proxy.** New
   `GET /api/preview/asset/{assetId}/html` serves `text/html` inline gated by the same
   `_check_preview_access` policy and file://-containment guards, hardened with
   `Content-Security-Policy: sandbox allow-scripts` (unique origin — scripts run without
   same-origin credentials/storage), `nosniff`, `no-store`, `no-referrer`. The shared content
   proxy keeps its attachment guard for HTML unchanged. The new `HtmlRenderer` embeds this URL in
   an `<iframe sandbox="allow-scripts">` (never `allow-same-origin`) with an open-in-new-tab
   button; thumbnails use a fully inert iframe (`sandbox=""`, `pointer-events-none`).

### Consequences

- Every format the dispatcher supports now renders identically on card, modal, detail, and drawer;
  the per-surface gap matrix collapses to renderer capability only.
- The API image grows by the LibreOffice layer — accepted cost for PPTX being a first-class
  preview format; converter 503 fallback still exists if `soffice` is ever absent.
- HTML assets are effectively app-hosted single pages under the preview policy model; anything
  beyond single-file pages (multi-asset sites) remains out of scope.
- Tests: `web/__tests__/asset-viewer-extensions.test.tsx` (HTML routing, surface mount coverage);
  `api/tests/test_routes_preview.py::TestGetAssetHtml` (inline disposition, CSP header, 403/415/404).

### References

- `web/features/assets/components/AssetViewer/{index,PdfRenderer,HtmlRenderer}.tsx`
- `web/features/assets/components/EntityModal/AssetPreviewTabPanel.tsx`, `web/features/assets/AssetDetail.tsx`
- `api/app/api/preview.py` (`get_asset_html`), `deploy/Dockerfile.api`, `shared/openapi.yaml`
- Builds on D-012 (ADR-4 viewer + R6 proxy posture) and D-014 (Range streaming) without modifying
  their guards.

---

## D-016 — Persist the managed content store on its own named volume

**Status**: Accepted
**Date**: 2026-07-09
**Phase**: Hotfix (preview 404 regression)
**Deciders**: debug (fix:debug)

### Context

After the D-015 redeploy to the nuc, every content-addressed asset failed preview with
`404 "source file not found"`. Root cause: the managed content store (`settings.content_store_dir`)
resolves to `/app/assets/content` — inside the **image filesystem**, not the persistent `atlas-data`
volume. The entrypoint (`deploy/api-entrypoint.sh`) redirects registry/exports to `/data` via
`ATLAS_*` env, but the content store was never included. Any image rebuild + `--force-recreate`
resets `/app`, wiping every runtime-uploaded blob, while the registry on `/data` keeps pointing at
the now-missing blobs. Latent since V1-011; exposed by the first rebuild carrying uploaded content.

### Decision

Mount a dedicated named volume `atlas-assets:/app/assets` in `deploy/docker-compose.yml`, persisting
the content store (and preview/thumbnail/pptx caches) exactly as `atlas-data:/data` persists the
registry. `workspace_root` stays `/app`, so the preview proxy's LFI/SSRF containment guard
(`_resolve_within_workspace`, D-012/F-002) is unchanged — no code and no security-surface change.

Rejected alternative: redirect `ATLAS_CONTENT_STORE_DIR` to `/data/assets/content`. Cleaner w.r.t.
the "mutable state → /data" convention but requires widening the containment guard's trusted root
(a security-sensitive change). Deferred as a possible follow-up; the volume mount is the minimal,
guard-neutral fix.

### Consequences

- Uploaded blobs now survive image rebuilds. Preview/thumbnail caches also persist (regenerable, but
  no longer wiped on redeploy).
- Blobs lost in the D-015 rebuild are recovered out-of-band by re-uploading originals to the existing
  asset ids via `PUT /api/assets/{id}/content` (idempotent, content-addressed).
- Follow-up: e2e/deploy smoke should assert an uploaded asset's `/content` survives a `--force-recreate`.

## D-017 — UI Wave 3: Projects Index, Command-Center Fidelity, BOM Builder, Library/Detail Mockup Alignment

- **Date**: 2026-07-10
- **Status**: Accepted
- **Branch**: `autopilot/ui-wave3-projects-bom` (squash-merged to `main`)

### Context

The MVP surfaces existed functionally but diverged from the PRD mockups: PPTX previews rendered
only in detail views (cards showed a static icon per AC P4C-D), the asset detail page exposed a
fraction of the mockup's fields, the library lacked the expanded filter bar and Board/Timeline
views, there was no Projects index (the root route hard-redirected to the seeded project), and
the BOM view had neither missing-slot visualization nor a template/BOM builder.

### Decision

Five parallel workstreams brought the app to mockup fidelity with **additive-only** backend
changes:

1. **PPTX card previews** (supersedes AC P4C-D): thumbnail mode now reuses the D-015 server
   conversion pipeline with per-asset in-flight dedupe, a session-level ready-cache, an 8s
   thumbnail poll budget, and icon fallback on error/`policy_denied`.
2. **Asset detail metadata conventions**: mockup fields with no first-class column (provenance,
   annotations, associations, policy toggles, ai_summary, tags, starred) persist as structured
   keys in the existing free-form asset `metadata` dict via `PATCH /api/assets/{id}` — no schema
   migration. First-class data (links, relationships, audit activity) got additive read endpoints
   (`GET /api/assets/{id}/links`, `/relationships`).
3. **Library filters**: additive `captured_after`/`captured_before`/`starred` query params on the
   list endpoint; mockup filters with no backing data (Topic/Feature/IntentTree Node) are omitted
   rather than faked.
4. **Projects**: `tags`/`starred` (persisted) and `asset_count` (computed enrichment, never
   persisted) added to the Project model; root route is now a real Projects index with create
   dialog. Command-center panels wrap in a shared `ExpandablePane` fullscreen primitive.
5. **Templates/BOM**: fixed a real persistence gap — JSONL (builder-created) templates previously
   dropped their domain structure (`create_draft` discarded it; `get_detail` read YAML only).
   Domains now embed on the JSONL record; slots gain `accepted_file_types`, `max_file_size_mb`,
   `naming_convention`, `guidance`. New three-panel BOM Builder route
   (`/projects/{id}/templates/builder`) uses dnd-kit against the existing templates API.

### Consequences

- `shared/openapi.yaml` parity maintained for every additive change (parity test green).
- Metadata-dict conventions are documented in `web/features/assets/detailApi.ts`; a future
  first-class promotion (e.g. Postgres columns, V1-003) can migrate from these keys.
- Client-side metadata merge (read-modify-write) has a small lost-update window between
  concurrent editors; acceptable single-user, revisit with V1-001 multi-user.
- Validation at merge: web tsc clean, vitest 106/106, api pytest 631 passed / 2 skipped.

---

## D-018 — Delivery-Report Hosting: Asset Ownership + Catalog Principles (PF-1 host decision)

**Status**: Accepted  
**Date**: 2026-08-01  
**Phase**: PF-1 M4  
**Deciders**: nick (PF-1 lead)

### Context

Rendered `/delivery-report` HTML (output from the launchpad's `delivery_report.py` skill, routes `feature` / `dossier` / `program` / `phase` / `readiness`) lands as loose files under `.claude/reports/…` with no index, no hosting, and no linkage to the feature/epic/project that produced it. The `dev-execution` phase-close hook bundles these reports but has no way to surface them durably or link them back to work-tracking systems.

Two sibling features depend on this decision:

- **PF-2** (intenttree link + UI) — needs a stable servable preview URL from Atlas to store as an `ExternalLink`. **Shipped** (`merge_commit 5bf3f1b`, PR #9) and it hard-rejects any report URL not starting `http(s)://`, which makes the origin-qualified URL a real contract rather than a preference.
- **PF-3** (agentic_meta_dev wiring) — implements delivery-report export + ingest orchestration; blocks on PF-1 M1 and OQ-3. **Status `not_started`**, so no upstream `atlas` export target exists yet and PF-1 defines the ingest contract.

An upstream `/plan:explore` run (`delivery-report-hosting-and-linking-charter.md`, completed 2026-07-30) tested whether hosting AND linking both require substantially new infrastructure, and refuted that deal-killer: both artifact_atlas and IntentTree already ship suitable primitives (Atlas's sandboxed HTML capsule route + HtmlRenderer; IntentTree's existing `ExternalLink` model, with RF-grounding links as precedent).

The open decision is whether this hosting model aligns with the upstream artifact-atlas-agentic-catalog ADR principles, and how to reconcile the scattered existing HTML posture.

### Decision

Delivery-report hosting adopts the Artifact Atlas Catalog Ownership model from the 2026-06-12 proposed ADR (see `../agentic_meta_dev/docs/project_plans/exploration/artifact-atlas-agentic-catalog/artifact-atlas-agentic-catalog-proposed-adr.md`), with the following implementation invariants:

1. **HTML pages are first-class asset types.** Delivery reports are stored as `delivery_report` artifacts with `mime_type: text/html`, joining images, documents, and other content in the Atlas asset graph.

2. **Local-first, non-public by default.** Report assets take an explicit `--sensitivity` when given, otherwise the workspace default (`ATLAS_DEFAULT_SENSITIVITY` / policy config, baseline `personal` per D-009) — with one report-specific rule: the result is **floored at non-public**, so a workspace defaulting to `public` still yields a non-public report. Reports embed commit hashes, internal paths and model-routing detail, so publishing one by default would be a leak. `agent_access` is the one field ingest sets deliberately: `preview_allowed`, which is the serve contract for the sandboxed capsule route, **not** a public/external grant. Nothing else is auto-elevated without explicit human action.

   *Correction (post-review):* an earlier revision of this entry claimed reports "inherit the workspace's default sensitivity (`personal`)". The shipped code at the time did not — it hardcoded `sensitivity or "personal"`, which is always truthy and so never consulted the workspace default, silently **downgrading** a `client_sensitive` workspace to `personal`. The code was fixed to defer to the default and floor only `public` (`ImportService._report_sensitivity`), and this entry now describes actual behavior. Pinned by two regression tests in `api/tests/test_report_ingest.py`.

3. **Controlled API only; no broad filesystem access.** Agents retrieve reports through `GET /api/preview/asset/{id}/html` (policy-gated) and asset search/link APIs, never by scanning `.claude/reports/…` directories directly. The asset index (JSONL) is the source of truth; filesystem paths are implementation detail.

4. **IntentTree/project ties are explicit links.** Report ownership (feature/project/intenttree_node scope) is captured as `AssetLink` rows with well-defined `target_type`, never inferred from path or naming convention. Multi-attach on write is supported — a report linking multiple nodes is correct and common (RF precedent).

5. **No LLM on render/browse.** Stored, previewed, and served reports are deterministic; no model calls during hosting, rendering, or asset retrieval. Future semantic search or summarization is optional and deferred.

6. **Catalog stays derived.** Atlas is not the system of record for generated artifact content. The canonical `.claude/reports/…` files remain authoritative; Atlas indexing and serving are derived views. Ingest never deletes or moves canonical files (R1/R8 guardrail).

These principles are a direct carry-forward of the 2026-06-12 catalog ADR, reconciling it with the delivery-report-hosting scope boundary (OQ-1/OQ-3/OQ-4 resolved in the PF-1 plan).

### Reconciliation of stale scattered-HTML posture notes

Prior documentation (pre-hosting planning docs and design specs) references the "scattered `.claude/reports/…`" model as the canonical arrangement. **As of D-018 the posture is:** scatter remains the canonical *file* location and is never repointed; Atlas holds a derived *browsable index + servable URL layer* on top. Any doc claiming reports should be moved into Atlas, or that Atlas is the canonical store, is outdated — files stay canonical, Atlas is the index/pointer layer. The PF-1 plan's own problem statement carries an inline resolved-marker to this effect.

### Consequences

- Reports hosted by Artifact Atlas are accessible to agents through policy-gated APIs, not broad filesystem access — aligns with AOS agent-writing doctrine and system sovereignty.
- The preview capsule (`GET /api/preview/asset/{id}/html` with sandboxed `text/html` inline route) serves as the hosting infrastructure; no new render/proxy/security code is needed.
- Re-ingest of the same report **instance** updates the blob in-place via `PUT /content` (stable asset id), leaving project/feature/node links intact (OQ-3 decision, PF-1 M3). Instance identity is `(route, subject, instance_key)`; two *different* instances of one subject get distinct assets (see DI-SubjectCollapse, resolved 2026-08-03). An earlier revision of this line said "the same dossier slug", which described the `(route, subject)` key that shipped in M3 and has since been superseded.
- Scattered existing HTML reports in `.claude/reports/…` remain in-place unless explicitly migrated. No fleet-wide backfill is performed by PF-1 (R7, deferred to Tier-2).
- The decision record chain (D-012 ADR-4 viewer, D-015 full-surface HTML route, D-018 hosting model) unifies HTML as first-class throughout the system: authored via skills, stored as assets, served via capsule, linked to intent.

### References

- Upstream proposed ADR: `../agentic_meta_dev/docs/project_plans/exploration/artifact-atlas-agentic-catalog/artifact-atlas-agentic-catalog-proposed-adr.md` (2026-06-12)
- PF-1 plan: `docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md` (decisions: OQ-1, OQ-3, OQ-4)
- PF-1 PRD: `docs/project_plans/prds/features/delivery-report-hosting-v1.md` (requirements, gates, success metrics)
- PF-1 implementation plan: `docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md` (milestones M1–M4)
- Design spec: `../agentic_meta_dev/docs/project_plans/design-specs/delivery-report-hosting-and-linking-v1.md` (§2.A composites, §6 end-to-end flow)
- Atlas spike findings: `../agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/spikes/atlas-spike.md` (gap analysis: G2 store/tag, G3 preview_allowed, G5 revisioning)
- Feasibility brief: `../agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-feasibility-brief.md` (verdict GO; atlas leg 0.82 confidence)
- Sibling PF-3 plan: `../agentic_meta_dev/docs/project_plans/implementation_plans/delivery-report-hosting-and-linking-v1.md` (note: no `infrastructure/` subdir; status `not_started`)
- Superseded: `../agentic_meta_dev/docs/project_plans/exploration/artifact-atlas-agentic-catalog/artifact-atlas-agentic-catalog-proposed-adr.md` (2026-06-12, status proposed; reconciled by D-018)
- Execution ledger (verified envelope + PF-2 contracts, deviations, post-review fixes): `.claude/worknotes/delivery-report-hosting/implementation-notes.md`
- M1 council-review artifacts: `.claude/findings/delivery-report-hosting/`
- Related D-012 (viewer dispatch + XSS hardening), D-015 (full-surface HTML route), D-016 (content store persistence)

---

## Deferred Items (DI) — Delivery-Report Hosting and Catalog

The following scope items are explicitly deferred and tracked as discovery tickets for Tier-2 or future phases. Deferral is by design (not dropped); each row includes rationale and suggested handling.

### DI-G4 — Reports lens / cross-scope dashboard (OQ-2, Tier-2 follow-on)

**Description**: A UI surface showing all `delivery_report` assets across a workspace, with filtering by route (feature/dossier/program/phase/readiness), date, subject/project, truth_status, and linked node. The design spec calls this the "cross-scope Reports lens" in section 14.1. Current MVP surfaces (library, project detail) show all asset types; a reports-only aggregation is not yet available.

**Why deferred**: Deferred in the PF-1 plan (OQ-2) as non-blocking; library filtering and project-scoped views cover the immediate workflow. Tier-2 follow-on can add a dedicated Reports lens without changing the ingest or storage contracts.

**Suggested handling**: File as a feature in Tier-2 planning. Acceptance criteria: saved filter for `artifact_type_id=delivery_report` OR a new `/reports` route with route/subject/status facets and result pinning. Blocks: none (additive UI only).

---

### DI-G6 — Epic link alias / AssetLinkTargetType expansion (future)

**Description**: The current `AssetLinkTargetType` enum has `feature`, `project`, `intenttree_node`. A sibling PF-2 (intenttree link+UI) references "epic" as a link target in its contract, but delivery-report hosting does not yet emit epic links. The enum should be extended if epics become first-class in IntentTree's domain model.

**Why deferred**: PF-2 does not require an `epic` enum value for PF-1 M1–M3 acceptance (it uses `intenttree_node` for all tree-based targets). IntentTree's formal epic model is not yet stable. Deferred to IntentTree's domain model clarity.

**Suggested handling**: Coordinate with PF-2 and IntentTree on whether `epic` is a distinct target type or a node-type attribute. If distinct, add to `AssetLinkTargetType` in `api/app/models/vocabulary.py` and update link creation/retrieval tests. Blocks: none (links via `intenttree_node` work today).

---

### DI-Backfill — Fleet backfill of scattered `.claude/reports/` HTML (R7, non-goal)

**Description**: Existing projects have HTML reports scattered across `.claude/reports/…` directories, created before the hosting service existed. These files could be bulk-ingested as assets to provide a searchable index. The design spec (R7) explicitly marks this as a non-goal for MVP.

**Why deferred**: Scope boundary R7 excludes fleet backfill. Automating a discovery/ingest across all projects in a fleet introduces migration complexity and cross-project policy decisions (sensitivity defaults per project vs. workspace-wide). MVP focuses on new ingest paths; legacy migration is Tier-2.

**Suggested handling**: Create a documented backfill script (not automated) that accepts a project path and directory pattern, listing candidate HTML files with preview (no auto-ingest). Users can manually select files to ingest. Suggested Tier-2 timeline: post-pilot feedback.

---

### DI-Sensitivity — Report-asset sensitivity defaulting policy (M3 observation)

**Description**: Report assets are ingested with `sensitivity=personal` (workspace default) and `agent_access=preview_allowed` (to enable the capsule route). This is correct for generated summaries/overviews, but some reports may carry sensitive content (client names, internal metrics, model routing). The ingest verb does not re-evaluate sensitivity on subsequent ingests (it preserves the original setting), which is intentional (avoid silent policy changes). However, the workspace-level default and any per-report override mechanism are not yet documented.

**Why deferred**: Policy defaulting is covered by D-009 (baseline policy), but report-specific sensitivity guidance (e.g., "reports carrying client names should default to `client_sensitive`") is a policy-and-docs item that follows from pilot usage patterns. Deferred to Phase 2 (post-pilot).

**Suggested handling**: After pilot, document report-asset policy defaults in `docs/user-workflows.md` or a new `docs/policy-guide.md`. Include a checkbox in the ingest CLI (`atlas report ingest --sensitivity work_sensitive …`) for explicit override if needed. Suggested Tier-2 timeline: after pilot feedback on sensitivity UX.

---

### DI-LinkTarget — Tracker/subject link-target existence validation gap (M2 observation, deferred)

**Description**: The ingest verb validates the **shape** of `tracker_links[].tracker` and `subject` (e.g., does `tracker` look like `node_<id>`?) and checks whether `subject` resolves to an Atlas project. It does **not** verify that a well-formed `node_<id>` or `tree_<id>` actually exists in IntentTree, or that a `feature` subject refers to a real feature in upstream systems. A well-formed but nonexistent target (e.g. `node_DOESNOTEXIST`) creates a link silently.

**Why deferred**: Building an IntentTree client just to validate link targets is outside the PF-1 composition scope (reuse shipped primitives, no new subsystem clients). The risk — silent misattribution to a nonexistent node — is real and **currently unmitigated at write time**. The only present-day surface is the CLI's post-hoc link printout (`atlas report ingest` prints each created link, `api/app/cli/atlas.py`), which an operator can eyeball *after* the fact. There is no pre-publish link-preview UI; an earlier revision of this row cited one as a mitigation, which was wrong — it does not exist.

**Suggested handling**: Document the limitation in `docs/agent-handoff.md` (section "Link Target Validation") and the CLI help text for `atlas report ingest`. After pilot, add an optional `--verify-targets` flag that does an existence check via the IntentTree API (requires a policy review to grant Atlas an IntentTree client). Blocks: none for PF-1 — shape validation does catch malformed ids, and the failure mode is a dangling link rather than a link to the *wrong* real node.

---

### DI-SubjectCollapse — RESOLVED 2026-08-03: report identity is `(route, subject, instance_key)`

**Status**: Resolved. Superseded the deferral below; no OQ-3 amendment was required.

**Was**: M3's stable asset id was keyed on `(route, subject)` per OQ-3. But `subject` is a feature/project **slug**, not a per-instance key (emitted as `report.subject or report.project`). Correct for `dossier`/`feature` — the intended "one living record" model — but it **collapsed** `phase`, `program`, and `readiness` reports for one project onto a single asset: ingesting a phase-2 report and then a phase-3 report overwrote the first's blob. The missing discriminator was genuinely upstream; the silent overwrite was a local choice.

**Resolution**: PF-3 resolved its OQ-5 on 2026-08-02 (`agentic_meta_dev` #87, `8555cf0`) by adding a **named** `instance_key` to the export envelope — derived by the caller from the thing that actually distinguishes the instance (phase/milestone id for `phase`, milestone id for `program`, decision date for `readiness`), and absent for `feature`/`dossier`. Verified end-to-end here: a `target=atlas` export carries both `instance_key` and a precomputed `link_identity` (`report:{route}:{subject}:{instance_key}`).

Atlas therefore extends its identity key to `(route, subject, instance_key)` (`api/app/services/import_index.py`, `_find_report_by_identity` / `_has_stable_report_identity`) rather than route-gating. This is strictly better than the route-gate previously recorded as preferred:

- Distinct instances get distinct assets — the data loss is gone.
- Re-publishing the *same* instance still replaces in place, so OQ-3's idempotence survives. A route-gate would have made every re-run of the phase-close hook mint another asset, trading silent overwrite for duplicate spam on an unattended caller.
- **No OQ-3 amendment needed.** OQ-3's letter is "re-ingest updates a STABLE asset id keyed by envelope identity, NOT a supersedes-chain"; this keeps both clauses and only sharpens what "envelope identity" means. PF-3's own OQ-5 rationale makes the same point: once instance identity is a named field, "same instance → replace" and "different instance → distinct record" compose cleanly, and the apparent OQ-3/OQ-5 contradiction dissolves as an artifact of overloading one field with two jobs.
- Cross-repo coherence holds without a joint decision: PF-2's `itt link report --ref` takes a verbatim `external_id`, and PF-3 computes the Atlas asset identity and the IntentTree `external_id` in one shared function so the two cannot drift.

`revision` is deliberately **not** part of identity: `init_manifest` sets it to `1` and nothing increments it, so folding it in would mint a new asset on every re-render of one report.

**Safety fallback**: a recurring-route envelope carrying no `instance_key` cannot say which instance it is, so it takes the create path (new asset) instead of replacing. PF-3's exporter hard-fails before emitting such an envelope for `target=atlas`, so this only catches hand-rolled or pre-OQ-5 envelopes — the worst case is an extra asset, never a lost one.

**Coverage**: `TestRecurringRouteInstanceIdentity` (`api/tests/test_report_revision.py`) replaces the old collapse-asserting regression test with five cases: distinct instances separate, same instance replaces in place, byte-identical re-publish is a no-op, recurring route without `instance_key` never overwrites, and `feature`/`dossier` still collapse. Documented in the `atlas report ingest` help text.

**Follow-on (upstream, non-blocking)**: `delivery-report.schema.json`'s `report` object sets `additionalProperties: false` and does not declare `instance_key`. Currently harmless — `delivery_report.py validate` uses a hand-rolled validator, and a manifest with `instance_key` passes (verified) — but any consumer validating against the JSON Schema directly would reject a valid manifest. One-line upstream fix in `agentic_meta_dev`.

---

Deferred items are reviewed at each phase boundary. None of these block PF-1 acceptance (all are explicitly out-of-scope per the plan). See the PF-1 exit criteria (plan M4 section) for acceptance gates.

---

## D-019 — Reports Hub Foundations: Project Attribution, Fleet Project Rows, Report Backfill (PF-4 prerequisites)

**Status**: Accepted
**Date**: 2026-08-08
**Phase**: PF-4 (work package `node_01KZH6QVPKAN01N8JTQ09XRMXA`)
**Deciders**: nick (PF-4 lead)

### Context

PF-1/PF-2/PF-3 shipped hosting and linking: a delivery report can be rendered, exported to Atlas, and link-attached to an IntentTree node. **Discovery never shipped.** Every discovery item was deferred and none was filed as tree work — `DI-G4` said "File as a feature in Tier-2 planning" on 2026-08-02 and that never happened.

Measured live state on 2026-08-08 (`http://10.42.10.76:8042`): exactly **one** `delivery_report` asset existed (`asset_c7c088ab3c8d4639`), with `project_id: null`, `workspace_id: null`, `status: inbox`. Its three `AssetLink` rows were correct and its IntentTree external link (`extlink_01KZ2M7R924SNQJ0ZQSYABMT06`) resolved — so the pipeline worked end to end once. But every Atlas web route is nested under `(projects)/projects/[projectId]`, so a project-less asset renders on **no page of the app**. The pipeline was proven; the destination did not exist.

`GET /api/projects` returned a single row (`proj_artifact_atlas`). The ~40 other AOS repos had no project rows at all, so "all reports for all projects" could not resolve even in principle.

This decision covers the three prerequisites implemented in the PF-4 run. The three discovery surfaces themselves (per-project reports view, cross-project `/reports` lens, AOS-wide overview) were **planned and deliberately held** — see the three `reports-hub-*-v1.md` implementation plans.

### Decision

**1. Report project attribution resolves at ingest, in a fixed precedence, storing only canonical ids.**

Order, first hit wins: explicit caller `project_id` (accepted as slug **or** id, resolved to canonical) → envelope `subject` matched against a project slug → `generated_from.repo` basename, normalized for the underscore/hyphen mismatch (`artifact_atlas` → `artifact-atlas`) → `None`. The stored value is always the canonical `proj_*` id, never a slug.

The repo-basename step is the load-bearing cheap win: it needs **no change to the cross-repo PF-3 envelope contract**, because the envelope already carries an absolute repo path. Resolution runs before any write, mirroring how link targets already resolved, so a bad value cannot leave a partially-written asset. The single lookup is shared between link-target typing and attribution so the two cannot disagree — previously the code called `get_by_slug(subject)` and threw the resolved `Project` away.

**2. An explicit but unresolvable `project_id` fails loud; an unresolvable *inferred* one leaves the report unattributed.**

A dangling `project_id` is strictly worse than a refused ingest: `GET /api/projects/{id}/assets` filters on exact equality, so the asset would silently match nothing — the very defect being fixed. Conversely an unattributed report is merely invisible until a workspace-wide lens or backfill picks it up, whereas a *wrongly* attributed one lies on that project's page. So: explicit and wrong → raise; inferred and absent → `None`, never a best guess.

**3. `workspace_id` is stamped at the report-ingest service layer, not declared on `AssetCreate`.**

`AssetRepository.create` splats `model_dump(exclude_none=False)`, so declaring the field would write `"workspace_id": null` into every asset from every create path and promote it to a client-settable field on the public `POST /api/projects/{id}/assets` body. Scoping the stamp to report ingest disturbs nothing shared. **Known fragility, accepted and recorded**: on the Project side the seeder's `workspace_id` rides on `ConfigDict(extra="allow")` because `ProjectCreate` does not declare it. One break mode is loud (`extra="forbid"` → `ValidationError`, abort before writing) and one is silent (extras ceasing to reach the stored record → rows with no `workspace_id`, no error). Declaring the field is filed as follow-up work.

**4. Report ingest lands at `status: candidate`, and re-ingest never demotes.**

Honours the PRD's explicit OQ-1 commitment ("auto-ingest … at `status=candidate`, never canonical"), which had been recorded in the PRD but never reached the code or D-018 — ingest hardcoded `inbox`, a third state. `import_content` gained an optional `status` defaulting to `inbox`, so `import_url` and the MCP/HTTP content-upload path are behaviourally unchanged (pinned by tests). The revise path deliberately leaves status alone: a later re-ingest must never silently demote a report a human already promoted to `canonical`, per this repo's agent-writes-stay-suggestion-grade rule.

**5. Re-ingest repairs attribution idempotently, and the repair is audited.**

A report first ingested while unattributable previously stayed unreachable forever — `_revise_report_asset` accepted `project_id` and used it only for the audit event. Attribution is now applied on the revise path *and* on the identical-bytes no-op, so re-publication is an attribution repair. Because attribution is now policy-relevant, a `project_id` delta bumps `last_indexed_at` and emits a `report_attribution_repaired` event; a `workspace_id`-only stamp stays silent to avoid double-logging beside the create/revise event.

**6. On a content-hash collision with a *different* report's asset, neither attribution nor scope links are written.**

Two distinct reports (different `(route, subject, instance_key)`) can render byte-identical HTML and hit the dedup branch. Writing attribution there would re-attribute the other project's report; writing links there contaminated it with the wrong project's evidence links plus an `asset_linked` audit event. Both are now gated together. The trigger is narrow but the failure was silent and cross-project. Exit code 0 is retained deliberately, with an explicit CLI warning naming the matched asset and stating that this invocation's report was **not** stored — the operator must not read a silent success as "hosted".

**7. Fleet project rows are seeded from a single machine-readable source into one shared workspace.**

`scripts/seed_fleet_projects.py` reads `agentic_meta_dev/docs/05-app-registry.yaml` (overridable via `--registry`, so Atlas does not hard-depend on a sibling checkout), dry-run by default, `--apply` to write, and `--allow-real-registry` required before it will touch canonical `registry/`. Ids are deterministic (`proj_<normalized_slug>`) so re-seeding is stable and matches the hand-authored `proj_artifact_atlas` convention. Slugs are normalized (lowercase, `_`→`-`) and validated against the OpenAPI contract's `^[a-z0-9-]+$`; anything unnormalizable is reported, never written. Whitespace is **not** stripped — a whitespace-bearing fleet id reports INVALID like any other pattern violation, surfacing the upstream typo rather than silently repairing it.

All rows take the configured `settings.workspace_id`, because the central lens spans a workspace and splitting it would fragment the surface PF-4 exists to build. (The workspace is consequently named `ws_artifact_atlas_local` while holding fleet-wide content — a recorded misnomer, filed for rename.)

**8. Uniqueness is enforced over tombstones on both id *and* slug.**

`get_by_slug` filters soft-deleted rows, so nothing below the seeder rejects a second row reusing a tombstoned slug. The derived-id guard is **not** a backstop: existing rows need not carry the derived id form, so a tombstone with id `proj_legacy_id` holding slug `foo` leaves `proj_foo` free and a candidate for `foo` passes the id guard entirely (reproduced: exit 0, `conflict: 0`, duplicate slug written). Slugs are therefore split into live (idempotent SKIP) versus tombstone-held (CONFLICT), keeping the two legitimate outcomes distinct instead of collapsing them into a silent skip or a silent duplicate.

Remediation guidance for such a conflict names only operations that exist — hand-edit the tombstone line out of `registry/projects.jsonl`, or change the fleet app id. `jsonl.hard_delete_record` has zero callers and no CLI/API/service surface, so advising a hard delete would send the operator after a command the codebase does not offer.

**9. `root_intenttree_node_id` is left null rather than filled with the wrong id type.**

The field wants a **node** id; the only machine-readable fleet tree data holds **tree** ids. Writing a `tree_*` id into a node-id field would read as populated while being a type lie. The seeder accepts an optional `--tree-map` of slug → root node id and leaves the field null otherwise.

**10. Backfill is dry-run-first, reuses the one ingest path, and never touches canonical files.**

`scripts/backfill_reports.py` (resolves `DI-Backfill`, which had marked fleet backfill an explicit non-goal) discovers candidates, prints the full envelope it *would* emit, and ingests only on `--apply` plus explicit selection. It calls `ImportService.import_report` rather than adding a second ingest path. Envelopes are synthesized from each report's own `report.json` manifest, so `subject`/`route` are faithful rather than guessed; candidates without a manifest are skipped with a stated reason. No canonical `.claude/reports` or `docs/project_plans/reports` file is moved, deleted, rewritten, or repointed (D-018) — Atlas holds a derived pointer plus a content-store copy, asserted by a byte-identity test. Sensitivity keeps the existing ingest defaults (`personal` / `preview_allowed`) per `DI-Sensitivity` rather than inventing a new policy for backfilled content.

An explicitly-named but un-ingestable `--select` key is a **usage error (exit 2)**, not a 0-exit no-op, and a mixed selection refuses the whole run rather than partially applying — the safe direction, now pinned by a test so it cannot silently flip.

**11. Backfill identity is anchored explicitly, records its derivation, and refuses ambiguous layouts.**

`instance_key` was originally `f"{collection}/{key}"` with `collection` defaulting to the scan root's name, so re-running with a differently-spelled `--root` produced a different key and **duplicated every asset instead of revising it** — silently destroying the one guarantee the script exists to provide. Derivation now anchors on an explicit `--collection` (else the owning repo root) and records its inputs in the envelope as `instance_key_derivation` (`anchor_kind`, `anchor_path`, `collection`, `relative_path`) so a mismatch is detectable rather than silent. Two distinct reports laid out as `<dir>/index.html` and `<dir>.html` previously collided onto one key; that pair is now refused. Residual invocation-sensitivity (the anchor *rule* still depends on whether `--collection` is passed, and the repo-root fallback depends on which checkout a path is reached through) is documented in-script and filed as follow-up.

### Consequences

- A delivery report ingested for a known project is now reachable from a project-scoped Atlas surface. Pinned by tests that assert reachability through `GET /api/projects/{id}/assets?artifact_type_id=delivery_report` — the same exact-equality filter the UI hits — rather than merely asserting ingest returned 200.
- The three discovery surfaces have implementation plans but **no implementation**; they remain the substance of PF-4.
- Nothing has been applied to the live node or to canonical `registry/`. Both scripts are dry-run by default; seeding the deployed instance is a separate, explicitly-gated action.
- Backend suite: 779 passed, 2 skipped. Both scripts verified executing against real sibling data (42 fleet apps → 41 create / 1 skip / 0 problem; 15 backfill candidates → 14 ingestable, the lone skip being the prototype's own `index.html`).

### Deferred items (filed as tree work, not left in this document)

Unlike `DI-G4`, which sat here for six days with "File as a feature in Tier-2 planning" and was never filed, each of these is an IntentTree node:

| Item | Node |
|---|---|
| `AssetLink.target_id` stores a project slug while `project_id` stores the canonical id | `node_01KZHJX2Z3FCQBP9Q36J93FTFJ` |
| `root_intenttree_node_id` needs a tree→root-node resolution | `node_01KZHJXCFSKVH7T8S9TACE92FH` |
| Rename `ws_artifact_atlas_local` → `ws_aos` | `node_01KZHJXM14NSTSMV8BT8D6YBRJ` |
| Fleet seeding creates 41 projects where ~14 produce reports | `node_01KZHNGY48EVDTR4G814048QNX` |
| Backfill `instance_key` still varies with the invocation | `node_01KZHNHBMQSR87X6D8ZX25T5MA` |
| No Python lint gate (`make lint` covers `web/` only) | `node_01KZHNHP84MBRH9KYRS7A0T37Q` |
| PF-3's stale "no live round trip" deferred_item (cross-repo) | `node_01KZHJYBDJCEEHAVH2309XS6Q9` |
| `skillmeat deploy` blocked repo-wide by a malformed bundle record | `node_01KZHJYTV7FFRARVJVAYJ344JH` |

`DI-G4` and `DI-Backfill` above are partially superseded by this decision: `DI-Backfill`'s "explicit non-goal" is resolved by item 10, and `DI-G4`'s "additive UI only" assumption is refuted by the central-lens plan — there is no cross-project asset list endpoint, so that surface requires backend work.
