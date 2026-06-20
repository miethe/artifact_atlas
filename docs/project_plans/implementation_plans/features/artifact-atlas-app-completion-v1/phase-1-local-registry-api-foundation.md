# Phase 1: Local Registry And API Foundation

**Parent Plan**: [Artifact Atlas App Completion](../artifact-atlas-app-completion-v1.md)  
**Duration**: 2-3 weeks  
**Effort**: 42 points  
**Dependencies**: Phase 0 decisions complete  
**Primary Subagents**: data-layer-expert, python-backend-engineer, backend-architect, api-documenter

## Phase Overview

Phase 1 replaces the current hard-coded API scaffold with a real local-first backend. It must keep the registry/export files readable while introducing typed repositories, services, route modules, policy checks, and tests.

## Goals

- Stabilize local API/web runtime setup enough for repeatable development.
- Expand Pydantic models to match MVP data objects.
- Implement JSONL repository read/write services for local-first mode.
- Implement API route modules for projects, assets, inbox, templates, BOM, coverage, context packs, policies, audit, and integrations.
- Align backend route behavior with `shared/openapi.yaml`.
- Add import/index services for local file/URL assets, thumbnails/previews where feasible, and audit events.

## Architecture Focus

- **Layer**: Data contracts, repositories, services, FastAPI API.
- **Patterns**: Repository abstraction over JSONL, service-owned business rules, policy evaluation before content access, audit-on-sensitive-actions.
- **Standards**: FastAPI + Pydantic, source spec section 13/14/18/19, current `config/workspace.yaml`.

## Task Breakdown

### Epic: Runtime And Project Setup

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| API-ENV-001 | Dependency Setup | Make API and web setup reproducible. | API dependencies install; pytest/FastAPI/uvicorn available; web deps install or lockfile generated. | 3 | DevOps, python-backend-engineer | P0 |
| API-ENV-002 | Test Baseline | Establish backend test command and frontend typecheck/build command. | `cd api && python3 -m pytest -q` passes; web command documented or passing. | 2 | testing specialist | API-ENV-001 |
| API-ENV-003 | Scaffold Hygiene | Decide whether generated caches/egg-info stay ignored or tracked. | `.gitignore` and repo hygiene prevent committing runtime noise. | 1 | DevOps | API-ENV-001 |

### Epic: Schemas And Repositories

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| DATA-001 | Pydantic Schema Expansion | Add models for workspace, project, asset, asset links, relationships, templates, BOM, assignments, context packs, events, policies. | Models parse current seed files and source-spec fixture examples. | 5 | python-backend-engineer, backend-architect | P0-003 |
| DATA-002 | JSONL Repository Layer | Implement typed repository helpers with append/update/delete semantics and file locking or atomic write strategy. | Repositories support list/get/create/update for seed entities without data corruption. | 5 | data-layer-expert, python-backend-engineer | DATA-001 |
| DATA-003 | YAML Template Loader | Parse `templates/*.yaml` into template/domain/slot models. | Seed templates load and can generate project BOM slots. | 3 | data-layer-expert | DATA-001 |
| DATA-004 | Registry Validation | Add a validation command/test for `registry/*.jsonl`, `templates/*.yaml`, and `exports/context-packs/*.yaml`. | Invalid records fail clearly; existing seeds pass. | 3 | python-backend-engineer | DATA-002 |

### Epic: Services

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| SVC-001 | Project Service | Implement project CRUD/list and dashboard aggregate reads. | Project API reads seed project and returns aggregate counts from repositories. | 3 | python-backend-engineer | DATA-002 |
| SVC-002 | Asset Registry Service | Implement asset CRUD, metadata edit, search/filter, link creation, and status transitions. | Asset list/detail/edit/link APIs work with audit logging. | 5 | backend-architect, python-backend-engineer | DATA-002 |
| SVC-003 | Import And Index Service | Add file path, URL, and manual asset import with SHA-256 and basic metadata extraction. | Import endpoint creates inbox asset records and avoids duplicate hash records. | 5 | python-backend-engineer | SVC-002 |
| SVC-004 | Thumbnail/Preview Service | Generate thumbnails for images and preview text for markdown/text; leave PDF/video as extensible adapters if deps unavailable. | Image/markdown fixtures produce preview metadata; unsupported types degrade gracefully. | 4 | python-backend-engineer | SVC-003 |
| SVC-005 | Policy Service | Evaluate include modes against sensitivity and `agent_access`. | Requests for restricted content are denied or downgraded with audit event. | 4 | backend-architect | DATA-001 |
| SVC-006 | Audit/Event Service | Record major asset, policy, BOM, context-pack, and sync events. | `atlas_event` records are append-only and queryable. | 3 | backend-architect, data-layer-expert | DATA-002 |

