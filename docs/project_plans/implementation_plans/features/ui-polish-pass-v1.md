---
schema_version: 2
doc_type: implementation_plan
title: "Implementation Plan: UI Polish Pass — Artifact Atlas"
status: draft
created: 2026-06-20
updated: 2026-06-20
feature_slug: ui-polish-pass
feature_version: v1
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: null
spike_ref: docs/project_plans/spikes/ui-polish-pass-spike.md
scope: "Adopt @miethe/ui design system, replace 5 bespoke detail surfaces with canonical tabbed-modal pattern, redesign cards with real per-format previews, ship multi-format AssetViewer, and land a prioritized facelift pass across AA web."
effort_estimate: "55 pts"
priority: high
risk_level: medium
tier: 3
deferred_items_spec_refs: []
findings_doc_ref: null
changelog_required: true
related_documents:
  - .claude/worknotes/ui-polish-pass/decisions-block.md
  - docs/project_plans/upstream/miethe-ui-additions-v1.md
  - .claude/worknotes/ui-polish-pass/discovery/leg-1-aa-frontend.md
adr_refs:
  - "ADR-1: Adopt @miethe/ui via token-bridge, subpath imports, v0.6.0"
  - "ADR-2: Canonical detail pattern — tabbed modal + full-page route, URL-driven"
  - "ADR-3: Preview-card pattern — zone-composition card with top thumbnail"
  - "ADR-4: Asset-viewer stack — dispatcher + per-format libs; PPTX server-side→PDF"
  - "ADR-5: Facelift scope — P0 a11y/correctness + P1 high-impact; defer dark mode"
  - "ADR-6: Upstream-vs-local split policy"
---

# Implementation Plan: UI Polish Pass — Artifact Atlas

**Plan ID**: `IMPL-2026-06-20-UI-POLISH-PASS`
**Date**: 2026-06-20
**Author**: Implementation Planner (Sonnet) — expanded from Opus decisions block
**Human Brief**: `docs/project_plans/human-briefs/ui-polish-pass.md`
**Related Documents**:
- **PRD**: `docs/project_plans/prds/features/ui-polish-pass-v1.md`
- **SPIKE**: `docs/project_plans/spikes/ui-polish-pass-spike.md`
- **Decisions Block**: `.claude/worknotes/ui-polish-pass/decisions-block.md`
- **Frontend Discovery**: `.claude/worknotes/ui-polish-pass/discovery/leg-1-aa-frontend.md`
- **Upstream Plan (do not duplicate)**: `docs/project_plans/upstream/miethe-ui-additions-v1.md`

**Complexity**: XL (Tier 3)
**Total Estimated Effort**: 55 pts
**Target Timeline**: TBD — gate on `@miethe/ui@0.6.0` publish

---

## Executive Summary

This plan delivers five coordinated UI pillars for Artifact Atlas: (1) adopt `@miethe/ui@0.6.0` via a shadcn-compatible token bridge (P1 — hard gate for all phases); (2) replace five inconsistent bespoke detail surfaces with one canonical tabbed-modal + full-page-route pattern (P2a/P2b); (3) redesign all card families with zone composition and real per-format top thumbnails (P3); (4) ship a multi-format `AssetViewer` supporting images, PDF, Markdown, DOCX, PPTX (via server-side conversion), and code (P4a/P4b/P4c); and (5) land a prioritized facelift — P0 a11y/correctness items in parallel with P1, P1 high-impact items after P3 (P5). The SPIKE verdict is CONDITIONAL GO; two load-bearing constraints drive the phase ordering: the token-bridge prerequisite (P1 hard gate) and the absence of a React 19-compatible PPTX renderer (P4c server-side seam). P6 closes with hardening, a11y gates, and docs.

**Key milestones**: P1 exit gate (ContentPane smoke screen) → P2a pattern API → P2b migrations + P4a viewer in parallel → P3 card redesign → P5-P1 facelift → P6 hardening.

---

## Implementation Strategy

### Architecture Sequence

This feature is frontend-dominant with one backend seam (P4c). Sequence follows:
1. **Design-system foundation** (P1) — token bridge, build config, one smoke-screen page
2. **Modal pattern** (P2a) — shared EntityModal shell, tab registry, URL state, a11y
3. **Surface migration** (P2b) — migrate all 5 detail surfaces onto EntityModal
4. **Asset viewer** (P4a/P4b/P4c) — dispatcher + per-format renderers + PPTX BE seam
5. **Card redesign** (P3) — zone-composition cards reusing P4a preview renderers
6. **Facelift** (P5-P0 parallel / P5-P1 sequential) — P0 independent; P1 after P3
7. **Hardening** (P6) — tsc/build/axe/e2e gates, docs, OpenAPI alignment

