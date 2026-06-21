# Artifact Atlas — Frontend Discovery: Leg 1

> Scope: Mode A (exploration only). No code changes.
> Date: 2026-06-20
> Root: `/Users/miethe/dev/homelab/development/artifact_atlas/web`

---

## 1. Route Structure

All project-scoped routes live under the `(projects)` route group. The group layout wraps every page in `AppShell`.

```
app/
  layout.tsx                              # Root: html/body + Providers
  page.tsx                                # (likely redirects)
  providers.tsx                           # Mounts QueryProvider (TanStack Query)
  globals.css                             # CSS vars + base reset
  (projects)/
    layout.tsx                            # → <AppShell projectId?> wrapper
    projects/
      [projectId]/
        page.tsx                          # Command Center (dashboard)
        assets/
          page.tsx                        # Asset Library
          [assetId]/page.tsx              # Asset Detail (full page)
        inbox/page.tsx                    # Inbox Triage (3-col)
        board/page.tsx                    # Kanban board (dnd-kit)
        bom/page.tsx                      # BOM Overview
        bom-mapping/page.tsx              # Inbox → BOM mapping (dnd-kit)
        coverage/page.tsx                 # Coverage & Gaps
        templates/
          page.tsx                        # Template Library
          TemplatesPageClient.tsx         # Client entry
        context-packs/page.tsx            # Context Packs
        intent-nodes/
          page.tsx                        # Intent Nodes list
          [nodeId]/page.tsx               # Node detail (NodeContextView)
```

Default project ID fallback: `"proj_artifact_atlas"` (SidebarNav:31).

---

## 2. Global Shell & Layout

### AppShell (`components/shell/AppShell.tsx`)

Fixed `flex h-screen w-screen overflow-hidden` grid. Regions:

| Region | Component | Dimensions |
|---|---|---|
| Sidebar | `SidebarNav` | 208 px expanded / 48 px collapsed (local state, no persistence) |
| TopBar | `TopBar` | `h-11` |
| Content | `<main id="main-content">` | fills remainder |
| Right rail | optional `<aside>` prop slot | `w-80` — NOT used by any page today (prop exists but no caller passes it) |
| Footer | `CollaborationFooter` | small |

The `rightRail` / `rightRailOpen` props on AppShell are wired but unused — no page currently injects a persistent right rail through the shell.

### SidebarNav (`components/shell/SidebarNav.tsx`)

10 nav items (line 39–91): Overview, Assets, Inbox, Intent Nodes, Board, Artifact BOM, Templates, Coverage & Gaps, Inbox → BOM, Context Packs. Active link: `bg-blue-50 text-blue-700`. Collapse toggle at bottom.

### TopBar (`components/shell/TopBar.tsx`)

Contains `GlobalSearch` (max-w-sm), `⌘K` chip → `CommandPalette`, Bell icon, Settings icon, user avatar button ("N"). No dark-mode toggle present.

### RightDrawer (`components/shell/RightDrawer.tsx`)

Reusable overlay / non-overlay right-side panel. Props: `open`, `onClose`, `title?`, `width: sm|md|lg` (256/320/384 px), `overlay: boolean` (default true). Implements focus-trap + Escape key. Used by two features (see section 3).

---

## 3. Detail / Sidebar / Drawer Catalogue

### 3a. Asset Inspector Drawer — Assets page

**File:** `features/assets/AssetLibrary.tsx:277-292`
**Entity:** Asset
**Mechanism:** `RightDrawer` (non-overlay, `width="md"` = 320 px) rendered inline beside the grid. Opens when `inspectAssetId` is set.
**Trigger:** clicking an `AssetCard` (or the "Open detail" icon button on hover). `handleOpen` at line 142.
**Content:** `AssetDrawerContent` (`features/assets/components/AssetDrawerContent.tsx`)
**Data hook:** `useAssets(projectId, filters)` — the already-fetched asset list. The specific asset is found with `.find()` — no second fetch.
**What it shows:** `AssetPreview` (thumb/icon area), title, `StatusBadge` + `SensitivityBadge` + `PolicyBadge`, description, source/MIME/size/captured fields, tags, `ProvenancePanel` (collapsed), quick-action row (Open full detail link, Edit metadata, Copy, Pack).

