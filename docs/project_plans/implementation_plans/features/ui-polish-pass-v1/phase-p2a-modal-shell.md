---
schema_version: 2
doc_type: phase_plan
title: "P2a: Modal Shell + Tab Registry + URL State + A11y — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P2a
phase_title: "Modal Shell + Tab Registry"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "P1 exit gate passed (ContentPane smoke screen + build gates green)"
  - "karen mid-feature gate passed (P1 hard gate milestone)"
exit_criteria:
  - "EntityModal renders with correct ARIA, focus-trap, Escape, focus-restore"
  - "Tab registry wired with React.lazy + Suspense panel loading"
  - "URL state (?item=&tab=) driven by Next.js useSearchParams"
  - "Full-page route affordance navigates correctly"
  - "a11y-sheriff review passes"
  - "task-completion-validator gate passes"
integration_owner: null
---

# P2a: Modal Shell + Tab Registry + URL State + A11y

**Estimate**: 5 pts
**Depends on**: P1 (hard gate)
**Blocks**: P2b (surface migration requires this shell)
**Assigned Subagent(s)**: `frontend-architect` (pattern API design), `ui-engineer-enhanced` (implementation)
**Model routing**: `frontend-architect` → opus (medium effort) for pattern API; `ui-engineer-enhanced` → sonnet (high effort)

> ADR-2: Canonical detail pattern — tabbed modal + full-page route, URL-driven
> This is the one pattern that ALL five detail surfaces will use. Get it right here.

---

## Context

AA currently has five different detail surfaces (see leg-1 discovery §3): `RightDrawer` (Assets), a bespoke fixed-inset `SlotDetailPanel` (BOM — not using `RightDrawer`, no focus-trap), an inline sidebar column (Coverage), a persistent `<aside>` (Templates), and a permanent center column (Inbox). This phase builds the single shared `EntityModal` that replaces all five.

Key design decisions (OQ-3: resolved to generic route):
- **Full-page route**: one generic `/projects/[projectId]/detail/[type]/[id]` route with type-keyed tab registries, rather than N entity-specific routes
- **Tab registry shape**: `Record<string, { label: string; icon?: React.ComponentType; Panel: React.LazyExoticComponent }>` (design: `frontend-architect`)
- **URL state**: `?item=<id>&tab=<tabKey>` via `useSearchParams` (Next.js App Router); removing `item` param closes modal
- **Feature flag**: `flag:miethe-ui-ds` gates `@miethe/ui`-based primitives used in the modal shell

---

