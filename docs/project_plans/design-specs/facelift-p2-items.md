---
schema_version: 2
doc_type: design-spec
title: "Design Spec: Facelift P2 Items — Artifact Atlas"
status: draft
maturity: idea
created: '2026-06-21'
feature_slug: ui-polish-pass
source: "docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md (DEFER-2)"
defer_id: DEFER-2
defer_category: backlog
---

# Design Spec: Facelift P2 Items — Artifact Atlas

> **Maturity: idea** — This stub preserves deferred P2 polish scope from the UI Polish Pass v1
> Leg-5 audit. It is NOT a commitment. Promote to `shaping` after a post-P1 polish sprint is
> scheduled.

---

## Summary

The UI Polish Pass v1 landed **P0** (a11y/correctness) and **P1** (high-impact visible delta)
facelift items. The **P2** backlog — medium-polish improvements — was deferred to stay within
the 55-point budget and keep the feature scope coherent.

P2 items are individually small-to-medium effort (S–M) but collectively add a meaningful layer
of polish: consolidated toolbars, discoverable view toggles, richer micro-interactions, and
improved keyboard accessibility. None block correctness or WCAG compliance.

**Why deferred:** ADR-5 — "P2 opportunistically; defer dark mode (P3-1) and other P3 items."
P2 items were explicitly labeled for a follow-on polish sprint, not abandoned.

---

## Promotion Trigger

A post-P1 polish sprint is approved by product. Before promotion to `planned`, confirm which
P2 items may now be partially addressed by:
- The EntityModal migration (P2b) — `RightDrawer` tab bar (P2-5) may be superseded.
- The P5-P1 facelift — verify `PageHeader h1` (P2-11) and `View all` target (P2-12) were not
  already resolved.

---

## Scope Sketch

All items sourced from the leg-5 facelift audit P2 table and P6-014 task description:

- **Filter-bar consolidation** (P2-2, `AssetLibrary`) — merge the two-row `FilterBar` +
  toolbar into a single sticky row with left-side filter controls and right-side sort/view/add.
- **View-mode labels** (P2-3, `AssetLibrary`) — replace icon-only `SegmentedControl` with
  labeled "Gallery / Table / Board" options (or add tooltip + `aria-label` clarity at minimum).
- **Board per-column add-card** (P2-4, `BoardColumn`) — add `+ Add asset` ghost button at the
  bottom of each board column.
- **RightDrawer / AssetDetail tab bar** (P2-5, `AssetDrawerContent`) — add tab bar (Details /
  Links / BOM / Policy) to the right-drawer asset inspector.
- **Context-pack token count** (P2-6, `WizardStepReview`) — surface `preview.token_estimate`
  or compute from selected items in the review step.
- **Inbox queue row classification tag** (P2-7, `InboxQueueItem`) — display AI-suggested
  `suggested_type` chip in each queue item row.
- **Sidebar project switcher** (P2-9, `SidebarNav`) — collapsible project pill or avatar below
  brand mark showing current project name.
- **MissingContextPanel urgency treatment** (P2-10, `MissingContextPanel`) — add red left
  border or "NEEDS ATTENTION" badge to high-priority missing context items.
- **PageHeader h1 size** (P2-11, `PageHeader`) — increase from `text-lg` (16 px) to `text-xl`
  (18 px) to match mockup heading scale.
- **Panel "View all" click target** (P2-12, `PanelShell`) — increase `text-[10px]` link to
  `text-xs` with padding to meet 28 px minimum tap target.
- **Global keyboard shortcuts** (P2-13) — implement A / I / B / C / T / L / M / G shortcuts
  from spec §7.4 via a global `keydown` handler.

---

## Open Questions

1. Does filter-bar consolidation need to wait for a filter-state refactor, or can the layout
   change happen independently?
2. Is `RightDrawer` / `AssetDetail` tab bar (P2-5) now fully superseded by the EntityModal
   migration (P2b), or does the drawer still exist for a distinct use case?
3. Is `suggested_type` available on `InboxItem` today, or does the API need an update?
4. Should keyboard shortcuts (P2-13) share infrastructure with the existing `useHotkeys` /
   `useKeyboardNavigation` hooks?

---

## References

- **Parent plan / deferred table**: `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md` § Deferred Items Triage
- **ADR-5** (facelift scope): `docs/project_plans/spikes/ui-polish-pass-spike.md` § ADR-5
- **Leg-5 audit P2 table**: `.claude/worknotes/ui-polish-pass/discovery/leg-5-facelift-audit.md` § P2
