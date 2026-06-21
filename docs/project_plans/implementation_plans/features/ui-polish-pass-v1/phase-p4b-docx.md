---
schema_version: 2
doc_type: phase_plan
title: "P4b: DOCX Renderer — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P4b
phase_title: "DOCX Renderer"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "P4a exit gate passed (AssetViewer dispatcher exists and is extensible)"
exit_criteria:
  - "DOCX renderer integrated into AssetViewer dispatcher"
  - "fetchRelated:false enforced"
  - "Error tile + download fallback implemented"
  - "task-completion-validator gate passes"
integration_owner: null
---

# P4b: DOCX Renderer

**Estimate**: 3 pts
**Depends on**: P4a (dispatcher must exist)
**Blocks**: P6
**Assigned Subagent(s)**: `ui-engineer-enhanced`
**Model routing**: sonnet (adaptive effort — mechanical extension of P4a dispatcher)

> ADR-4: Asset-viewer stack — docx-preview 0.3.7 for DOCX; `fetchRelated:false` for SSRF mitigation

---

## Context

DOCX rendering uses `docx-preview` 0.3.7 (Apache-2.0, framework-agnostic). Key security constraint: `fetchRelated:false` prevents the library from fetching remote resources embedded in the DOCX (SSRF mitigation, NFR-S4).

DOCX has no thumbnail-mode — in `mode="thumbnail"` the DOCX renderer should show a document icon fallback rather than attempting full render. Full render is expensive and not needed for card thumbnails.

---

## Task Breakdown

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P4B-001 | DOCX renderer (docx-preview 0.3.7) | Create `web/features/assets/components/AssetViewer/DocxRenderer.tsx`. Load via `next/dynamic({ssr:false})` (docx-preview manipulates the DOM). Fetch DOCX bytes via backend proxy. Call `docx.renderAsync(arrayBuffer, containerEl, null, { breakPages: true, ignoreWidth: true, fetchRelated: false })`. Implement loading state (Spinner). `mode="thumbnail"`: render document-type icon fallback, do NOT call renderAsync (perf). `mode="full"`: full render. Register DOCX MIME types in AssetViewer dispatcher. | 2 pts | ui-engineer-enhanced | sonnet | high | P4A-007 |
| P4B-002 | Error tile + download fallback | If docx-preview renderAsync throws, or if the proxy returns non-200, show error tile with download link. Do NOT propagate errors to page-level crash. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P4B-001 |
| P4B-003 | task-completion-validator gate | Run `task-completion-validator` against all P4b exit criteria. | — | task-completion-validator | (default) | — | P4B-002 |

---

## Acceptance Criteria

### AC P4B-A: DOCX renders without remote resource fetch

- target_surfaces:
    - web/features/assets/components/AssetViewer/DocxRenderer.tsx
- propagation_contract: `fetchRelated: false` option passed to `docx.renderAsync`. No network requests made to URLs embedded in DOCX document during rendering. Verified by network tab (no third-party fetches during render).
- resilience: If DOCX contains broken remote refs, they are silently skipped (not fetched, no error thrown by fetchRelated:false)
- visual_evidence_required: false
- verified_by: [P4B-001, P6-007]

### AC P4B-B: Thumbnail mode shows icon, not full render

- target_surfaces:
    - web/features/assets/components/AssetViewer/DocxRenderer.tsx
- propagation_contract: When `mode="thumbnail"`, render a document-type Lucide icon (e.g., `FileText`) in the HeaderZone at card size. Do NOT call `renderAsync` in thumbnail mode.
- resilience: N/A — icon always available even if DOCX is corrupt
- visual_evidence_required: false
- verified_by: [P4B-001, P6-006, P6-007]

### AC P4B-C: Error tile + download fallback

- target_surfaces:
    - web/features/assets/components/AssetViewer/DocxRenderer.tsx
- propagation_contract: Any render error or proxy non-200 shows error tile with download link to original asset. No blank or crashed UI.
- resilience: This IS the resilience behavior
- visual_evidence_required: false
- verified_by: [P4B-002, P6-007]

---

## Phase Quality Gates

- [ ] `DocxRenderer.tsx` exists and registered in AssetViewer dispatcher for DOCX MIME types
- [ ] Loaded via `next/dynamic({ssr:false})`
- [ ] `fetchRelated: false` option verified in renderAsync call
- [ ] `mode="thumbnail"` renders document icon, not full renderAsync
- [ ] Error tile with download link on renderAsync failure or proxy non-200
- [ ] `task-completion-validator` passes

---

## Key Files

| File | Change Type | Notes |
|------|-------------|-------|
| `web/features/assets/components/AssetViewer/DocxRenderer.tsx` | Create | docx-preview 0.3.7 |
| `web/features/assets/components/AssetViewer/index.tsx` | Modify | Register DOCX MIME types in dispatcher |
| `web/package.json` | Modify | Add docx-preview@0.3.7 |
