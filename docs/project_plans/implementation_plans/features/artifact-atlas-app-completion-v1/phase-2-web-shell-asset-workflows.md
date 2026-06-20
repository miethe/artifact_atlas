# Phase 2: Web Shell And Asset Workflows

**Parent Plan**: [Artifact Atlas App Completion](../artifact-atlas-app-completion-v1.md)  
**Duration**: 3-5 weeks  
**Effort**: 55 points  
**Dependencies**: Phase 1 project/assets/search APIs available or mocked with contract fixtures  
**Primary Subagents**: ui-designer, ui-engineer-enhanced, frontend-developer, web-accessibility-checker

## Phase Overview

Phase 2 turns the static `web/app/page.tsx` shell into the primary usable web app for project command center, asset library, asset detail/review, inbox/capture triage, IntentTree node context scaffold, and feature/topic board. It follows the mockups as visual direction while preserving operational density and accessibility.

## Goals

- Establish a reusable app shell with sidebar, top search, breadcrumbs, page actions, command palette, right inspector, and bottom collaboration/status bar.
- Build project home/command center with real dashboard aggregates.
- Build asset library with filters, view modes, selectable cards, table mode, and right detail drawer.
- Build asset detail/review page with provenance, policy, status transitions, and canonical gate UI.
- Build inbox triage and feature/topic board scaffolds.
- Make UI state URL-addressable, API-backed, keyboard navigable, and responsive enough for desktop/tablet.

## Architecture Focus

- **Layer**: Next.js App Router, React components, client state, API integration.
- **Patterns**: Feature modules, shared design tokens, server-state hooks, stable layout dimensions, accessible drag/drop alternatives.
- **Standards**: Mockup package, source spec sections 7/8/17, no marketing-page hero patterns.

## Task Breakdown

### Epic: Frontend Foundation

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| UI-FND-001 | Dependency Stack | Add UI dependencies: query/state/forms/table/virtual/dnd/icons as selected in Phase 0. | Package install succeeds; typecheck runs. | 3 | frontend-developer | Phase 0 |
| UI-FND-002 | Design Tokens | Implement semantic color/spacing/type tokens matching mockup direction. | Tokens cover blue, purple, green, orange, red, gray, surfaces, borders, focus. | 4 | ui-engineer-enhanced, ui-designer | UI-FND-001 |
| UI-FND-003 | App Shell | Build `AppShell`, `SidebarNav`, `TopBar`, `Breadcrumbs`, `ActionToolbar`, `RightDrawer`, `CollaborationFooter`. | Shell matches mockup proportions at 1672x941, 1440x900, 1280x800. | 5 | ui-engineer-enhanced | UI-FND-002 |
| UI-FND-004 | Routing Structure | Create routes for project overview, assets, inbox, IntentTree node, feature board, BOM placeholders, templates placeholders, context packs placeholders. | Routes render within shell and preserve project context. | 3 | frontend-developer | UI-FND-003 |
| UI-FND-005 | API Client And Hooks | Add typed API client and hooks for projects/assets/search/dashboard. | Loading/error/empty/success states exist for all hooks. | 4 | frontend-developer | Phase 1 APIs |
| UI-FND-006 | Command Palette | Implement command palette shortcuts and navigation actions. | Cmd/Ctrl+K opens palette; `/` focuses search; shortcuts documented in code/tests. | 3 | frontend-developer, ui-engineer-enhanced | UI-FND-004 |

### Epic: Project Command Center

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| UI-HOME-001 | Dashboard Data Model | Map dashboard aggregate API to KPI cards and panels. | No hard-coded counts remain except demo fallback fixtures. | 3 | frontend-developer | UI-FND-005 |
| UI-HOME-002 | Command Center Panels | Build active nodes, recent assets, canonical artifacts, candidate assets, missing context, context packs, agent activity panels. | Panels match `artifact_atlas_command_center_interface.png` hierarchy and density. | 6 | ui-engineer-enhanced | UI-HOME-001 |
| UI-HOME-003 | MeatyWiki Sync Actions | Add sync status, Open in MeatyWiki, and export action placeholders. | Actions are visible and disabled/ready based on integration status. | 2 | frontend-developer | UI-HOME-002 |

### Epic: Asset Library And Detail

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| UI-ASSET-001 | Filter Bar And URL State | Implement filters for project, source, type, status, topic, feature, node, date, sensitivity, artifact type, BOM slot. | Filters update URL state and API query params. | 5 | frontend-developer | UI-FND-005 |
| UI-ASSET-002 | Asset Gallery Cards | Build cards with thumbnail/type icon, source, tags, status, linked counts, BOM state, quick actions. | Cards support hover, focus, selected, multi-selected, empty preview, loading skeleton. | 5 | ui-engineer-enhanced | UI-ASSET-001 |
| UI-ASSET-003 | View Modes | Implement Gallery and Table for MVP; scaffold Board/Timeline if not fully functional. | Gallery/table toggle works; unavailable modes are clearly staged or hidden. | 4 | frontend-developer | UI-ASSET-002 |
| UI-ASSET-004 | Detail Drawer | Build right drawer with preview, description, details, tags, node links, sensitivity, quick actions. | Drawer matches asset library mockup and collapses on narrower widths. | 5 | ui-engineer-enhanced | UI-ASSET-002 |
| UI-ASSET-005 | Asset Detail Page | Build deep detail/review route with large preview, lifecycle status, provenance, versions, related assets, AI summary placeholder, policy panel. | Canonical promotion requires explicit confirmation/review state. | 6 | ui-engineer-enhanced, frontend-developer | UI-ASSET-004 |
| UI-ASSET-006 | Metadata Editing | Add forms for title, description, tags, status, sensitivity, project/topic/feature/node, BOM slot associations. | Edits persist through API with optimistic state and rollback on error. | 5 | frontend-developer | UI-ASSET-004, Phase 1 APIs |

