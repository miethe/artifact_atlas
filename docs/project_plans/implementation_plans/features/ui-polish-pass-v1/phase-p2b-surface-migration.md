---
schema_version: 2
doc_type: phase_plan
title: "P2b: Migrate 5 Detail Surfaces — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P2b
phase_title: "Migrate 5 Detail Surfaces"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "P2a exit gate passed (EntityModal + tab registry + URL state + a11y complete)"
exit_criteria:
  - "All 5 detail surfaces use EntityModal (or flagged behind flag:ui-tabbed-modal)"
  - "Old bespoke panel code removed or deprecated (no orphaned drawer code)"
  - "Feature flag per-surface wiring verified"
  - "task-completion-validator gate passes"
integration_owner: null
---

# P2b: Migrate 5 Detail Surfaces

**Estimate**: 8 pts
**Depends on**: P2a (EntityModal shell must exist before migrations)
**Blocks**: P6 (hardening requires all surfaces migrated)
**Assigned Subagent(s)**: `ui-engineer-enhanced`
**Model routing**: sonnet (high effort)
**Feature flag**: `flag:ui-tabbed-modal` — per-surface, gates new modal; shows old panel when off

---

## Context

The 5 surfaces to migrate (from leg-1 discovery §3):

| Surface | Current Mechanism | File |
|---------|------------------|------|
| Asset Inspector | `RightDrawer` (non-overlay, w-80) | `web/features/assets/AssetLibrary.tsx` + `web/features/assets/components/AssetDrawerContent.tsx` |
| BOM Slot Detail | Bespoke `fixed inset-y-0 right-0 z-40 w-80` panel | `web/features/bom/BomOverview.tsx` (inline SlotDetailPanel, lines 269-366) |
| Coverage Slot Detail | Inline static `div` in w-56 sidebar column | `web/features/coverage/CoverageView.tsx` (lines 200-255) |
| Template Preview | Persistent right `<aside>` (TemplatePreviewPanel) | `web/features/templates/TemplateLibrary.tsx` + `web/features/templates/components/TemplatePreviewPanel.tsx` |
| Inbox Preview | Permanent center column (flex-1) | `web/features/inbox/InboxTriage.tsx` (lines 261-269) + `web/features/inbox/InboxPreviewPane.tsx` |

Each migration: (1) define entity-specific tab registry, (2) swap old surface for EntityModal, (3) wire feature flag, (4) verify data hook compatibility.

**Note on OQ-5 resolution**: Per-surface feature flags during migration; global `flag:ui-tabbed-modal` cutover after all 5 surfaces pass validation.

---

## Task Breakdown

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P2B-001 | Migrate AssetDrawerContent to EntityModal | Create `AssetTabRegistry` (tabs: Preview, Details, Links, Policy). Replace `RightDrawer` + `AssetDrawerContent` in `AssetLibrary.tsx` with `EntityModal`. Wire `flag:ui-tabbed-modal`. The preview tab renders `AssetViewer` (initially a placeholder; will be real after P4a — stub with the existing AssetPreview for now). | 2 pts | ui-engineer-enhanced | sonnet | high | P2A-009 |
| P2B-002 | Migrate BomOverview SlotDetailPanel to EntityModal | Create `SlotTabRegistry` (tabs: Details, Assignments, Links). Extract the inline `SlotDetailPanel` code from `BomOverview.tsx` (lines 269-366) into proper tab panel components. Replace with EntityModal. Wire `flag:ui-tabbed-modal`. Remove bespoke fixed-inset panel code. | 2 pts | ui-engineer-enhanced | sonnet | high | P2A-009 |
| P2B-003 | Migrate CoverageView inline sidebar to EntityModal | Create `CoverageSlotTabRegistry` (tabs: Slot Detail, Coverage Rules). Remove inline sidebar column from `CoverageView.tsx`. Replace with EntityModal triggered by `onSlotClick`. Wire `flag:ui-tabbed-modal`. | 1.5 pts | ui-engineer-enhanced | sonnet | high | P2A-009 |
| P2B-004 | Migrate TemplatePreviewPanel to EntityModal | Create `TemplateTabRegistry` (tabs: Preview, Domains, Apply). Migrate `TemplatePreviewPanel` content into tab panels. Replace the persistent `<aside>` in TemplateLibrary with EntityModal. Wire `flag:ui-tabbed-modal`. Preserve "Apply to Project" CTA in the Apply tab. | 1.5 pts | ui-engineer-enhanced | sonnet | high | P2A-009 |
| P2B-005 | Migrate InboxPreviewPane to EntityModal | Create `InboxItemTabRegistry` (tabs: Preview, Classify, Links). Migrate `InboxPreviewPane` content into tab panels. Remove the permanent center column from the 3-column layout. Replace with EntityModal. Wire `flag:ui-tabbed-modal`. Preserve ClassificationForm flow in Classify tab. | 1.5 pts | ui-engineer-enhanced | sonnet | high | P2A-009 |
| P2B-006 | Remove deprecated bespoke panel code | After all 5 surfaces migrated and flagged: delete `RightDrawer` consumers' old code paths (Assets), delete inline `SlotDetailPanel` code from `BomOverview.tsx`, remove Coverage w-56 sidebar column, remove Template persistent aside, remove Inbox center column. Keep `RightDrawer` component itself — it is still used by Context Pack Builder (`ContextPacksView`). | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P2B-001 through P2B-005 |
| P2B-007 | Feature flag wiring per-surface | Verify `flag:ui-tabbed-modal` gates each surface independently. When flag is off, old surface renders (fallback). Add flag documentation note. Prepare the global flag cutover path for post-P6. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P2B-006 |
| P2B-008 | task-completion-validator gate | Run `task-completion-validator` against all P2b exit criteria. | — | task-completion-validator | (default) | — | P2B-007 |

