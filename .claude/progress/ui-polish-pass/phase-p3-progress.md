---
type: progress
schema_version: 2
doc_type: progress
prd: "ui-polish-pass"
feature_slug: ui-polish-pass
phase: P3
status: pending
created: 2026-06-21
updated: 2026-06-21
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p3-card-redesign.md
commit_refs: []
pr_refs: []
owners: ["ui-engineer-enhanced"]
contributors: []

tasks:
  - id: "P3-001"
    description: "Implement zone-composition card base — ZoneCard.tsx with HeaderZone/ContentZone/StatusZone/ActionZone, tier sizing, border-l-4 accentColor"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P1-007", "P4A-007"]

  - id: "P3-002"
    description: "Rebuild AssetCard on zone model — full-width ~96px thumbnail via AssetViewer thumbnail mode, click-to-open EntityModal, multi-select preserved"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P3-001"]

  - id: "P3-003"
    description: "Rebuild SlotCard on zone model — full-width top thumbnail, per-status border/bg, SlotStatusBadge, ActionZone with MoreHorizontal menu"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P3-001"]

  - id: "P3-004"
    description: "Rebuild PackCard on zone model — pack icon/thumbnail at full width, hover-reveal Open chevron"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P3-001"]

  - id: "P3-005"
    description: "Rebuild TemplateCard on zone model — template icon/thumbnail, domain count, slot summary, apply/preview actions"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P3-001"]

  - id: "P3-006"
    description: "Wire click-to-open EntityModal guard — e.target.closest('button,a,input,[role=menuitem]') on all 4 card families"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P3-002", "P3-003", "P3-004", "P3-005"]

  - id: "P3-007"
    description: "Keyboard accessibility — Enter/Space on card root, tabIndex=0, Tab order within cards"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P3-006"]

  - id: "P3-008"
    description: "Verify TanStack Virtual lists unaffected — visual smoke on AssetLibrary + BomOverview slot grid, no layout thrash or scroll-reset"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P3-007"]

  - id: "P3-009"
    description: "task-completion-validator gate — all P3 exit criteria"
    status: pending
    assigned_to: ["task-completion-validator"]
    dependencies: ["P3-008"]

parallelization:
  batch_1: ["P3-001"]
  batch_2: ["P3-002", "P3-003", "P3-004", "P3-005"]
  batch_3: ["P3-006"]
  batch_4: ["P3-007"]
  batch_5: ["P3-008"]
  batch_6: ["P3-009"]
  critical_path: ["P3-001", "P3-002", "P3-006", "P3-007", "P3-008", "P3-009"]
---

# ui-polish-pass — Phase P3: Card Redesign + Preview Cards

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Rebuild all four card families (AssetCard, SlotCard, PackCard, TemplateCard) on a zone-composition model with full-width ~96px top thumbnails using the P4a AssetViewer thumbnail mode. P3 depends on both P1 (design system) and P4a (viewer thumbnail dispatcher).
