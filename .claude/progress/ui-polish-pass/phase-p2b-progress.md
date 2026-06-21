---
type: progress
schema_version: 2
doc_type: progress
prd: ui-polish-pass
feature_slug: ui-polish-pass
phase: P2b
status: completed
created: 2026-06-21
updated: '2026-06-21'
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p2b-surface-migration.md
commit_refs: []
pr_refs: []
owners:
- ui-engineer-enhanced
contributors: []
tasks:
- id: P2B-001
  description: "Migrate AssetDrawerContent to EntityModal \u2014 AssetTabRegistry\
    \ (Preview/Details/Links/Policy), replace RightDrawer, wire flag:ui-tabbed-modal"
  status: pending
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-009
- id: P2B-002
  description: "Migrate BomOverview SlotDetailPanel to EntityModal \u2014 SlotTabRegistry,\
    \ extract inline code (lines 269-366), remove bespoke fixed-inset panel"
  status: pending
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-009
- id: P2B-003
  description: "Migrate CoverageView inline sidebar to EntityModal \u2014 CoverageSlotTabRegistry,\
    \ remove w-56 sidebar column, wire onSlotClick"
  status: pending
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-009
- id: P2B-004
  description: "Migrate TemplatePreviewPanel to EntityModal \u2014 TemplateTabRegistry\
    \ (Preview/Domains/Apply), remove persistent <aside>"
  status: pending
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-009
- id: P2B-005
  description: "Migrate InboxPreviewPane to EntityModal \u2014 InboxItemTabRegistry\
    \ (Preview/Classify/Links), remove center column, preserve ClassificationForm"
  status: pending
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-009
- id: P2B-006
  description: "Remove deprecated bespoke panel code \u2014 delete old code paths;\
    \ retain RightDrawer component for ContextPacksView"
  status: pending
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2B-001
  - P2B-002
  - P2B-003
  - P2B-004
  - P2B-005
- id: P2B-007
  description: "Feature flag wiring per-surface \u2014 verify flag:ui-tabbed-modal\
    \ gates each surface independently; document global cutover path"
  status: pending
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2B-006
- id: P2B-008
  description: "task-completion-validator gate \u2014 all P2b exit criteria"
  status: pending
  assigned_to:
  - task-completion-validator
  dependencies:
  - P2B-007
parallelization:
  batch_1:
  - P2B-001
  - P2B-002
  - P2B-003
  - P2B-004
  - P2B-005
  batch_2:
  - P2B-006
  batch_3:
  - P2B-007
  batch_4:
  - P2B-008
  critical_path:
  - P2B-001
  - P2B-006
  - P2B-007
  - P2B-008
---

# ui-polish-pass — Phase P2b: Migrate 5 Detail Surfaces

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Migrate all five bespoke detail surfaces (Asset Inspector RightDrawer, BOM SlotDetailPanel, Coverage sidebar, Template aside, Inbox center column) to the canonical EntityModal from P2a. All five migrations are independent and can run in parallel (batch_1).
