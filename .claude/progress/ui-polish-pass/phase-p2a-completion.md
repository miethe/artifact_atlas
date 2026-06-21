# P2a Completion Note — Modal Shell + Tab Registry + URL State + A11y

Feature: ui-polish-pass-v1 / Phase P2a
Agent: ui-engineer-enhanced (Mode C — autonomous sprint, P2a scope)
Date: 2026-06-21

## Modal base decision

**Used `BaseArtifactModal` from `@miethe/ui/primitives`** (confirmed exported in
`dist/primitives/index.d.ts:15`; built on Radix `Dialog`/`DialogContent`). The
Dialog fallback (`web/components/ui/Dialog.tsx`) was NOT needed for the modal
path. `BaseArtifactModal`'s Radix base supplies focus-trap, Escape-to-close
(via `onOpenChange`), `role="dialog"` + `aria-modal` + `aria-labelledby`.

`useFocusTrap` was still implemented (P2A-006) and exported for the full-page
route and as the documented mechanism for any non-`@miethe/ui` consumer / the
Dialog fallback. It is NOT layered on top of BaseArtifactModal (that would
double-trap focus) — using it there would conflict with Radix's own trap.

## Per-task status

| Task | Status | Notes |
|------|--------|-------|
| P2A-001 design note | DONE | `.claude/worknotes/ui-polish-pass/modal-pattern-api.md` — registry interface, URL contract, EntityModal props, full-page route shape. Implemented against it. |
| P2A-002 EntityModal shell | DONE | Wraps `BaseArtifactModal`; tab bar from registry; PanelSlot body; "Open full page" affordance in `headerActions`. |
| P2A-003 TabRegistry + lazy/Suspense | DONE | `TabRegistry.ts` (`createTabRegistry`, order-preserving Record, first-tab fallback, registry-by-type seam). `PanelSlot.tsx` = React.lazy panels behind Suspense skeleton + error boundary (error tile, not blank). |
| P2A-004 URL state | DONE | `useEntityModalUrl.ts` — `?item=&tab=` via `useSearchParams`/`router`. open=push item+tab, close=push w/o item, setTab=replace (1 history entry per open). Back/forward correct; unrelated params preserved. |
| P2A-005 full-page route | DONE | `app/(projects)/projects/[projectId]/detail/[type]/[id]/page.tsx` (server shell) + `FullPageDetail.tsx` (client, same registry, no overlay). "Open full page" preserves `?tab=`. Suspense boundary around useSearchParams. |
| P2A-006 useFocusTrap | DONE | Trap + Escape + focus-restore-to-trigger; re-queries focusables each Tab so lazy panel content is included; container is the fallback focus target. |
| P2A-007 ARIA | DONE | role/aria-modal/aria-labelledby provided by BaseArtifactModal's Radix Dialog + DialogTitle; `aria-label="Open full page"` on the link; close button aria-label comes from the primitive. |

## Files created

- `.claude/worknotes/ui-polish-pass/modal-pattern-api.md` (P2A-001 design note)
- `web/features/ui/index.ts` (feature barrel)
- `web/features/ui/components/EntityModal/index.tsx` (shell)
- `web/features/ui/components/EntityModal/TabRegistry.ts`
- `web/features/ui/components/EntityModal/useFocusTrap.ts`
- `web/features/ui/components/EntityModal/useEntityModalUrl.ts`
- `web/features/ui/components/EntityModal/PanelSlot.tsx`
- `web/app/(projects)/projects/[projectId]/detail/[type]/[id]/page.tsx`
- `web/app/(projects)/projects/[projectId]/detail/[type]/[id]/FullPageDetail.tsx`

## AC coverage

- AC P2A-A (ARIA + focus-trap): EntityModal always renders a valid dialog; when
  `entityId` is falsy it shows a `MetadataUnavailable` placeholder (no crash, no
  empty dialog). ARIA inherited by every surface — no per-surface setup.
- AC P2A-B (bidirectional URL): `?item=&tab=` written on open; removing `item`
  closes; tab change updates `tab`; missing/unknown `tab` → first registered tab;
  back/forward correct.
- AC P2A-C (code-split): all panels via `React.lazy`; Suspense skeleton; lazy
  import failure → error tile via `PanelErrorBoundary` (not blank).

## Self-check (tsc, my files only)

`npx tsc --noEmit` filtered to `features/ui/` + the detail route, excluding
`features/assets/`, react-pdf, pdfjs-dist, lowlight (parallel agent / in-flight
install): **CLEAN** — 0 errors.

One error was found and fixed during the sprint: React 19's `useRef<T>(null)`
yields `RefObject<T | null>`, so `useFocusTrap`'s return type was corrected to
`React.RefObject<T | null>`.

## Deviations / notes for P2b

- Registry-by-type lookup (`registerEntityRegistry` / `getRegistryForType`) is a
  seam only in P2a — surfaces populate it during P2b migration. An unregistered
  type on the full-page route renders a MetadataUnavailable placeholder.
- `EntityModal` is the always-open inner component (open by virtue of being
  mounted); the `?item=` presence check that mounts/unmounts it lives with the
  surface container (or via `useEntityModalUrl().isOpen`) — wired per-surface in
  P2b. This keeps the shell pure and the open/close source-of-truth in the URL.
- Did NOT run `npm install` / `npm run build` (concurrency constraint). Did NOT
  edit package.json, globals.css, tailwind.config.ts, next.config.mjs, or
  anything under features/assets/. No new dependencies. Did NOT git commit or
  edit progress YAML frontmatter.
