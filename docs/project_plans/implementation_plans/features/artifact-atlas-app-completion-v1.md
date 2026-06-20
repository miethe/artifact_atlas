---
title: "Artifact Atlas App Completion - Implementation Plan"
description: "Token-efficient phased plan to complete the Artifact Atlas local-first app, UI workflows, Artifact BOM, context packs, agent gateway, and designed integrations."
audience: [ai-agents, developers]
tags: [artifact-atlas, implementation, planning, uiux, bom, context-packs, integrations]
created: 2026-06-19
updated: 2026-06-19
category: "product-planning"
status: draft
related:
  - /Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md
  - /docs/PRD.md
  - /docs/architecture.md
  - /docs/mvp-backlog.md
  - /docs/DECISIONS.md
  - /AGENTS.md
  - /CLAUDE.md
---

# Implementation Plan: Artifact Atlas App Completion

**Plan ID**: `IMPL-2026-06-19-ARTIFACT-ATLAS-APP-COMPLETION`  
**Date**: 2026-06-19  
**Author**: Codex implementation planner with delegated explorer review  
**Complexity**: XL  
**Target**: Local-first MVP, then v1 completion track  
**Source of Truth**: `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md`

## Executive Summary

Artifact Atlas is currently an early scaffold: a static Next.js shell, a minimal FastAPI service, seed JSONL/YAML registry files, template YAMLs, and local project instructions. This plan turns the source PRD/UIUX package and mockups into an executable build program for the proposed app: asset registry, visual curation, Artifact BOM, templates, context-pack builder, read-first CLI/MCP agent gateway, and integrations with MeatyWiki, IntentTree, SkillMeat/SAM, CCDash, and the Agentic Control Plane.

The first release should preserve the core product boundary: Artifact Atlas owns asset metadata, relationships, BOM state, context-pack workflow state, and agent access policy, while MeatyWiki owns rationale, IntentTree owns task hierarchy, SkillMeat owns reusable skills/templates, and CCDash owns execution telemetry.

## Current Baseline

| Area | Current state | Completion requirement |
|---|---|---|
| Frontend | `web/app/page.tsx` static command-center shell, no routing/data fetching | Next.js App Router feature modules for Projects, Assets, Inbox, BOM, Templates, Coverage, Context Packs, Integrations |
| API | `api/app/main.py` has `/health` and `/api/projects` only | FastAPI routers, services, schemas, OpenAPI, policy/audit, registry-backed storage |
| Data | Seed `registry/*.jsonl`, `templates/*.yaml`, `config/*.yaml` | Read/write repositories, validation, migrations to SQLite-compatible model, portable exports |
| Integrations | Config placeholders and docs only | Local-first MeatyWiki export, IntentTree refs, SkillMeat refs, CCDash event export, Control Plane signals |
| Agent gateway | Spec only | CLI entry points plus read-first MCP tools with policy evaluation and audit logging |
| Mockups | 14 PNG references | Implement shared app shell and screen-specific layouts as design direction, not pixel-perfect screenshots |
| Operator/SkillMeat | Existing T4 run record is `awaiting_plan_approval`; local SkillMeat skills deployed | Keep this plan as the approval artifact; do not create a new T4 run unless explicitly requested |

## Non-Negotiable Product Rules

- Agents must use scoped CLI/API/MCP/context-pack surfaces, not broad raw filesystem access.
- Sensitive assets default to metadata-only or preview-only access.
- Canonical promotion is explicit and human-reviewed unless a future policy allows otherwise.
- BOM gap to IntentTree task creation is an explicit action, never automatic.
- Artifact Atlas does not replace MeatyWiki, IntentTree, SkillMeat, CCDash, Figma, Drive, or GitHub.
- Local-first mode must avoid external model calls by default.
- JSONL/YAML/Markdown exports remain readable and portable.

## Plan Structure

Detailed tasks are split into phase files for progressive disclosure. Load this parent first, then the phase file for the active work.

