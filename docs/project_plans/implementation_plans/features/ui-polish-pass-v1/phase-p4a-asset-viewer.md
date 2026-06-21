---
schema_version: 2
doc_type: phase_plan
title: "P4a: AssetViewer Dispatcher + Images + PDF + Code/MD — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P4a
phase_title: "AssetViewer (img/PDF/MD/code)"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "P1 exit gate passed (design system live; @miethe/ui ContentPane available)"
exit_criteria:
  - "AssetViewer dispatcher selects correct renderer by MIME/extension after agent_access gate"
  - "Image renderer (next/image + SVG via img) functional and secure"
  - "PDF renderer (react-pdf 10.4.1) renders first page; worker loads without console error"
  - "MD/code renderer via @miethe/ui ContentPane with sanitize=true for untrusted content"
  - "Editable mode gated by agent_access + policy"
  - "security checklist signed off by code-reviewer"
  - "task-completion-validator gate passes"
  - "karen mid-feature gate passes (P4a milestone)"
integration_owner: null
---

# P4a: AssetViewer Dispatcher + Images + PDF + Code/MD

**Estimate**: 6 pts
**Depends on**: P1 (ContentPane available via @miethe/ui)
**Blocks**: P3 (cards need thumbnail mode), P4b, P4c, P6
**Assigned Subagent(s)**: `ui-engineer-enhanced`
**Model routing**: sonnet (high effort — security posture + worker config are non-trivial)

> ADR-4: Asset-viewer stack — dispatcher + per-format libs; PPTX server-side→PDF
> Security is a first-class concern here. `code-reviewer` signs off before task-completion-validator.

---

## Context

AA's current `AssetPreview` renders `[Preview: {title}]` for text/code and a bare `<img>` for images. No PDF, DOCX, or PPTX support exists. The viewer must:
- Gate on `agent_access` (inherit from existing `AssetPreview` logic)
- Support thumbnail mode (used by P3 card thumbnails — first-page/first-line preview, compact size)
- Support full-view mode (used by EntityModal preview tab + full-page route)
- Lazy-load all heavy renderers
- Enforce security posture per NFR-S1 through NFR-S8

**Supported formats (P4a scope)**:
- Images: raster (png/jpg/gif/webp) via `next/image`; SVG via `<img>` (never innerHTML)
- PDF: `react-pdf` 10.4.1 via `next/dynamic({ssr:false})`
- Markdown: `@miethe/ui` ContentPane (`sanitize=true`)
- Code-like text: `@miethe/ui` ContentPane (shiki view / CM6 edit)

**Not in P4a scope**: DOCX (P4b), PPTX (P4c), formats beyond the 6 defined (DEFER-4).

---

## Task Breakdown

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P4A-001 | AssetViewer dispatcher | Create `web/features/assets/components/AssetViewer/index.tsx`. Props: `asset: Asset`, `mode: 'thumbnail' \| 'full'`, `editable?: boolean`. Gate: check `agent_access`; if `"none"` or `"metadata_only"` render `AccessRestrictedPlaceholder`. Dispatch to renderer by MIME type / file extension. Support `mode="thumbnail"` (compact, first-page/snippet) for P3 cards. | 1 pt | ui-engineer-enhanced | sonnet | high | P1-007 |
| P4A-002 | Image renderer | Implement `ImageRenderer.tsx`. Raster formats (png/jpg/gif/webp): use `next/image` with `object-fit: contain`. SVG: use `<img>` element routed through backend proxy (never `dangerouslySetInnerHTML`). Implement error tile with download link for non-200 proxy responses. | 1 pt | ui-engineer-enhanced | sonnet | high | P4A-001 |
| P4A-003 | PDF renderer (react-pdf 10.4.1) | Implement `PdfRenderer.tsx`. Load via `next/dynamic({ssr:false})`. In the same `'use client'` module as `<Document>`, set `GlobalWorkerOptions.workerSrc = \`/pdf-worker/pdf.worker.min.js\``. Render first page in thumbnail mode; render with page-turn controls in full mode. Add CI assertion: `pdfjs-dist` version must equal `react-pdf` peer dep version. Implement error tile with download link. | 1.5 pts | ui-engineer-enhanced | sonnet | high | P4A-001 |
| P4A-004 | Markdown/code renderer via @miethe/ui ContentPane | Implement `ContentRenderer.tsx`. Import from `@miethe/ui/content-viewer` (subpath). `sanitize={true}` for user-uploaded/untrusted content. Show toolbar only when `editable=true`. Validate code language against shiki's known-language list before highlighting (`ContentPane` option). In thumbnail mode: render plain text snippet (first N lines, no toolbar). | 1 pt | ui-engineer-enhanced | sonnet | high | P4A-001 |
| P4A-005 | Editable mode gating | Editable mode activates only when: (a) `agent_access` permits editing AND (b) file extension is in the "code-like" set (`.md .ts .tsx .js .jsx .py .json .yml .yaml .toml .txt`) AND (c) `editable` prop is true. Binary formats (images, PDF, DOCX, PPTX) are strictly read-only regardless of `editable` prop. (OQ-4 resolution: preview-only for now — no write endpoint in scope.) | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P4A-004 |
| P4A-006 | Security checklist sign-off | `code-reviewer` reviews P4a implementation against the security checklist: (1) no SVG innerHTML; (2) `sanitize=true` for untrusted MD/HTML; (3) react-pdf JS execution disabled (default); (4) workerSrc set explicitly; (5) all heavy renderers lazy-loaded; (6) agent_access gate enforced; (7) proxy enforces MIME (covered by P4C-002 for proxy, reference here). Block P4A-007 until signed off. | — | code-reviewer | (default) | — | P4A-005 |
| P4A-007 | task-completion-validator gate | Run `task-completion-validator` against all P4a exit criteria. | — | task-completion-validator | (default) | — | P4A-006 |