### 3b. Asset Metadata Edit Dialog — Assets page

**File:** `features/assets/AssetLibrary.tsx:296-300` and `features/assets/AssetDetail.tsx:396-409`
**Entity:** Asset metadata
**Mechanism:** `Dialog` (modal) via `MetadataEditDialog` (in `AssetLibrary`) or inline expand via `MetadataEditForm` (in `AssetDetail` right rail).
**Trigger:** "Edit metadata" button inside drawer or right rail.
**Data hook:** `useUpdateAsset(assetId)` mutation.

### 3c. Asset Detail — Full route page

**File:** `features/assets/AssetDetail.tsx`
**Entity:** Asset
**Mechanism:** Dedicated route `/projects/[projectId]/assets/[assetId]`. Two-column: main content (preview, description, tags, version scaffold, related scaffold, AI summary scaffold) + `<aside>` right rail (w-72 xl:w-80, lifecycle actions, metadata edit, policy panel, provenance, context pack placeholder).
**Data hook:** `useAsset(assetId)` (line 146), `usePromoteAsset`, `useUpdateAsset`.
**Status confirm:** `Dialog` rendered at bottom (line 463) for canonical promotion and archive.

### 3d. BOM Slot Detail Panel — BOM Overview page

**File:** `features/bom/BomOverview.tsx:269-366` (inline `SlotDetailPanel`)
**Entity:** BOM slot
**Mechanism:** Custom `fixed inset-y-0 right-0 z-40 w-80` panel (NOT the shared `RightDrawer` component — a local bespoke implementation). Backdrop overlay `fixed inset-0 z-30 bg-black/10` added.
**Trigger:** Clicking any `SlotCard` (when slot is not `not_applicable`) sets `selectedSlot` (line 383). `onOpen` prop at line 599.
**Data:** Already-fetched `BomSlot` object from `useBom(projectId)`.
**What it shows:** ID, required, phase, domain, assignments, description, coverage rules legend.

### 3e. BOM Slot Context Menu + Dialogs — SlotCard

**File:** `features/bom/components/SlotCard.tsx`
**Entity:** BOM slot
**Mechanism:** Inline `SlotMenu` popover (absolute positioned, z-30) + five separate `Dialog` modals: Assign asset, Confirm unassign, Confirm N/A, Request asset, View assignments.
**Trigger:** "More" (MoreHorizontal) icon button on card hover/focus.

### 3f. Coverage Slot Detail — Coverage page sidebar

**File:** `features/coverage/CoverageView.tsx:200-255`
**Entity:** BOM slot
**Mechanism:** Inline static panel in the right 56px sidebar column (w-56 shrink-0). NOT a drawer — just a conditional `div` that appears in the sidebar.
**Trigger:** Clicking a slot in `CoverageMatrix` or gap in `GapsPanel` (via `onSlotClick` / `onAssignAsset`).

### 3g. Context Pack Builder Drawer — Context Packs page

**File:** `features/context-packs/ContextPacksView.tsx:251-263`
**Entity:** Context Pack (create or edit)
**Mechanism:** `RightDrawer` (overlay, `width="lg"` = 384 px).
**Trigger:** "New pack" button, or `onOpen` on `PackCard` (chevron icon on hover).
**Content:** `ContextPackBuilder` (multi-step wizard with 5 steps: Node, Assets, Instructions, Policy, Review).
**Data hook:** `useContextPacks(projectId)` for pack list.

### 3h. Template Preview Panel — Template Library page

**File:** `features/templates/TemplateLibrary.tsx` / `features/templates/components/TemplatePreviewPanel.tsx`
**Entity:** Template
**Mechanism:** Persistent right panel (likely inline `<aside>` split layout, not a drawer). Shows template domains, slot counts, required/optional breakdown, expandable domain → slot tree. "Apply to Project" CTA.
**Trigger:** Clicking a `TemplateCard` sets `selectedTemplate`.

