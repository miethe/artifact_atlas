---
type: progress
schema_version: 2
doc_type: progress
prd: "ui-polish-pass"
feature_slug: ui-polish-pass
phase: P1
status: pending
created: 2026-06-21
updated: 2026-06-21
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p1-ds-foundation.md
commit_refs: []
pr_refs: []
owners: ["frontend-architect", "ui-engineer-enhanced"]
contributors: []

tasks:
  - id: "P1-001"
    description: "Confirm @miethe/ui@0.6.0 availability — verify npm publish or configure file:/pnpm-workspace link"
    status: pending
    assigned_to: ["frontend-architect"]
    dependencies: []

  - id: "P1-002"
    description: "Add @miethe/ui dependency + build config (package.json, transpilePackages, serverExternalPackages)"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P1-001"]

  - id: "P1-003"
    description: "Author shadcn token bridge in globals.css — additive :root block mapping ~14 shadcn vars to AA palette"
    status: pending
    assigned_to: ["frontend-architect"]
    dependencies: ["P1-002"]

  - id: "P1-004"
    description: "Add dist content glob to tailwind.config.ts — node_modules/@miethe/ui/dist/**/*.{js,mjs}"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P1-003"]

  - id: "P1-005"
    description: "Resolve @codemirror/state single-instance via overrides/resolutions + CI assertion"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P1-002"]

  - id: "P1-006"
    description: "Resolve lucide-react / tailwind-merge major-version duplicates after adding @miethe/ui"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P1-002"]

  - id: "P1-007"
    description: "ContentPane smoke screen on one feature-flagged page (flag:miethe-ui-ds) — visual review sign-off required"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P1-003", "P1-004", "P1-005", "P1-006"]

  - id: "P1-008"
    description: "task-completion-validator gate — P1 exit criteria + karen mid-feature gate"
    status: pending
    assigned_to: ["task-completion-validator"]
    dependencies: ["P1-007"]

parallelization:
  batch_1: ["P1-001"]
  batch_2: ["P1-002"]
  batch_3: ["P1-003", "P1-005", "P1-006"]
  batch_4: ["P1-004"]
  batch_5: ["P1-007"]
  batch_6: ["P1-008"]
  critical_path: ["P1-001", "P1-002", "P1-003", "P1-007", "P1-008"]
---

# ui-polish-pass — Phase P1: Design-System Foundation

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Establish the @miethe/ui design-system foundation: add the dependency, author a shadcn-compatible token bridge, resolve build/deduplication issues, and verify ContentPane renders correctly on one feature-flagged page. This phase is the HARD GATE — no other phase may start until P1-008 passes.
