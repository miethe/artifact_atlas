---
schema_name: ccdash_document
schema_version: 2

doc_type: human_brief
doc_subtype: feature_brief
root_kind: project_plans

id: BRIEF-ui-polish-pass
title: "UI Polish Pass — Human Brief"
status: draft
category: human-briefs

feature_slug: ui-polish-pass
feature_family: ui-polish-pass
feature_version: v1

prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
intent_ref: ""
epic_ref: ""

related_documents:
  - docs/project_plans/spikes/ui-polish-pass-spike.md
  - .claude/worknotes/ui-polish-pass/decisions-block.md
  - .claude/worknotes/ui-polish-pass/discovery/leg-1-aa-frontend.md
  - docs/project_plans/upstream/miethe-ui-additions-v1.md

owner: nick
contributors: []

audience: [humans]

priority: high
confidence: 0.85

created: 2026-06-20
updated: 2026-06-20
target_release: ""

tags: [human-brief, ui-polish, design-system, tier-3]
---

# UI Polish Pass — Human Brief

> Living document for human orchestrators. Agents: do not load unless explicitly instructed.
> Status: draft | Updated: 2026-06-20

---

## 1. Context Pointers

One-line pointers. Do not restate content.

- **PRD**: `docs/project_plans/prds/features/ui-polish-pass-v1.md`
- **Implementation Plan**: `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md`
- **Phase files**: `docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p*.md`
- **SPIKE (CONDITIONAL GO, 6 ADRs)**: `docs/project_plans/spikes/ui-polish-pass-spike.md`
- **Decisions Block**: `.claude/worknotes/ui-polish-pass/decisions-block.md`
- **Frontend Discovery (Leg 1)**: `.claude/worknotes/ui-polish-pass/discovery/leg-1-aa-frontend.md`
- **Upstream plan (do NOT duplicate)**: `docs/project_plans/upstream/miethe-ui-additions-v1.md`
- **Design Specs**: None yet — DEFER-1 through DEFER-4 specs authored in P6

---

## 2. Estimation Sanity Check

**Bottom-up total**: 55 pts
**Top-down anchor**: No directly comparable prior feature in this repo (first design-system adoption + modal unification at Tier 3). Top-down intuition also 55 pts — no delta.
**Reconciliation**: Bottom-up sum matches top-down intuition. The heuristic application below explains why 55 is well-grounded.

### H1 — Noun Count (new CRUD domain nouns)

No new backend tables for the core frontend work. P4c adds 1 new FastAPI endpoint (`/api/preview/convert/pptx`) and 1 proxy seam — but these are not new database-backed domain nouns. H1 floor contribution: ~0 pts (endpoint-only, not table-backed CRUD).

**Impact**: Minimal. The feature is frontend-dominant; H1 doesn't inflate the estimate.

### H2 — Dual-Implementation Multiplier

Not applicable. This project does not use a local + enterprise dual-repository pattern for frontend work. The single `web/` codebase is the only implementation target. H2 multiplier: 1.0× (no adjustment).

### H3 — Algorithmic Flag

No algorithmic services in scope. Format dispatch in `AssetViewer` is deterministic (MIME/extension lookup table). PPTX conversion is I/O-bound (LibreOffice/Gotenberg), not algorithmic. No dependency resolution, cycle detection, or graph traversal. H3: not triggered.

### H4 — Bundle Decomposition (≥3 capability areas)

5+ distinct capability areas — per-area estimates summed:

| Capability Area | Independent Estimate | Notes |
|----------------|---------------------|-------|
| DS foundation (P1) | 8 pts | New design-system adoption; token bridge is fiddly; hard gate |
| Modal pattern + 5 migrations (P2a+P2b) | 13 pts | New cross-cutting pattern + URL state + a11y + 5 migrations; sub-split required |
| Card redesign (P3) | 8 pts | 4 card families rebuilt; mechanical after P1+P4a |
| Asset viewer (P4a+P4b+P4c) | 13 pts | Dispatcher + 4 formats + DOCX + PPTX BE seam; sub-split required |
| Facelift P0+P1 (P5) | 8 pts | P0 independent; P1 card-tied |
| Hardening + docs (P6) | 5 pts | Gates + axe + Playwright + OpenAPI + docs |
| **Σ** | **55 pts** | Sum = plan total; no compression below sum |

