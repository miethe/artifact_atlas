---
type: progress
schema_version: 2
doc_type: progress
prd: "ui-polish-pass"
feature_slug: ui-polish-pass
phase: P4c
status: pending
created: 2026-06-21
updated: 2026-06-21
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p4c-pptx-seam.md
commit_refs: []
pr_refs: []
owners: ["python-backend-engineer", "ui-engineer-enhanced"]
contributors: []

tasks:
  - id: "SEAM-P4C-001"
    description: "Define convert→render API contract — endpoint path, request/response shape, error codes, caching; output: pptx-seam-contract.md; signed off by both agents"
    status: pending
    assigned_to: ["python-backend-engineer", "ui-engineer-enhanced"]
    dependencies: ["P4A-007"]

  - id: "P4C-001"
    description: "FastAPI PPTX-convert endpoint — POST /api/preview/convert/pptx, magic bytes validation, async convert (LibreOffice or Gotenberg), cache, error→download fallback, 30s timeout"
    status: pending
    assigned_to: ["python-backend-engineer"]
    dependencies: ["SEAM-P4C-001"]

  - id: "P4C-002"
    description: "Asset-fetch proxy seam — backend MIME enforcement, strip dangerous response headers (X-Frame-Options override, Content-Disposition attachment)"
    status: pending
    assigned_to: ["python-backend-engineer"]
    dependencies: ["SEAM-P4C-001"]

  - id: "P4C-003"
    description: "FE render via react-pdf on converted PDF — call convert endpoint when flag:pptx-server-conversion on, loading state, download fallback on error; must not merge before SEAM-P4C-001 sign-off"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P4C-001", "SEAM-P4C-001"]

  - id: "P4C-004"
    description: "Feature flag + download fallback — flag:pptx-server-conversion off → show download + 'Preview not available'; wire in AssetViewer dispatcher for PPTX MIME"
    status: pending
    assigned_to: ["ui-engineer-enhanced"]
    dependencies: ["P4C-003"]

  - id: "P4C-005"
    description: "Update shared/openapi.yaml for convert endpoint — request/response schema, status codes, security scheme; coordinate with P6-010"
    status: pending
    assigned_to: ["python-backend-engineer"]
    dependencies: ["P4C-001"]

  - id: "P4C-006"
    description: "task-completion-validator gate — all P4c exit criteria"
    status: pending
    assigned_to: ["task-completion-validator"]
    dependencies: ["P4C-004", "P4C-005"]

parallelization:
  batch_1: ["SEAM-P4C-001"]
  batch_2: ["P4C-001", "P4C-002"]
  batch_3: ["P4C-003", "P4C-005"]
  batch_4: ["P4C-004"]
  batch_5: ["P4C-006"]
  critical_path: ["SEAM-P4C-001", "P4C-001", "P4C-003", "P4C-004", "P4C-006"]
---

# ui-polish-pass — Phase P4c: PPTX Server-Side Seam

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## Objective

Implement the PPTX→PDF server-side conversion seam: seam contract (SEAM-P4C-001) is the prerequisite gate for FE render work. Backend (python-backend-engineer) and frontend (ui-engineer-enhanced) work in parallel after seam sign-off. OQ-2 (LibreOffice vs Gotenberg engine) must be resolved before P4C-001.