### 3i. Inbox Preview Pane — Inbox Triage page

**File:** `features/inbox/InboxTriage.tsx:261-269` / `features/inbox/InboxPreviewPane.tsx`
**Entity:** Inbox item (pre-asset)
**Mechanism:** Center column (flex-1) of a 3-column layout. NOT a drawer — a permanent column.
**Trigger:** Selecting an `InboxQueueItem` sets `selectedId`.
**Data hook:** `useInboxItems(projectId)`.

### 3j. Apply Template Wizard — Template page

**File:** `features/templates/components/ApplyWizard.tsx`
**Entity:** Template → BOM application
**Mechanism:** Unknown render mechanism (modal or inline). Not fully explored.

---

## 4. Card Component Inventory

| Component | File | Entity | Used In |
|---|---|---|---|
| `AssetCard` | `features/assets/components/AssetCard.tsx` | Asset | `AssetLibrary` gallery grid |
| `AssetCardSkeleton` | same file | — | `AssetLibrary` loading |
| `DraggableAssetCard` | `features/board/DraggableAssetCard.tsx` | Asset | `AssetBoard` columns |
| `InboxItemCard` | `features/bom-mapping/components/InboxItemCard.tsx` | InboxItem | `BomMappingView` left column |
| `InboxQueueItem` | `features/inbox/InboxQueueItem.tsx` | InboxItem | `InboxTriage` queue list |
| `SlotCard` | `features/bom/components/SlotCard.tsx` | BomSlot | `BomOverview` slot grid |
| `PackCard` | `features/context-packs/components/PackCard.tsx` | ContextPack | `ContextPacksView` grid |
| `TemplateCard` | `features/templates/components/TemplateCard.tsx` | Template | `TemplateLibrary` list |
| `MetricCard` | `components/ui/MetricCard.tsx` | KPI stat | `BomOverview` KPI row, `CommandCenterView` dashboard panels |

### AssetCard anatomy (detailed)

- 8px border-radius (`rounded-[8px]`)
- Thumbnail row: `AssetThumbnail` (w-9 h-9) + title (line-clamp-2) + source · size
- Badge row: `StatusBadge` + `SensitivityBadge` (xs size)
- Tags row: up to 3 `TagChip` + overflow count
- Footer: `PolicyBadge` + link count + BOM slot label + quick-action icon buttons (hover-only, opacity-0→1)
- States: default, hover (shadow-card-hover, border-gray-300), selected (border-blue-400 ring-1), focused (ring-2 ring-blue-500)
- Multi-select: checkbox visible when multiSelectActive or hovered

### PackCard anatomy

- `role="button"` article, border, rounded-lg, p-4
- Header: Package icon + name + `PackStatusBadge`
- Optional description (line-clamp-2)
- Meta row: audience icon + label, item count, relative date
- Hover-reveal "Open" chevron (absolute top-right)

### SlotCard anatomy

- Per-status border/bg style (`getCardStyle`)
- Top row: status icon + `SlotStatusBadge` + optional/required badge + MoreHorizontal menu trigger
- Slot name (truncated)
- Phase + domain chips (gray-100 bg)
- Assignment count pill (Paperclip icon)
- Missing+required: red CTA "Assign" strip
- Complete: faded CheckCircle overlay

---

## 5. Asset / File Preview

### AssetPreview (`features/assets/components/AssetPreview.tsx`)

Full-featured viewer component, 4 size variants (sm/md/lg/full):

| Condition | Render |
|---|---|
| `agent_access === "none"` or `"metadata_only"` | Lock icon + "Access Restricted" |
| `image/*` + `thumbnail_uri` or `preview_text_uri` | `<img>` with `object-contain` |
| `text/*` or `code` + `preview_text_uri` | `<pre>` snippet with fade-out gradient (placeholder text) |
| Everything else | Type icon + MIME label (gray dashed bg) |

The text/code snippet path currently renders `[Preview: {asset.title}]` as placeholder — real content fetch is not implemented yet.

### AssetThumbnail (`features/assets/components/AssetThumbnail.tsx`)