H4: per-area sum (55) equals plan total (55). No package-price anchoring.

### H5 — Anchor Reference Comparison

No exact prior feature analog in this repo (first design-system adoption + modal unification). Closest analog class: "unify all detail panels" refactor in similar-complexity frontend projects — typically 40-60 pts for 5 surfaces + design-system integration. This plan's 55 pts is within that range.

Delta vs. class anchor: ~0% (aligned). No justification needed for disagreement.

### H6 — Hidden Plumbing Budget

~15% of 55 = ~8 pts. Plumbing is explicitly captured:
- P6 (5 pts): gates + axe + Playwright + OpenAPI + docs
- P4c seam task (SEAM-P4C-001, 0.5 pts): contract definition before FE render merges
- Feature flag wiring distributed across P2b (P2B-007) and P4c (P4C-004): ~1 pt
- P1 dependency resolution tasks (P1-005, P1-006): ~0.75 pts

Total visible plumbing: ~7-8 pts (~14-15% of 55). Aligned with H6 rule.

**Bottom-up total**: 55 pts
**Top-down**: 55 pts
**Delta**: 0% — locked at 55 pts.

---

## 3. Wave & Orchestration Notes

**Critical path**: `@miethe/ui@0.6.0 publish` → **P1** (token bridge, HARD GATE, karen mid-feature) → **P2a** (modal shell) → **P2b** (5 surface migrations) → **P6** (hardening + karen final sign-off)

**Parallel opportunities**:
- Wave 1 (immediate): P5-P0 (font/contrast/reduced-motion/footer) ∥ P1 (token bridge) — completely independent files
- Wave 2 (after P1): P2a ∥ P4a ∥ P4c ∥ P5-P0 ongoing — distinct file ownership; backend PPTX seam (P4c) independent of FE modal work
- Wave 3 (after P2a): P2b begins; after P4a: P3 and P4b begin — P3 needs P4a's thumbnail mode
- Wave 4 (after P3): P5-P1 begins (card-tied items)
- Wave 5 (final): P6 after P2b, P3, P4b, P4c, P5-P1 all complete

**Merge order**: P1 → then P2a and P4a can merge concurrently → P2b depends on P2a merge → P3 depends on P4a merge → P5-P1 after P3 → P6 last.

**Cross-feature coupling**: DEFER-5 (upstream @miethe/ui additions including shiki for ContentPane) is tracked in `docs/project_plans/upstream/miethe-ui-additions-v1.md`. If upstream is delayed, AA uses a thin local shim for code highlighting. P4a-004 already accounts for this — ContentPane from @miethe/ui@0.6.0 includes the shiki integration per the SPIKE. If only @0.3.0 (npm latest) is available, the shim path applies.

---

## 4. Open Questions Ledger

| ID | Source | Question | Status | Resolved By |
|----|--------|----------|--------|-------------|
| OQ-1 | PRD §12, Decisions Block §7 | Consume `@miethe/ui@0.6.0` via published npm vs workspace/`file:` link during dev? | open | P1-001 task forces resolution; lean: publish 0.6.0; `file:` link as dev interim |
| OQ-2 | PRD §12, Decisions Block §7 | PPTX→PDF conversion engine: LibreOffice headless vs. Gotenberg sidecar vs. hosted service? | open | Blocks P4c; resolve before P4c sprint; lean: Gotenberg sidecar (no LibreOffice in API container) |
| OQ-3 | PRD §12, Decisions Block §7 | Full-page detail route shape: per-entity or one generic `/detail/[type]/[id]`? | resolved | Plan: one generic route with type-keyed tab registries (P2a-001, P2A-005) |
| OQ-4 | PRD §12, Decisions Block §7 | Editable extension set and persistence: which extensions are editable, and do edits persist or stay preview-only? | resolved | Plan: `.md .ts .tsx .js .jsx .py .json .yml .yaml .toml .txt`; preview-only (no write endpoint in scope); no Mode-D boundary |
| OQ-5 | PRD §12, Decisions Block §7 | Feature-flag strategy: per-surface flag vs. global `flag:ui-tabbed-modal` during P2b migration? | resolved | Plan: per-surface flags during migration; global flag for final cutover after all 5 surfaces pass |
| OQ-6 | PRD §12, Decisions Block §7 | Preview thumbnails: client-side on-demand vs. server-generated cached thumbnails for large virtualized lists? | resolved | Plan: client-on-demand for MVP (P3); server cache deferred unless P4 NFR perf testing fails |

