---
schema_version: 2
doc_type: phase_plan
title: "P4c: PPTX Server-Side Seam — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P4c
phase_title: "PPTX Server-Side Seam"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "P4a exit gate passed (AssetViewer dispatcher + react-pdf renderer exist)"
  - "OQ-2 resolved (PPTX conversion engine selected: LibreOffice headless vs Gotenberg sidecar)"
  - "SEAM-P4C-001 signed off before any FE render work merges"
exit_criteria:
  - "FastAPI PPTX-convert endpoint functional"
  - "Asset-fetch proxy seam enforces MIME and strips dangerous headers"
  - "FE renders converted PDF via react-pdf on convert success"
  - "Download fallback shown during conversion or on error"
  - "shared/openapi.yaml updated for convert endpoint"
  - "flag:pptx-server-conversion gates the seam"
  - "task-completion-validator gate passes"
integration_owner: python-backend-engineer
---

# P4c: PPTX Server-Side Seam

**Estimate**: 4 pts
**Depends on**: P4a (react-pdf renderer must exist for FE render step)
**Blocks**: P6
**Assigned Subagent(s)**: `python-backend-engineer` (BE endpoint + proxy), `ui-engineer-enhanced` (FE render + flag)
**Model routing**: `python-backend-engineer` → sonnet (medium effort); `ui-engineer-enhanced` → sonnet (adaptive)
**Integration owner**: `python-backend-engineer`
**Feature flag**: `flag:pptx-server-conversion` — shows download fallback when off

> ADR-4: PPTX server-side→PDF seam (no in-browser PPTX lib for React 19)
> R4: PPTX server-side conversion adds backend infra and latency (medium risk)
> **SEAM task (SEAM-P4C-001) must be completed and signed off before P4C-003 FE render work merges.**

---

## Context

No React 19-compatible PPTX renderer exists (SPIKE verify). `@mkabatek/pptx-viewer` is alpha with a peerDep conflict (`^19.2.5`). The solution: convert PPTX to PDF server-side (LibreOffice headless or Gotenberg sidecar per OQ-2), then render the converted PDF via the existing `react-pdf` surface (P4a).

**OQ-2 resolution affects P4C-001 implementation**: If Gotenberg, the FastAPI endpoint calls Gotenberg's REST API. If LibreOffice, it shells out to `soffice --headless --convert-to pdf`. The plan accounts for either; engine choice is recorded in the decisions block.

**Seam contract**: The backend convert endpoint takes an asset ID or PPTX file reference and returns PDF bytes (or a download URL for the PDF). The FE renders the PDF bytes via `react-pdf`. The seam task (SEAM-P4C-001) defines this contract before either side is implemented.

---

## Task Breakdown

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| SEAM-P4C-001 | Define convert→render API contract | **Seam task — must complete before P4C-003 merges.** `python-backend-engineer` + `ui-engineer-enhanced` jointly define: (1) endpoint path (`POST /api/preview/convert/pptx`), (2) request shape (asset ID or file ref), (3) response shape (PDF bytes as `application/pdf` OR JSON with `{ pdf_url: string, expires_at: string }`), (4) error codes (400 invalid type, 422 convert failed, 503 engine unavailable), (5) caching strategy (asset-ID-keyed, TTL). Document in `.claude/worknotes/ui-polish-pass/pptx-seam-contract.md`. | 0.5 pts | python-backend-engineer, ui-engineer-enhanced | sonnet | adaptive | P4A-007 |
| P4C-001 | FastAPI PPTX-convert endpoint | Implement `POST /api/preview/convert/pptx` in the FastAPI backend. Input validation: verify file is PPTX (magic bytes check, not just extension). Async convert via engine (LibreOffice or Gotenberg per OQ-2 resolution). Cache result keyed by asset ID + content hash. On convert error: return `{ error: "convert_failed", download_url: string }` (not a 500). Timeout: configurable (default 30s). | 1.5 pts | python-backend-engineer | sonnet | medium | SEAM-P4C-001 |
| P4C-002 | Asset-fetch proxy seam | Backend enforces MIME type on asset fetch: validate Content-Type header matches expected type for the asset's MIME field. Strip dangerous response headers (`X-Frame-Options` override, `Content-Disposition: attachment` for inline preview, etc.). This proxy is also referenced by P4a (AC P4A-A) for image/SVG rendering. | 1 pt | python-backend-engineer | sonnet | medium | SEAM-P4C-001 |
| P4C-003 | FE render via react-pdf on converted PDF | In `AssetViewer`, when PPTX is dispatched and `flag:pptx-server-conversion` is on: call the convert endpoint; on success, render PDF bytes via the existing `PdfRenderer` (P4a). Display a loading state ("Converting presentation…") while async convert runs. On error response (`convert_failed`): show download fallback immediately. **This task must not merge until SEAM-P4C-001 is signed off.** | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P4C-001, SEAM-P4C-001 |
| P4C-004 | Feature flag + download fallback | When `flag:pptx-server-conversion` is off: show download button + "Preview not available" message (no convert attempt). Wire flag in AssetViewer dispatcher for PPTX MIME type. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P4C-003 |
| P4C-005 | Update shared/openapi.yaml for convert endpoint | Add `POST /api/preview/convert/pptx` to `shared/openapi.yaml`. Include request body schema, response schema (both success PDF bytes and error JSON), status codes, and security scheme. Coordinate with P6-010 to avoid double-edit. | 0.5 pts | python-backend-engineer | sonnet | adaptive | P4C-001 |
| P4C-006 | task-completion-validator gate | Run `task-completion-validator` against all P4c exit criteria. | — | task-completion-validator | (default) | — | P4C-004, P4C-005 |