Compact icon widget (xs/sm/md/lg). Shows actual `<img>` only if `thumbnail_uri` is set AND MIME starts with `image/`. Otherwise renders a MIME-mapped Lucide icon in a colored box. Used in cards and table rows.

---

## 6. Design Tokens & Theming

### CSS Variables (`app/globals.css`)

Declared on `:root`. No dark-mode variant (`[data-theme="dark"]`) exists yet. Color-scheme is locked to `light`.

Key layout dimensions:
```
--sidebar-width: 232px    (CSS var — sidebar itself uses w-52 = 208px; slight discrepancy)
--topbar-height: 48px
--drawer-width: 360px
--footer-height: 32px
```

Semantic surface tokens:
```
--surface              #ffffff
--surface-raised       #ffffff   (same as surface — no elevation distinction)
--surface-sunken       #f7f9fc
--surface-overlay      #ffffff
--bg                   #f1f3f7
--bg-subtle            #e8ebf0
```

Ink tokens: `--ink` #111827, `--ink-muted` #5c6370, `--ink-faint` #9ca3af, `--ink-inverse` #ffffff.

Border tokens: `--border` #d9dee8, `--border-strong` #b4bbca, `--border-focus` #2563eb.

Transition vars: `--t-fast: 100ms`, `--t-base: 150ms`, `--t-slow: 250ms`.

### Tailwind Config (`tailwind.config.ts`)

**Brand palette:** brand-50→900 (blue). **Purple** for agent/AI actions. **Status** colors: `status.*` and corresponding CSS vars. **Sensitivity** colors: `sensitivity.*`.

**Typography scale:** 11px (2xs) → 28px (3xl). Base body is 14px. Font family: Inter → system sans, JetBrains Mono → monospace.

**Spacing:** Standard 4px-base grid, explicit overrides through 24 (96px).

**Border-radius:** card=8px, sm=4px, default=6px. No larger than 8px anywhere.

**Shadows:** `shadow-card` (subtle), `shadow-card-hover` (elevated on hover), `shadow-drawer` (left-side drawer), `shadow-modal`, `shadow-focus-ring`.

**Custom animations:** `fade-in` (150ms), `slide-in-right` (200ms), `slide-in-up` (200ms), `pulse-subtle` (2s loop). These are used on drawers and modals.

**No dark mode** configured (no `darkMode` key in tailwind.config.ts).

### UI Primitives in `components/ui/`

| Component | File | Notes |
|---|---|---|
| `Button` | `Button.tsx` | variants: primary/secondary/ghost/danger/outline; sizes: xs/sm/md/lg; loading spinner; iconLeft/Right slots |
| `IconButton` | `IconButton.tsx` | Square icon-only button, variants: ghost/secondary |
| `StatusBadge` | `StatusBadge.tsx` | Asset lifecycle status chip; sizes xs/sm/md |
| `SensitivityBadge` | `SensitivityBadge.tsx` | Sensitivity level chip; optional Lock icon |
| `TagChip` | `TagChip.tsx` | Removable or static tag pill |
| `MetricCard` | `MetricCard.tsx` | KPI card with label, value, delta, icon, sublabel, footer slot |
| `EmptyState` | `EmptyState.tsx` | Empty/error placeholder with icon, title, description, action slot; sizes sm/default |
| `Skeleton` | `Skeleton.tsx` | Exports: `Skeleton` (generic), `SkeletonCard`, `SkeletonRow` |
| `Tooltip` | `Tooltip.tsx` | Hover tooltip, `side: top/bottom/left/right` |
| `Dialog` | `Dialog.tsx` | Focus-trapped modal; sizes sm/md/lg; title, description, children, footer slots |
| `SegmentedControl` | `SegmentedControl.tsx` | Tab-style toggle (gallery/table, context/assets/outputs); `iconOnly` mode |

**Not present:** Dropdown/Select primitive (bare `<select>` used inline), Checkbox (bare HTML used inline), Radio, Toast/notification system, Combobox/Autocomplete, Popover (menus built ad hoc), Badge (StatusBadge serves this but is entity-specific), Avatar, Accordion/Collapse, DataTable (AssetTable uses TanStack Table directly but no shared primitive exists).