### Parallel Work Opportunities

- **P5-P0 facelift** (font/contrast/reduced-motion/footer) starts immediately in parallel with P1. These touch independent files (`app/layout.tsx`, `app/globals.css`, `CollaborationFooter.tsx`) with no design-system dependency.
- After P1 completes: **P2a** (modal pattern) and **P4a/P4c** (viewer + backend PPTX seam) run in parallel — distinct file ownership.
- **P4b** (DOCX) and **P4c** (PPTX) run in parallel after P4a — independent renderers.
- After P2a: **P2b** begins; after P1+P4a: **P3** begins.

### Critical Path

`publish @miethe/ui@0.6.0` → **P1** (token bridge, HARD GATE) → **P2a** (modal shell) → **P2b** (5 surface migrations) → **P6** (hardening)

Parallel path feeding P6: P1 → P4a → P4b / P4c → P6; P3 hangs off P1 + P4a.

### Phase Summary

| Phase | Title | Estimate | Target Subagent(s) | Model(s) | Notes |
|-------|-------|----------|--------------------|---------:|-------|
| P1 | Design-system foundation | 8 pts | frontend-architect, ui-engineer-enhanced | opus (design), sonnet (impl) | Hard gate for all phases |
| P2a | Modal shell + tab registry | 5 pts | frontend-architect, ui-engineer-enhanced | opus (pattern API), sonnet | After P1 |
| P2b | Migrate 5 detail surfaces | 8 pts | ui-engineer-enhanced | sonnet | After P2a; feature flags per surface |
| P3 | Card redesign + previews | 8 pts | ui-engineer-enhanced | sonnet | After P1+P4a |
| P4a | AssetViewer (img/PDF/MD/code) | 6 pts | ui-engineer-enhanced | sonnet | After P1; parallel with P2 |
| P4b | DOCX renderer | 3 pts | ui-engineer-enhanced | sonnet | After P4a |
| P4c | PPTX server-side seam | 4 pts | python-backend-engineer, ui-engineer-enhanced | sonnet | FE+BE; integration_owner required |
| P5 | Facelift P0+P1 | 8 pts | ui-engineer-enhanced, a11y-sheriff | sonnet | P5-P0 starts parallel with P1 |
| P6 | Hardening, a11y & docs | 5 pts | task-completion-validator, karen, documentation-writer | (agent defaults) | Final gates |
| **Total** | — | **55 pts** | — | — | — |

> Estimation rationale lives in the Human Brief §2. See `docs/project_plans/human-briefs/ui-polish-pass.md`.

---

## Wave Plan

```yaml
wave_plan:
  serialization_barriers:
    - web/app/globals.css
    - shared/openapi.yaml
  phases:
    - id: P5-P0
      depends_on: []
      parallelizable: true
      notes: "P0 facelift items (font/contrast/reduced-motion/footer) — independent files; start immediately"
    - id: P1
      depends_on: []
      parallelizable: true
      notes: "Token bridge; hard gate for all downstream phases"
    - id: P2a
      depends_on: [P1]
      parallelizable: false
    - id: P4a
      depends_on: [P1]
      parallelizable: true
      notes: "Viewer dispatcher — parallel with P2a/P2b"
    - id: P2b
      depends_on: [P2a]
      parallelizable: false
    - id: P4b
      depends_on: [P4a]
      parallelizable: true
    - id: P4c
      depends_on: [P4a]
      parallelizable: true
    - id: P3
      depends_on: [P1, P4a]
      parallelizable: false
      notes: "Cards need P1 design system + P4a renderers for thumbnails"
    - id: P5-P1
      depends_on: [P3]
      parallelizable: false
      notes: "P1 facelift items — after P3 for card-tied items"
    - id: P6
      depends_on: [P2b, P3, P4b, P4c, P5-P1]
      parallelizable: false
      notes: "Final hardening gate"
```

---

## Reviewer Gates (Tier-3 Mandatory)

- **`task-completion-validator`**: runs after EVERY phase (P1 through P5)
- **`karen`**:
  - Mid-feature after P1 (hard gate milestone)
  - Mid-feature after P4a (viewer security + dispatch milestone)
  - End of feature after P6

No phase is "complete" until `task-completion-validator` passes. `karen` mid-feature gates block proceeding to dependent phases.

