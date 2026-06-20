# Phase 4: Context Packs, Agent Gateway, And Integrations

**Parent Plan**: [Artifact Atlas App Completion](../artifact-atlas-app-completion-v1.md)  
**Duration**: 3-5 weeks  
**Effort**: 46 points  
**Dependencies**: Phase 1 policy/audit APIs, Phase 2 assets UI, Phase 3 BOM coverage  
**Primary Subagents**: backend-architect, python-backend-engineer, documentation-complex, frontend-developer, api-documenter

## Phase Overview

Phase 4 completes the agent-facing side of Artifact Atlas. It builds context-pack workflows, YAML/Markdown exports, read-first CLI/MCP tools, and local-first integration seams with MeatyWiki, IntentTree, SkillMeat/SAM, CCDash, and the Agentic Control Plane.

## Goals

- Build Context Pack Builder UI and APIs from selected assets, BOM slots, project, or IntentTree node.
- Enforce policy envelopes, include modes, sensitivity, token/payload estimates, and publish gates.
- Export context-pack YAML and MeatyWiki-compatible asset cards.
- Implement local `atlas` CLI entry points for MVP workflows.
- Implement read-first MCP tools for asset search/get, BOM coverage, node context, project snapshot, and event recording.
- Emit local CCDash-compatible event records and Control Plane routing-signal snapshots.

## Architecture Focus

- **Layer**: Context-pack service, policy-aware retrieval, CLI/MCP gateway, integration export adapters.
- **Patterns**: Draft-first writes, policy envelope, scoped retrieval, audit logging, local-first sync/export.
- **Standards**: Source spec sections 8.13, 14.3, 15, 16, 19, 24, 26.

## Task Breakdown

### Epic: Context Pack Backend And UI

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| CP-BE-001 | Context Pack Service | Create draft/update/list/get pack workflows and context item management. | Packs can include assets, pages, nodes, BOM slots, URLs, and notes. | 5 | backend-architect, python-backend-engineer | Phase 1 |
| CP-BE-002 | Pack Builder From Node | Generate draft pack from IntentTree node ref, linked assets, relevant BOM slots, and MeatyWiki refs. | Node pack uses refs only and marks missing integrations clearly. | 4 | backend-architect | CP-BE-001, Phase 3 |
| CP-BE-003 | Policy Envelope And Estimate | Apply include-mode policy checks and estimate token/payload size. | Sensitive assets are downgraded/blocked unless approved; estimate shown. | 4 | backend-architect | CP-BE-001, Phase 1 policy |
| CP-BE-004 | Preview And Export | Render context pack preview and YAML export into `exports/context-packs/`. | Export matches manifest shape in source spec and seed file. | 4 | python-backend-engineer | CP-BE-003 |
| CP-UI-001 | Context Pack Builder UI | Build select-node, choose-assets, instructions, review, publish wizard. | Matches `create_context_pack_dashboard_interface.png`; draft save and preview work. | 6 | frontend-developer, ui-engineer-enhanced | CP-BE-004 |
| CP-UI-002 | Policy Controls UI | Build sensitivity, external data, code execution, network access, audience, expiry, tag controls. | UI maps to backend policy and blocks unsafe publish. | 4 | frontend-developer | CP-UI-001 |

### Epic: MeatyWiki And IntentTree

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| INT-001 | MeatyWiki Asset Cards | Export asset cards as Markdown/YAML frontmatter with links, sensitivity, node refs, BOM slots. | Export path is deterministic and does not overwrite without confirmation. | 4 | documentation-complex, python-backend-engineer | Phase 1 assets |
| INT-002 | MeatyWiki Decision Notes | Generate suggested decision/writeback notes for template apply, canonical promotion, context-pack publish. | Notes are draft/exported suggestions, not silent writes. | 3 | documentation-complex | INT-001 |
| INT-003 | IntentTree Node Ref Adapter | Create local adapter interface for node lookup/display and node context payloads. | MVP works with manual node fixture/ref and can be replaced by live API later. | 4 | backend-architect | Phase 2 node scaffold |
| INT-004 | Gap To Task Suggestion Payload | Build explicit draft task payload from gaps without auto-creating tasks. | User sees payload and must approve external task creation separately. | 3 | backend-architect, documentation-complex | Phase 3 gaps |

### Epic: SkillMeat, CCDash, Control Plane

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| SM-001 | SkillMeat Reference Metadata | Add template/context-pack fields for SkillMeat/SAM bundle refs, SkillBOM refs, Golden Context Pack candidate status. | Data model and UI can show refs without requiring live SkillMeat API. | 3 | backend-architect | CP-BE-001 |
| CCD-001 | CCDash Event Export | Map Atlas events to CCDash event payloads and export JSONL/webhook-ready files. | Context pack publish, asset use, BOM gap resolution events export locally. | 4 | python-backend-engineer | Phase 1 audit |
| CP-CTRL-001 | Control Plane Signal Export | Generate project snapshot/routing signal from coverage, gaps, packs, canonical assets, and policy. | YAML/JSON export matches spec example semantics. | 4 | backend-architect | CP-BE-004, CCD-001 |

