---
schema_version: 2
doc_type: phase_plan
title: "P5: Facelift P0 + P1 — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P5
phase_title: "Facelift P0+P1"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "P5-P0: No hard dependencies — starts immediately in parallel with P1"
  - "P5-P1: P3 exit gate passed (cards redesigned; some P1 facelift items are card-tied)"
exit_criteria:
  - "P0: ink-faint contrast ≥4.5:1; Inter + JetBrains Mono loaded via next/font; prefers-reduced-motion block present; CollaborationFooter probes /api/health"
  - "P1: Sidebar grouping + active accent; PageHeader enriched; BOM dotted-purple empty slots; Dashboard thumbnails + KPI deltas; ReadinessScore ring; BoardColumn accent; EmptyState icons"
  - "a11y-sheriff review passes (contrast + reduced-motion)"
  - "task-completion-validator gate passes"
integration_owner: null
---

# P5: Facelift P0 + P1

**Estimate**: 8 pts (P0: 3 pts parallel with P1; P1: 5 pts after P3)
**Depends on**: P5-P0 → none (parallel with P1); P5-P1 → P3
**Blocks**: P6
**Assigned Subagent(s)**: `ui-engineer-enhanced`, `a11y-sheriff`
**Model routing**: `ui-engineer-enhanced` → sonnet (low-medium effort — many small, well-scoped edits); `a11y-sheriff` → (agent default)

> ADR-5: Facelift scope — P0 a11y/correctness + P1 high-impact; defer dark mode (DEFER-1)
> P5-P0 items are independent files; start in parallel with P1 immediately.

---

## Context

