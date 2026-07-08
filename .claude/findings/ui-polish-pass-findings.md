---
schema_version: 2
doc_type: report
report_category: findings
title: "In-Flight Findings: UI Polish Pass"
status: in_progress
created: '2026-06-21'
updated: '2026-07-08'
feature_slug: ui-polish-pass
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
---

# In-Flight Findings — UI Polish Pass

Discoveries made during execution that were not anticipated in the plan/spike.

## F-001 — `.gitignore` `coverage/` rule silently ignored the entire Coverage feature dir

**Severity:** High (latent data-loss / fresh-clone breakage)
**Discovered:** P2b (Wave 3), 2026-06-21
**Phase:** P2B-003 (CoverageView → EntityModal migration)

### Symptom
While migrating CoverageView onto EntityModal, the new EntityModal tab panels under
`web/features/coverage/components/EntityModal/` did not appear in `git status`, yet
`tsc` compiled them. `git check-ignore -v` revealed `.gitignore:12 coverage/` was
matching the path.

### Root cause
`.gitignore` line 12 was a bare `coverage/`, intended to ignore test-coverage report
output (vitest/pytest). A bare directory pattern with no leading slash matches a
directory of that name **at any depth** — so it also matched `web/features/coverage/`,
the Coverage *feature* directory.

### Impact
`git ls-files web/features/coverage/` returned **0 tracked files** — the entire
Coverage feature (including the pre-existing `CoverageView.tsx`) had **never been
committed**. It worked in local dev only because the files exist on disk. A fresh
clone would be missing the Coverage feature entirely.

### Fix
Scoped the rule in `.gitignore` from `coverage/` to anchored paths that match only
real coverage-report output:
```
/coverage/
/web/coverage/
```
Then added the full `web/features/coverage/` feature tree to git as part of the P2b
commit (this is the first time the feature is tracked).

### Follow-up
- Confirm no other feature dir collides with a bare gitignore pattern.
- The Coverage feature being newly-tracked means its first commit carries pre-existing
  (non-P2b) code; this is expected and called out in the P2b commit message.
- **Second exposed dir:** scoping the rule also revealed the Next.js *route*
  `web/app/(projects)/projects/[projectId]/coverage/page.tsx` (pre-existing, Jun-20)
  was likewise ignored and never committed — a fresh clone would 404 the coverage route
  and fail `next build`. Tracked in the P3 commit. Swept for further `coverage` dirs:
  none remain ignored.

## F-002 — Flags-ON live verification not yet run (RESOLVED 2026-07-08)

**Severity:** Medium (verification gap, not a code defect)
**Raised by:** P6-019 (task-completion-validator) + P6-020 (karen) final gates.
**Resolved by:** Wave 2 close-out session (P6-003/005/007/009).

### Detail
The session's gates are strong but flags-OFF for the runtime path: `tsc` 0, `next build`
exit 0 (15 routes), vitest 75/75, **Playwright e2e 7/7 (fixture-fallback = legacy flags-OFF
paths)**, api pytest 571, static a11y-sheriff APPROVED, per-phase validators APPROVED, and a
senior-code-reviewer security pass on the P4c backend. NOT yet run:
- **P6-003** live axe-core sweep with `ui-tabbed-modal=true` over the 5 EntityModal surfaces
  + AssetViewer for all 6 formats.
- **P6-009** Playwright specs for the flags-ON paths: modal open/close/tab/Escape+focus-return,
  `?item=&tab=` deep-link, AssetViewer per-format, agent_access gate.

### Resolution (2026-07-08)
Added `web/e2e/flags-on/` — a second Playwright project built with `NEXT_PUBLIC_FLAGS`
pinned explicitly (`miethe-ui-ds,ui-tabbed-modal,dark-mode`) via a separate `next build`
output dir (`NEXT_DIST_DIR=.next-flags-on`, `web/next.config.mjs`), alongside the
existing legacy project (`web/playwright.config.ts`).