---

## 7. Data Hooks Inventory

All hooks live in `lib/hooks/` and use TanStack Query.

| Hook | File | Used By |
|---|---|---|
| `useAssets(projectId, filters?)` | `useAssets.ts` | AssetLibrary, CommandCenterView, NodeContextView |
| `useAsset(assetId)` | `useAssets.ts` | AssetDetail |
| `usePromoteAsset(assetId)` | `useAssets.ts` | AssetDetail |
| `useUpdateAsset(assetId)` | `useAssets.ts` | AssetDetail |
| `useImportAsset(projectId)` | `useAssets.ts` | InboxTriage |
| `useBom(projectId)` | `useBom.ts` | BomOverview, BomMappingView |
| `useBomCoverage / useBomCoverageExtended` | `features/bom/hooks/useBomCoverage.ts` | BomOverview, CoverageView |
| `useSlotAssign / useSlotUnassign / useSlotMarkNA / useSlotRequestAsset` | `features/bom/hooks/useBomSlot.ts` | SlotCard |
| `useContextPacks(projectId)` | `useContextPacks.ts` | ContextPacksView, CommandCenterView |
| `useDashboard(projectId)` | `useDashboard.ts` | CommandCenterView |
| `useInboxItems(projectId)` | `useInbox.ts` | InboxTriage |
| `useImportToInbox / useBulkStatusChange / useBulkDelete` | `useInbox.ts` | InboxTriage |
| `useProjects()` | `useProjects.ts` | (project list, not explored fully) |
| `useTemplates(filters?)` | `features/templates/hooks.ts` | TemplateLibrary |
| `useBomMapping(projectId)` | `features/bom-mapping/hooks/useBomMapping.ts` | BomMappingView |
| `useCoverageData(projectId)` | `features/coverage/hooks/useCoverageData.ts` | CoverageView |
| `useMeatyWikiIntegration()` | `features/dashboard/hooks/useIntegrations.ts` | CommandCenterView |

---

## 8. Feature-by-Feature Panel Summary

### Dashboard (Command Center) — `/projects/[id]`

3-column grid (1→2→3 col responsive). Panels: MeatyWikiSyncBar (banner), KPIRow (4 MetricCards), ActiveNodesPanel, AgentActivityPanel, RecentAssetsPanel, CandidateAssetsPanel, CanonicalArtifactsPanel, MissingContextPanel, ContextPacksPanel. No detail drawer — clicking panels navigates to dedicated pages.

### Asset Library — `/projects/[id]/assets`

View toggle (gallery/table via `SegmentedControl`). FilterBar + SortMenu. In gallery mode: responsive grid (1→2→3→4→5 cols, narrows when drawer is open). On click: `RightDrawer` opens with `AssetDrawerContent` (non-overlay, pushes grid narrower). From drawer: "Open full detail" navigates to `/assets/[assetId]` route. BulkActionBar appears when selections exist. `MetadataEditDialog` for metadata editing.

### Asset Detail — `/projects/[id]/assets/[id]`

Two-column: main area (lg:flex-row) + right `<aside>` (w-72 xl:w-80). `Dialog` for lifecycle confirm. `MetadataEditForm` inline toggle in right rail.

### Inbox Triage — `/projects/[id]/inbox`

3-column: Queue (w-72) | InboxPreviewPane (flex-1) | ClassificationForm (w-72). Not a drawer pattern — fixed columns. Keyboard nav (ArrowUp/Down in queue). BulkActionBar at top when multi-selected.

### Board — `/projects/[id]/board`

dnd-kit DndContext. Status-grouped columns (`AssetStatus` values). `DragOverlay` for active card. `MoveSelectedDialog` as keyboard fallback.

### BOM Overview — `/projects/[id]/bom`

KPI row + domain tabs + coverage sub-scores + SlotCard grid. `SlotDetailPanel` is a bespoke fixed-position overlay (NOT using `RightDrawer`). SlotCard has its own popover menu + 5 Dialogs per card.

