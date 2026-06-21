# Leg 3 — Skillmeat-web @miethe/ui Usage Patterns

Exploration date: 2026-06-20
Root explored: `/Users/miethe/dev/homelab/development/skillmeat/skillmeat/web`

---

## 1. Tabbed Modal Pattern

### ConsolidatedEntityModal (`components/artifacts/modal/consolidated-entity-modal.tsx`)

The canonical tabbed modal. Wraps `Dialog` + `Tabs` from shadcn-derived `@/components/ui/*`. Tabs are **registry-driven** (`tab-registry.ts` via `getTabsForContext(tabCtx)`), not hardcoded.

Two layout modes gated by a feature flag (`modalVerticalSidebarEnabled`):

**Horizontal (flag OFF):**
```tsx
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <DialogContent className="flex h-[90vh] max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 max-w-6xl">
    <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
    {/* Custom header row */}
    <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
      <ModalHeader item={item} />
      <ModalActions item={item} onClose={handleClose} />
    </div>
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center border-b">
        <TabsList className="h-auto flex-1 justify-start rounded-none border-b-0 bg-transparent px-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id} value={tab.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <LensToggle value={activeLens} onChange={setActiveLens} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0 h-full">
            <React.Suspense fallback={<TabSkeleton />}>
              <tab.component artifact={item} onClose={handleClose} />
            </React.Suspense>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  </DialogContent>
</Dialog>
```

**Vertical sidebar (flag ON):**
```tsx
import { VerticalTabNavigation } from '@miethe/ui/primitives';
import type { Tab } from '@miethe/ui/primitives';

<Tabs value={activeTab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 overflow-hidden">
  <ModalSidebar
    tabs={tabs}
    activeTab={activeTab}
    onTabChange={handleTabChange}
    activeLens={activeLens}
    onLensChange={setActiveLens}
  />
  <div className="flex-1 overflow-auto p-6">
    {tabPanels}
  </div>
</Tabs>
```

**Key props on `ConsolidatedEntityModal`:**
```tsx
<ConsolidatedEntityModal
  item={unifiedArtifactItem | null}
  catalogEntry={ArtifactSearchResult | null}   // catalog mode: item=null
  initialTab="content"
  open={boolean}
  onClose={closeModal}
  lens="library" | "operations"                 // optional; seeds activeLens state
/>
```

**Provider/context requirements:**
- `NavigationGuardProvider` wraps the inner modal (handles unsaved-changes guard).
- Tab active state synced to URL via `?tab=` search param + `router.replace`.
- `useFeatureFlags()` for `modalVerticalSidebarEnabled`.
- `useEdition()` for tab context edition.

**Vertical sidebar component (`components/artifacts/modal/modal-sidebar.tsx`):**
```tsx
import { VerticalTabNavigation } from '@miethe/ui/primitives';
// Tab[] shape: { value: string; label: string; icon: React.ComponentType }
// Lucide icon names (PascalCase strings from TabConfig) resolved at render time via:
const resolved = (LucideIcons as Record<string, unknown>)[name];

<ModalSidebar
  tabs={TabConfig[]}
  activeTab={string}
  onTabChange={(tabId: string) => void}
  activeLens="library" | "operations"
  onLensChange={(lens) => void}
  variant="expanded"   // forward-compat; v1 ignores collapsed/hidden
/>
```

---

## 2. Card Layouts — Preview/Thumbnail Cards

### ArtifactCard (`components/artifacts/cards/artifact-card.tsx`)

Full-featured grid card. Uses zone composition pattern (`HeaderZone`, `ContentZone`, `RelationshipZone`, `StatusZone`, `ActionZone`). Left-border colored by type (`border-l-4`). Card tint via `getCardTint(type, tier)`.

```tsx
import { EnterpriseOwnerBadge, LockIcon } from '@miethe/ui/primitives';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

<Card
  data-lens={lens}
  data-tier={tier}
  tabIndex={0}
  role="article"
  className={cn('relative flex flex-col gap-0 transition-all duration-150 cursor-pointer h-full', 'border-l-4', typeBarColor, cardTint, TIER_MIN_HEIGHT[tier])}
  onClick={handleCardClick}   // opens modal; guards against interactive descendants
>
```

**Three card tiers:** `'compact' | 'standard' | 'expanded'`. Tier controls which zones render and min-height.

**Click → modal pattern (in ArtifactCard parent):**
```tsx
onOpenModal?: (item: UnifiedArtifactItem) => void;
// Guard: target.closest('button, a, input, [role="menuitem"],...') → skip
```

### MarketplaceCard (`components/marketplace/MarketplaceCard.tsx`)

**Flip-card** design — front face shows summary, back face shows details (file count, version, status, rating). Flip triggered by a right-edge affordance button. 3D perspective via `[perspective:1200px]` + `[backface-visibility:hidden]`.

```tsx
// Lazy back-face file count — only fetched after first flip:
const treeQuery = useCatalogFileTree(
  hasFlipped && data.fileCount == null ? data.sourceId : null,
  hasFlipped && data.fileCount == null ? data.path : null,
);
```