**P5-P0 items** (a11y/correctness — independent of design system):
- FR-14: Inter + JetBrains Mono via `next/font` in `app/layout.tsx`
- FR-15: `ink-faint` (#9ca3af ~2.9:1 contrast) → ≥ #6b7280 for text-context usage (WCAG AA)
- FR-16: `@media (prefers-reduced-motion: reduce)` block in `globals.css`
- FR-17: `CollaborationFooter` health probe wiring

**P5-P1 items** (high-impact surfaces — most depend on P3 cards or P1 design system):
- FR-18: SidebarNav section grouping + active accent bar
- FR-19: PageHeader enrichment (project tags, last-sync, CTAs)
- FR-20: Empty BOM SlotCard dotted-purple treatment
- FR-21: Dashboard panel item rows with AssetThumbnail (24×24)
- FR-22: MetricCard delta from useDashboard
- FR-23: ReadinessScore circular progress ring
- FR-24: BoardColumn top accent bar
- FR-25: EmptyState surface-specific icons

Dark mode is deferred (DEFER-1). Leg-5 P2/P3 facelift items are deferred (DEFER-2, DEFER-3).

---

## P5-P0 Task Breakdown (Starts parallel with P1)

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P5-P0-001 | Inter + JetBrains Mono via next/font | In `web/app/layout.tsx`: import `Inter` and `JetBrains_Mono` from `next/font/google`. Configure display: `swap`. Apply class names to `<html>` or `<body>`. Remove or supersede any existing CSS `font-family: Inter` fallback references. Verify Network tab shows woff2 requests on first load. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | None |
| P5-P0-002 | ink-faint contrast fix | In `web/app/globals.css`: update `--ink-faint` from `#9ca3af` to `≥ #6b7280` (or the closest AA-passing value on white background, verified via DevTools contrast ratio). Audit all Tailwind `text-ink-faint` callsites — for body-text contexts, either the token change covers them or switch specific callsites to `text-ink-muted`. Target: ≥ 4.5:1 contrast ratio on white for all body-text usages. | 1 pt | ui-engineer-enhanced | sonnet | adaptive | None |
| P5-P0-003 | prefers-reduced-motion block in globals.css | Add `@media (prefers-reduced-motion: reduce)` block to `web/app/globals.css`. Set `animation: none !important; transition: none !important` for the following Tailwind animation classes: `animate-pulse`, `animate-spin`, `animate-slide-in-right`, `animate-fade-in`. Also suppress `pulse-subtle` animation. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | None |
| P5-P0-004 | CollaborationFooter health probe wiring | In `web/components/shell/CollaborationFooter.tsx` (or equivalent): replace hardcoded "checking" state with a `useInterval`-based fetch of `/api/health` (or `useSWR`). Map response: 2xx → "connected", non-2xx / timeout → "disconnected", pending → "checking". Interval: 30s. | 1 pt | ui-engineer-enhanced | sonnet | adaptive | None |

---

## P5-P1 Task Breakdown (After P3)

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P5-P1-001 | SidebarNav section grouping + active accent bar | In `web/components/shell/SidebarNav.tsx`: group the 10 nav items into sections ("Project", "Content", "Tools" or per-spec). Add visible section labels (small text, ink-faint). Active item: add a 3px left accent bar (e.g., `border-l-4 border-brand-500`) alongside existing `bg-blue-50 text-blue-700` active style. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-009 |
| P5-P1-002 | PageHeader enrichment | In `web/features/dashboard/CommandCenterView.tsx` (PageHeader): add project tag chips (from project metadata), last-sync timestamp (from `useDashboard` or `useMeatyWikiIntegration`), and at least two primary CTAs (e.g., "Scan Assets", "Build Context Pack"). Adapt to existing data hook output. | 1 pt | ui-engineer-enhanced | sonnet | medium | P3-009 |
| P5-P1-003 | Empty BOM SlotCard dotted-purple treatment | In `web/features/bom/components/SlotCard.tsx`: for slots with `status === "unassigned"` (empty): apply `border-dashed border-purple-300 bg-purple-50` styling. Preserve existing per-status styles for non-empty statuses. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-009 |
| P5-P1-004 | Dashboard panel rows with AssetThumbnail (24×24) | In `web/features/dashboard/panels/*.tsx` (RecentAssetsPanel, CandidateAssetsPanel, CanonicalArtifactsPanel): add a 24×24 `AssetThumbnail` (existing component) to each item row. Wire asset data already available from the panel's existing data hook. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-009 |
| P5-P1-005 | MetricCard delta from useDashboard | In `web/components/ui/MetricCard.tsx`: verify `delta` prop is rendered as a delta indicator (up/down arrow + formatted value). In `web/features/dashboard/CommandCenterView.tsx` (KPIRow): pass `delta` prop values from `useDashboard` hook output to each MetricCard. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-009 |
| P5-P1-006 | ReadinessScore circular progress ring | In `web/features/coverage/components/ReadinessScore.tsx`: replace current rendering with a circular progress ring (SVG arc or CSS conic-gradient). Show percentage value and color coding (red <50%, yellow 50-80%, green >80%). | 1 pt | ui-engineer-enhanced | sonnet | medium | P3-009 |
| P5-P1-007 | BoardColumn top accent bar | In `web/features/board/components/BoardColumn.tsx` (or equivalent): add a 3px top accent bar to the column header, using the column's `color` prop (maps to a Tailwind `bg-*` class). | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-009 |
| P5-P1-008 | EmptyState surface-specific icons | In `web/components/ui/EmptyState.tsx`: verify `icon` prop is supported. At each `EmptyState` callsite, pass a surface-specific icon: FolderOpen (Asset Library), Package (BOM), Layers (Context Packs), Inbox (Inbox Triage), Layout (Coverage), Template (Templates). Audit all callsites; update those that pass no icon. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-009 |
| P5-009 | a11y-sheriff review (contrast + reduced-motion) | Run `a11y-sheriff` focused on: (1) contrast ratios for ink-faint text after P0-002 fix, (2) reduced-motion behavior in P0-003 block. Block P5-010 until passes. | — | a11y-sheriff | (default) | — | P5-P1-008, P5-P0-003 |
| P5-010 | task-completion-validator gate | Run `task-completion-validator` against all P5 exit criteria (both P0 and P1). | — | task-completion-validator | (default) | — | P5-009 |

---

## Acceptance Criteria

### AC P5-A: Inter + JetBrains Mono loaded via next/font

- target_surfaces:
    - web/app/layout.tsx
- propagation_contract: `next/font/google` imports applied to `<html>` or `<body>` class. Network tab confirms woff2 font requests on first load (not relying on system fallback).
- resilience: If Google Fonts unavailable, next/font falls back gracefully to system-ui (display: swap)
- visual_evidence_required: Network tab screenshot showing woff2 font requests
- verified_by: [P5-P0-001, P6-008]

### AC P5-B: ink-faint contrast ≥ 4.5:1 on white

- target_surfaces:
    - web/app/globals.css (--ink-faint token value)
    - All body-text callsites using text-ink-faint
- propagation_contract: `--ink-faint` CSS var updated to ≥ #6b7280. All body-text usages of `text-ink-faint` achieve ≥ 4.5:1 contrast on white background.
- resilience: Non-text usages of ink-faint (decorative borders, placeholder icons) may remain at lower contrast per WCAG non-text rules
- visual_evidence_required: Chrome DevTools contrast ratio screenshot showing ≥ 4.5:1 for a representative ink-faint text element
- verified_by: [P5-P0-002, P5-009, P6-003, P6-008]

### AC P5-C: prefers-reduced-motion suppresses all CSS animations

- target_surfaces:
    - web/app/globals.css
- propagation_contract: `@media (prefers-reduced-motion: reduce)` block sets `animation: none !important` for animate-pulse, animate-spin, animate-slide-in-right, animate-fade-in, pulse-subtle
- resilience: If a new animation is added in a future phase, it must also be added to this block
- visual_evidence_required: false
- verified_by: [P5-P0-003, P5-009, P6-008]

### AC P5-D: EmptyState callsites have surface-specific icons

- target_surfaces:
    - web/features/assets/*.tsx (FolderOpen icon)
    - web/features/bom/*.tsx (Package icon)
    - web/features/context-packs/*.tsx (Layers icon)
    - web/features/inbox/*.tsx (Inbox icon)
    - web/features/coverage/*.tsx (Layout icon)
    - web/features/templates/*.tsx (Template icon)
- propagation_contract: Each EmptyState callsite passes a surface-specific Lucide icon via the `icon` prop. All callsites audited.
- resilience: If EmptyState does not receive an `icon` prop, render a generic fallback (existing behavior preserved)
- visual_evidence_required: false
- verified_by: [P5-P1-008, P6-008]

---

## Phase Quality Gates

**P0 gates** (may be validated before P1 completes):
- [ ] Inter and JetBrains Mono loaded via `next/font/google` in `app/layout.tsx`; woff2 requests confirmed in Network tab
- [ ] All body-text `ink-faint` usages achieve ≥ 4.5:1 contrast (verified axe or DevTools)
- [ ] `@media (prefers-reduced-motion: reduce)` block in `globals.css` suppresses named animations
- [ ] `CollaborationFooter` fetches `/api/health` on mount and at 30s interval; shows dynamic state

**P1 gates** (after P3):
- [ ] SidebarNav: 3 section groups with labels + active left accent bar
- [ ] PageHeader: project tags, last-sync, ≥2 CTAs visible
- [ ] Empty BOM SlotCard: `border-dashed border-purple-300 bg-purple-50`
- [ ] Dashboard panel rows: 24×24 AssetThumbnail on each item
- [ ] MetricCard delta values wired from `useDashboard`
- [ ] ReadinessScore: circular progress ring (SVG or conic-gradient)
- [ ] BoardColumn: 3px top accent bar using `color` prop
- [ ] EmptyState: surface-specific icons on all audited callsites

**Both**:
- [ ] `a11y-sheriff` review passes (contrast + reduced-motion)
- [ ] `task-completion-validator` passes

---

## Key Files

| File | Change Type | Notes |
|------|-------------|-------|
| `web/app/layout.tsx` | Modify | next/font loads |
| `web/app/globals.css` | Modify | ink-faint fix + reduced-motion block (coordinate with P1-003 edit) |
| `web/components/shell/CollaborationFooter.tsx` | Modify | Health probe |
| `web/components/shell/SidebarNav.tsx` | Modify | Section groups + active accent |
| `web/features/dashboard/CommandCenterView.tsx` | Modify | PageHeader enrichment |
| `web/features/bom/components/SlotCard.tsx` | Modify | Empty-slot dotted-purple (coordinate with P3 edits) |
| `web/features/dashboard/panels/*.tsx` | Modify | AssetThumbnail in rows |
| `web/components/ui/MetricCard.tsx` | Modify | Delta rendering |
| `web/features/coverage/components/ReadinessScore.tsx` | Modify/Rewrite | Circular ring |
| `web/features/board/components/BoardColumn.tsx` | Modify | Top accent bar |
| All `EmptyState` callsites | Modify | Surface-specific icons |