---

## Acceptance Criteria

### AC P4C-A: FE handles missing/error convert response

- target_surfaces:
    - web/features/assets/components/AssetViewer/index.tsx (PPTX dispatch path)
- propagation_contract: If convert endpoint returns error JSON (`{ error: "convert_failed", download_url }`) OR times out: immediately show download fallback tile with download_url link. If `flag:pptx-server-conversion` is off: show download fallback without attempting convert.
- resilience: Error response → download fallback (not a blank or crashed UI). Timeout → same fallback. flag off → same fallback.
- visual_evidence_required: false
- verified_by: [P4C-003, P4C-004, P6-007]

### AC P4C-B: File-type validation on convert endpoint

- target_surfaces:
    - (FastAPI backend) `POST /api/preview/convert/pptx`
- propagation_contract: Backend validates PPTX magic bytes before passing to conversion engine. Non-PPTX input returns 400 with `{ error: "invalid_type" }`.
- resilience: 400 invalid type → FE shows error tile with download link; does not attempt to render 400 as PDF
- visual_evidence_required: false
- verified_by: [P4C-001, P6-007]

### AC P4C-C: Seam contract verified before FE render merges

- target_surfaces:
    - .claude/worknotes/ui-polish-pass/pptx-seam-contract.md
    - web/features/assets/components/AssetViewer/index.tsx (P4C-003)
- propagation_contract: SEAM-P4C-001 document signed off by both `python-backend-engineer` and `ui-engineer-enhanced` before P4C-003 is merged
- resilience: N/A — this is a process gate
- visual_evidence_required: false
- verified_by: [SEAM-P4C-001, P6-007]

### AC P4C-D: PPTX thumbnail mode shows presentation icon

- target_surfaces:
    - web/features/assets/components/AssetViewer/index.tsx (PPTX dispatch in thumbnail mode)
- propagation_contract: In `mode="thumbnail"`, show a presentation-type Lucide icon (e.g., `Presentation`). Do NOT call the convert endpoint in thumbnail mode (latency/cost).
- resilience: N/A — icon always available
- visual_evidence_required: false
- verified_by: [P4C-003, P6-007]

---

## Phase Quality Gates

- [ ] SEAM-P4C-001 signed off (contract doc at `.claude/worknotes/ui-polish-pass/pptx-seam-contract.md`)
- [ ] `POST /api/preview/convert/pptx` endpoint functional (async convert + cache + error→download fallback)
- [ ] File-type validation (magic bytes) in convert endpoint
- [ ] Asset-fetch proxy enforces MIME and strips dangerous headers
- [ ] FE renders converted PDF via react-pdf on success
- [ ] FE shows loading state during conversion ("Converting presentation…")
- [ ] FE shows download fallback on convert error or timeout
- [ ] `flag:pptx-server-conversion` off → download fallback (no convert attempt)
- [ ] `shared/openapi.yaml` updated for convert endpoint
- [ ] `task-completion-validator` passes

---

## Key Files

| File | Change Type | Notes |
|------|-------------|-------|
| `.claude/worknotes/ui-polish-pass/pptx-seam-contract.md` | Create | Seam contract (SEAM-P4C-001 output) |
| `api/routers/preview.py` (or equivalent) | Create/Modify | FastAPI convert endpoint |
| `api/services/pptx_converter.py` | Create | Conversion service (LibreOffice or Gotenberg) |
| `web/features/assets/components/AssetViewer/index.tsx` | Modify | PPTX dispatch + flag |
| `shared/openapi.yaml` | Modify | Add convert endpoint (coordinate with P6-010) |