**Evidence — both projects green, 43/43 passing, run twice for stability:**
- `web/e2e/happy-path.spec.ts` (legacy, 7 tests) — 2 assertions updated to match
  current default behavior (ADR-8 already flipped `ui-tabbed-modal` default-on, so
  clicking a card now opens EntityModal, not the old RightDrawer the test originally
  asserted; a `role="radio"` name regex was stale — `"Table"` not `"Table view"`).
- `web/e2e/flags-on/entity-modal.spec.ts` (15 tests) — open/close/tab, Escape+focus-
  return, `?item=&tab=` deep-link restore × 5 surfaces (assets/inbox/coverage/
  templates/bom).
- `web/e2e/flags-on/asset-viewer-formats.spec.ts` (10 tests) — 9-format smoke +
  agent_access gate (see F-004 for scope of what "smoke" means here).
- `web/e2e/flags-on/axe-sweep.spec.ts` (8 tests, light) + `axe-dark-mode.spec.ts`
  (2 tests, dark, DM-5) — see F-005 for the violations found and how the gate
  handles them (KNOWN_VIOLATION_IDS allowlist, not a silent skip).

**Two real, unambiguous app-code bugs found and fixed by this live sweep** (not
mocked/worked-around in tests):
1. `EntityModal` never returned keyboard focus to the triggering element on close.
   Root cause: `BaseArtifactModal` (`@miethe/ui`) wraps Radix `Dialog` without a
   `Dialog.Trigger`; Radix's *default* `onCloseAutoFocus` always calls
   `event.preventDefault()` and focuses `context.triggerRef.current` — always `null`
   here — so focus silently dropped to `<body>` on every close. Fixed in
   `web/features/ui/components/EntityModal/index.tsx`: capture
   `document.activeElement` on initial render (before Radix's FocusScope moves focus
   into the dialog) and restore it in the component's unmount cleanup (which runs
   after Radix's own no-op attempt).
2. `ZoneCard.isInteractiveTarget()` (`web/features/ui/components/Card/ZoneCard.tsx`)
   included `[role=option]` in its "is this an interactive descendant" selector — but
   `AssetCard`/`TemplateCard` are *themselves* `role="option"`, so `.closest()` always
   matched the card's own root, making every mouse click look like "clicked an
   interactive child" and silently blocking `onOpen`. **Click-to-open via mouse was
   completely broken for Assets and Templates** (keyboard Enter/Space still worked,
   masking it). Fixed by ignoring a match that equals `e.currentTarget`.

Both fixes are narrow, isolated to one shared component each, and were re-verified
green after the fix (all 43 flags-on/legacy specs, `tsc --noEmit`, vitest 86/86).

### Disposition
**RESOLVED.** Flags-ON live verification (P6-003, P6-009) now runs as a permanent
Playwright project, catching real regressions in this exact composed, flags-ON DOM
going forward — not just a one-time check before cutover.

## F-003 — Disclosed in-panel deferrals (backlog, not stubs)

**Severity:** Low (honest scope limit).
Two EntityModal sub-panels render real content with disclosed placeholders, confirmed as
intentional backlog items (not silent stubs):
- `BomSlotAssignmentsTabPanel` — assignment-table editing deferred to a future BOM epic.
- `AssetLinksTabPanel` — graph sub-section deferred to the P5 Graph Explorer.
Both should remain tracked in `docs/mvp-backlog.md`.

## F-004 — AssetViewer `mode="full"` has no live mount point anywhere in the app

**Severity:** Medium (feature gap / dead code risk, discovered closing F-002).
**Discovered:** 2026-07-08, building the P6-009 AssetViewer per-format Playwright specs.

