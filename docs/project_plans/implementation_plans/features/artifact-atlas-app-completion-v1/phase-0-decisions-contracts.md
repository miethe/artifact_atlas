# Phase 0: Decisions And Contracts

**Parent Plan**: [Artifact Atlas App Completion](../artifact-atlas-app-completion-v1.md)  
**Duration**: 3-5 days  
**Effort**: 18 points  
**Dependencies**: None  
**Primary Subagents**: lead-architect, implementation-planner, backend-architect, documentation-complex

## Phase Overview

Phase 0 turns the large PRD/UIUX package into implementation contracts that later agents can safely build against. The goal is to resolve MVP ambiguity before implementation touches persistence, agent access, BOM semantics, or external project integrations.

## Goals

- Freeze the MVP persistence decision and export contract.
- Normalize statuses, sensitivity labels, include modes, and slot states.
- Convert the source spec API surface into an OpenAPI-backed implementation contract.
- Define integration seams for MeatyWiki, IntentTree, SkillMeat/SAM, CCDash, and Agentic Control Plane.
- Record decisions in `docs/DECISIONS.md` and backlog in `docs/mvp-backlog.md`.

## Architecture Focus

- **Layer**: Product architecture, API contract, policy model, local-first file conventions.
- **Patterns**: Contract-first API, JSONL/YAML portability, explicit human gates, read-first agent gateway.
- **Standards**: Source spec, `AGENTS.md`, `CLAUDE.md`, `shared/openapi.yaml`, `config/workspace.yaml`.

## Task Breakdown

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| P0-001 | Baseline Inventory | Record scaffold state across `api`, `web`, `shared`, `registry`, `templates`, `exports`, and mockups. | Inventory section exists in plan/docs and distinguishes implemented vs missing. | 2 | implementation-planner | None |
| P0-002 | Persistence Decision | Decide JSONL-only MVP, SQLite-primary, or repository abstraction with JSONL first and SQLite-ready models. | `docs/DECISIONS.md` has a decision with migration path and non-goals. | 3 | lead-architect, data-layer-expert | P0-001 |
| P0-003 | Vocabulary Canonicalization | Normalize asset status, BOM slot status, template status, sensitivity, agent access, include mode, and assignment status. | Shared vocabulary is documented and referenced by API schemas and UI tokens. | 3 | lead-architect, backend-architect | P0-001 |
| P0-004 | Policy Baseline | Define personal-mode auth, default sensitivity, full-content access rules, canonical promotion gates, and audit requirements. | Policy rules cover sensitive assets, context-pack publish, MCP access, and destructive changes. | 3 | backend-architect, documentation-complex | P0-003 |
| P0-005 | API Contract Expansion | Expand `shared/openapi.yaml` from scaffold endpoints to the MVP API surface from the spec. | OpenAPI includes Projects, Assets, Inbox, Templates, BOM, Coverage, Context Packs, Search, Audit, Policies. | 4 | api-documenter, python-backend-engineer | P0-002, P0-003 |
| P0-006 | Integration Contract Notes | Define local-first integration payloads for MeatyWiki cards, IntentTree node refs, SkillMeat refs, CCDash events, Control Plane signals. | Each integration has MVP read/write boundary, file/export shape, and deferred live API path. | 2 | documentation-complex, lead-architect | P0-004 |
| P0-007 | Backlog Reconciliation | Merge the source spec first sprint backlog with `docs/mvp-backlog.md`. | Backlog reflects phase sequencing and avoids duplicate/conflicting epics. | 1 | lead-pm, implementation-planner | P0-005 |

## Detailed Requirements

### Persistence Decision

Recommended default: keep local-first JSONL/YAML as the portable source in MVP, but implement repository interfaces and Pydantic models so SQLite can become the storage backend without UI/API rewrites. This respects current seed files while avoiding ad hoc file edits scattered through services.

Acceptance criteria:

- [ ] `registry/*.jsonl` remains human-readable and exportable.
- [ ] Repository methods own all reads/writes and validation.
- [ ] Models include enough fields to support the source spec MVP.
- [ ] SQLite/Postgres fields are not designed into a corner.

### Vocabulary Canonicalization

Normalize these vocabularies before UI work:

- Asset status: `inbox`, `raw`, `candidate`, `in_review`, `in_progress`, `selected`, `canonical`, `archived`.
- BOM slot status: `missing`, `partial`, `in_progress`, `complete`, `stale`, `blocked`, `not_applicable`.
- Sensitivity: `public`, `personal`, `work_sensitive`, `client_sensitive`, `restricted`.
- Agent access: `none`, `metadata_only`, `preview_allowed`, `read_allowed`, `context_pack_allowed`.
- Assignment status: `suggested`, `accepted`, `rejected`, `canonical`.
- Template status: `core`, `recommended`, `optional`, `experimental`, `deprecated`.

Acceptance criteria:

- [ ] UI labels can differ slightly, but API/storage values are stable.
- [ ] Mockup fixture inconsistencies (`AOS`/`AGS`, `MeatyWiki` typo variants, conflicting counts) are not copied into seed data.
- [ ] Status transitions are explicit and auditable.

### Integration Boundaries

MVP integrations must be file/export/ref based:

- MeatyWiki: asset cards and context pack markdown/YAML export.
- IntentTree: node ID references and context-pack target references.
- SkillMeat/SAM: template/context-pack references and Golden Context Pack candidate metadata.
- CCDash: local event export with spec-compatible event types.
- Control Plane: project snapshot/routing signal export.

Do not implement external OAuth or live remote connectors in this phase.

## Quality Gates

- [ ] Decisions recorded in `docs/DECISIONS.md`.
- [ ] `shared/openapi.yaml` has MVP endpoints and schemas.
- [ ] `docs/mvp-backlog.md` reflects reconciled scope.
- [ ] Integration boundaries are documented and do not replace upstream systems.
- [ ] Policy rules explicitly deny broad agent filesystem access.
- [ ] No implementation phase depends on unresolved status or policy vocabulary.

## Key Files

| File Path | Purpose | Subagent |
|---|---|---|
| `docs/DECISIONS.md` | Durable decisions and tradeoffs | lead-architect |
| `docs/mvp-backlog.md` | Reconciled implementation backlog | lead-pm |
| `shared/openapi.yaml` | API contract | api-documenter |
| `config/workspace.yaml` | Policy defaults and local paths | backend-architect |
| `config/integrations.yaml` | Integration status and roles | documentation-complex |
| `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/*.png` | UI design references | ui-designer |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Storage debate stalls build | High | Choose JSONL repository-first MVP and document SQLite migration path. |
| Status vocabulary drifts between systems | High | Freeze API values, map external labels at integration boundaries. |
| Agents gain too much access | High | Policy baseline defaults to metadata-only and logs denied access. |
| BOM/I-BOM/SkillBOM overlap remains vague | Medium | Document Artifact Atlas as asset/BOM workflow state, with references to other systems. |

## Validation

```bash
python3 - <<'PY'
from pathlib import Path
for path in [
  "docs/DECISIONS.md",
  "docs/mvp-backlog.md",
  "shared/openapi.yaml",
  "config/workspace.yaml",
  "config/integrations.yaml",
]:
    assert Path(path).exists(), path
print("phase 0 contract files exist")
PY
```

[Return to Parent Plan](../artifact-atlas-app-completion-v1.md)
