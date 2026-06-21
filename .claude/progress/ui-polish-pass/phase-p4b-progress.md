---
type: progress
schema_version: 2
doc_type: progress
prd: "ui-polish-pass"
feature_slug: ui-polish-pass
phase: P4b
status: pending
created: 2026-06-21
updated: 2026-06-21
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p4b-docx.md
commit_refs: []
pr_refs: []
owners: ["ui-engineer-enhanced"]
contributors: []

tasks:
  - id: "P4B-001"
    description: "DOCX renderer (docx-preview 0.3.7) — next/dynamic ssr:false, fetchRelated:false, full render mode, document icon fallback for thumbnail mode"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P4A-007"]

  - id: "P4B-002"
    description: "Error tile + download fallback — catch renderAsync throws and proxy non-200; no page-level crash"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P4B-001"]

  - id: "P4B-003"
    description: "task-completion-validator gate — all P4b exit criteria"
    status: pending
    assigned_to: ["task-completion-validator"]
    dependencies: ["P4B-002"]

parallelization:
  batch_1: ["P4B-001"]
  batch_2: ["P4B-002"]
  batch_3: ["P4B-003"]
  critical_path: ["P4B-001", "P4B-002", "P4B-003"]
---

# ui-polish-pass — Phase P4b: DOCX Renderer

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Add DOCX rendering to the AssetViewer dispatcher using docx-preview 0.3.7. Key constraint: fetchRelated:false for SSRF mitigation. Thumbnail mode shows a document icon (no renderAsync call). Three tasks run sequentially.