---

## Deferred Items & In-Flight Findings Policy

### Deferred Items Triage

| Item ID | Category | Reason Deferred | Trigger for Promotion | Target Spec Path |
|---------|----------|-----------------|-----------------------|-----------------|
| DEFER-1 | scope-cut | Dark mode: AA intentionally light-only; whole new token axis | AA product direction change | docs/project_plans/design-specs/dark-mode-aa.md |
| DEFER-2 | backlog | Leg-5 P2 facelift items (filter-bar, view-mode labels, board add-card, etc.) | Post-P1 polish sprint | docs/project_plans/design-specs/facelift-p2-items.md |
| DEFER-3 | backlog | Leg-5 P3 facelift items (facepile, provenance ribbon, Board Group By, etc.) | Product priority decision | docs/project_plans/design-specs/facelift-p3-items.md |
| DEFER-4 | scope-cut | Preview formats beyond the 6 defined (video, audio, ZIP, etc.) | New verified-compatible library | docs/project_plans/design-specs/asset-viewer-extensions.md |
| DEFER-5 | dependency-blocked | Upstream @miethe/ui additions (shiki, CM6 lang packs, dark-mode MarkdownEditor) | Upstream release; see docs/project_plans/upstream/miethe-ui-additions-v1.md | N/A — upstream plan owns |

DOC-006 tasks in P6 will author design specs for DEFER-1 through DEFER-4. DEFER-5 is upstream — reference only.

### In-Flight Findings

Findings doc is NOT pre-created. Create `.claude/findings/ui-polish-pass-findings.md` on the first real in-flight discovery. Set `findings_doc_ref` in this plan's frontmatter when created.

---

## Phase Files

Full task detail lives in the phase files below. Parent plan is the orchestration index; phase files are the execution surfaces.

| Phase | Phase File |
|-------|-----------|
| P1 | [phase-p1-ds-foundation.md](./ui-polish-pass-v1/phase-p1-ds-foundation.md) |
| P2a | [phase-p2a-modal-shell.md](./ui-polish-pass-v1/phase-p2a-modal-shell.md) |
| P2b | [phase-p2b-surface-migration.md](./ui-polish-pass-v1/phase-p2b-surface-migration.md) |
| P3 | [phase-p3-card-redesign.md](./ui-polish-pass-v1/phase-p3-card-redesign.md) |
| P4a | [phase-p4a-asset-viewer.md](./ui-polish-pass-v1/phase-p4a-asset-viewer.md) |
| P4b | [phase-p4b-docx.md](./ui-polish-pass-v1/phase-p4b-docx.md) |
| P4c | [phase-p4c-pptx-seam.md](./ui-polish-pass-v1/phase-p4c-pptx-seam.md) |
| P5 | [phase-p5-facelift.md](./ui-polish-pass-v1/phase-p5-facelift.md) |
| P6 | [phase-p6-hardening.md](./ui-polish-pass-v1/phase-p6-hardening.md) |

---

## Risk Summary

| Risk | Impact | Likelihood | Mitigation | Phase |
|------|--------|------------|------------|-------|
| R1: Token-bridge adoption failure | High | Medium | P1 hard gate with ContentPane smoke screen before any rollout | P1 |
| R2: `@miethe/ui@0.6.0` not published | High | Medium | `file:` link interim; explicit publish prerequisite task P1-001 | P1 |
| R3: `@codemirror/state` duplication | High | Medium | Package overrides + CI assert (`npm ls @codemirror/state`) | P1 |
| R4: PPTX server-side infra latency | Medium | Medium | Async convert + cache; download fallback; behind flag | P4c |
| R5: react-pdf worker misconfiguration | Medium | Low | `workerSrc` in same `'use client'` module; CI version assert | P4a |
| R6: Untrusted-file XSS/SSRF | Medium-High | Low | `sanitize=true`, `fetchRelated:false`, SVG via `<img>`, code-reviewer gate | P4a/P4b |
| R7: Migration regression (5 surfaces + cards) | Medium | Medium | One shared pattern; per-surface flags; visual smoke + axe + e2e | P2b/P3/P6 |

---

## Wrap-Up

After P6 gates clear:
1. Delegate to `documentation-writer` to create `.claude/worknotes/ui-polish-pass/feature-guide.md`
2. Open PR; derive summary bullets from Executive Summary + CHANGELOG entry (P6-017)
3. Update this plan's frontmatter: `status: completed`, `commit_refs`, `files_affected`
