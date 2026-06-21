# Modal Pattern API — Canonical Detail Surface (P2A-001)

Status: design note (implemented by P2A-002..P2A-007)
Owner: ui-engineer-enhanced
Feature: ui-polish-pass-v1 / Phase P2a
ADR ref: ADR-2 (tabbed modal + full-page route, URL-driven)

> This is the ONE pattern all five AA detail surfaces (Assets, BOM, Coverage,
> Templates, Inbox) will adopt. The API below is the contract; surfaces only
> supply a tab registry + entity data, never their own modal chrome, focus
> trap, ARIA, or URL wiring.

---

## 1. Tab registry TypeScript interface

A registry is a plain `Record<tabKey, TabDefinition>`. Insertion order is
significant — the **first** registered tab is the fallback when `?tab=` is
missing or unknown.

```ts
import * as React from "react";

/** Props every lazy tab panel receives from EntityModal / full-page route. */
export interface TabPanelProps {
  entityType: string;
  entityId: string;
  projectId: string;
}

export interface TabDefinition {
  /** Human label shown in the tab bar. */
  label: string;
  /** Optional Lucide-style icon component (className-only props). */
  icon?: React.ComponentType<{ className?: string }>;
  /** Code-split panel, created via React.lazy(() => import(...)). */
  Panel: React.LazyExoticComponent<React.ComponentType<TabPanelProps>>;
}

export type TabRegistry = Record<string, TabDefinition>;
```

`createTabRegistry(entries)` is an identity/typing helper that preserves key
order and gives call sites inference + validation (rejects an empty registry).

```ts
export function createTabRegistry(entries: TabRegistry): TabRegistry;
```

Why a `Record` (not an array): surfaces address tabs by stable key in the URL
(`?tab=overview`), and `Object.keys()` preserves insertion order for string
keys in JS — so order-as-fallback is well defined without an extra `order`
field.

---

## 2. URL state contract (`?item=<id>&tab=<key>`)

Single source of truth = the URL search params. No internal open/closed state.

| Param  | Meaning                                              |
|--------|-----------------------------------------------------|
| `item` | Entity id. Present ⇒ modal open. Absent ⇒ modal closed. |
| `tab`  | Active tab key. Optional.                            |

Rules:

- **Open**: `router.push("?item=<id>&tab=<firstTabKey>")`. Opening always
  writes an explicit `tab` so refresh/share is deterministic.
- **Close**: remove the `item` param (keep unrelated params). Modal unmounts.
- **Tab change**: rewrite `tab` only. Use `router.replace` for tab switches so
  back/forward steps over item open/close, not every intra-modal tab click
  (one history entry per open). Open/close use `router.push`.
- **Fallback**: if `tab` is missing OR refers to a key not in the registry,
  fall back to the first registered tab. Never crash, never blank.
- **Back/forward**: because state derives from `useSearchParams`, browser
  navigation re-renders correctly — removing `item` via Back closes the modal,
  re-adding it re-opens at the previously active tab.
- **Other params preserved**: building the next URL starts from the current
  `searchParams`, mutating only `item`/`tab`. Library filters etc. survive.

The full-page route encodes `item`/`type`/`projectId` in the path, so only
`?tab=` is carried as a query param there (see §4).

---

## 3. `EntityModal` props interface

```ts
export interface EntityModalProps {
  /** Entity type key (e.g. "asset", "bom-slot"); drives full-page route + icon. */
  entityType: string;
  /** Entity id. When undefined/empty the modal renders the unavailable placeholder. */
  entityId?: string;
  /** Project id for the full-page route + panel props. */
  projectId: string;
  /** Surface-specific registry of tabs. */
  tabRegistry: TabRegistry;
  /** Called when the modal requests close (Escape, backdrop, close button, item removed). */
  onClose: () => void;
  /** Optional title; falls back to a humanized entityType + id. */
  title?: string;
  /** Optional description under the title. */
  description?: string;
  /** Optional artifact-type icon/color resolver passed through to BaseArtifactModal. */
  getTypeConfig?: (type: string) => { icon?: string; color?: string } | undefined;
}
```

Resilience (AC P2A-A): when `entityId` is falsy the shell still renders a valid
`role="dialog"` with the title and a `MetadataUnavailable` placeholder body —
it does not crash or render an empty dialog, and it does not mount any panel.

Code-split (AC P2A-C): the active panel is the registry's `Panel`
(`React.lazy`). It is wrapped in `Suspense` (skeleton fallback) and a small
error boundary that renders an error tile if the chunk import rejects.

---

## 4. Generic full-page route shape

One generic route, not N entity-specific routes (OQ-3 resolved → generic):

```
web/app/(projects)/projects/[projectId]/detail/[type]/[id]/page.tsx
  path params: { projectId, type, id }
  query param:  ?tab=<key>   (optional; same fallback rule as §2)
```

- Renders the **same** tab registry (resolved by `type`) in a full-page layout
  (PageHeader + tab bar + panel), with **no** modal overlay / focus trap.
- The EntityModal "Open full page" affordance links to
  `/projects/${projectId}/detail/${entityType}/${entityId}?tab=${activeTab}`,
  preserving the active tab.
- Registry resolution: a `getRegistryForType(type)` lookup (surfaces register
  their registries by `entityType`). In P2a the route ships the lookup seam;
  surfaces populate it during P2b migration. Unknown type → MetadataUnavailable
  placeholder (no crash).

---

## 5. Component / file map

| File | Role |
|------|------|
| `features/ui/components/EntityModal/TabRegistry.ts` | Types + `createTabRegistry` + registry-by-type lookup seam |
| `features/ui/components/EntityModal/useFocusTrap.ts` | Focus trap, Escape, focus-restore (reuses Dialog pattern) |
| `features/ui/components/EntityModal/index.tsx` | Modal shell: BaseArtifactModal-or-Dialog, tabs, URL state, ARIA, Open-full-page |
| `app/(projects)/projects/[projectId]/detail/[type]/[id]/page.tsx` | Generic full-page detail route (no overlay) |

Decision — modal base: **wrap `BaseArtifactModal` from `@miethe/ui/primitives`**
(confirmed exported; built on Radix Dialog so it brings its own focus trap +
ARIA). We still ship `useFocusTrap` + explicit ARIA because (a) the full-page
route and any future non-`@miethe/ui` consumer need the same focus semantics,
and (b) it guarantees focus-restore-to-trigger, which the Radix default does
not always preserve across our wrapper. The AA `components/ui/Dialog.tsx`
primitive is the documented fallback if the `@miethe/ui` flag is off.