### Epic: API Routes And Contract

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| ROUTE-001 | FastAPI Router Modules | Split `main.py` into route modules under `api/app/api`. | Routes import cleanly and `/health` remains stable. | 2 | python-backend-engineer | API-ENV-002 |
| ROUTE-002 | Project/Asset Routes | Implement projects/assets/inbox/search endpoints from MVP OpenAPI. | Endpoints return typed responses and tested errors. | 4 | python-backend-engineer | SVC-001, SVC-004 |
| ROUTE-003 | Template/BOM Routes | Implement template list/preview, BOM get/apply-template, slot assign, coverage/gaps endpoints. | Routes use loaded templates and create/update BOM slot assignments. | 5 | python-backend-engineer, backend-architect | DATA-003 |
| ROUTE-004 | Context/Policy/Audit Routes | Implement context-pack draft/preview/export, policy evaluate, audit events, integration status. | Routes enforce policy and expose local integration status. | 4 | backend-architect, python-backend-engineer | SVC-005, SVC-006 |
| ROUTE-005 | OpenAPI Parity Test | Add a test or script to compare implemented route set with `shared/openapi.yaml`. | Drift is reported in CI/local validation. | 3 | api-documenter, python-backend-engineer | ROUTE-004 |

## Detailed Task Specifications

### DATA-002: JSONL Repository Layer

Files involved:

- `api/app/repositories/jsonl.py` - atomic read/write helpers.
- `api/app/repositories/projects.py` - project repository.
- `api/app/repositories/assets.py` - asset/link/relationship repository.
- `api/app/repositories/bom.py` - BOM and slot repositories.
- `api/app/repositories/context_packs.py` - pack repository.
- `api/app/settings.py` - resolve config and registry paths.

Implementation notes:

- Use structured JSON parsing line-by-line; do not mutate files with string replacement.
- Preserve unknown `metadata` fields so future integrations do not lose data.
- Prefer deterministic IDs for seed/demo data and generated IDs for new records.
- Use atomic temp-file replace for updates.
- Treat deletions as archive/tombstone where possible.

Acceptance criteria:

- [ ] Current `registry/*.jsonl` records parse without loss.
- [ ] Repository writes preserve JSONL validity.
- [ ] Concurrent-ish writes cannot produce partial files in normal local use.
- [ ] Tests cover malformed JSONL and missing files.

### SVC-003: Import And Index Service

MVP import should support:

- Local path asset import where the API records metadata and hash but does not broadly expose content.
- URL/manual reference import.
- Project assignment and default status `inbox` or `raw`.
- Default sensitivity/access from `config/workspace.yaml`.
- Duplicate detection by hash when local content is available.

Acceptance criteria:

- [ ] File import records `source_kind`, `uri`, `mime_type`, `size_bytes`, `hash_sha256`, `captured_at`.
- [ ] URL import records `source_kind=url` and does not try to fetch remote content unless explicitly allowed.
- [ ] Duplicate hash creates relationship or returns existing asset with clear status.
- [ ] Every import emits `asset_added` event.

### SVC-005: Policy Service

Policy rules:

- `include=metadata` is allowed for most assets except explicit `agent_access=none`.
- `include=preview` requires `preview_allowed`, `read_allowed`, or `context_pack_allowed` with approved pack context.
- `include=content` requires `read_allowed` and is denied for `client_sensitive` or `restricted` without explicit approval.
- Context-pack inclusion of sensitive assets requires review or draft-only state.

Acceptance criteria:

- [ ] Denials return a policy reason and produce `policy_denied`.
- [ ] Downgrades return metadata with denied include mode noted.
- [ ] Canonical promotion cannot occur without project, type, sensitivity, provenance, and review marker.

## Quality Gates

- [ ] API tests cover repositories, services, routes, policy denials, and OpenAPI route parity.
- [ ] Registry validation passes for existing seeds.
- [ ] Backend no longer returns hard-coded project-only data for implemented resources.
- [ ] Import/index flow works for at least markdown, PNG, PDF-as-reference, and URL assets.
- [ ] OpenAPI, Pydantic models, and seed registry fixtures are aligned.
- [ ] No route gives agents filesystem-wide access.

## Integration Points

- MeatyWiki export writer begins in Phase 4 but asset model must include `meatywiki_page_ref`.
- IntentTree node refs are string IDs in asset links and context-pack targets.
- CCDash events start as Atlas events with optional export mapping.
- SkillMeat references remain metadata until package promotion is added.

## Validation Commands

```bash
cd api && python3 -m pytest -q
python3 -m compileall api/app
python3 - <<'PY'
from pathlib import Path
import json
for path in Path("registry").glob("*.jsonl"):
    for line in path.read_text().splitlines():
        if line.strip():
            json.loads(line)
print("registry jsonl valid")
PY
```

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| JSONL updates become brittle | High | Centralize writes in repository layer and add validation tests. |
| Dependency setup diverges across machines | Medium | Record exact setup commands and lock files where practical. |
| Thumbnail/PDF dependencies slow MVP | Medium | Support images/text first; model previews as optional adapters. |
| OpenAPI drifts from implementation | High | Add parity check in this phase. |

[Return to Parent Plan](../artifact-atlas-app-completion-v1.md)
