# Phase 5: Release Hardening

**Parent Plan**: [Artifact Atlas App Completion](../artifact-atlas-app-completion-v1.md)  
**Duration**: 2-3 weeks  
**Effort**: 32 points  
**Dependencies**: Phases 1-4 feature-complete for MVP  
**Primary Subagents**: testing specialist, web-accessibility-checker, code-reviewer, DevOps, documentation-writer

## Phase Overview

Phase 5 turns the MVP into something shippable for local-first use. It closes test gaps, validates visual fidelity against mockups, hardens policy-sensitive flows, documents setup and operation, and produces demo data for the intended pilot on real generated assets.

## Goals

- Make setup, tests, and local run commands reproducible.
- Add backend, frontend, API contract, policy, export, and integration tests.
- Validate UI against the mockup direction across desktop breakpoints.
- Confirm accessibility, keyboard navigation, focus behavior, and non-drag alternatives.
- Verify performance targets for local asset libraries.
- Update project docs and handoff artifacts.

## Architecture Focus

- **Layer**: Testing, validation, documentation, local deployment.
- **Patterns**: Contract tests, golden fixtures, visual smoke tests, policy regression tests, release checklist.
- **Standards**: MVP acceptance criteria from source spec section 30, repo quality gates from `CLAUDE.md`.

## Task Breakdown

### Epic: Test Coverage

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| TEST-001 | Backend Unit Tests | Cover repositories, schemas, services, coverage rules, policy service. | Core service tests pass and cover edge cases. | 5 | python-backend-engineer, testing specialist | Phases 1-4 |
| TEST-002 | API Integration Tests | Cover project/assets/inbox/templates/BOM/context/policy/audit endpoints. | Main API workflows pass with local registry fixtures. | 5 | testing specialist, python-backend-engineer | TEST-001 |
| TEST-003 | OpenAPI Contract Tests | Compare implemented endpoints and response models with `shared/openapi.yaml`. | Drift fails clearly. | 3 | api-documenter, testing specialist | TEST-002 |
| TEST-004 | Frontend Component/State Tests | Cover asset filters, drawer, forms, BOM slot assignment, context pack wizard. | Critical UI state transitions pass. | 4 | frontend-developer, testing specialist | Phases 2-4 |
| TEST-005 | E2E Smoke Tests | Cover import asset, classify, apply template, assign slot, build context pack, export. | One local-first happy path passes headlessly. | 5 | testing specialist | TEST-004 |
| TEST-006 | Policy Regression Tests | Cover denied content access, sensitive publish gate, canonical promotion gate, destructive action confirmation. | Unsafe access cannot pass silently. | 4 | backend-architect, testing specialist | Phases 1, 4 |

### Epic: Visual, Accessibility, Performance

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| QA-001 | Visual Smoke Matrix | Capture screenshots at `1672x941`, `1440x900`, `1280x800` for core screens. | No overlap/clipping; shell proportions match mockup direction. | 4 | ui-designer, testing specialist | Phase 2-4 UI |
| QA-002 | Accessibility Audit | Validate keyboard navigation, focus states, labels, drawer/modal traps, non-color status cues. | WCAG-oriented checklist passes for MVP screens. | 4 | web-accessibility-checker, ui-engineer-enhanced | QA-001 |
| QA-003 | Performance Baseline | Measure asset grid first paint and filter latency with generated 1k/10k fixture records. | First 100 visible assets load under target locally or bottlenecks documented. | 4 | react-performance-optimizer, backend-architect | TEST-002 |
| QA-004 | Export Portability Check | Validate JSONL/YAML/Markdown exports can be parsed independently. | Registry, asset cards, context packs, events parse in clean process. | 3 | testing specialist | Phases 1, 4 |

### Epic: Documentation And Release Prep

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| DOC-001 | README Setup Update | Document install/run/test commands, bundled-runtime caveats, local mode. | New contributor can run API/web tests with documented commands. | 2 | documentation-writer | TEST-002 |
| DOC-002 | Developer Architecture Guide | Update architecture docs for repositories, services, UI modules, policy, exports. | Maintainers understand boundaries and extension points. | 3 | documentation-complex | Phases 1-4 |
| DOC-003 | User Workflow Guide | Document local asset import, template apply, slot assignment, context-pack export. | User can complete MVP workflows from guide. | 3 | documentation-writer | TEST-005 |
| DOC-004 | ADR And Backlog Closeout | Update `docs/DECISIONS.md` and `docs/mvp-backlog.md` with completed/deferred scope. | MVP done/deferred items are explicit. | 2 | lead-pm, documentation-writer | TEST-005 |
| REL-001 | Demo Fixture Pack | Add realistic non-sensitive demo assets/registry fixtures for screenshots and e2e. | Demo data covers command center, assets, BOM, coverage, context packs. | 4 | testing specialist, ui-designer | TEST-002 |
| REL-002 | Pilot Checklist | Prepare checklist for pilot with 25 real ChatGPT image outputs. | Checklist covers import, classify, assign, pack, policy, export, telemetry. | 2 | lead-pm | DOC-003 |

## Release Acceptance Checklist

- [ ] API and frontend dependencies are installable.
- [ ] API tests pass.
- [ ] Frontend typecheck/build passes.
- [ ] OpenAPI parity check passes.
- [ ] Registry/template/context-pack export validation passes.
- [ ] E2E smoke path passes.
- [ ] Policy-sensitive flows have explicit gates and audit events.
- [ ] Core UI screens pass visual smoke checks.
- [ ] Keyboard and non-drag action paths exist for mapping/assignment flows.
- [ ] README, architecture, user workflow guide, ADRs, and backlog are updated.

## Visual QA Screen List

Capture and inspect:

- Project Command Center.
- Asset Library with right drawer open.
- Asset Detail/Review.
- Inbox Triage.
- Feature/Topic Board.
- Artifact BOM Overview.
- Template Library.
- Apply Template Wizard.
- Inbox to BOM Mapping.
- Coverage & Gaps.
- Context Pack Builder.

## Performance Fixtures

Generate fixture sets:

- 100 assets for default demo.
- 1,000 assets for realistic local project.
- 10,000 metadata-only assets for target local scale.
- Mixed source kinds: local, ChatGPT, Figma, PDF, markdown, GitHub, URL.
- Mixed sensitivities and statuses.
- Multiple templates and partial/missing/stale slots.

## Documentation Deliverables

| File | Update |
|---|---|
| `README.md` | Setup, run, test, local-first mode |
| `docs/architecture.md` | Implemented architecture and integration boundaries |
| `docs/agent-handoff.md` | Agent-facing usage, CLI/MCP, context packs |
| `docs/DECISIONS.md` | Storage, policy, gateway, UI architecture decisions |
| `docs/mvp-backlog.md` | Completed/deferred MVP tasks |
| `docs/user-workflows.md` | New guide for MVP workflows |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Tests arrive too late to influence design | High | Add tests progressively in each phase; Phase 5 fills gaps. |
| Visual QA is subjective | Medium | Use mockup-derived concrete checks: shell proportions, density, no clipping, state coverage. |
| Performance misses 10k local target | Medium | Virtualize asset lists and keep previews lazy. |
| Demo data contains sensitive local paths | High | Generate synthetic fixtures and scrub real pilot output before committing. |

## Validation Commands

```bash
cd api && python3 -m pytest -q
cd web && npm run typecheck && npm run build
python3 scripts/validate_registry_exports.py
```

If script names differ, add them as part of this phase and update docs.

[Return to Parent Plan](../artifact-atlas-app-completion-v1.md)