### Detail
`AssetViewer` (`web/features/assets/components/AssetViewer/index.tsx`) supports two
render modes, `"thumbnail"` and `"full"`, and every per-format renderer (Pdf/Docx/
Pptx/Csv/Audio/Video/Content/Image) is implemented and unit-tested for both. But a
repo-wide search shows `AssetViewer` is only ever imported by
`web/features/assets/components/AssetCard.tsx`, and only ever mounted with
`mode="thumbnail"`. The EntityModal "Preview" tab
(`AssetPreviewTabPanel.tsx`) uses a *different*, simpler component
(`AssetPreview.tsx` — icon/type-badge only, with a literal comment "Content would be
loaded via data fetching in a real implementation") — not `AssetViewer`. No other
panel, route, or full-page surface renders `AssetViewer` in `"full"` mode.

### Impact
- Real per-format preview content (an actual rendered PDF page, a parsed DOCX
  document, native audio/video playback, a converted PPTX) is **not reachable by any
  user today** — the six renderer components exist, compile, and pass their vitest
  unit tests, but are effectively dead code from the product's perspective.
- Thumbnail mode partially compensates: image/csv/tsv/markdown-code *do* fetch and
  render real content even in `"thumbnail"` (only the pixel dimensions differ from
  `"full"`), but docx/pptx/audio/video intentionally render an icon-only tile in
  thumbnail mode (perf: no network fetch per grid card) — so those four formats have
  **zero live, in-browser exercise** of their actual rendering logic; only jsdom-based
  vitest coverage exists for them.
- This also means P6-007's original AC ("AssetViewer all 6 formats" runtime smoke)
  could never have been satisfied as literally written, flags on or off — the surface
  it names doesn't exist in the product yet.

### Disposition
Documented, not fixed, in this sprint — wiring `AssetViewer` `mode="full"` into a
real panel (e.g. replacing `AssetPreviewTabPanel`'s use of `AssetPreview`, or adding
a dedicated "Content" sub-tab) is a product decision + implementation task, not an
"unambiguous a11y fix." **Recommended follow-up:** a small Tier 1 feature contract to
wire `AssetViewer` `mode="full"` into the asset EntityModal's Preview tab (and/or the
full-page detail route), after which this same flags-on Playwright suite should be
extended to cover the full-mode rendering paths for docx/pptx/audio/video live.

## F-005 — Live P6-003 axe sweep surfaced 6 pre-existing serious/critical rule categories

