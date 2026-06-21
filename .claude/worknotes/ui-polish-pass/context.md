---
type: context
schema_version: 2
doc_type: context
prd: "ui-polish-pass"
title: "UI Polish Pass — Development Context"
status: active
created: 2026-06-21
updated: 2026-06-21
critical_notes_count: 6
implementation_decisions_count: 6
active_gotchas_count: 4
agent_contributors: []
agents: []
---

# UI Polish Pass — Development Context

**Status**: Pre-implementation (all phases pending)
**Created**: 2026-06-21

---

## Feature Goal

Replace five inconsistent bespoke detail surfaces with one canonical tabbed-modal + full-page-route pattern; redesign all card families with zone composition and real per-format top thumbnails; ship a multi-format AssetViewer (image/PDF/MD/DOCX/PPTX + code); adopt @miethe/ui@0.6.0 via shadcn token bridge; and land a prioritized facelift (P0 a11y + P1 high-impact surfaces). SPIKE verdict: CONDITIONAL GO.

---

## Key Document Paths

| Doc | Path |
|-----|------|
| PRD | `docs/project_plans/prds/features/ui-polish-pass-v1.md` |
| Parent implementation plan | `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md` |
| SPIKE | `docs/project_plans/spikes/ui-polish-pass-spike.md` |
| Decisions block | `.claude/worknotes/ui-polish-pass/decisions-block.md` |
| Upstream @miethe/ui plan | `docs/project_plans/upstream/miethe-ui-additions-v1.md` |
| Leg-1 discovery | `.claude/worknotes/ui-polish-pass/discovery/leg-1-aa-frontend.md` |
| Modal pattern API (created in P2A-001) | `.claude/worknotes/ui-polish-pass/modal-pattern-api.md` |
| PPTX seam contract (created in SEAM-P4C-001) | `.claude/worknotes/ui-polish-pass/pptx-seam-contract.md` |

---

## Architecture Constraints

### Token-Bridge HARD GATE (P1)

P1 is the prerequisite for ALL other phases except P5-P0. Do NOT start P2, P3, or P4 until P1-008 passes. The gate check: ContentPane smoke screen renders with correct AA palette tokens on a feature-flagged page + tsc --noEmit passes + next build passes + @codemirror/state single instance confirmed.

The shadcn token bridge is ADDITIVE ONLY — no existing AA tokens (`--ink*`, `--surface`, `--brand`, `--status-*`) may be renamed or overwritten.

All `@miethe/ui` imports MUST use subpath imports (`@miethe/ui/primitives`, `/editor`, `/content-viewer`, `/diff`). NEVER import root barrel `@miethe/ui` from a Server Component (throws "You're importing a component that needs 'use client'").

### PPTX Server-Side→PDF Seam (P4c)

No React 19-compatible PPTX renderer exists. PPTX converts server-side (LibreOffice headless or Gotenberg — OQ-2 must resolve before P4C-001). FE renders the converted PDF via the existing react-pdf surface. SEAM-P4C-001 contract doc must be signed off by both `python-backend-engineer` and `ui-engineer-enhanced` before P4C-003 merges.

PPTX thumbnail mode: show Lucide Presentation icon only. Do NOT call the convert endpoint in thumbnail mode.

### Untrusted-File Security Posture (P4a/P4b)

- SVG: render via `<img>` through backend proxy; NEVER `dangerouslySetInnerHTML`
- Markdown/HTML: `sanitize=true` on ContentPane for all user-uploaded content
- DOCX: `fetchRelated:false` in docx.renderAsync (SSRF mitigation, NFR-S4)
- PDF: `GlobalWorkerOptions.workerSrc` set explicitly in same `'use client'` module as `<Document>`; JS execution disabled by default in react-pdf
- All heavy renderers (PDF, DOCX, ContentPane): `next/dynamic({ssr:false})` — never eagerly bundled
- agent_access gate: absent field → treat as `"metadata_only"` (fail-safe)

### @miethe/ui Subpath-Only Imports

All imports must use granular subpaths. Importing root barrel from Server Component throws at runtime. Caught in code review and P6-001 tsc gate.

---

## Phase Dependency Summary

```
P5-P0 (parallel, no deps) ──────────────────────────────────────┐
P1 (HARD GATE) → P2a → P2b                                       │
             └→ P4a ─┬→ P4b → P6
                      ├→ P4c (+ BE)
                      └→ P3 (after P4a + P1)
P3 → P5-P1 → P6
All prior phases → P6
```

---

## The 6 ADRs

- **ADR-1**: Adopt @miethe/ui via token-bridge, subpath imports, v0.6.0
- **ADR-2**: Canonical detail pattern — tabbed modal + full-page route, URL-driven
- **ADR-3**: Preview-card pattern — zone-composition card with top thumbnail
- **ADR-4**: Asset-viewer stack — dispatcher + per-format libs; PPTX server-side→PDF
- **ADR-5**: Facelift scope — P0 a11y/correctness + P1 high-impact; defer dark mode (DEFER-1)
- **ADR-6**: Upstream-vs-local split policy

All 6 must be written to `docs/DECISIONS.md` in P6-011.

---

## Progress File Index

| Phase | Progress File |
|-------|--------------|
| P1 | `.claude/progress/ui-polish-pass/phase-p1-progress.md` |
| P2a | `.claude/progress/ui-polish-pass/phase-p2a-progress.md` |
| P2b | `.claude/progress/ui-polish-pass/phase-p2b-progress.md` |
| P3 | `.claude/progress/ui-polish-pass/phase-p3-progress.md` |
| P4a | `.claude/progress/ui-polish-pass/phase-p4a-progress.md` |
| P4b | `.claude/progress/ui-polish-pass/phase-p4b-progress.md` |
| P4c | `.claude/progress/ui-polish-pass/phase-p4c-progress.md` |
| P5 | `.claude/progress/ui-polish-pass/phase-p5-progress.md` |
| P6 | `.claude/progress/ui-polish-pass/phase-p6-progress.md` |
