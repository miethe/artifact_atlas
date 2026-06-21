---
schema_version: 2
doc_type: phase_plan
title: "P3: Card Redesign + Preview Cards — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P3
phase_title: "Card Redesign + Preview Cards"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "P1 exit gate passed (design system live)"
  - "P4a exit gate passed (AssetViewer dispatcher + thumbnail mode available)"
exit_criteria:
  - "All 4 card families rebuilt on zone-composition model"
  - "Full-width top thumbnail (~96px) renders real per-format preview on all cards"
  - "Click-to-open guard prevents action-zone interference"
  - "Keyboard accessibility (Enter/Space on card root) verified"
  - "TanStack Virtual lists unaffected"
  - "task-completion-validator gate passes"
integration_owner: null
---

# P3: Card Redesign + Preview Cards

**Estimate**: 8 pts
**Depends on**: P1 (design system) + P4a (viewer/thumbnail renderers)
**Blocks**: P5-P1 (some facelift items are card-tied), P6
**Assigned Subagent(s)**: `ui-engineer-enhanced`
**Model routing**: sonnet (medium effort — mechanical given P1+P4a)

> ADR-3: Preview-card pattern — zone-composition card with top thumbnail

---

## Context

Current card anatomy (leg-1 §4):
- **AssetCard**: 8px border-radius, thumbnail (w-9 h-9 inline-left), title, badges, tags, footer with quick-actions
- **PackCard**: role=button article, header (icon + name + badge), description, meta row, hover-reveal chevron
- **SlotCard**: per-status border/bg, top row (status icon + badges + menu), slot name, phase/domain chips, assignment count
- **TemplateCard**: left-side list layout (explored in TemplateLibrary)

Target (ADR-3 / leg-5 P1-1 mockups):
- Zone-composition model: `HeaderZone / ContentZone / StatusZone / ActionZone` (tier-aware sizing)
- Full-width top thumbnail (~96px tall) at the top of each card — replaces the inline-left 32×32 thumb
- `border-l-4` left accent bar using source/type tint color
- Click-to-open guard: `e.target.closest('button,a,input,[role=menuitem]')` prevents card root click when inside action zone

---

## Task Breakdown

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P3-001 | Implement zone-composition card base | Create `web/features/ui/components/Card/ZoneCard.tsx` base component with `HeaderZone`, `ContentZone`, `StatusZone`, `ActionZone` sub-components. Support tier sizing prop (compact/default/expanded). Add `border-l-4` with configurable `accentColor` prop. Export from `web/features/ui/components/Card/index.ts`. | 1.5 pts | ui-engineer-enhanced | sonnet | medium | P1-007 |
| P3-002 | Rebuild AssetCard on zone model | Replace current AssetCard with zone-composition. HeaderZone: AssetThumbnail (now full-width, ~96px tall via `AssetViewer` thumbnail mode). ContentZone: title, description. StatusZone: StatusBadge, SensitivityBadge, tags. ActionZone: quick-action icon buttons (hover-reveal). Wire click-to-open EntityModal. Preserve multi-select checkbox behavior. `border-l-4` with source-type tint. | 1.5 pts | ui-engineer-enhanced | sonnet | high | P3-001 |
| P3-003 | Rebuild SlotCard on zone model | Replace SlotCard with zone-composition. HeaderZone: full-width top thumbnail (slot status icon/color at full width). ContentZone: slot name, phase+domain chips. StatusZone: SlotStatusBadge, optional/required badge, assignment count. ActionZone: MoreHorizontal menu trigger (keep existing Dialogs). Preserve per-status border/bg styles. | 1.5 pts | ui-engineer-enhanced | sonnet | high | P3-001 |
| P3-004 | Rebuild PackCard on zone model | Replace PackCard with zone-composition. HeaderZone: pack icon/thumbnail at full width. ContentZone: name, description. StatusZone: PackStatusBadge, item count, date. ActionZone: "Open" chevron (hover-reveal). | 1 pt | ui-engineer-enhanced | sonnet | medium | P3-001 |
| P3-005 | Rebuild TemplateCard on zone model | Replace TemplateCard with zone-composition. HeaderZone: template icon/thumbnail at full width. ContentZone: name, domain count, slot summary. StatusZone: template type badge, status. ActionZone: apply/preview actions. | 1 pt | ui-engineer-enhanced | sonnet | medium | P3-001 |
| P3-006 | Wire click-to-open EntityModal guard | On all 4 card families: add `onClick` handler to card root that calls `e.target.closest('button,a,input,[role=menuitem]')` — if truthy, do nothing. Otherwise open EntityModal for this entity. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-002 through P3-005 |
| P3-007 | Keyboard accessibility (Enter/Space on card root) | Add `role="button"` (or `role="article"` with explicit key handler) to card root elements. `onKeyDown`: Enter/Space triggers `onClick`. Ensure `tabIndex={0}` on card roots that are not already focusable. Verify Tab order within cards (thumbnail → content → actions). | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-006 |
| P3-008 | Verify TanStack Virtual lists unaffected | Run visual smoke in virtualized gallery views (`AssetLibrary`, `BomOverview` slot grid). Confirm no layout thrash, no scroll-reset, no blank-row artifacts. TanStack Virtual must see consistent card heights. If zone model introduces height variance, implement `estimateSize` fix. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P3-007 |
| P3-009 | task-completion-validator gate | Run `task-completion-validator` against all P3 exit criteria. | — | task-completion-validator | (default) | — | P3-008 |