**Severity:** Mixed (1 critical class affects the shared EntityModal shell across all
5 surfaces; the rest are contained to specific components). None are regressions from
this session — all predate it; the live, composed, flags-ON sweep is what first
caught them (the static a11y-sheriff pass and vitest a11y suite test components in
isolation and evidently didn't hit these particular compositions).
**Discovered:** 2026-07-08, `web/e2e/flags-on/axe-sweep.spec.ts` +
`axe-dark-mode.spec.ts`.

### Detail
Six distinct axe-core rule IDs, all "serious" or "critical" impact, found across the
dashboard / asset gallery (light + dark) / all 5 EntityModal surfaces / the
AssetViewer format sweep:

1. **`aria-valid-attr-value` (critical)** — every EntityModal surface. The active
   tab's `<button role="tab">` sets `aria-controls="radix-..._-content-{tab}"`, but
   no element with that id ever renders: `BaseArtifactModal` (`@miethe/ui`) composes
   Radix `Tabs` by splicing `PanelSlot`'s output directly as `<Tabs>` children instead
   of wrapping it in Radix's `<Tabs.Content id=...>` primitive. Root cause is in the
   `@miethe/ui` package (upstream, not this repo) — per this project's
   artifact-upstream convention, fix belongs there, not as a local patch.
2. **`aria-allowed-attr` + `aria-required-children` (critical)** — Asset library table
   view. `AssetTable`'s custom virtualized grid gives sortable column-header `<div>`s
   `role="button"` *and* `aria-sort="none"` (a11y spec: `aria-sort` is only valid on
   `role="columnheader"`), and the `role="grid"` container's direct children aren't
   `row`/`rowgroup`. Needs an ARIA-structure rework of `AssetTable`'s header rendering
   — out of scope for a verification sprint; needs its own contract.
3. **`nested-interactive` + `no-focusable-content` (serious)** — Asset gallery,
   Template gallery, AssetViewer format sweep. `AssetCard`/`TemplateCard` are
   themselves `role="option"` + `tabIndex={0}` (the whole card is one interactive
   control) *and* nest real `<button>` quick-actions (Select/Open/Copy/Add-to-pack)
   inside — a recognized ARIA anti-pattern (nested interactive controls aren't
   reliably announced by screen readers). Needs a redesign of how per-card quick
   actions are exposed (e.g. move the actions outside the `option` element, or split
   the gallery into a listbox + a separate toolbar/menu pattern) — a design decision,
   not a one-line fix.
4. **`color-contrast` (serious)** — present almost everywhere, worst in dark mode.
   Light-mode instances found: the sidebar "Collapse" label (~2.53:1, needs 4.5:1),
   the `--ink-faint` token against sunken backgrounds (~4.35:1, just under 4.5:1), and
   a green trend-indicator color (~3.29:1). Dark mode surfaced far more (52 nodes on
   the dashboard alone) — this reinforces, but doesn't newly discover, the
   **already-tracked DEFER-1 "dark-mode-aa"** backlog item in `docs/mvp-backlog.md`;
   this sweep's job was to confirm the `dark-mode` flag doesn't crash/regress
   anything else, not to close DEFER-1.
5. **`doc-has-title` (serious, intermittent)** — observed a handful of times across
   many runs, always right after a client-side route/URL-state transition (e.g. the
   EntityModal's open click also does a `router.push` for `?item=`). Manually
   confirmed via `page.title()` moments later that the title *is* correctly set — this
   reads as axe occasionally scanning mid-transition, not a persistent page defect.
   Mitigated (not just documented): `runAxe()` in `web/e2e/flags-on/helpers.ts` now
   waits for a non-empty `document.title` before scanning.

### Disposition
Not fixed in this sprint (categories 1–4 require a design decision, an upstream
`@miethe/ui` change, or a nontrivial ARIA-structure rework of a virtualized grid —
none are "unambiguous" one-line patches). Encoded as a reviewed, documented allowlist
(`KNOWN_VIOLATION_IDS` in `web/e2e/flags-on/helpers.ts`, cross-referencing this
finding) so the Playwright axe gate still fails on any **new** serious/critical
violation (a true regression) while these six stay visible in test output (logged
every run, not silently swallowed) until each gets its own fix contract.
**Recommended follow-up:** four separate, appropriately-scoped tickets — (a) upstream
`@miethe/ui` `BaseArtifactModal` Tabs.Content fix, (b) `AssetTable` ARIA-structure
rework, (c) card quick-actions redesign (AssetCard/TemplateCard), (d) design-token
contrast pass (folds into the existing DEFER-1 dark-mode-aa spec, extended to cover
the light-mode instances found here too).

## F-006 — Inbox flag-on layout: preview/classification panes never render

### Detail

Found during the 2026-07-08 visual-fidelity pass. With `ui-tabbed-modal` on (the shipped
default since ADR-8), `InboxTriage.tsx` gates its center-preview and right-classification
panes behind `{!useEntityModalFlag && …}`, so the flag-on Inbox page shows the queue next
to a large empty gray region. Pre-existing from the P2b modal-migration wave (`423eb27`),
not introduced by the 2026-07-08 autopilot wave.

### Impact

Cosmetic/layout — triage still works via the EntityModal, but the page wastes ~60% of its
width and looks unfinished at desktop sizes.

### Disposition

Open. Follow-up: either collapse the layout to full-width queue when the flag is on, or
render a lightweight summary/empty-state in the vacated panes. Small (S) frontend item;
candidate for the next polish sprint alongside F-004.