### Epic: CLI And MCP Gateway

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| CLI-001 | CLI Entrypoint | Add `atlas` CLI module for init, import, index, inbox list, asset classify/link, BOM status/gaps/assign, pack build/export. | CLI commands call service layer and work in local repo mode. | 6 | python-backend-engineer | Phase 1, Phase 3, CP-BE-004 |
| MCP-001 | MCP Tool Server | Implement read-first MCP tool server or wrapper for asset.search, asset.get, bom.get, bom.coverage, context_pack.create, node.context, project.snapshot, record_event. | Tools enforce policy and audit calls. | 6 | backend-architect, python-backend-engineer | CLI-001 |
| MCP-002 | Gateway Tests | Add tests for include-mode denials, sensitive asset access, context-pack allowed access, and write-suggestion behavior. | Tests prove no broad file access and write defaults are suggestions. | 4 | testing specialist, backend-architect | MCP-001 |

## Context Pack Rules

- Draft creation is always allowed if policy metadata can be evaluated.
- Publish is blocked for sensitive assets requiring review.
- Assets can be included as `metadata`, `preview`, `summary`, `full`, or `link_only` only when policy allows.
- Pack export should reference asset IDs and URIs; it should not inline restricted content.
- Publishing emits audit and CCDash export event.

## MCP Tool Policy

Implement these MVP tools:

- `asset.search`: metadata-only result summaries.
- `asset.get`: metadata/preview/content based on include mode and policy.
- `bom.get`: project BOM summary.
- `bom.coverage`: coverage and gaps by domain/phase/template.
- `context_pack.create`: draft pack creation only.
- `intent_node.context`: local node context refs and linked assets.
- `project.snapshot`: routing-signal snapshot.
- `atlas.record_event`: append event record.

Deferred:

- Live external connector sync.
- Autonomous canonical promotion.
- Direct IntentTree task creation.
- Full-content access for restricted/client-sensitive assets without approval.

## Integration Output Paths

| Output | Target path | Notes |
|---|---|---|
| Context pack manifests | `exports/context-packs/*.yaml` | Agent handoff and MCP publish source |
| MeatyWiki asset cards | `exports/meatywiki/assets/*.md` or configured vault path | Draft by default |
| Decision-note suggestions | `exports/meatywiki/decisions/*.md` | Draft/writeback candidate |
| CCDash events | `exports/events/ccdash-events.jsonl` | Local-first event export |
| Control Plane signals | `exports/control-plane/*.yaml` | Routing snapshot |

## Quality Gates

- [ ] Context Pack Builder creates, previews, saves, and exports a pack.
- [ ] Sensitive asset publish requires explicit review/approval state.
- [ ] MeatyWiki export writes draft asset cards with valid frontmatter.
- [ ] IntentTree node context works from manual refs and exposes linked assets/BOM slots.
- [ ] CCDash and Control Plane exports are generated from real Atlas events/state.
- [ ] CLI commands work against local repositories.
- [ ] MCP tools are read-first, policy-aware, and audited.
- [ ] Tests prove content access is denied/downgraded correctly.

## Key Files

| File Path | Purpose | Subagent |
|---|---|---|
| `exports/context-packs/*.yaml` | Context pack exports | python-backend-engineer |
| `api/app/services/context_pack_service.py` | Pack creation/export logic | backend-architect |
| `api/app/services/policy_service.py` | Access checks reused by API/CLI/MCP | backend-architect |
| `api/app/services/meatywiki_sync.py` | Draft asset card/decision note export | documentation-complex |
| `api/app/services/intenttree_sync.py` | Node ref adapter | backend-architect |
| `api/app/services/ccdash_client.py` | Event export adapter | python-backend-engineer |
| `api/app/services/skillmeat_client.py` | SkillMeat reference adapter | backend-architect |
| `api/app/cli/atlas.py` | CLI entrypoint | python-backend-engineer |
| `api/app/mcp/server.py` | MCP server | backend-architect |
| `web/features/context-packs/*` | Context-pack UI | frontend-developer |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| MCP exposes too much content | High | Reuse policy service and audit every call. |
| Integrations become live-sync rabbit holes | High | MVP uses refs/exports/drafts only. |
| Context packs duplicate source systems | Medium | Reference MeatyWiki/node/asset IDs and include modes instead of embedding everything. |
| CLI and API drift | Medium | CLI calls service layer, not separate implementations. |

## Validation Commands

```bash
cd api && python3 -m pytest -q
python3 -m app.cli.atlas bom status artifact-atlas
python3 -m app.cli.atlas pack build --project artifact-atlas --out /tmp/context-pack.yaml
```

Exact CLI invocation can change if packaged entry points are added; keep service tests authoritative.

[Return to Parent Plan](../artifact-atlas-app-completion-v1.md)