---

## 5. Deferred Items Rationale

Why items were deferred and what would trigger promotion. Plan §"Deferred Items" owns the triage table.

- **DEFER-1 — Dark mode**: AA is intentionally light-only. The SPIKE `verify:ui-adoption` confirmed library dark styles are dead/inactive. Dark mode would require a new token axis, `data-theme="dark"` CSS var variants, and `@miethe/ui` dark-style activation. Promote when AA product direction changes. Design spec: `docs/project_plans/design-specs/dark-mode-aa.md` (authored in P6-013).

- **DEFER-2 — Leg-5 P2 facelift items**: High-impact but not P0/P1 corrective. Scope control for this Tier-3 feature. Items: filter-bar consolidation, view-mode labels, board add-card button, RightDrawer tab bar, context-pack token count, inbox classification tag, sidebar project switcher, urgency panel, PageHeader h1 size, "View all" click target, global keyboard shortcuts. Promote in a post-P1 polish sprint. Design spec: `docs/project_plans/design-specs/facelift-p2-items.md` (P6-014).

- **DEFER-3 — Leg-5 P3 facelift items**: Lower product impact and unclear priority. Items: collaborator facepile, publish destination radio, provenance ribbon, Board Group By, pulse-subtle animation, BOM slot drag from BomOverview, Coverage recommendations rail. Promote when product priority is confirmed. Design spec: `docs/project_plans/design-specs/facelift-p3-items.md` (P6-015).

- **DEFER-4 — Preview formats beyond 6**: Scope control. Deferred formats: video, audio, ZIP, spreadsheet (xlsx/csv). Each requires a new verified-compatible library before promotion. Promote when a library is confirmed. Design spec: `docs/project_plans/design-specs/asset-viewer-extensions.md` (P6-016).

- **DEFER-5 — Upstream @miethe/ui additions**: Belongs in the upstream `@miethe/ui` project, not AA. Items: shiki in ContentPane, CM6 lang packs, reactive dark-mode MarkdownEditor, image-preview slot, root barrel `'use client'` fix, v0.6.0 publish docs. Track via `docs/project_plans/upstream/miethe-ui-additions-v1.md`. No AA spec task needed.

---

## 6. Risk Narrative

Orchestrator-facing risks (not the per-phase table in the plan):

- **R1+R2 — @miethe/ui@0.6.0 publish + token bridge (combined)**: This is the highest-stakes risk and the reason P1 is the hard gate. If npm publish is delayed, AA cannot proceed past P1 without a `file:` link workaround (acceptable per plan). If the token bridge is wrong (~330 shadcn class refs misaligned), every @miethe/ui component renders unstyled. The single-screen ContentPane smoke proof is the go/no-go checkpoint. Do not approve P2 or P4 sprint starts until this smoke passes. Watch for: any `@miethe/ui` class that renders as gray/unstyled; any tsc error involving `@miethe/ui` type resolution.

- **R3 — @codemirror/state duplication**: Silent runtime failure — ContentPane works for markdown but throws for CM6 editor mode if two instances exist. The CI assertion (`npm ls @codemirror/state`) is the defense. Watch for: any unexplained editor error in P4a ContentRenderer.

- **R4 — PPTX server-side latency**: If LibreOffice/Gotenberg is slow (>10s per file), the download fallback experience becomes the primary path. Async convert + cache is essential. Watch for: P4c integration test showing >10s convert times — if so, reconsider caching strategy.

