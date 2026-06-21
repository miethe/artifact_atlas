---
type: progress
schema_version: 2
doc_type: progress
prd: "ui-polish-pass"
feature_slug: ui-polish-pass
phase: P4a
status: pending
created: 2026-06-21
updated: 2026-06-21
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p4a-asset-viewer.md
commit_refs: []
pr_refs: []
owners: ["ui-engineer-enhanced"]
contributors: ["code-reviewer"]

tasks:
  - id: "P4A-001"
    description: "AssetViewer dispatcher — index.tsx, mode thumbnail|full, agent_access gate, MIME/extension dispatch, AccessRestrictedPlaceholder"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P1-007"]

  - id: "P4A-002"
    description: "Image renderer — raster via next/image, SVG via <img> (no innerHTML), error tile + download link"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P4A-001"]

  - id: "P4A-003"
    description: "PDF renderer (react-pdf 10.4.1) — next/dynamic ssr:false, GlobalWorkerOptions.workerSrc, page-turn full / first-page thumbnail, CI version assertion"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P4A-001"]

  - id: "P4A-004"
    description: "Markdown/code renderer via @miethe/ui ContentPane — sanitize=true for untrusted, shiki language validation, plain-text snippet thumbnail mode"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P4A-001"]

  - id: "P4A-005"
    description: "Editable mode gating — only for agent_access + code-like extension set + editable prop; binary formats strictly read-only"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P4A-004"]

  - id: "P4A-006"
    description: "Security checklist sign-off — code-reviewer reviews all 7 security checklist items before task-completion-validator"
    status: pending
    assigned_to: ["code-reviewer"]
    dependencies: ["P4A-005"]

  - id: "P4A-007"
    description: "task-completion-validator gate + karen mid-feature gate — all P4a exit criteria"
    status: pending
    assigned_to: ["task-completion-validator"]
    dependencies: ["P4A-006"]

parallelization:
  batch_1: ["P4A-001"]
  batch_2: ["P4A-002", "P4A-003", "P4A-004"]
  batch_3: ["P4A-005"]
  batch_4: ["P4A-006"]
  batch_5: ["P4A-007"]
  critical_path: ["P4A-001", "P4A-003", "P4A-006", "P4A-007"]
---

# ui-polish-pass — Phase P4a: AssetViewer Dispatcher + Images + PDF + Code/MD

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Build the AssetViewer dispatcher and implement renderers for images, PDF (react-pdf 10.4.1), Markdown/code (@miethe/ui ContentPane). Security is first-class: code-reviewer signs off before task-completion-validator. P4a is also a karen mid-feature milestone. The thumbnail mode (P4A-001) unblocks P3.
