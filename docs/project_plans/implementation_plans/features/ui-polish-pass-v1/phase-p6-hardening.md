---
schema_version: 2
doc_type: phase_plan
title: "P6: Hardening, A11y & Docs — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P6
phase_title: "Hardening, A11y & Docs"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "P2b, P3, P4b, P4c, P5-P1 all exit gates passed"
  - "All task-completion-validator gates passed for P1 through P5"
exit_criteria:
  - "tsc --noEmit passes (zero new errors vs P1 baseline)"
  - "next build passes"
  - "axe-core sweep reports zero new critical/serious violations on modal + AssetViewer surfaces"
  - "All 6 runtime smoke checks passed"
  - "Playwright e2e passes (modal + AssetViewer happy paths)"
  - "shared/openapi.yaml complete (PPTX-convert + preview proxy)"
  - "docs/DECISIONS.md updated with all 6 ADRs"
  - "docs/mvp-backlog.md updated"
  - "CHANGELOG [Unreleased] entry present"
  - "4 design specs authored for DEFER-1 through DEFER-4"
  - "karen final sign-off"
integration_owner: null
---

# P6: Hardening, A11y & Docs

**Estimate**: 5 pts
**Depends on**: All prior phases (P2b, P3, P4b, P4c, P5-P1)
**This is the final phase**
**Assigned Subagent(s)**: `task-completion-validator`, `karen`, `documentation-writer`
**Model routing**: agent defaults (reviewers are edit-less); `documentation-writer` → haiku (adaptive) for standard docs; sonnet for design-spec authoring

---

## Context

P6 is the cross-cutting validation and documentation finalization phase. Every phase's runtime surfaces must be smoke-checked here. The design specs for deferred items must be authored so that nothing is lost.

**karen gates** in this phase:
- `karen` mid-feature gate after P4a was a prerequisite for reaching P6
- `karen` final sign-off (P6-020) closes the feature

---

## Task Breakdown

### Build & Type Gates

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P6-001 | tsc --noEmit gate | Run `npx tsc --noEmit 2>&1 \| grep -v "__tests__/a11y/" \| grep "error TS"`. Must return zero lines (zero new errors vs P1 baseline). Record baseline TS error count at P1 start; compare here. | 0.5 pts | task-completion-validator | (default) | — | All impl phases |
| P6-002 | next build gate | Run `next build`. Must exit 0. No new warnings about missing `transpilePackages` or ESM resolution. | 0.5 pts | task-completion-validator | (default) | — | P6-001 |

### A11y Gate

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P6-003 | axe-core sweep | Run `axe-core` automated sweep against: (1) EntityModal open on each of 5 surfaces, (2) AssetViewer for each of 6 formats. Report must show zero new critical or serious violations introduced by this feature. Pre-existing violations are noted but do not block. | 0.5 pts | a11y-sheriff | (default) | — | P6-002 |

### Runtime Smoke

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P6-004 | Runtime smoke — P1 surfaces | Verify ContentPane on the feature-flagged page (P1-007 smoke screen) still renders with correct tokens. Target: `web/features/assets/AssetDetail.tsx` (smoke screen page). | 0.25 pts | task-completion-validator | (default) | — | P6-002 |
| P6-005 | Runtime smoke — P2 surfaces (EntityModal) | Verify EntityModal opens on all 5 detail surfaces with correct tab UI, URL state, and focus behavior. Target surfaces: `web/features/assets/AssetLibrary.tsx` (Asset Inspector), `web/features/bom/BomOverview.tsx` (Slot Detail), `web/features/coverage/CoverageView.tsx` (Coverage Slot), `web/features/templates/TemplateLibrary.tsx` (Template Preview), `web/features/inbox/InboxTriage.tsx` (Inbox Preview). | 0.5 pts | task-completion-validator | (default) | — | P6-003 |
| P6-006 | Runtime smoke — P3 surfaces (cards) | Verify all 4 card families render zone-composition with full-width top thumbnail. Target: `web/features/assets/components/AssetCard.tsx`, `web/features/bom/components/SlotCard.tsx`, `web/features/context-packs/components/PackCard.tsx`, `web/features/templates/components/TemplateCard.tsx`. | 0.25 pts | task-completion-validator | (default) | — | P6-005 |
| P6-007 | Runtime smoke — P4 surfaces (AssetViewer all 6 formats) | Verify AssetViewer renders all 6 formats: image (png), PDF, Markdown, code (TypeScript), DOCX, PPTX (behind flag). Target: `web/features/assets/components/AssetViewer/index.tsx` (and per-renderer files). Verify agent_access gate shows placeholder for restricted assets. | 0.5 pts | task-completion-validator | (default) | — | P6-006 |
| P6-008 | Runtime smoke — P5 surfaces (facelift) | Verify P5-P0 items (fonts loading, contrast, reduced-motion suppression, footer health) and P5-P1 items (sidebar groups, PageHeader, BOM empty slots, dashboard thumbnails, MetricCard delta, ReadinessScore ring, BoardColumn accent, EmptyState icons). Target surfaces: `web/app/layout.tsx`, `web/app/globals.css`, `web/components/shell/SidebarNav.tsx`, `web/features/dashboard/CommandCenterView.tsx`, `web/features/bom/components/SlotCard.tsx`, `web/features/dashboard/panels/*.tsx`, `web/components/ui/MetricCard.tsx`, `web/features/coverage/components/ReadinessScore.tsx`, `web/features/board/components/BoardColumn.tsx`, all EmptyState callsites. | 0.5 pts | task-completion-validator | (default) | — | P6-007 |