### Coverage & Gaps — `/projects/[id]/coverage`

ReadinessScore + tab bar (Matrix|Gaps) + right 56px sidebar column with inline slot detail. No drawer.

### Inbox → BOM Mapping — `/projects/[id]/bom-mapping`

dnd-kit drag-and-drop. InboxItemCard → BomSlotDropTarget. KeyboardMappingPanel for fallback. SuggestedClassificationPanel.

### Template Library — `/projects/[id]/templates`

Left list (`TemplateCard`) + right persistent `TemplatePreviewPanel`. ApplyWizard modal/sheet.

### Context Packs — `/projects/[id]/context-packs`

Grid of `PackCard`. `RightDrawer` (overlay, lg=384px) opens `ContextPackBuilder` 5-step wizard (Node, Assets, Instructions, Policy, Review).

### Intent Nodes — `/projects/[id]/intent-nodes/[nodeId]`

`NodeContextView` with 3 tabs (Context, Assets, Outputs). Context tab: 2-col (linked entities | agent actions). Assets tab: flat list rows. All demo-fixtures driven; no real API hook.

---

## 9. Known Polish Gaps & Observations

### Structural / Architecture
- `AppShell` `rightRail` prop is unwired — no page uses the persistent right rail slot. This means there is no shared persistent inspector rail pattern implemented, even though the slot exists.
- `--sidebar-width: 232px` in CSS vars but actual sidebar is `w-52` (208px) — minor inconsistency.
- `--surface-raised` equals `--surface` (#ffffff = #ffffff) — no elevation differentiation exists.
- `--surface-overlay` also equals `--surface` — no distinct overlay surface.

### Detail / Drawer Inconsistency
- **BOM Overview** uses a hand-rolled `fixed` panel (SlotDetailPanel) rather than the shared `RightDrawer`. It reimplements the close button, focus is not trapped, Escape key is not wired. Inconsistent with the asset library drawer.
- **Coverage page** slot detail is an inline sidebar column (w-56) — different from every other detail pattern.
- **Template Library** right panel is a persistent preview (not a drawer or route), which is appropriate for a browse-and-apply flow but visually inconsistent with the drawer pattern used elsewhere.
- **Inbox Preview** is a fixed center column — correct for triage but uses different visual language (surface-sunken bg) vs. the white surface used in drawers.

### Missing UI Primitives
- No shared Popover/Menu primitive — `SlotMenu`, `CommandPalette`, `SortMenu` all build their own.
- No Toast/notification system — lifecycle mutations show inline status banners only.
- No dark-mode support (no CSS vars switching, no `darkMode` in tailwind).
- No Combobox for asset search in AssignDialog — raw text input only.
- `SkeletonCard` and `SkeletonRow` exist but no `SkeletonText` or `SkeletonInline`.

### Preview
- `AssetPreview` text/code path renders placeholder text `[Preview: {title}]` — no real content fetch. Image path is functional if `thumbnail_uri` is populated.
- No PDF viewer scaffold.
- `AssetThumbnail` only renders an `<img>` for images with `thumbnail_uri` set; all other types get icon-in-box, which is visually flat.

### Theming
- No dark mode wiring anywhere.
- `color-scheme: light` locked in `:root`.
- `Inter` and `JetBrains Mono` fonts referenced but no `next/font` or `@font-face` loading configured in `layout.tsx` — relies on system fallbacks unless loaded externally.

### Empty / Loading States
- `EmptyState` component is consistent and used throughout.
- Skeleton variants exist (`SkeletonCard`, `SkeletonRow`, `Skeleton`). `SkeletonCard` is an animate-pulse gray card.
- Loading states are feature-local (no global loading indicator).

### Accessibility Notes
- Focus trap implemented in both `RightDrawer` and `Dialog` (shared utility pattern).
- `:focus-visible` base style defined in globals; `focus-ring` utility class available.
- `aria-current="page"` on active sidebar links.
- `AssetCard` uses `role="option"` + `aria-selected` but is inside a `role="listbox"` — correct pattern.
- `SlotCard` uses `role="article"` (not `option`) — inconsistent with asset card pattern.
- BOM `SlotDetailPanel` does not trap focus.
- `aria-live` regions absent — no announcement for drawer open/close.

### Interaction Micro-details
- Card hover: quick-action icons use `opacity-0 group-hover:opacity-100` — correct pattern, present in AssetCard and SlotCard.
- Selected card ring: `ring-1 ring-blue-400` (thin) — distinguishable but could be stronger.
- Drawer animation: `animate-slide-in-right` (200ms ease-out) — defined in tailwind keyframes.
- Dialog animation: `animate-slide-in-up` (200ms ease-out) + backdrop `animate-fade-in`.

---

## 10. Entity Model Summary (from `lib/types.ts`)

Core entities relevant to UI:

- **Asset** — lifecycle status (8 states), sensitivity (5 levels), agent_access (5 levels), mime_type, source_kind (16 sources), thumbnail_uri, preview_text_uri
- **BomSlot** — 7 status states, domain, phase, required bool, assignment_count
- **ContextPack** — 4 statuses, 6 audience types, 3 target types, item_count
- **InboxItem** — subset of Asset (pre-classification)
- **ArtifactTemplate** — (in `features/templates/types.ts`) domains array → slots array; template_type, status

---

## Files Referenced

| Path | Role |
|---|---|
| `web/tailwind.config.ts` | Design tokens, palette, spacing, shadows, animations |
| `web/app/globals.css` | CSS vars, surface/ink/border/status/sensitivity tokens, layout dims |
| `web/app/layout.tsx` | Root layout — Providers mount |
| `web/app/(projects)/layout.tsx` | AppShell mount per project route |
| `web/components/shell/AppShell.tsx` | Sidebar + topbar + content + optional right rail |
| `web/components/shell/SidebarNav.tsx` | 10 nav items, collapse logic |
| `web/components/shell/TopBar.tsx` | Search, ⌘K, Bell, Settings, user avatar |
| `web/components/shell/RightDrawer.tsx` | Reusable overlay/inline right drawer |
| `web/components/ui/index.ts` | Primitive export list |
| `web/components/ui/Button.tsx` | 5 variants, 4 sizes, loading |
| `web/components/ui/Dialog.tsx` | Focus-trapped modal |
| `web/components/ui/MetricCard.tsx` | KPI card |
| `web/features/assets/AssetLibrary.tsx` | Gallery/table + inspector drawer |
| `web/features/assets/AssetDetail.tsx` | Full asset detail route component |
| `web/features/assets/components/AssetCard.tsx` | Gallery card |
| `web/features/assets/components/AssetDrawerContent.tsx` | Inspector panel content |
| `web/features/assets/components/AssetPreview.tsx` | Preview renderer (image/text/icon) |
| `web/features/assets/components/AssetThumbnail.tsx` | Compact type icon / img thumb |
| `web/features/bom/BomOverview.tsx` | BOM page + bespoke slot detail panel |
| `web/features/bom/components/SlotCard.tsx` | BOM slot card + menus + 5 dialogs |
| `web/features/context-packs/ContextPacksView.tsx` | Pack grid + builder RightDrawer |
| `web/features/context-packs/components/PackCard.tsx` | Context pack card |
| `web/features/coverage/CoverageView.tsx` | Coverage matrix + inline slot sidebar |
| `web/features/dashboard/CommandCenterView.tsx` | 3-col dashboard composition |
| `web/features/inbox/InboxTriage.tsx` | 3-col triage layout |
| `web/features/node/NodeContextView.tsx` | Node detail with tabs |
| `web/features/templates/TemplateLibrary.tsx` | Template list + preview panel |
| `web/features/templates/components/TemplateCard.tsx` | Template card |
| `web/features/templates/components/TemplatePreviewPanel.tsx` | Right preview panel |
| `web/lib/types.ts` | All entity TypeScript types |
| `docs/PRD.md` | MVP scope |
| `docs/architecture.md` | System shape, API routes |
| `docs/mvp-backlog.md` | Backlog items and scaffold state |