---

## Acceptance Criteria

### AC P4A-A: Agent access gate enforced on all formats

- target_surfaces:
    - web/features/assets/components/AssetViewer/index.tsx
- propagation_contract: `agent_access === "none" | "metadata_only"` shows `AccessRestrictedPlaceholder` for all formats; no file content is fetched or rendered
- resilience: If agent_access field is absent from Asset object, treat as `"metadata_only"` (fail-safe)
- visual_evidence_required: false
- verified_by: [P4A-001, P6-007]

### AC P4A-B: SVG never rendered via innerHTML

- target_surfaces:
    - web/features/assets/components/AssetViewer/ImageRenderer.tsx
- propagation_contract: SVG assets rendered only via `<img src={proxiedUrl}>`. `dangerouslySetInnerHTML` not used for SVG anywhere in AssetViewer.
- resilience: If proxy returns non-SVG MIME for an SVG URL, fall back to error tile with download link
- visual_evidence_required: false
- verified_by: [P4A-002, P4A-006]

### AC P4A-C: react-pdf workerSrc configured correctly

- target_surfaces:
    - web/features/assets/components/AssetViewer/PdfRenderer.tsx
- propagation_contract: `GlobalWorkerOptions.workerSrc` set in the same `'use client'` module as `<Document>`. Worker loads without console error. CI asserts pdfjs-dist version == react-pdf peer dep.
- resilience: If worker fails to load, PDF renderer shows error tile with download link, not a blank pane
- visual_evidence_required: false
- verified_by: [P4A-003, P6-007]

### AC P4A-D: Editable mode restricted to code-like formats

- target_surfaces:
    - web/features/assets/components/AssetViewer/ContentRenderer.tsx
- propagation_contract: Edit toolbar/mode only active for files in the editable extension set AND with agent_access permission. Binary formats (image, PDF) have no edit path.
- resilience: If agent_access check fails or extension is not in the editable set, render read-only view silently (no error message about editing)
- visual_evidence_required: false
- verified_by: [P4A-005, P6-007]

### AC P4A-E: All heavy renderers lazy-loaded

- target_surfaces:
    - web/features/assets/components/AssetViewer/PdfRenderer.tsx
    - web/features/assets/components/AssetViewer/ContentRenderer.tsx
- propagation_contract: Both loaded via `next/dynamic({ssr:false})`. Neither is bundled into the page that doesn't render those formats.
- resilience: If dynamic import fails, show error tile with download link
- visual_evidence_required: false
- verified_by: [P4A-003, P4A-004, P6-007]

### AC P4A-F: Error tile with download link on non-200 proxy response

- target_surfaces:
    - web/features/assets/components/AssetViewer/index.tsx (dispatcher)
    - web/features/assets/components/AssetViewer/ImageRenderer.tsx
    - web/features/assets/components/AssetViewer/PdfRenderer.tsx
    - web/features/assets/components/AssetViewer/ContentRenderer.tsx
- propagation_contract: If backend proxy returns non-200 or MIME mismatch, AssetViewer shows an error tile with a download link to the original asset URL. No blank or crashed UI.
- resilience: This IS the resilience behavior — error tile is the fallback
- visual_evidence_required: false
- verified_by: [P4A-002, P4A-003, P4A-004, P6-007]

---

## Phase Quality Gates

- [ ] `AssetViewer` dispatcher exists at `web/features/assets/components/AssetViewer/index.tsx`
- [ ] Supports `mode="thumbnail"` and `mode="full"`
- [ ] `agent_access` gate enforced (restricted → placeholder, no file fetch)
- [ ] Image renderer: raster via `next/image`; SVG via `<img>` (no innerHTML)
- [ ] PDF renderer: `react-pdf` 10.4.1; `GlobalWorkerOptions.workerSrc` set; loaded via `next/dynamic({ssr:false})`
- [ ] MD/code renderer: `@miethe/ui` ContentPane; `sanitize={true}`; editable only for code-like extensions + authorized users
- [ ] Code language validated against shiki's known-language list
- [ ] Error tile + download link on any renderer failure or non-200 proxy response
- [ ] `code-reviewer` security checklist signed off
- [ ] `task-completion-validator` passes
- [ ] `karen` mid-feature gate passes (P4a milestone)

---

## Key Files

| File | Change Type | Notes |
|------|-------------|-------|
| `web/features/assets/components/AssetViewer/index.tsx` | Create | Dispatcher |
| `web/features/assets/components/AssetViewer/ImageRenderer.tsx` | Create | raster + SVG |
| `web/features/assets/components/AssetViewer/PdfRenderer.tsx` | Create | react-pdf 10.4.1 |
| `web/features/assets/components/AssetViewer/ContentRenderer.tsx` | Create | @miethe/ui ContentPane |
| `web/features/assets/components/AssetViewer/AccessRestrictedPlaceholder.tsx` | Create | agent_access gate UI |
| `web/features/assets/components/AssetPreview.tsx` | Supersede | Replaced by AssetViewer; retain for compatibility shim during P2b migration if needed |
| `web/package.json` | Modify | Add react-pdf 10.4.1 |