### E2E

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P6-009 | Playwright e2e | Author/update Playwright tests covering: (a) open modal from card click; (b) Escape closes modal + focus returns to trigger; (c) "Open full page" navigation preserves tab param; (d) AssetViewer renders each supported format happy path (image, PDF, MD, code, DOCX, PPTX); (e) agent_access gate shows metadata-only placeholder. | 1 pt | task-completion-validator | (default) | — | P6-008 |

### Documentation & OpenAPI

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P6-010 | Update shared/openapi.yaml | Verify `shared/openapi.yaml` includes: (1) `POST /api/preview/convert/pptx` (coordinate with P4C-005 — no double-edit), (2) asset-fetch proxy seam endpoint (if added in P4C-002). Ensure response schemas are complete. | 0.5 pts | documentation-writer | sonnet | adaptive | P4C-005 |
| P6-011 | Update docs/DECISIONS.md | Add all 6 ADRs from the SPIKE to `docs/DECISIONS.md`: ADR-1 (token bridge), ADR-2 (tabbed modal pattern), ADR-3 (preview card), ADR-4 (asset viewer stack), ADR-5 (facelift scope), ADR-6 (upstream split policy). | 0.5 pts | documentation-writer | haiku | adaptive | P6-009 |
| P6-012 | Update docs/mvp-backlog.md | Mark completed items in `docs/mvp-backlog.md`: all 5 pillar completions. Add deferred items (DEFER-1 through DEFER-4) to appropriate backlog sections (P2 and P3 backlogs for facelift; future AssetViewer extension; future dark mode). | 0.25 pts | documentation-writer | haiku | adaptive | P6-011 |
| P6-013 | DOC-006 — Design spec DEFER-1 (dark-mode-aa) | Author `docs/project_plans/design-specs/dark-mode-aa.md` with `doc_type: design_spec`, `maturity: idea`, `status: draft`. Problem statement: AA is intentionally light-only; dark mode would require a new token axis and library dark-style adoption. Open questions: product direction trigger, `@miethe/ui` dark-mode support status. | 0.25 pts | documentation-writer | sonnet | adaptive | P6-012 |
| P6-014 | DOC-006 — Design spec DEFER-2 (facelift-p2-items) | Author `docs/project_plans/design-specs/facelift-p2-items.md` with `maturity: shaping`. Enumerate the Leg-5 P2 items: filter-bar consolidation, view-mode labels, board add-card, RightDrawer tab bar, context-pack token count, inbox classification tag, sidebar project switcher, urgency panel, PageHeader h1 size, "View all" click target, keyboard shortcuts. | 0.25 pts | documentation-writer | sonnet | adaptive | P6-012 |
| P6-015 | DOC-006 — Design spec DEFER-3 (facelift-p3-items) | Author `docs/project_plans/design-specs/facelift-p3-items.md` with `maturity: idea`. Enumerate the Leg-5 P3 items: collaborator facepile, publish destination radio, provenance ribbon, Board Group By, pulse-subtle, BOM slot drag from BomOverview, Coverage recommendations rail. | 0.25 pts | documentation-writer | sonnet | adaptive | P6-012 |
| P6-016 | DOC-006 — Design spec DEFER-4 (asset-viewer-extensions) | Author `docs/project_plans/design-specs/asset-viewer-extensions.md` with `maturity: idea`. Enumerate deferred formats: video, audio, ZIP, spreadsheet (xlsx/csv). Note: new format requires a verified-compatible library before promotion. | 0.25 pts | documentation-writer | sonnet | adaptive | P6-012 |
| P6-017 | CHANGELOG [Unreleased] entry | Author CHANGELOG entry under `[Unreleased]` covering: Added — EntityModal tabbed detail pattern (replaces 5 bespoke surfaces); AssetViewer multi-format renderer (image/PDF/MD/DOCX/PPTX/code); zone-composition card redesign with top thumbnails; @miethe/ui design system adoption. Changed — ink-faint contrast fix; Inter font via next/font. See `.claude/specs/changelog-spec.md` for categorization rules. | 0.25 pts | changelog-generator | haiku | adaptive | P6-016 |
| P6-018 | Plan frontmatter completion | Update `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md` frontmatter: `status: completed`, populate `commit_refs`, `files_affected`, `deferred_items_spec_refs` (paths to DEFER-1 through DEFER-4 specs). Update `updated` date. | 0.25 pts | documentation-writer | haiku | adaptive | P6-017 |

