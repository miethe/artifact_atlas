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
