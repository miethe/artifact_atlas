# Phase 3: Artifact BOM, Templates, And Coverage

**Parent Plan**: [Artifact Atlas App Completion](../artifact-atlas-app-completion-v1.md)  
**Duration**: 3-5 weeks  
**Effort**: 50 points  
**Dependencies**: Phase 1 services and Phase 2 shell/assets available  
**Primary Subagents**: backend-architect, data-layer-expert, python-backend-engineer, frontend-developer, ui-engineer-enhanced

## Phase Overview

Phase 3 implements the template-driven Artifact BOM system: template library, apply wizard, BOM overview, slot assignment, inbox-to-BOM mapping, coverage/gaps, and light template builder. This phase converts Artifact Atlas from a visual asset library into a readiness and expected-artifact control surface.

## Goals

- Load, preview, duplicate, and apply artifact templates.
- Create project BOMs and slots from one or more templates.
- Assign assets to slots manually through form and drag/drop.
- Calculate coverage and gaps by domain, phase, template, and required/optional status.
- Build UI surfaces matching BOM, template, mapping, coverage, and builder mockups.
- Keep task creation from BOM gaps explicit and draft-only.

## Architecture Focus

- **Layer**: BOM/template data model, coverage service, slot assignment workflows, dense UI control surfaces.
- **Patterns**: Template-to-instance expansion, immutable template history with editable project BOM state, confidence-scored suggestions, explicit publish/commit actions.
- **Standards**: Source spec sections 8.7-8.12, 10.4, 18.3, 25.3, mockup inventory.

## Task Breakdown

### Epic: Template And BOM Backend

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| BOM-BE-001 | Template Registry Service | Load YAML templates and JSONL template records into canonical template/domain/slot models. | `new-product-app` and `architecture-initiative` load with expected counts and domains. | 4 | data-layer-expert, python-backend-engineer | Phase 1 |
| BOM-BE-002 | Template Preview API | Return template domains, artifact types, counts, required/optional counts, and project readiness preview. | UI can preview impact before applying. | 3 | python-backend-engineer | BOM-BE-001 |
| BOM-BE-003 | Apply Template Service | Create or merge `project_bom`, `bom_slot`, and source template references. | Applying a template is idempotent or conflict-aware and emits event. | 6 | backend-architect, data-layer-expert | BOM-BE-001 |
| BOM-BE-004 | Slot Assignment Service | Assign/unassign assets to slots with assignment status and confidence. | Assignments update asset links and emit audit/BOM events. | 5 | python-backend-engineer | BOM-BE-003, Phase 1 assets |
| BOM-BE-005 | Coverage Service Expansion | Implement slot status rules and weighted coverage by domain/phase/template. | Missing, partial, in progress, complete, stale, blocked, N/A produce correct scores. | 5 | backend-architect, data-layer-expert | BOM-BE-004 |
| BOM-BE-006 | Gap Recommendations | Generate basic deterministic recommendations for missing/stale/partial slots. | Gaps are actionable and do not auto-create IntentTree tasks. | 3 | backend-architect | BOM-BE-005 |
| BOM-BE-007 | Template Builder Persistence | Save custom template drafts with domains, slots, artifact properties, required rules, staleness, guidance. | Draft templates can be saved and previewed; publishing requires explicit action. | 5 | python-backend-engineer, data-layer-expert | BOM-BE-001 |

### Epic: BOM And Template UI

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| BOM-UI-001 | Template Library | Build filterable template table/list with right preview inspector. | Matches `template_library_overview_dashboard.png` direction. | 4 | ui-engineer-enhanced, frontend-developer | BOM-BE-002 |
| BOM-UI-002 | Apply Template Wizard | Implement choose/configure/review/apply steps with merge/options. | Matches wizard mockup and requires confirmation before slot creation. | 5 | frontend-developer, ui-engineer-enhanced | BOM-BE-003 |
| BOM-UI-003 | BOM Overview | Build KPI row, domain tabs, slot grid, quick actions, template sources, legend. | Matches `artifact_bom_project_dashboard_interface.png` with real coverage data. | 6 | ui-engineer-enhanced | BOM-BE-005 |
| BOM-UI-004 | Slot Card Interactions | Implement click, assign, unassign, mark N/A, request asset, view assignments. | All actions route through API and audit-sensitive actions confirm. | 5 | frontend-developer | BOM-UI-003, BOM-BE-004 |
| BOM-UI-005 | Inbox To BOM Mapping | Build inbox list, BOM slot grid, suggested classification panel, drag/drop and keyboard mapping. | Matches `saas_ui_dashboard_with_inbox_mapping.png`; confidence states visible. | 6 | ui-engineer-enhanced, frontend-developer | BOM-BE-004 |
| BOM-UI-006 | Coverage And Gaps | Build readiness score, matrix, recommendations, quick actions, legend. | Matches `coverage_and_gaps_dashboard_overview.png`; no task creation without explicit request. | 5 | frontend-developer, ui-engineer-enhanced | BOM-BE-006 |
| BOM-UI-007 | Light BOM Builder | Build artifact type library, structure canvas, properties inspector for draft templates. | Matches `artifact_atlas_project_template_interface.png` enough for v0 template edits. | 6 | ui-engineer-enhanced, frontend-developer | BOM-BE-007 |