Data shape (`MarketplaceCardData`):
```ts
{ id, name, title, artifactType, description, tags, sourceLabel, sourceUrl,
  confidence, status, version, updatedAt, rating, downloads, license,
  fileCount, sourceId, path }
```

Adapters: `fromCatalogEntry(ArtifactSearchResult)` and `fromListing(MarketplaceListing)`.

### TemplateCard (`components/templates/template-card.tsx`)

Simpler 3-zone card (`CardHeader` / `CardContent` / `CardFooter`). Has `onPreview` and `onDeploy` callbacks. `hover:scale-[1.02] hover:shadow-md` on the Card. No `@miethe/ui` imports — uses shadcn only.

### BundleCardItem (`components/sharing/bundle-card-item.tsx`)

Compact list-item card. Uses `StatusBadge` from `@miethe/ui/primitives`:

```tsx
import { StatusBadge } from '@miethe/ui/primitives';
<StatusBadge status={bundle.status} aria-label={`Status: ${bundle.status}`} />
```

### DiscoveryCard (`@miethe/ui/discovery`)

Used in marketplace search results grid/list. Receives adapted `AgentDiscoveryCandidate` data (via `artifactSearchToDiscovery` adapter). Key props:

```tsx
import { DiscoveryCard } from '@miethe/ui/discovery';
<DiscoveryCard
  candidate={candidate}
  isSelected={boolean}
  onToggleSelect={() => void}
  onOpenDetail={() => void}
  onImport={() => void}
  onDeploy={() => void}
  className={cn(isListMode && 'min-h-0 flex-row items-center ...')}  // list-mode overrides
/>
```

---

## 3. ContentViewer (FileTree + ContentPane) Usage

### Pattern A — read-only consumer lens (`components/marketplace/ContentsPanel.tsx`)

```tsx
import { FileTree, ContentPane } from '@miethe/ui/content-viewer';
import type { FileNode } from '@miethe/ui';

// Two-pane layout: fixed-width sidebar + flex-1 content pane
<section className="flex h-[calc(90vh-16rem)] min-h-0 gap-4 p-4">
  <div className="w-64 flex-shrink-0 overflow-hidden rounded-lg border">
    <div className="flex-shrink-0 border-b bg-muted/30 px-3 py-2">
      <p className="text-sm font-medium">Files</p>
    </div>
    <ScrollArea className="h-[calc(100%-2.5rem)]">
      <FileTree
        entityId={sourceId}
        files={fileNodes}           // FileNode[] (hierarchical, built from flat API response)
        selectedPath={selectedFile}
        onSelect={handleSelect}
        isLoading={isTreeLoading}
        readOnly                    // consumer lens: no add/delete
        ariaLabel="Marketplace artifact file browser"
      />
    </ScrollArea>
  </div>
  <div className="min-w-0 flex-1 overflow-hidden rounded-lg border">
    <ContentPane
      path={selectedFile}
      content={contentData?.content ?? null}
      isLoading={isContentLoading}
      error={contentError instanceof Error ? contentError.message : null}
      truncationInfo={contentData?.truncated ? { truncated: true, originalSize: contentData.original_size } : undefined}
      readOnly
      ariaLabel="Marketplace file content viewer"
    />
  </div>
</section>
```

**FileNode type:**
```ts
// from @miethe/ui
type FileNode = { name: string; path: string; type: 'file' | 'directory'; size?: number; children?: FileNode[] }
```

**Flat-to-tree conversion:** The API returns GitHub-style `{ type: 'file' | 'tree', path, size? }[]`. A local `buildFileNodes()` function converts to hierarchical `FileNode[]` using a `Map<dirPath, FileNode>`.

### Pattern B — editable full-lifecycle (`components/artifacts/modal/tabs/content-tab.tsx`)

```tsx
import { FileTree, ContentPane } from '@miethe/ui';   // note: root import, not /content-viewer

<FileTree
  entityId={artifact.id}
  files={files}                     // FileListResponse['files'] — already hierarchical from backend
  selectedPath={selectedPath}
  onSelect={handleSelectPath}
  readOnly={!canEdit}
  onAddFile={canEdit ? () => setCreateOpen(true) : undefined}   // shows "New File" button in header
  onDeleteFile={canEdit ? handleDeleteFileRequest : undefined}
  ariaLabel="Artifact file browser"
  iconResolver={iconResolver}       // custom icon resolver from useArtifactIconResolver()
/>

<ContentPane
  path={selectedPath}
  content={contentData?.content ?? null}
  isLoading={isContentLoading}
  error={contentError instanceof Error ? contentError.message : null}
  readOnly={!canEdit}
  isEditing={isEditing}
  editedContent={editedContent}
  onEditStart={handleEditStart}
  onEditChange={handleEditChange}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

**When `readOnly=false` and `onAddFile` provided:** FileTree renders its own header with "New File" button — do NOT add a separate `<p>Files</p>` header.

**When `readOnly=true`:** Add a plain header manually:
```tsx
{!canEdit && (
  <div className="flex-shrink-0 border-b bg-muted/30 px-3 py-2">
    <p className="text-sm font-medium">Files</p>
  </div>
)}
<ScrollArea className={canEdit ? 'h-full' : 'h-[calc(100%-2.5rem)]'}>
```

---

## 4. "Open in Modal" + "Open Full Page" Dual Pattern

### MarketplaceBrowsePage (`components/marketplace/MarketplaceBrowsePage.tsx`)

URL-driven modal state: `?item=<entryId>&tab=<tabId>` search params.

```tsx
// Open modal: push URL param
const openModal = useCallback((entryId: string, tab?: string) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set('item', entryId);
  if (tab) params.set('tab', tab); else params.delete('tab');
  router.replace(`${pathname}?${params.toString()}`);
}, [router, pathname, searchParams]);

