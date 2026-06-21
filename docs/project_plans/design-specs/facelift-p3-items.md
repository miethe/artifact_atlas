---
schema_version: 2
doc_type: design-spec
title: "Design Spec: Facelift P3 Items — Artifact Atlas"
status: draft
maturity: idea
created: '2026-06-21'
feature_slug: ui-polish-pass
source: "docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md (DEFER-3)"
defer_id: DEFER-3
defer_category: backlog
---

# Design Spec: Facelift P3 Items — Artifact Atlas

> **Maturity: idea** — This stub preserves deferred P3 polish scope from the UI Polish Pass v1
> Leg-5 audit. These are low-priority / nice-to-have items that require explicit product
> prioritization before any implementation work begins.

---

## Summary

The **P3** facelift backlog contains items that are either low-impact for current AA workflows,
require collaboration infrastructure that does not yet exist, or carry L-effort relative to their
visual value. They were explicitly deferred in ADR-5 pending a product priority decision.

Dark mode (leg-5 P3-1) is tracked separately as DEFER-1 (`dark-mode-aa.md`) because it requires
a distinct upstream dependency and a full token axis, not just UI polish.

The remaining P3 items — facepile, provenance ribbon, Board Group By, BOM slot drag from
overview, Coverage recommendations rail, publish destination radio, and animation usage — are
captured here.

**Why deferred:** ADR-5 — "defer dark mode (P3-1) and other P3 items."

---

## Promotion Trigger

An explicit product priority decision that schedules a P3 polish cycle. Some individual items
may be fast-followed into a P2 sprint if the effort is confirmed as S; those should be promoted
to `facelift-p2-items.md` instead of this spec.

---

## Scope Sketch

All items sourced from the leg-5 facelift audit P3 table and P6-015 task description (P3-1 /
dark mode excluded — see `dark-mode-aa.md`):

- **Collaborator facepile** (P3-2, `TopBar`) — show presence facepile (max 3 avatars) when
  multiple sessions are active. Requires a real-time presence/collaboration API signal.
- **Context Pack publish destination radio** (P3-3, `WizardStepReview`) — replace the string
  `destination` param with a radio/select for destination type (local, MeatyWiki, Agent, MCP).
- **Asset card provenance ribbon** (P3-4, `AssetCard`) — thin colored left border on each card
  indicating source kind (purple = AI-generated, blue = cloud/sync, gray = local).
- **Board Group By selector** (P3-5, `AssetBoard` / `BoardColumn`) — implement "Group by:
  Feature / Domain" in the board layout. The `groupBy` prop stub exists; only `status` is wired.
- **`animate-pulse-subtle` usage** (P3-6) — apply the defined-but-unused keyframe to the live
  agent activity dot in the footer and agent panel when an agent is actively querying.
- **BOM slot drag from BomOverview** (P3-7, `BomOverview` / `SlotCard`) — allow dropping an
  `InboxItem` directly onto a `SlotCard` in `BomOverview`. Currently drag-to-slot only works in
  `BomMappingView`.
- **Coverage Recommendations rail** (P3-8, `CoverageView`) — add a "Prioritized
  Recommendations" sidebar matching the mockup right column (numbered action list with slot
  names and domain labels).

---

## Open Questions

1. Does the facepile (P3-2) require a presence API endpoint that does not exist yet? What is
   the collaboration infrastructure plan?
2. Is the Board Group By (P3-5) blocked by the data model, or only by frontend layout work?
3. Does provenance ribbon (P3-4) have a defined and stable taxonomy of source kinds, or is
   the `source_kind` field still in flux?
4. Should BOM slot drag from BomOverview (P3-7) share the same dnd-kit drag source as
   `BomMappingView`, or is there a coordination concern?
5. Does the Coverage Recommendations rail (P3-8) require a backend recommendations endpoint, or
   can it derive recommendations from existing gap data client-side?

---

## References

- **Parent plan / deferred table**: `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md` § Deferred Items Triage
- **ADR-5** (facelift scope): `docs/project_plans/spikes/ui-polish-pass-spike.md` § ADR-5
- **Leg-5 audit P3 table**: `.claude/worknotes/ui-polish-pass/discovery/leg-5-facelift-audit.md` § P3
- **DEFER-1 (dark mode)**: `docs/project_plans/design-specs/dark-mode-aa.md`
