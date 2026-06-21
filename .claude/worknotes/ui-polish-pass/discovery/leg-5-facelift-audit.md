---
leg: "5"
title: "Facelift Audit — Artifact Atlas Web UI"
date: 2026-06-20
status: discovery
author: subagent (Mode A — read-only)
sources:
  - web/ codebase (components, features, globals.css, tailwind.config.ts)
  - Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/*.png mockups (15 images read)
  - Artifact_Atlas_PRD_UIUX_Implementation_Spec.md §§7-8
needs_live_verification:
  - Actual font loading (Inter + JetBrains Mono — no font import confirmed)
  - CollaborationFooter connection-status probe (hardcoded 'checking')
  - Dark mode — no @media prefers-color-scheme block in globals.css
  - AssetThumbnail rendering quality at xs/sm sizes
  - Board column scroll containment on narrow viewports
  - RightDrawer focus-trap behavior on keyboard
---

# Leg 5 — Facelift Audit: Artifact Atlas Web UI

## Executive Summary

The implementation is structurally solid and spec-faithful at the layout and token level. The
design system (tokens, spacing scale, shadow scale, keyframes) is well-executed. The gaps that
matter most are **visual hierarchy inside panels** (too flat, too uniform), **sidebar identity**
(no project avatar/name, color branding absent below the brand icon), **page-level headers** (too
thin vs. mockup headers that carry project tags and sync status), **dark-mode absence** (single
light-mode CSS block, no dark token layer), and a cluster of **empty/loading state quality**
deficits. The mockups show richer in-card micro-details (thumbnail quality, provenance ribbons,
draggable BOM slot drop-zones with dotted borders) that are either absent or only partially
scaffolded.

---

## Mockup vs. Implementation Delta — Surface by Surface

### 1. Navigation / Shell

| Aspect | Current state | Target state (mockup) | Gap |
|---|---|---|---|
| Sidebar brand area | Boxes icon + "Artifact Atlas" text, 44px height | Mockup shows project switcher below brand, avatar, colored project pill | No project context in sidebar header; project name only in page header |
| Sidebar nav items | 10 flat items, no grouping, no section dividers | Mockup groups items into logical sections (Projects, Content, Tools) with subtle section labels | Flat list with no visual grouping |
| Active item treatment | `bg-blue-50 text-blue-700` pill | Mockup: left accent bar + subtle fill, slightly more prominent | No left accent bar on active item |
| Sidebar collapse | Works, collapses to 48px icons | Same | Meets spec |
| TopBar | Search + ⌘K hint + Bell + Settings + avatar | Mockup has Filters dropdown, All Types dropdown, collaborator avatars, notification dot | Mockup's TopBar is richer — filter pills and collaborator presence absent |
| TopBar height | 44px (h-11) | Mockup appears ~44–48px | Acceptable |
| Footer status bar | 24px, shows "Connecting…" always (hardcoded) | Mockup shows "You're collaborating with N teammates…" + agent online count | Connection probe not wired; always shows "checking" state |
| Breadcrumbs | Present in PageHeader | Mockup shows "Projects > [name] > [page]" in topbar, not below topbar | Breadcrumbs placed differently than mockup |

### 2. Dashboard / Command Center

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Page header | Generic PageHeader (title + eyebrow) | Mockup has project title, description snippet, tags, sync status, + 3 primary action buttons prominently placed | Mockup header is much richer — project metadata and primary CTA block missing |
| KPI row | 6 MetricCards in `grid-cols-6` at xl | Mockup KPI row has 6 cards with delta indicators and mini sparklines on several | Delta prop exists in MetricCard but never populated from useDashboard |
| Panel grid | 3-col grid, panels using PanelShell | Mockup 3-col matches | Structural match is good |
| Panel headers | "View all →" link in 10px text | Mockup has bolder "View All" buttons and refresh icons per panel | Very small "View all" link is hard to tap/click |
| Active Nodes panel | Fixture data only (3 hardcoded nodes) | Mockup shows rich node rows with status color strip and progress bar | Fixture data; no real IntentTree link yet |
| Agent Activity panel | Plain list with colored dots | Mockup shows richer activity feed with event-type icons and resource thumbnails | Actor dots too subtle; needs per-event icons |
| MeatyWiki sync bar | Renders but shows placeholder integration text | Mockup shows dismissible sync bar with icon, last-sync time, action buttons | Sync bar content is mostly stub |
| Missing Context panel | Present | Mockup: red-bordered "attention" cards with urgency indicator | Missing visual urgency treatment in MissingContextPanel |
| Candidate/Canonical panels | Simple asset name rows | Mockup shows mini thumbnail + status chip in each row | No thumbnail in dashboard panel rows |
| Context Packs panel | Pack list with status | Similar to mockup | Reasonable match |

### 3. Asset Library

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Gallery card | AssetCard with thumbnail, status, sensitivity, tags, footer actions | Mockup: cards are slightly larger, thumbnail spans full card width (not side-by-side), richer source pill with icon | Thumbnail is inline-left (small, ~32px); mockup has full-width thumbnail area at card top |
| Card hover actions | Opacity-0 icons that appear on hover | Mockup same pattern | Matches |
| Filter bar | Text search + multi-select dropdowns | Mockup: more prominent filter chips/pills with icons, "Filters" button + "All Types" dropdown visible in TopBar | FilterBar is tucked below toolbar; mockup exposes key filters at top-level |
| View mode toggle | Gallery + Table (icon-only SegmentedControl) | Mockup shows labeled Gallery/Table/Board/Timeline tabs | Missing labeled view toggle; icon-only is harder to discover |
| Toolbar density | Separate FilterBar row + toolbar row = 2 rows | Mockup shows single integrated toolbar row | Extra row wastes vertical space |
| Sort menu | Dropdown SortMenu | Matches | OK |
| Table view | TanStack Table + Virtual | Matches mockup table closely | Strong implementation |
| Right drawer | RightDrawer opens with AssetDrawerContent | Mockup shows richer inspector: large preview area, tabbed sections (Details / Links / BOM / Policy), collapsible sections | Single-scroll drawer without tabs; preview area small |
| Empty state (gallery) | EmptyState with Inbox icon | Should use folder-specific icon + dotted drop zone | Wrong default icon (Inbox on an asset library) |
| AssetThumbnail | Renders type icon; image loading needs verification | Mockup shows actual rendered thumbnails for images/PDFs | **NEEDS LIVE VERIFICATION** |

### 4. Artifact BOM / Project Dashboard

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| BOM header | Title row with slot count and status | Mockup: "Artifact BOM" title with subtitle, Apply Template + Add Domain Template + More buttons, domain filter bar | Quick actions match; "Add Domain Template" button absent |
| Slot cards | `SlotCard` component, auto-fill grid | Mockup: cards show asset thumbnail when filled, dotted purple border when empty, drag-handle visible | Empty slot dotted purple border missing (currently likely plain border); no drag-handle on slot card |
| Domain tabs | Present | Matches mockup | Good |
| Domain coverage sub-scores | Inline coverage mini-cards | Mockup shows same | Good |
| Right panel (BOM context) | SlotDetailPanel as overlay drawer | Mockup shows persistent right rail with "Quick Actions / Template Sources / Insights / Legend" | Right rail is overlay not persistent; QuickActions not in rail |
| Phase swimlanes | Not implemented | Spec §8.7 mentions "Phase swimlane" as component | Missing — not in current implementation |
| Slot drag-drop from inbox | Not wired (BomMappingView exists but separate) | Mockup shows direct drop onto slot | Drop-onto-slot in BomOverview not implemented |

### 5. Context Pack Builder

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Wizard layout | Vertical drawer/modal with step indicator, header, scrolling body, footer nav | Mockup: wide 2-pane layout — left pane for selections, right pane for live preview/summary | Implemented as single-column; mockup is side-by-side |
| Step indicator | Horizontal bubbles with connector line | Mockup: step list with checkmarks | Close enough; minor style diff |
| Instructions field | Textarea | Mockup has rich instruction area with "Auto-suggest assets" button | Auto-suggest button missing |
| Preview pane | WizardStepReview shows text-only preview | Mockup shows formatted context pack preview with token count estimate visible | Token count display missing in review step |
| Policy controls | Toggles for allow_external_data, allow_code_execution | Mockup shows same + agent access level selector | Close match; agent_access selector present in draft but may not render in WizardStepPolicy |
| Pack metadata sidebar | Not present in builder | Mockup shows Pack Metadata section (Pack Managers, Expiring) in right rail | Missing |
| "Publish to Agent" button | Uses destination string param | Mockup shows prominent "Publish to Agent" CTA with destination selector | Destination selector absent in current WizardStepReview |

### 6. Coverage & Gaps

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Readiness score | ReadinessScore component — shows percentage, slot counts | Mockup: large circular progress ring (72% "Good") with color coding | Current ReadinessScore is likely numeric; mockup shows a dial/ring — **NEEDS LIVE VERIFICATION** |
| Coverage Matrix | CoverageMatrix component | Mockup: domain rows x phase columns grid with colored status cells | Implementation present; alignment with mockup detail TBD |
| Gaps panel | GapsPanel with list | Mockup: gap rows with priority, slot name, domain, action button | Gap list structure implemented; priority colors may differ |
| Recommendations panel | Not visible in current code | Mockup: "Prioritized Recommendations" side panel with numbered actions | GapsPanel exists but dedicated recommendations rail is absent |
| Export button | Present | Matches | OK |
| Critical-only filter | Button toggle | Mockup shows filter chip | Close match |

### 7. Inbox / Triage

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| 3-pane layout | Queue left / Preview center / Classification right | Mockup matches this 3-pane pattern | Layout structure is correct |
| Queue items | InboxQueueItem with status dot, title, thumbnail | Mockup: richer queue rows with agent-suggested classification tag | AI-suggested classification tag not shown in queue row |
| Preview pane | InboxPreviewPane | Mockup: dark background preview with file metadata ribbon at bottom | Preview pane styling likely lacks dark-bg treatment |
| Classification form | InboxClassificationForm | Mockup: rich form with project/topic/node/type/slot/tags grouped in collapsible sections | TBD — form exists but section collapsibility not confirmed |
| Capture bar | InboxCaptureBar | Mockup shows prominent capture actions at top | Present |
| "Apply to selection" bulk bar | InboxBulkActionBar | Matches | OK |

### 8. Board (Feature Board)

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Column header | Color dot + title + count | Mockup: column header with colored top accent bar spanning column width, count badge | No top accent bar per column — just a dot |
| Board toolbar | "Board grouped by status" + selection info | Mockup shows "Group: Feature" dropdown + "Board Settings" button | Group-by selector not implemented (groupBy prop exists but only "status" works) |
| Card in column | DraggableAssetCard | Mockup: cards with full-width image thumbnail area visible | Cards in board may be compact-only; thumbnail area visibility TBD |
| "Add asset" slot at column bottom | Not present | Mockup shows "+ Add card" button at bottom of each column | Missing per-column add action |
| Archived column | Exists in assetMap but not in BOARD_COLUMNS | Mockup shows an "Archived" column optionally | Archived excluded from board columns |

### 9. Empty + Loading + Error States

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| EmptyState icon | Defaults to Inbox icon | Should be surface-specific (e.g., FolderOpen for assets, Package for BOM) | Wrong default icon; callsite override needed for each surface |
| EmptyState drop zones | Plain centered text | Mockup: dotted border drop zone with dashed outline and invite text | No dashed/dotted drop zone variant in EmptyState |
| Loading skeleton | SkeletonCard, SkeletonRow — generic | Works but slots/BOM use SlotCardSkeleton — reasonable | Acceptable |
| BOM empty state | EmptyState with Apply Template CTA | Matches mockup | Good |
| Board error state | EmptyState | Basic | Acceptable |
| API error banner | Simple red div in ContextPackBuilder | No standardized error banner component | Should be a reusable AlertBanner component |

### 10. Typography

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Font loading | `font-family: "Inter"` in body CSS; no `<link>` or `next/font` import in layout.tsx | Inter must be loaded via next/font/google or CDN | **CRITICAL — font may silently fall back to system-ui on first load** |
| JetBrains Mono | Declared in tailwind.config.ts fontFamily.mono | Same — no import confirmed | Mono font may silently fall back |
| Type scale | 2xs(11px) to 3xl(28px) — well-defined | Spec: "clean sans-serif, high density but readable" | Scale is correct; density is good |
| Panel heading size | `text-xs font-semibold` (12px) — very small | Mockup panel headers feel slightly larger (13–14px) | Panel titles may read too small at 12px |
| Page h1 | `text-lg font-semibold` (16px) | Mockup page titles appear ~18–20px | h1 undersized vs. mockup |

### 11. Spacing / Density

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Content padding | `p-4` (16px) on CommandCenterView, `p-5` (20px) on BomOverview | Mockup: consistent 20–24px outer padding | Minor inconsistency (16 vs 20px) |
| Panel gap | `gap-4` (16px) in dashboard grid | Mockup: 16px gap | Matches |
| Card inner padding | MetricCard uses `p-4`; PanelShell header `px-3 py-2` | Mockup: same density | Reasonable match |
| TopBar + sidebar header height | Both 44px (h-11) | Mockup: appears 44–48px | Acceptable |

### 12. Color / Tokens / Dark Mode

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Dark mode | No dark mode token layer in globals.css; `color-scheme: light` only | Spec does not explicitly require dark mode for MVP, but mockup environment appears to be light-only too | No dark mode — acceptable for MVP but should be documented |
| Agent/AI accent (purple) | Defined in tokens and tailwind; used in AgentActivityPanel dots and pack badges | Mockup: purple more prominent for AI surfaces | Usage is present but not consistently applied to all AI-generated labels |
| Status badge rendering | CSS var–based status badge colors | Matches mockup status pill colors | Good match |
| Sensitivity badge | Similar | Good | OK |
| Selection highlight | `bg-blue-50 ring-1 ring-blue-400` on AssetCard | Mockup: same pattern | Matches |
| Cover/progress bars | `bg-green-500 / bg-amber-500 / bg-red-500` | Mockup uses same color ramp | Matches |
| BOM empty slot | Likely default border styling | Mockup: `border-dashed border-purple-300 bg-purple-50` for empty slots | Missing dotted purple empty-slot treatment |

### 13. Responsiveness

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Shell | Desktop-first flex layout; no mobile breakpoints in AppShell | Spec: "desktop-first" | Acceptable per spec |
| Dashboard grid | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` | Matches spec guidance | Good |
| Asset gallery | Responsive grid with drawer column reduction | Good | Good |
| Sidebar on mobile | Collapses to icons only; no overlay/hamburger for mobile | Spec says desktop-first; mobile not required for MVP | Acceptable |
| Board | Horizontal scroll on narrow viewport | Matches expected behavior | OK |

### 14. Motion / Animation

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Page transitions | None (Next.js hard navigations) | Mockup appears to use instant transitions | Acceptable — no page transition animations needed |
| Panel open/close | `animate-slide-in-right` on right rail, RightDrawer | Mockup shows smooth slide-in | Good |
| Drag overlay | DragOverlay from dnd-kit; no custom animation | Standard dnd-kit ghost | Acceptable |
| Skeleton animation | `animate-pulse` | Matches mockup skeleton behavior | Good |
| Button loading spinner | `animate-spin` SVG | Standard | Good |
| `animate-pulse-subtle` | Defined in keyframes but usage unclear | Could be used for live sync indicator, agent activity dot | Underutilized |
| reduce-motion | No `@media (prefers-reduced-motion)` block | Should suppress all animations | Missing a11y motion preference handling |

### 15. Accessibility

| Aspect | Current state | Target state | Gap |
|---|---|---|---|
| Focus ring | `:focus-visible` set globally with `--focus-ring` double-ring | Matches WCAG 2.1 AA | Good |
| ARIA roles | Most interactive elements have explicit roles | Generally good | Good |
| `aria-current="page"` | Set on active nav link | Correct | Good |
| Color-only meaning | Status badges always pair color + text label | Spec requirement met | Good |
| AssetCard ARIA | `role="option" aria-selected` — but parent is `role="listbox"` | Matches ARIA spec for listbox/option pattern | Correct |
| Table sort headers | `aria-sort` set in AssetTable | Correct | Good |
| Modal focus trap | RightDrawer has focus-trap prop placeholder | **NEEDS LIVE VERIFICATION** — focus-trap wiring not confirmed in read-only audit | Live check needed |
| Keyboard shortcuts | Global Cmd+K, `/` search, Shift+M on board | Spec shortcuts partially implemented; A/B/I/C/T/L/M/G shortcuts from spec §7.4 missing | Missing 8 of 10 spec shortcuts |
| `prefers-reduced-motion` | Absent | Should suppress animate-pulse, slide-in-right, etc. | Missing |
| Color contrast | Ink (#111827) on white surface — passes 4.5:1 | Ink-muted (#5c6370) on white = ~4.8:1 — passes | Ink-faint (#9ca3af) on white = ~2.9:1 — FAILS AA for body text | **ink-faint used as body text in some sublabels** |

---

## Prioritized Facelift Backlog

### P0 — Critical / Correctness (fix first)

| # | Surface | Current | Target | Impact | Effort |
|---|---|---|---|---|---|
| P0-1 | Typography | Inter font not loaded via `next/font` or CDN `<link>`; CSS `font-family` only | Add `next/font/google` import for Inter + JetBrains Mono in `app/layout.tsx` | HIGH — brand font silently falls back | S |
| P0-2 | Accessibility | `ink-faint` (#9ca3af) used as text in sublabels, panel "View all" links, slot descriptions — contrast ratio ~2.9:1 | Bump `ink-faint` to ≥ #6b7280 for text contexts, or switch those text uses to `ink-muted` | HIGH — WCAG 2.1 AA fail | S |
| P0-3 | Motion / A11y | No `@media (prefers-reduced-motion)` block | Add `@media (prefers-reduced-motion: reduce)` that disables `animate-pulse`, `animate-spin`, `animate-slide-in-right`, `animate-fade-in` | HIGH — a11y compliance | S |
| P0-4 | Shell footer | `apiStatus` always "checking" — no probe wired | Wire a lightweight `fetch("/api/health")` or `HEAD /` probe in CollaborationFooter with interval refetch | MED — UX confusion | M |

### P1 — High Visual Impact / Spec Gaps (facelift core)

| # | Surface | Current | Target | Impact | Effort |
|---|---|---|---|---|---|
| P1-1 | Asset Library — card layout | Thumbnail is small inline-left (32px); card body below | Full-width thumbnail area at card top (~96px tall), title + badges below — match mockup | HIGH | M |
| P1-2 | Sidebar | Flat 10-item list, no section grouping | Add section labels ("Project", "Content", "Tools") + left accent bar on active item | HIGH | S |
| P1-3 | Dashboard — PageHeader | Plain title + eyebrow only | Add project tag chips, last-sync timestamp, and primary CTAs ("Add Asset", "Create Context Pack") to PageHeader on command center route | HIGH | M |
| P1-4 | BOM — empty slot visual | Plain border, no dotted treatment | `border-dashed border-purple-300 bg-purple-50` for empty/missing BOM slots in SlotCard | HIGH | S |
| P1-5 | Dashboard panels — row thumbnails | Panel item rows (RecentAssets, Candidates, Canonical) show text only | Add 24×24 AssetThumbnail to each item row in dashboard panels | MED-HIGH | S |
| P1-6 | Dashboard — KPI delta indicators | MetricCard.delta prop never populated | Wire delta values from DashboardStats into KPIRow MetricCards | MED | S |
| P1-7 | Coverage — Readiness score | Unknown rendering — **needs live check** | Confirm/add circular progress ring (dial) matching mockup 72% "Good" display | HIGH | M |
| P1-8 | Board — column top accent | No column-top color bar | Add 3px top accent bar matching column's `color` prop to BoardColumn header | MED | S |
| P1-9 | Context Pack Builder — layout | Single-column wizard | Add persistent right-pane draft summary / preview panel beside wizard steps on wider viewports | HIGH | L |
| P1-10 | EmptyState — surface-specific icons | Defaults to `<Inbox>` everywhere | Pass correct surface icon at each callsite (FolderOpen for assets, Package for BOM, Layers for context packs) | MED | S |

### P2 — Medium Polish (second pass)

| # | Surface | Current | Target | Impact | Effort |
|---|---|---|---|---|---|
| P2-1 | Agent activity panel | Plain actor dots (2px circles) | Per-event-type Lucide icon (e.g., `<FileCheck>` for asset_promoted, `<Zap>` for agent_query) | MED | S |
| P2-2 | Asset Library — filter bar consolidation | Two separate rows (FilterBar + toolbar) | Merge into single sticky toolbar row with left filters + right sort/view/add | MED | M |
| P2-3 | Asset Library — view mode toggle | Icon-only SegmentedControl (no labels) | Labeled options ("Gallery", "Table", "Board") or at minimum tooltip + aria-label clarity | MED | S |
| P2-4 | Board — per-column add button | Missing | Add `+ Add asset` ghost button at each column bottom | MED | S |
| P2-5 | RightDrawer / AssetDetail | Single scroll, no tabs | Add tab bar (Details / Links / BOM / Policy) to AssetDrawerContent | MED | M |
| P2-6 | Context Pack — token count | Missing in review step | Surface `preview.token_estimate` or compute from items in WizardStepReview | MED | S |
| P2-7 | Inbox — queue row classification tag | Missing AI-suggested tag in queue item | Add `suggested_type` chip to InboxQueueItem row | MED | S |
| P2-8 | BOM — phase swimlanes | Not implemented | Add horizontal "phase" swimlane grouping toggle to BomOverview domain view | MED | L |
| P2-9 | Sidebar — project switcher | No project context in sidebar | Add collapsible project pill or avatar below brand mark showing current project name | MED | M |
| P2-10 | MissingContextPanel | No urgency visual | Add red left border or "NEEDS ATTENTION" badge to high-priority missing context items | MED | S |
| P2-11 | PageHeader h1 | `text-lg` (16px) | Increase to `text-xl` (18px) to match mockup heading size | LOW-MED | S |
| P2-12 | Panel "View all" link | `text-[10px]` — very small click target | Increase to `text-xs` + add padding for 28px min tap target | MED | S |
| P2-13 | Global keyboard shortcuts | Only Cmd+K + `/` + Shift+M wired | Implement A/I/B/C shortcuts from spec §7.4 via global keydown handler | MED | M |

### P3 — Low / Nice-to-Have

| # | Surface | Current | Target | Impact | Effort |
|---|---|---|---|---|---|
| P3-1 | Dark mode | Not present | Add `@media (prefers-color-scheme: dark)` token layer (surface → #1a1d23, ink → #e5e7eb, etc.) | LOW for MVP | L |
| P3-2 | TopBar — collaborator avatars | Single user avatar | Show presence facepile (3 max) when multiple sessions are active | LOW | M |
| P3-3 | Context Pack Builder — publish destination | String param only | Add radio/select for destination (local, MeatyWiki, Agent, MCP) in review step | LOW-MED | S |
| P3-4 | Asset card — provenance ribbon | Not present | Add thin colored left border on card indicating source kind (purple=AI, blue=cloud, gray=local) | LOW | S |
| P3-5 | Board — Group By selector | Stub (prop exists, only status works) | Implement "Group by: Feature / Domain" in BoardColumn layout | LOW | L |
| P3-6 | Animation — `pulse-subtle` usage | Defined but unused | Apply to live agent activity dot in footer and agent panel when agent is actively querying | LOW | S |
| P3-7 | BOM — slot drag from BomOverview | Not wired | Allow dropping InboxItem onto slot card in BomOverview (currently only in BomMappingView) | LOW | L |
| P3-8 | Coverage — Recommendations rail | Absent | Add "Prioritized Recommendations" sidebar matching mockup right column | LOW | M |

---

## Items Requiring Live Verification

1. **Font rendering**: Is Inter actually loading, or silently falling back? Check Network tab for Inter woff2 requests.
2. **AssetThumbnail quality**: Does it render real image previews at xs/sm, or just type icons for all assets?
3. **RightDrawer focus-trap**: Is focus actually trapped within the drawer on open? Tab through to verify.
4. **ReadinessScore component**: Does it render a circular dial/ring or a numeric text? Read `/features/coverage/components/ReadinessScore.tsx` for confirmation.
5. **CollaborationFooter**: Does the "checking" state ever resolve in a live app with the backend running?
6. **Board column scroll**: On a 1280px viewport with 6 columns, does horizontal overflow produce a scroll without clipping cards?
7. **BOM SlotCard**: Does the empty slot currently render a dashed border or solid border?

---

## Token/Component Debt Summary

| Component | Debt |
|---|---|
| `EmptyState` | Missing drop-zone variant; wrong default icon |
| `MetricCard` | Delta never wired from hooks |
| `PanelShell` | "View all" link too small for click target |
| `AssetCard` | Thumbnail too small for gallery use |
| `BoardColumn` | Missing top accent bar and per-column add button |
| `SlotCard` | Missing empty slot dotted-purple treatment |
| `CollaborationFooter` | Connection probe not wired |
| `PageHeader` | Needs project metadata slot for command center |
| `ContextPackBuilder` | Single-column layout vs. 2-pane mockup |
| `app/layout.tsx` | Missing `next/font` import for Inter + JetBrains Mono |
| `globals.css` | Missing `prefers-reduced-motion` block; ink-faint contrast issue |