// Close modal: clear URL params
const closeModal = useCallback(() => {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('item');
  params.delete('tab');
  router.replace(`${pathname}?${params.toString()}`);
}, [router, pathname, searchParams]);

// Card fires onOpen → push URL
const handleCardOpen = useCallback((data: MarketplaceCardData) => {
  openModal(data.id);
}, [openModal]);

// Render modal — only when entry resolved (avoids flash on deep-link)
<ConsolidatedEntityModal
  item={null}
  catalogEntry={activeEntry}
  initialTab={tabParam}
  open={!!itemParam && !!activeEntry}
  onClose={closeModal}
/>
```

### CatalogModalHeader (inside consolidated-entity-modal.tsx) — "Open full page" link

The catalog-mode header includes an `<ExternalLink>` styled as a subtle link:

```tsx
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

<Link
  href={`/marketplace/items/${entry.id}`}
  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
  onClick={(e) => e.stopPropagation()}
>
  <ExternalLink className="h-3 w-3" aria-hidden="true" />
  Open full page
</Link>
```

The full detail page (`/marketplace/items/[entry_id]`) is `ConsumerItemPage` — uses the **same tab registry + `buildConsumerPanelProps`** as the modal's catalog mode, so both surfaces render identically. The modal is a lightweight preview of the full page.

### ConsumerItemPage (`components/marketplace/ConsumerItemPage.tsx`)

Full page version — same `getTabsForContext({ lens: 'consumer' })` + `buildConsumerPanelProps(entryId, entry)` as modal. Supports both horizontal and vertical sidebar layouts via the same feature flag.

---

## 5. FilterBar Usage

```tsx
import { FilterBar } from '@miethe/ui/filters';
import type { FilterSlotConfig, SortOption } from '@miethe/ui/filters';

<FilterBar
  searchValue={q}
  onSearchChange={setQ}
  searchPlaceholder="Filter..."
  searchAriaLabel="Filter artifacts"
  filterSlots={[
    { id: 'type-filter', label: 'Type', component: <TypeFilterSelect ... /> },
    { id: 'tag-filter', label: 'Tags', component: <TagFilterSelect ... /> },
  ]}
  sort={{
    options: [{ value: 'name', label: 'Name' }, { value: 'confidence', label: 'Confidence' }],
    sortField: activeSortField,
    sortOrder: 'asc' | 'desc',
    onSortChange: (field, order) => ...,
  }}
  className="h-9 flex-nowrap gap-1.5 text-sm"
/>
```

---

## 6. Providers / Context Required

Global in `Providers` (`components/providers.tsx`):
- `QueryClientProvider` (TanStack Query) — required for all data-fetching hooks
- `CollectionProvider` — collection membership data
- `NotificationProvider`
- `DataPrefetcher` — prefetches sources + collections after auth wired

Modal-level:
- `NavigationGuardProvider` — wraps `ConsolidatedEntityModal` to handle unsaved-changes prompts on tab/close navigation

---

## 7. Key Composition Idioms

1. **`e.stopPropagation()` on interactive children of clickable cards** — standard pattern everywhere a card is clickable but contains buttons/links.
2. **`target.closest('button, a, input, [role="menuitem"], [data-radix-popper-content-wrapper]')`** guard in `handleCardClick` to prevent modal open when clicking controls.
3. **`data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none`** — Radix-compatible active-tab underline style (no background highlight).
4. **`React.Suspense` around every lazy tab panel** — `tab-registry.ts` uses `React.lazy()` for each tab component. Each `TabsContent` gets its own boundary with a `TabSkeleton` fallback.
5. **All tab state URL-driven** — `?tab=` param via `router.replace(..., { scroll: false })`. Deep links work, back-nav restores state.
6. **`line-clamp-2`** on description text in cards; `truncate` on long names.
7. **Skeleton components co-located** — every card/modal has a `*Skeleton` export with `animate-pulse` placeholders matching the real layout dimensions.
8. **`VerticalTabNavigation` imperative handle** — `navRef.current?.focusFirstTab()` called on lens change via `requestAnimationFrame` to shift keyboard focus to the first tab after the list remounts.