| Phase | Focus | Primary deliverables | Subagent owners | Details |
|---|---|---|---|---|
| 0 | Decisions and contracts | ADRs, OpenAPI alignment, policy baseline, implementation backlog | lead-architect, implementation-planner | [Phase 0](./artifact-atlas-app-completion-v1/phase-0-decisions-contracts.md) |
| 1 | Local registry and API foundation | Pydantic models, JSONL repositories, import/index services, API routers | data-layer-expert, python-backend-engineer | [Phase 1](./artifact-atlas-app-completion-v1/phase-1-local-registry-api-foundation.md) |
| 2 | Web shell and asset workflows | App shell, asset library/detail, inbox triage, command palette, visual QA baseline | ui-designer, ui-engineer-enhanced, frontend-developer | [Phase 2](./artifact-atlas-app-completion-v1/phase-2-web-shell-asset-workflows.md) |
| 3 | Artifact BOM and templates | Template library, apply wizard, BOM overview, inbox mapping, coverage/gaps | backend-architect, data-layer-expert, frontend-developer | [Phase 3](./artifact-atlas-app-completion-v1/phase-3-bom-templates-coverage.md) |
| 4 | Context packs and integrations | Context-pack builder, MeatyWiki/IntentTree/SkillMeat/CCDash/Control Plane integration seams | backend-architect, documentation-complex, python-backend-engineer | [Phase 4](./artifact-atlas-app-completion-v1/phase-4-context-packs-agent-gateway-integrations.md) |
| 5 | Release hardening | Tests, accessibility, performance, telemetry, docs, packaging, demo data | testing specialist, web-accessibility-checker, DevOps | [Phase 5](./artifact-atlas-app-completion-v1/phase-5-release-hardening.md) |
| 6 | v1 expansion | AI suggestions, semantic search, external connectors, enterprise policy, hosted mode | lead-architect, backend-architect, react-performance-optimizer | [Phase 6](./artifact-atlas-app-completion-v1/phase-6-v1-expansion.md) |

## Critical Path

1. Freeze local-first contracts: schema, registry files, OpenAPI, policy defaults.
2. Implement registry-backed services and API routers before wiring the UI.
3. Build the shared app shell and asset surfaces, then connect drag/drop workflows to real APIs.
4. Implement templates/BOM/coverage before context-pack generation, because packs need canonical assets, node links, and slot context.
5. Implement policy-aware CLI/MCP retrieval after the same services are covered by tests.
6. Harden with visual, accessibility, API, registry portability, and policy-denial tests before calling MVP complete.

## Parallel Work Plan

Use subagents whenever write scopes are cleanly separable:

- Backend foundation worker owns `api/app/models`, `api/app/services`, `api/app/api`, `shared/openapi.yaml`.
- Frontend shell worker owns `web/app`, `web/components`, `web/features`, `web/lib`.
- BOM/template worker owns `templates`, BOM services, coverage APIs, BOM UI modules.
- Gateway/integration worker owns `api/app/cli`, `api/app/mcp`, integration service stubs, export writers.
- QA/review agents run in parallel after each phase: code review, accessibility review, visual mockup comparison, policy review.

Workers must assume other agents may be editing nearby files, avoid unrelated rewrites, and list changed paths in handoff.

## Mockup Coverage Matrix