---

## Acceptance Criteria

### AC P3-A: All 4 card families have full-width top thumbnail

- target_surfaces:
    - web/features/assets/components/AssetCard.tsx
    - web/features/bom/components/SlotCard.tsx
    - web/features/context-packs/components/PackCard.tsx
    - web/features/templates/components/TemplateCard.tsx
- propagation_contract: HeaderZone renders a ~96px-tall full-width thumbnail area. AssetViewer thumbnail mode (or equivalent per-format icon/preview) fills this area. Thumbnail reuses P4a AssetViewer dispatcher where applicable.
- resilience: If thumbnail fetch fails, card shows a format-type icon fallback (e.g., Lucide FileText) in the HeaderZone; card remains fully functional.
- visual_evidence_required: Desktop ≥1280px screenshots of each card family showing full-width thumbnail
- verified_by: [P3-008, P6-006]

### AC P3-B: Click-to-open guard works on all 4 card families

- target_surfaces:
    - web/features/assets/components/AssetCard.tsx
    - web/features/bom/components/SlotCard.tsx
    - web/features/context-packs/components/PackCard.tsx
    - web/features/templates/components/TemplateCard.tsx
- propagation_contract: `e.target.closest('button,a,input,[role=menuitem]')` check in card root onClick. Clicking action-zone buttons does NOT also open EntityModal.
- resilience: If the guard throws, fall back to not opening the modal (do not propagate error to card crash)
- visual_evidence_required: false
- verified_by: [P3-006, P6-006]

### AC P3-C: Zone composition structure consistent

- target_surfaces:
    - web/features/assets/components/AssetCard.tsx
    - web/features/bom/components/SlotCard.tsx
    - web/features/context-packs/components/PackCard.tsx
    - web/features/templates/components/TemplateCard.tsx
- propagation_contract: All 4 cards use ZoneCard base component. HeaderZone / ContentZone / StatusZone / ActionZone structure visible in DOM. `border-l-4` left accent rendered per card.
- resilience: ZoneCard renders gracefully if a zone slot is empty (no zone prop provided)
- visual_evidence_required: false
- verified_by: [P3-001, P6-006]

### AC P3-D: TanStack Virtual lists unaffected

- target_surfaces:
    - web/features/assets/AssetLibrary.tsx (virtualized gallery grid)
    - web/features/bom/BomOverview.tsx (slot grid)
- propagation_contract: After card redesign, virtual row heights remain consistent. No scroll-reset or blank-row artifacts.
- resilience: If height variance detected, implement `estimateSize` in the virtual list's options
- visual_evidence_required: false
- verified_by: [P3-008, P6-006]

---

## Phase Quality Gates

- [ ] ZoneCard base component (`HeaderZone/ContentZone/StatusZone/ActionZone`) exists
- [ ] All 4 card families (`AssetCard`, `SlotCard`, `PackCard`, `TemplateCard`) rebuilt on zone model
- [ ] Full-width top thumbnail (~96px) renders in HeaderZone for all 4 families
- [ ] Thumbnail renders real per-format preview (reuses P4a AssetViewer thumbnail mode)
- [ ] `border-l-4` source/type tint applied on all cards
- [ ] Click-to-open guard (`target.closest('button,a,input,[role=menuitem]')`) present
- [ ] Keyboard: `Enter`/`Space` on card root opens EntityModal
- [ ] TanStack Virtual lists: no layout thrash or scroll-reset
- [ ] `task-completion-validator` passes

---

## Key Files

| File | Change Type | Notes |
|------|-------------|-------|
| `web/features/ui/components/Card/ZoneCard.tsx` | Create | Zone-composition base |
| `web/features/ui/components/Card/index.ts` | Create | Export |
| `web/features/assets/components/AssetCard.tsx` | Rewrite | Zone model + top thumbnail |
| `web/features/bom/components/SlotCard.tsx` | Rewrite | Zone model + top thumbnail |
| `web/features/context-packs/components/PackCard.tsx` | Rewrite | Zone model + top thumbnail |
| `web/features/templates/components/TemplateCard.tsx` | Rewrite | Zone model + top thumbnail |