## Coverage Rules

Implement slot status with deterministic rules:

- `not_applicable`: excluded from required denominator.
- `missing`: required slot has no accepted assignment.
- `partial`: only suggested assignment exists, confidence is uncertain, or min asset count unmet.
- `in_progress`: accepted asset exists with raw/candidate/in_progress status.
- `complete`: selected/canonical asset exists and review requirements are satisfied.
- `stale`: assigned asset exceeds staleness threshold or is superseded.
- `blocked`: missing dependency or explicit blocker state.

Coverage score:

- Required complete slots divided by required active slots for the primary score.
- Optional coverage tracked separately.
- Domain/template scores shown alongside total score.
- Stale/blocked slots appear in gap counts even if an asset is assigned.

## Template Semantics

Clarify counts before implementation:

- `artifact_template`: reusable definition.
- `artifact_type`: expected type like PRD, API Specification, UI Mockups.
- `artifact_template_slot`: definition of a type within domain/phase.
- `project_bom`: applied instance for a project.
- `bom_slot`: project-specific slot created from templates or custom additions.

Do not treat template count, artifact type count, and project slot count as interchangeable UI values.

## UI States

Required states:

- Empty/missing dotted slot.
- Filled slot with assigned asset thumbnail.
- Complete, in progress, partial, stale, blocked, N/A, optional.
- Drag valid/invalid target.
- Suggested high/medium/low/conflict match.
- Merge conflict when template application overlaps existing slots.
- Draft vs published template.
- Syncing/applying/saving/failed states.

## Quality Gates

- [ ] Applying seed templates creates project slots and correct coverage baseline.
- [ ] Assigning an asset to a slot updates asset links, slot assignment, coverage, and events.
- [ ] Template library/apply wizard/BOM/mapping/coverage screens render with real API data.
- [ ] Gaps are actionable but IntentTree task creation is explicit and draft-only.
- [ ] Coverage service tests cover all slot statuses and edge cases.
- [ ] Drag/drop surfaces have non-drag alternatives.
- [ ] Template/BOM fixture counts are consistent across screens.

## Key Files

| File Path | Purpose | Subagent |
|---|---|---|
| `templates/*.yaml` | Seed template source | data-layer-expert |
| `registry/bom.jsonl` | Local BOM records | data-layer-expert |
| `registry/templates.jsonl` | Local template records | data-layer-expert |
| `api/app/services/bom_service.py` | Template apply and assignment logic | backend-architect |
| `api/app/services/coverage.py` | Expanded coverage rules | backend-architect |
| `api/app/api/bom.py` | BOM endpoints | python-backend-engineer |
| `api/app/api/templates.py` | Template endpoints | python-backend-engineer |
| `web/features/bom/*` | BOM UI feature module | frontend-developer |
| `web/features/templates/*` | Template UI feature module | frontend-developer |
| `web/features/coverage/*` | Coverage/gaps feature module | ui-engineer-enhanced |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Counts and definitions drift | High | Freeze template/type/slot semantics and test fixture counts. |
| BOM UI becomes too complex | High | Ship overview, apply, assign, coverage first; keep builder light. |
| Template merge creates duplicate slots | Medium | Implement idempotent keys and conflict preview before apply. |
| Agents auto-fill slots incorrectly | High | Keep auto-suggest as draft/suggestion until user accepts. |

## Validation Commands

```bash
cd api && python3 -m pytest -q
cd web && npm run typecheck
```

Add focused tests:

- `test_apply_template_creates_slots`
- `test_slot_assignment_updates_coverage`
- `test_stale_and_not_applicable_coverage_rules`
- `test_gap_task_creation_is_suggestion_only`

[Return to Parent Plan](../artifact-atlas-app-completion-v1.md)
