---
type: progress
schema_version: 2
doc_type: progress
prd: "ui-polish-pass"
feature_slug: ui-polish-pass
phase: P2a
status: pending
created: 2026-06-21
updated: 2026-06-21
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p2a-modal-shell.md
commit_refs: []
pr_refs: []
owners: ["frontend-architect", "ui-engineer-enhanced"]
contributors: ["a11y-sheriff"]

tasks:
  - id: "P2A-001"
    description: "Design pattern API — tab registry shape, URL contract, EntityModal props, full-page route shape (output: modal-pattern-api.md)"
    status: pending
    assigned_to: ["frontend-architect"]
    dependencies: ["P1-008"]

  - id: "P2A-002"
    description: "Implement EntityModal shell + BaseArtifactModal wrapper — wraps @miethe/ui/primitives, accepts tabRegistry/entityId/entityType"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P2A-001"]

  - id: "P2A-003"
    description: "Implement tab registry + React.lazy/Suspense panel loading — code-split panels, registerTab/createTabRegistry helper"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P2A-002"]

  - id: "P2A-004"
    description: "Wire URL state via Next.js useSearchParams — ?item=<id>&tab=<key>, bidirectional, back/forward correct"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P2A-003"]

  - id: "P2A-005"
    description: "Full-page route affordance — /projects/[projectId]/detail/[type]/[id]/page.tsx, preserves ?tab="
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P2A-004"]

  - id: "P2A-006"
    description: "Focus-trap + Escape + focus-restore a11y — useFocusTrap hook, store trigger ref on open"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P2A-002"]

  - id: "P2A-007"
    description: "ARIA attributes — role=dialog, aria-modal=true, aria-labelledby, aria-label on buttons"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P2A-006"]

  - id: "P2A-008"
    description: "a11y-sheriff review — focus order, Escape, ARIA role/modal, aria-labelledby"
    status: pending
    assigned_to: ["a11y-sheriff"]
    dependencies: ["P2A-007"]

  - id: "P2A-009"
    description: "task-completion-validator gate — all P2a exit criteria"
    status: pending
    assigned_to: ["task-completion-validator"]
    dependencies: ["P2A-008"]

parallelization:
  batch_1: ["P2A-001"]
  batch_2: ["P2A-002"]
  batch_3: ["P2A-003", "P2A-006"]
  batch_4: ["P2A-004"]
  batch_5: ["P2A-005", "P2A-007"]
  batch_6: ["P2A-008"]
  batch_7: ["P2A-009"]
  critical_path: ["P2A-001", "P2A-002", "P2A-003", "P2A-004", "P2A-007", "P2A-008", "P2A-009"]
---

# ui-polish-pass — Phase P2a: Modal Shell + Tab Registry + URL State + A11y

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Build the single shared EntityModal that all five detail surfaces will use: tab registry, React.lazy code-split panels, URL-driven (?item=&tab=) state via useSearchParams, full-page route affordance, and complete a11y (focus-trap, Escape, ARIA). This pattern must be correct here — all five surfaces inherit it.