### Review Gates

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P6-019 | task-completion-validator final pass | Final `task-completion-validator` pass against all P6 exit criteria. | — | task-completion-validator | (default) | — | P6-018 |
| P6-020 | karen final sign-off | `karen` reviews: actual implementation state vs. PRD acceptance criteria (AC-1 through AC-7); plan vs. delivered; quality gate completeness. This closes the feature. | — | karen | (default) | — | P6-019 |

---

## Acceptance Criteria

### AC P6-A: Build gates pass (zero regressions)

- target_surfaces:
    - web/ (TypeScript compilation)
    - web/ (Next.js build)
- propagation_contract: `tsc --noEmit` and `next build` both exit 0. No new errors or warnings introduced by this feature.
- resilience: If pre-existing errors exist in test files, filter with `grep -v "__tests__/a11y/"` per project convention
- visual_evidence_required: false
- verified_by: [P6-001, P6-002]

### AC P6-B: axe-core zero new violations on modal + viewer

- target_surfaces:
    - web/features/ui/components/EntityModal/index.tsx
    - web/features/assets/components/AssetViewer/index.tsx
    - All 5 modal-surfaced detail views
    - All 6 AssetViewer format renderers
- propagation_contract: axe-core automated sweep run with modal open on each surface; zero new critical or serious violations reported
- resilience: Pre-existing violations noted separately; they do not block this gate
- visual_evidence_required: false
- verified_by: [P6-003, P6-005, P6-007]

### AC P6-C: Playwright e2e covers all required paths

- target_surfaces:
    - web/ (e2e test suite)
- propagation_contract: Tests cover: (a) modal open/close/tab/deep-link; (b) Escape + focus return; (c) "Open full page"; (d) AssetViewer per-format; (e) agent_access gate placeholder
- resilience: If a format's test asset is unavailable in CI, test should skip gracefully (not fail)
- visual_evidence_required: false
- verified_by: [P6-009]

### AC P6-D: Deferred items have design specs

- target_surfaces:
    - docs/project_plans/design-specs/dark-mode-aa.md
    - docs/project_plans/design-specs/facelift-p2-items.md
    - docs/project_plans/design-specs/facelift-p3-items.md
    - docs/project_plans/design-specs/asset-viewer-extensions.md
- propagation_contract: All 4 deferred items have `doc_type: design_spec` files at the target paths. DEFER-5 (upstream) has no spec task — referenced only via `docs/project_plans/upstream/miethe-ui-additions-v1.md`.
- resilience: N/A — authoring task
- visual_evidence_required: false
- verified_by: [P6-013, P6-014, P6-015, P6-016, P6-018]

---

## Phase Quality Gates

**Build**:
- [ ] `tsc --noEmit` exits 0 (zero new errors vs P1 baseline)
- [ ] `next build` exits 0

**A11y**:
- [ ] `axe-core` reports zero new critical/serious violations on modal + AssetViewer surfaces

**Runtime Smoke (by phase)**:
- [ ] P6-004: P1 ContentPane smoke screen verified
- [ ] P6-005: EntityModal verified on all 5 detail surfaces
- [ ] P6-006: All 4 card families zone-composition verified
- [ ] P6-007: AssetViewer verified for all 6 formats
- [ ] P6-008: All P5 facelift items verified

**E2E**:
- [ ] Playwright e2e passes all 5 required paths

**Documentation**:
- [ ] `shared/openapi.yaml` complete (PPTX-convert + proxy seam)
- [ ] `docs/DECISIONS.md` updated with all 6 ADRs
- [ ] `docs/mvp-backlog.md` updated (completed + deferred)
- [ ] Design specs authored for DEFER-1 through DEFER-4
- [ ] CHANGELOG `[Unreleased]` entry present

**Closure**:
- [ ] Plan frontmatter updated (`status: completed`, `commit_refs`, `files_affected`, `deferred_items_spec_refs`)
- [ ] `task-completion-validator` final pass
- [ ] `karen` final sign-off