- **R7 — Migration regression breadth**: 5 surfaces + 4 card families is a lot of changed code. The per-surface feature flags are the defense during P2b. Watch for: any surface where the EntityModal renders with broken layout or empty tabs — catch in P6-005 smoke check before karen sign-off.

---

## 7. What to Watch For

- **P1 hard gate delay**: Any blocker on `@miethe/ui@0.6.0` publish cascades to all downstream phases. If the publish is >1 week delayed, consider starting the feature with the `file:` link to unblock dev, and update P1-001 resolution accordingly.

- **P4c OQ-2 resolution**: The PPTX conversion engine choice (LibreOffice vs. Gotenberg) affects the Docker/infra shape. This must be resolved before P4c sprint starts — not after. If left unresolved, P4C-001 cannot be implemented correctly.

- **P2b migration order matters**: Migrate Asset Inspector (P2B-001) first — it's the simplest (existing RightDrawer already has focus-trap). Validate the pattern works on this surface before proceeding to BOM (P2B-002), which is the most complex (bespoke fixed panel, no existing focus-trap).

- **P3 card heights and TanStack Virtual**: Zone-composition adds a fixed ~96px HeaderZone. If the existing AssetLibrary virtual list uses `estimateSize` based on the old card height, it will need updating. P3-008 covers this but it's easy to miss. Watch for blank rows or scroll-jitter after P3 merges.

- **P5-P0 contrast fix scope**: `ink-faint` is used in both text and non-text contexts (borders, icons, placeholders). The contrast fix only applies to text-context usage. Non-text usage (decorative) remains at its current value per WCAG. If P5-P0-002 tries to fix non-text usages too, it may over-correct and break visual hierarchy.

- **globals.css as a serialization barrier**: Both P1-003 (token bridge) and P5-P0-002 (contrast fix) and P5-P0-003 (reduced-motion) all edit `globals.css`. These must NOT run in the same wave. P5-P0 tasks are parallel with P1 but they touch different lines; still, assign them to different agents with explicit conflict awareness.

---

## 8. Expected Success Behaviors

Observable, human-verifiable post-ship outcomes. Not agent acceptance criteria.

- [ ] Clicking any AssetCard, SlotCard, PackCard, or TemplateCard opens a consistent tabbed modal with a "Preview" tab showing real content — not a placeholder string
- [ ] The modal header shows a "Open full page" button that navigates to a deep-linkable URL (e.g., `/projects/proj_aa/detail/asset/ast_123?tab=preview`)
- [ ] Pressing Escape anywhere in the open modal closes it and returns focus to the card that was clicked
- [ ] AssetViewer correctly renders: a real image (not a placeholder box); a PDF's first page (with page controls); syntax-highlighted code; rendered Markdown with headings; a DOCX document body; a PPTX first slide (after server-side conversion)
- [ ] All card families show a full-width top thumbnail (~96px tall) with a real per-format preview — not the old 32×32 inline icon
- [ ] Inter font loads on every page (verify in Network tab: woff2 requests to fonts.gstatic.com)
- [ ] Body text that previously used `ink-faint` (#9ca3af) is now visually darker and passes WCAG AA contrast check in Chrome DevTools
- [ ] CSS animations (skeleton loading, drawer slide-in) stop when the OS "Reduce Motion" accessibility setting is enabled
- [ ] CollaborationFooter shows "Connected" or "Disconnected" dynamically — not a hardcoded "Checking" state
- [ ] SidebarNav shows section labels ("Project", "Content", "Tools") and the active item has a left accent bar
- [ ] Coverage page shows a circular readiness ring with a percentage, not a plain number
- [ ] Empty BOM slots render with a dashed purple border (distinct from filled slots)
- [ ] `tsc --noEmit` passes with zero new errors (confirm via CI)
- [ ] Playwright e2e suite passes (confirm in CI green)

---

## 9. Running Log

- [2026-06-20] Brief created. Plan authored from decisions block + PRD + SPIKE. 55 pts, Tier 3, CONDITIONAL GO. P1 is the hard gate pending @miethe/ui@0.6.0 publish.