## Task Breakdown

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P2A-001 | Design pattern API — tab registry shape and URL contract | `frontend-architect` documents: (1) tab registry TypeScript interface, (2) URL state contract (`?item=&tab=` with fallback tab), (3) `EntityModal` props interface (entityType, entityId, tabRegistry, onClose), (4) full-page route shape. Output: a `.claude/worknotes/ui-polish-pass/modal-pattern-api.md` design note that `ui-engineer-enhanced` implements against. | 0.5 pts | frontend-architect | opus | medium | P1 exit gate |
| P2A-002 | Implement EntityModal shell + BaseArtifactModal wrapper | Create `web/features/ui/components/EntityModal/index.tsx`. Wraps `BaseArtifactModal` from `@miethe/ui/primitives` (subpath import). Accepts `tabRegistry`, `entityId`, `entityType`. Renders tab bar + selected panel. Includes "Open full page" affordance linking to the generic full-page route. | 1 pt | ui-engineer-enhanced | sonnet | high | P2A-001 |
| P2A-003 | Implement tab registry + React.lazy/Suspense panel loading | Tab panels are code-split via `React.lazy`. Registry maps `tabKey` → lazy panel component. `Suspense` renders a skeleton fallback while the panel chunk loads. Export a `registerTab` / `createTabRegistry` helper for surface-specific registries. | 1 pt | ui-engineer-enhanced | sonnet | high | P2A-002 |
| P2A-004 | Wire URL state via Next.js useSearchParams | In the EntityModal (or a containing page layout): read `?item=` and `?tab=` from `useSearchParams`. Opening the modal pushes `?item=<id>&tab=<defaultTab>` to the URL via `router.push`. Closing removes `item` param. Tab change updates `tab` param. Ensure correct behavior on browser back/forward. | 1 pt | ui-engineer-enhanced | sonnet | high | P2A-003 |
| P2A-005 | Full-page route affordance | Create `web/app/(projects)/projects/[projectId]/detail/[type]/[id]/page.tsx` (generic full-page detail route). The "Open full page" button in EntityModal navigates to this route, preserving `?tab=`. The route renders the same tab registry but in a full-page layout (no modal overlay). | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P2A-004 |
| P2A-006 | Focus-trap + Escape + focus-restore a11y | Implement `useFocusTrap` hook (or reuse AA's existing pattern from `web/components/ui/Dialog.tsx`). On modal open: trap focus inside modal; wire `Escape` key to close. On close: restore focus to the element that triggered the modal (store ref on open). | 0.5 pts | ui-engineer-enhanced | sonnet | high | P2A-002 |
| P2A-007 | ARIA attributes | Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (pointing to modal title element) to the EntityModal root. Add `aria-label` to the "Open full page" and close buttons. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P2A-006 |
| P2A-008 | a11y-sheriff review | Run `a11y-sheriff` on the EntityModal (focus order, Escape, ARIA role/modal, aria-labelledby). Block P2b until this passes. | — | a11y-sheriff | (default) | — | P2A-007 |
| P2A-009 | task-completion-validator gate | Run `task-completion-validator` against all P2a exit criteria. | — | task-completion-validator | (default) | — | P2A-008 |

---

## Acceptance Criteria

### AC P2A-A: EntityModal ARIA and focus-trap

- target_surfaces:
    - web/features/ui/components/EntityModal/index.tsx
- propagation_contract: Every surface that renders EntityModal inherits these ARIA attrs; no surface needs to set them independently
- resilience: If entityId is undefined, modal shows a MetadataUnavailable placeholder; does not crash or render empty dialog
- visual_evidence_required: false (verified via axe-core in P6-003)
- verified_by: [P2A-008, P6-003, P6-005]

### AC P2A-B: URL state is bidirectional

- target_surfaces:
    - web/features/ui/components/EntityModal/index.tsx
    - web/app/(projects)/projects/[projectId]/detail/[type]/[id]/page.tsx
- propagation_contract: `?item=<id>&tab=<key>` written to URL on open; removing `item` param closes modal; tab change updates `tab` param; browser back/forward correctly opens/closes/restores tab
- resilience: If `tab` param is missing or refers to an unknown key, fall back to the first registered tab (no crash)
- visual_evidence_required: false
- verified_by: [P2A-004, P6-009]

### AC P2A-C: Tab panels are code-split

- target_surfaces:
    - web/features/ui/components/EntityModal/index.tsx
- propagation_contract: All tab panel components wrapped in `React.lazy`; Suspense renders a skeleton during loading; no panel bundle is eagerly loaded
- resilience: If a lazy import fails (network error), Suspense error boundary shows an error tile, not a blank modal
- visual_evidence_required: false
- verified_by: [P2A-003, P6-005]

---

## Phase Quality Gates

- [ ] `EntityModal` component exists at `web/features/ui/components/EntityModal/index.tsx`
- [ ] Tab registry TypeScript interface documented and implemented
- [ ] `React.lazy` + `Suspense` used for all tab panels
- [ ] `?item=<id>&tab=<key>` URL state works bidirectionally
- [ ] `role="dialog"` + `aria-modal="true"` + `aria-labelledby` present
- [ ] Focus trapped inside modal while open
- [ ] `Escape` key closes modal
- [ ] Focus restores to trigger element on close
- [ ] Full-page route at `/projects/[projectId]/detail/[type]/[id]` exists
- [ ] "Open full page" navigation works and preserves `?tab=`
- [ ] `a11y-sheriff` review passes
- [ ] `task-completion-validator` passes

---

## Key Files

| File | Change Type | Notes |
|------|-------------|-------|
| `web/features/ui/components/EntityModal/index.tsx` | Create | Core modal shell |
| `web/features/ui/components/EntityModal/TabRegistry.ts` | Create | Registry type + factory |
| `web/features/ui/components/EntityModal/useFocusTrap.ts` | Create (or reuse Dialog's) | Focus management hook |
| `web/app/(projects)/projects/[projectId]/detail/[type]/[id]/page.tsx` | Create | Generic full-page detail route |
| `.claude/worknotes/ui-polish-pass/modal-pattern-api.md` | Create | Opus design note (P2A-001 output) |