---

## Acceptance Criteria

### AC P2B-A: All 5 surfaces use EntityModal pattern

- target_surfaces:
    - web/features/assets/AssetLibrary.tsx
    - web/features/bom/BomOverview.tsx
    - web/features/coverage/CoverageView.tsx
    - web/features/templates/TemplateLibrary.tsx
    - web/features/inbox/InboxTriage.tsx
- propagation_contract: Each surface constructs an entity-specific tab registry and passes it to `EntityModal`. URL state (`?item=&tab=`) driven by shared EntityModal implementation.
- resilience: If `flag:ui-tabbed-modal` is off for a surface, the original panel renders unchanged. If EntityModal receives undefined entityId, it shows a MetadataUnavailable placeholder.
- visual_evidence_required: Screenshots of each surface with modal open (desktop ≥1280px), showing tab bar + URL with ?item=&tab=
- verified_by: [P2B-007, P6-005]

### AC P2B-B: Old bespoke panel code removed

- target_surfaces:
    - web/features/bom/BomOverview.tsx (was: inline SlotDetailPanel lines 269-366)
    - web/features/coverage/CoverageView.tsx (was: w-56 sidebar column lines 200-255)
    - web/features/templates/TemplateLibrary.tsx (was: persistent aside)
    - web/features/inbox/InboxTriage.tsx (was: center column lines 261-269)
- propagation_contract: Old code paths deleted; no dead code remaining. `RightDrawer` component itself retained for Context Pack Builder use.
- resilience: N/A — removal task; verify by absence
- visual_evidence_required: false
- verified_by: [P2B-006, P6-005]

### AC P2B-C: Focus and keyboard behavior correct on all 5 surfaces

- target_surfaces:
    - web/features/assets/AssetLibrary.tsx
    - web/features/bom/BomOverview.tsx
    - web/features/coverage/CoverageView.tsx
    - web/features/templates/TemplateLibrary.tsx
    - web/features/inbox/InboxTriage.tsx
- propagation_contract: Inherited from EntityModal shell (P2a) — all 5 surfaces get focus-trap, Escape, focus-restore, ARIA for free
- resilience: N/A — inherited from shell
- visual_evidence_required: false
- verified_by: [P6-003, P6-005, P6-009]

---

## Phase Quality Gates

- [ ] All 5 detail surfaces render EntityModal (when `flag:ui-tabbed-modal` is on)
- [ ] URL contains `?item=<id>&tab=<key>` when modal is open for each surface
- [ ] Old bespoke panel code removed (SlotDetailPanel inline, Coverage sidebar col, Template aside, Inbox center col)
- [ ] `RightDrawer` component retained (still used by Context Pack Builder)
- [ ] Feature flag `flag:ui-tabbed-modal` gates each surface independently
- [ ] Focus-trap + Escape + focus-restore verified on each surface (inherited from P2a shell)
- [ ] `task-completion-validator` passes

---

## Key Files

| File | Change Type | Notes |
|------|-------------|-------|
| `web/features/assets/AssetLibrary.tsx` | Modify | Replace RightDrawer with EntityModal |
| `web/features/assets/components/AssetDrawerContent.tsx` | Modify | Convert to tab panels or supersede |
| `web/features/bom/BomOverview.tsx` | Modify | Remove inline SlotDetailPanel; wire EntityModal |
| `web/features/coverage/CoverageView.tsx` | Modify | Remove w-56 sidebar column; wire EntityModal |
| `web/features/templates/TemplateLibrary.tsx` | Modify | Remove persistent aside; wire EntityModal |
| `web/features/templates/components/TemplatePreviewPanel.tsx` | Modify/supersede | Convert to tab panels |
| `web/features/inbox/InboxTriage.tsx` | Modify | Remove center column; wire EntityModal |
| `web/features/inbox/InboxPreviewPane.tsx` | Modify/supersede | Convert to tab panels |
