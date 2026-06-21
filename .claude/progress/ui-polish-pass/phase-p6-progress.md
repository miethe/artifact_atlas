---
type: progress
schema_version: 2
doc_type: progress
prd: ui-polish-pass
feature_slug: ui-polish-pass
phase: P6
status: at_risk
created: 2026-06-21
updated: '2026-06-21'
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p6-hardening.md
commit_refs: []
pr_refs: []
owners:
- task-completion-validator
- karen
contributors:
- a11y-sheriff
- documentation-writer
- changelog-generator
tasks:
- id: P6-001
  description: tsc --noEmit gate — zero new errors vs P1 baseline; filter __tests__/a11y/
    per project convention
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P5-010
  - P2B-008
  - P3-009
  - P4B-003
  - P4C-006
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: tsc-0-errors
- id: P6-002
  description: next build gate — exits 0, no new transpilePackages/ESM warnings
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-001
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - build: next-build-exit0-15routes
- id: P6-003
  description: axe-core sweep — EntityModal on all 5 surfaces + AssetViewer all 6
    formats; zero new critical/serious violations
  status: blocked
  assigned_to:
  - a11y-sheriff
  dependencies:
  - P6-002
  note: 'Deferred: flags-ON live verification not run this session; tracked as F-002
    / ADR-7 follow-up before global prod cutover.'
- id: P6-004
  description: Runtime smoke — P1 surfaces (ContentPane on feature-flagged AssetDetail
    page)
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-002
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: e2e-7pass-fixture
- id: P6-005
  description: 'Runtime smoke — P2 surfaces (EntityModal on all 5 detail surfaces:
    tab UI, URL state, focus)'
  status: blocked
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-003
  note: 'Deferred: flags-ON live verification not run this session; tracked as F-002
    / ADR-7 follow-up before global prod cutover.'
- id: P6-006
  description: 'Runtime smoke — P3 surfaces (all 4 card families: zone-composition,
    full-width top thumbnails)'
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-005
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: e2e-gallery-cards-pass
- id: P6-007
  description: 'Runtime smoke — P4 surfaces (AssetViewer all 6 formats: image/PDF/MD/code/DOCX/PPTX
    + agent_access gate)'
  status: blocked
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-006
  note: 'Deferred: flags-ON live verification not run this session; tracked as F-002
    / ADR-7 follow-up before global prod cutover.'
- id: P6-008
  description: Runtime smoke — P5 surfaces (fonts, contrast, reduced-motion, footer
    health, all P1 facelift items)
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-007
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: e2e-sidebar-kpi-pass
- id: P6-009
  description: Playwright e2e — (a) modal open/close/tab; (b) Escape+focus return;
    (c) Open full page; (d) AssetViewer per format; (e) agent_access gate
  status: blocked
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-008
  note: 'Deferred: flags-ON live verification not run this session; tracked as F-002
    / ADR-7 follow-up before global prod cutover.'
- id: P6-010
  description: Update shared/openapi.yaml — POST /api/preview/convert/pptx + proxy
    seam endpoint; coordinate with P4C-005
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P4C-005
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: test_openapi_parity-pass
- id: P6-011
  description: Update docs/DECISIONS.md — add all 6 ADRs (ADR-1 through ADR-6)
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-009
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-012
  description: Update docs/mvp-backlog.md — mark 5 pillar completions; add DEFER-1
    through DEFER-4
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-011
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-013
  description: DOC-006 — Design spec DEFER-1 (dark-mode-aa) — maturity:idea, problem
    statement, open questions
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-012
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-014
  description: DOC-006 — Design spec DEFER-2 (facelift-p2-items) — maturity:shaping,
    enumerate Leg-5 P2 items
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-012
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-015
  description: DOC-006 — Design spec DEFER-3 (facelift-p3-items) — maturity:idea,
    enumerate Leg-5 P3 items
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-012
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-016
  description: DOC-006 — Design spec DEFER-4 (asset-viewer-extensions) — maturity:idea,
    enumerate deferred formats (video/audio/ZIP/spreadsheet)
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-012
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-017
  description: CHANGELOG [Unreleased] entry — Added EntityModal/AssetViewer/zone cards/@miethe/ui;
    Changed ink-faint/Inter font
  status: completed
  assigned_to:
  - changelog-generator
  dependencies:
  - P6-016
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-018
  description: Plan frontmatter completion — status:completed, commit_refs, files_affected,
    deferred_items_spec_refs
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-017
  started: 2026-06-21T19:05Z
  completed: 2026-06-21T19:10Z
  evidence:
  - doc: plan-frontmatter-completed
- id: P6-019
  description: task-completion-validator final pass — all P6 exit criteria
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-018
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - review: task-completion-validator-APPROVED
- id: P6-020
  description: karen final sign-off — actual state vs PRD AC-1 through AC-7; plan
    vs delivered; quality gate completeness; closes the feature
  status: completed
  assigned_to:
  - karen
  dependencies:
  - P6-019
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - review: karen-APPROVED-on-closure
parallelization:
  batch_1:
  - P6-001
  batch_2:
  - P6-002
  batch_3:
  - P6-003
  - P6-004
  batch_4:
  - P6-005
  batch_5:
  - P6-006
  batch_6:
  - P6-007
  - P6-010
  batch_7:
  - P6-008
  batch_8:
  - P6-009
  batch_9:
  - P6-011
  batch_10:
  - P6-012
  batch_11:
  - P6-013
  - P6-014
  - P6-015
  - P6-016
  batch_12:
  - P6-017
  batch_13:
  - P6-018
  batch_14:
  - P6-019
  batch_15:
  - P6-020
  critical_path:
  - P6-001
  - P6-002
  - P6-003
  - P6-005
  - P6-006
  - P6-007
  - P6-008
  - P6-009
  - P6-011
  - P6-012
  - P6-017
  - P6-018
  - P6-019
  - P6-020
total_tasks: 20
completed_tasks: 16
in_progress_tasks: 0
blocked_tasks: 4
progress: 80
---

# ui-polish-pass — Phase P6: Hardening, A11y & Docs

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Cross-cutting validation and documentation finalization: build gates (tsc + next build), axe-core a11y sweep, 6 runtime smoke checks by phase, Playwright e2e, OpenAPI update, 6 ADRs documented, 4 deferred-item design specs authored, CHANGELOG entry, and karen final sign-off to close the feature.