### Epic: Inbox, Node Context, And Board

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| UI-INBOX-001 | Inbox Triage Layout | Build queue, preview, suggested metadata panel, classification form, bulk action bar. | Matches `modern_saas_dashboard_interface_design.png` flow and handles selected/multi-selected states. | 5 | ui-engineer-enhanced, frontend-developer | UI-ASSET-006 |
| UI-INBOX-002 | Capture Actions | Wire add asset, drag/drop, URL import, and clipboard/file-picker affordances to import APIs. | Import creates inbox item and shows processing/sync state. | 4 | frontend-developer | UI-INBOX-001 |
| UI-NODE-001 | IntentTree Node Context Scaffold | Build node metadata header, linked entities, context/assets/outputs tabs, agent actions. | Can render from mock/demo node refs and linked assets. | 4 | frontend-developer | UI-FND-004 |
| UI-BOARD-001 | Feature/Topic Board | Build board grouped by status/topic/domain with draggable cards and keyboard move fallback. | Drag/drop updates status/classification only after API success or rollback. | 5 | ui-engineer-enhanced, frontend-developer | UI-ASSET-006 |

## Component Inventory

Shared components needed in this phase:

- `AppShell`, `SidebarNav`, `TopBar`, `GlobalSearch`, `Breadcrumbs`, `PageHeader`, `ActionToolbar`.
- `MetricCard`, `StatusBadge`, `TagChip`, `AssetThumbnail`, `AssetCard`, `InspectorDrawer`, `EmptyState`.
- `FilterBar`, `ViewToggle`, `SortMenu`, `BulkActionBar`, `CommandPalette`.
- `AssetPreview`, `PolicyBadge`, `ProvenancePanel`, `NodeLinkChip`, `BOMSlotChip`.
- `BoardColumn`, `DraggableAssetCard`, `MoveSelectedDialog`.

## Visual Design Requirements

- Use a dense operational SaaS layout, not a landing page.
- Keep card radii at 8px or less.
- Use icons for tool buttons where available.
- Do not use decorative gradient blobs/orbs.
- Do not rely on color-only status meaning; pair color with labels/icons.
- Keep text inside cards/buttons from clipping at desktop widths.
- Stable grid tracks for cards, boards, and KPI rows to prevent layout shift.
- Desktop-first but responsive: collapse sidebar/right rail and allow horizontal board/matrix scrolling below desktop widths.

## Accessibility Requirements

- Cards and table rows are keyboard selectable.
- Drag/drop has keyboard alternatives: move selected to status/slot/node.
- Icon-only buttons have labels/tooltips.
- Drawer and modal focus is trapped.
- Command palette is fully keyboard operable.
- Status chips include text labels.
- Asset previews have alt text or type fallback.

## Quality Gates

- [ ] Frontend typecheck passes.
- [ ] Project home no longer uses only hard-coded static stats.
- [ ] Asset gallery/table/detail/inbox flows work against API or explicit contract fixtures.
- [ ] Right drawer behavior is consistent across asset library and detail workflows.
- [ ] Canonical/status-changing actions are explicit and auditable.
- [ ] Visual QA covers `1672x941`, `1440x900`, `1280x800`; no overlapping text or clipped controls.
- [ ] Accessibility smoke tests cover keyboard navigation, focus states, and drawer/modal behavior.

## Key Files

| File Path | Purpose | Subagent |
|---|---|---|
| `web/app/layout.tsx` | Root shell wiring | frontend-developer |
| `web/app/(projects)/projects/[projectId]/page.tsx` | Command center route | frontend-developer |
| `web/app/(projects)/projects/[projectId]/assets/page.tsx` | Asset library route | frontend-developer |
| `web/app/(projects)/projects/[projectId]/assets/[assetId]/page.tsx` | Asset detail route | ui-engineer-enhanced |
| `web/app/(projects)/projects/[projectId]/inbox/page.tsx` | Inbox triage route | frontend-developer |
| `web/components/*` | Shared design system components | ui-engineer-enhanced |
| `web/features/assets/*` | Asset hooks/components | frontend-developer |
| `web/lib/api.ts` | API client | frontend-developer |
| `web/app/globals.css` | Tokens/global styles | ui-engineer-enhanced |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| UI becomes over-dense or unreadable | High | Match mockup density with strict text/spacing QA and progressive disclosure. |
| Drag/drop excludes keyboard users | High | Build keyboard move dialogs alongside dnd implementation. |
| Frontend outruns backend | Medium | Use OpenAPI-derived fixtures until APIs are ready, then replace with hooks. |
| Status mutation becomes too easy | High | Confirmation and review states for canonical/policy-sensitive actions. |

## Validation Commands

```bash
cd web && npm run typecheck
cd web && npm run build
```

Add Playwright visual smoke checks once web dependencies are installed and the app can run.

[Return to Parent Plan](../artifact-atlas-app-completion-v1.md)