| Mockup | Implementation area |
|---|---|
| `artifact_atlas_command_center_interface.png` | Project home, sidebar, top search, KPI panels, MeatyWiki sync status |
| `modern_project_dashboard_overview.png` | Project dashboard variation and responsive density checks |
| `asset_library_dashboard_interface_snapshot.png` | Asset library, filters, view modes, right detail drawer |
| `artifact_atlas_dashboard_with_system_architecture.png` | Asset detail/review and architecture asset preview pattern |
| `modern_saas_dashboard_interface_design.png` | Inbox/capture triage layout |
| `artifact_atlas_dashboard_overview.png` | IntentTree node context/dashboard view |
| `feature_board_management_dashboard_design.png` | Feature/topic board grouped by status/topic/domain |
| `artifact_bom_project_dashboard_interface.png` | BOM overview, slot cards, domain tabs, quick actions |
| `template_library_overview_dashboard.png` | Template library and preview drawer |
| `modern_saas_template_application_dashboard.png` | Apply template wizard |
| `artifact_atlas_project_template_interface.png` | BOM builder/template editor |
| `saas_ui_dashboard_with_inbox_mapping.png` | Inbox to BOM mapping |
| `coverage_and_gaps_dashboard_overview.png` | Coverage matrix and recommendations |
| `create_context_pack_dashboard_interface.png` | Context-pack builder and policy controls |

## Integration Contract

| System | MVP contract | Deferred v1+ contract |
|---|---|---|
| MeatyWiki | Markdown/YAML asset cards, project refs, decision-note suggestions, context-pack exports | Bidirectional sync, richer namespace management |
| IntentTree | Manual node refs, node-context view, context pack from node, explicit task suggestion payloads | API sync and controlled task creation |
| SkillMeat/SAM | Template/context-pack references, Golden Context Pack candidate metadata | Bundle promotion and SkillBOM evidence sync |
| CCDash | JSONL/webhook-style event export for major Atlas events | Live dashboard ingestion and quality feedback loops |
| Agentic Control Plane | Project snapshot and routing-signal export | Hosted routing signal service and policy-aware recommendations |
| Local tools | Watched folders, file paths, URLs, GitHub repo path import | Figma, Drive, GitHub App, Notion, WebDAV, media-library connectors |

## Release Gates

MVP is complete only when:

- A user can create or load a project, import assets, browse in gallery/table, and edit metadata.
- A user can link an asset to an IntentTree node manually.
- A user can apply at least one template, create BOM slots, assign assets, and view coverage/gaps.
- A user can create a context pack from selected assets or a node and export YAML/Markdown.
- CLI and MCP tools serve read-first asset search, asset metadata/preview, BOM coverage, node context, and project snapshot through policy checks.
- MeatyWiki asset-card export and CCDash event export work in local-first mode.
- Policy denials, canonical promotion, sensitive context-pack publish, and destructive actions are audited.
- API tests, frontend typecheck/build, visual smoke tests, accessibility checks, and registry export validation pass.

## Open Decisions To Resolve In Phase 0

- Whether MVP persistence is JSONL-only with repository abstractions, SQLite primary with JSONL export, or both from day one.
- Whether watched-folder ingestion requires a Tauri/desktop wrapper for MVP or remains a backend CLI/server worker.
- Which status vocabulary becomes canonical across MeatyWiki, IntentTree, SkillMeat, CCDash, and Atlas.
- Whether the first MCP implementation is an in-process Python server, a CLI wrapper, or a standalone package.
- Minimum safe personal-mode auth model: local token, trusted loopback only, or no auth with explicit local-only warning.

## Verification Commands

Use the bundled runtime if `node` is not on PATH.

```bash
cd api && python3 -m pytest -q
cd web && npm run typecheck
cd web && npm run build
/Users/miethe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node .agents/skills/skillmeat-cli/scripts/analyze-project.js .
```

## Planning Inputs

- Planning skill: `/Users/miethe/.codex/skills/planning/SKILL.md`
- Source spec: `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md`
- Mockup package: `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/*.png`
- Repo instructions: `AGENTS.md`, `CLAUDE.md`
- Existing local docs: `docs/PRD.md`, `docs/architecture.md`, `docs/implementation-plan.md`, `docs/mvp-backlog.md`, `docs/DECISIONS.md`, `docs/agent-handoff.md`
- Current scaffold: `api/`, `web/`, `shared/openapi.yaml`, `config/`, `registry/`, `templates/`, `exports/`
