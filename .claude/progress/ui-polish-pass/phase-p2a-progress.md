---
type: progress
schema_version: 2
doc_type: progress
prd: ui-polish-pass
feature_slug: ui-polish-pass
phase: P2a
status: completed
created: '2026-06-21'
updated: '2026-06-21'
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p2a-modal-shell.md
commit_refs: []
pr_refs: []
owners:
- frontend-architect
- ui-engineer-enhanced
contributors:
- a11y-sheriff
tasks:
- id: P2A-001
  description: "Design pattern API \u2014 tab registry shape, URL contract, EntityModal\
    \ props, full-page route shape (output: modal-pattern-api.md)"
  status: completed
  assigned_to:
  - frontend-architect
  dependencies:
  - P1-008
  started: 2026-06-21T20:23Z
  completed: 2026-06-21T20:31Z
  evidence:
  - branch: feat/ui-polish-p1-p4a
  verified_by:
  - P2A-009
- id: P2A-002
  description: "Implement EntityModal shell + BaseArtifactModal wrapper \u2014 wraps\
    \ @miethe/ui/primitives, accepts tabRegistry/entityId/entityType"
  status: completed
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-001
  started: 2026-06-21T20:23Z
  completed: 2026-06-21T20:31Z
  evidence:
  - branch: feat/ui-polish-p1-p4a
  verified_by:
  - P2A-009
- id: P2A-003
  description: "Implement tab registry + React.lazy/Suspense panel loading \u2014\
    \ code-split panels, registerTab/createTabRegistry helper"
  status: completed
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-002
  started: 2026-06-21T20:23Z
  completed: 2026-06-21T20:31Z
  evidence:
  - branch: feat/ui-polish-p1-p4a
  verified_by:
  - P2A-009
- id: P2A-004
  description: "Wire URL state via Next.js useSearchParams \u2014 ?item=<id>&tab=<key>,\
    \ bidirectional, back/forward correct"
  status: completed
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-003
  started: 2026-06-21T20:23Z
  completed: 2026-06-21T20:31Z
  evidence:
  - branch: feat/ui-polish-p1-p4a
  verified_by:
  - P2A-009
- id: P2A-005
  description: "Full-page route affordance \u2014 /projects/[projectId]/detail/[type]/[id]/page.tsx,\
    \ preserves ?tab="
  status: completed
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-004
  started: 2026-06-21T20:23Z
  completed: 2026-06-21T20:31Z
  evidence:
  - branch: feat/ui-polish-p1-p4a
  verified_by:
  - P2A-009
- id: P2A-006
  description: "Focus-trap + Escape + focus-restore a11y \u2014 useFocusTrap hook,\
    \ store trigger ref on open"
  status: completed
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-002
  started: 2026-06-21T20:23Z
  completed: 2026-06-21T20:31Z
  evidence:
  - branch: feat/ui-polish-p1-p4a
  verified_by:
  - P2A-009
- id: P2A-007
  description: "ARIA attributes \u2014 role=dialog, aria-modal=true, aria-labelledby,\
    \ aria-label on buttons"
  status: completed
  assigned_to:
  - ui-engineer-enhanced
  dependencies:
  - P2A-006
  started: 2026-06-21T20:23Z
  completed: 2026-06-21T20:31Z
  evidence:
  - branch: feat/ui-polish-p1-p4a
  verified_by:
  - P2A-009
- id: P2A-008
  description: "a11y-sheriff review \u2014 focus order, Escape, ARIA role/modal, aria-labelledby"
  status: completed
  assigned_to:
  - a11y-sheriff
  dependencies:
  - P2A-007
  started: 2026-06-21T20:31Z
  completed: 2026-06-21T20:33Z
  evidence:
  - review: a11y-sheriff PASS
  verified_by:
  - P2A-007
- id: P2A-009
  description: "task-completion-validator gate \u2014 all P2a exit criteria"
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P2A-008
  started: 2026-06-21T20:31Z
  completed: 2026-06-21T20:33Z
  evidence:
  - review: task-completion-validator APPROVED
  verified_by:
  - P2A-007
parallelization:
  batch_1:
  - P2A-001
  batch_2:
  - P2A-002
  batch_3:
  - P2A-003
  - P2A-006
  batch_4:
  - P2A-004
  batch_5:
  - P2A-005
  - P2A-007
  batch_6:
  - P2A-008
  batch_7:
  - P2A-009
  critical_path:
  - P2A-001
  - P2A-002
  - P2A-003
  - P2A-004
  - P2A-007
  - P2A-008
  - P2A-009
total_tasks: 9
completed_tasks: 9
in_progress_tasks: 0
blocked_tasks: 0
progress: 100
---

# ui-polish-pass — Phase P2a: Modal Shell + Tab Registry + URL State + A11y

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Build the single shared EntityModal that all five detail surfaces will use: tab registry, React.lazy code-split panels, URL-driven (?item=&tab=) state via useSearchParams, full-page route affordance, and complete a11y (focus-trap, Escape, ARIA). This pattern must be correct here — all five surfaces inherit it.
