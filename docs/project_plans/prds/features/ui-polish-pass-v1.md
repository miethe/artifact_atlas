---
schema_version: 2
doc_type: prd
title: "UI Polish Pass — Artifact Atlas"
description: "Adopt the @miethe/ui design system, replace five bespoke detail surfaces with one canonical tabbed-modal + full-page-route pattern, redesign cards with real per-format asset previews, ship a multi-format asset viewer (images/PDF/MD/DOCX/PPTX + formatted editable code), and land a prioritized facelift pass across AA web."
status: draft
created: 2026-06-20
updated: 2026-06-20
feature_slug: ui-polish-pass
feature_version: v1
tier: 3
priority: high
risk_level: medium
owner: nick
contributors: []
prd_ref: null
plan_ref: null
spike_ref: docs/project_plans/spikes/ui-polish-pass-spike.md
adr_refs:
  - "ADR-1: Adopt @miethe/ui via token-bridge, subpath imports, v0.6.0"
  - "ADR-2: Canonical detail pattern — tabbed modal + full-page route, URL-driven"
  - "ADR-3: Preview-card pattern — zone-composition card with top thumbnail"
  - "ADR-4: Asset-viewer stack — dispatcher + per-format libs; PPTX server-side→PDF"
  - "ADR-5: Facelift scope — P0 a11y/correctness + P1 high-impact; defer dark mode"
  - "ADR-6: Upstream-vs-local split policy"
charter_ref: null
changelog_ref: null
test_plan_ref: null
changelog_required: true
related_documents:
  - .claude/worknotes/ui-polish-pass/decisions-block.md
  - Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md
  - docs/project_plans/upstream/miethe-ui-additions-v1.md
milestone: null
commit_refs: []
pr_refs: []
files_affected: []
---

# Feature brief & metadata

**Feature name:** UI Polish Pass — Artifact Atlas

**Filepath:** `ui-polish-pass-v1`

**Date:** 2026-06-20

**Author:** Claude Sonnet 4.6 (Mode B — Contract Drafting)

**Spike:** `docs/project_plans/spikes/ui-polish-pass-spike.md` — verdict CONDITIONAL GO, 6 ADRs

**Decisions block:** `.claude/worknotes/ui-polish-pass/decisions-block.md`

**Related upstream plan (do not duplicate):** `docs/project_plans/upstream/miethe-ui-additions-v1.md`

---

## 1. Executive summary

Artifact Atlas web is structurally spec-faithful but visually flat. This feature delivers five coordinated pillars: (1) replace five inconsistent bespoke detail surfaces with one canonical tabbed-modal + full-page-route pattern; (2) redesign all card families on a zone-composition model with full-width top thumbnails; (3) ship a multi-format `AssetViewer` supporting images, PDF, Markdown, DOCX, PPTX, and formatted/editable code; (4) adopt `@miethe/ui@0.6.0` as the design-system foundation via a shadcn-compatible token bridge; and (5) land a prioritized facelift (P0 a11y correctness + P1 high-impact surfaces). The SPIKE verdict is **CONDITIONAL GO**: adoption is feasible but gated on a token-bridge + build-config prerequisite (Phase 1 is a hard gate), and PPTX must be rendered server-side as PDF rather than with any in-browser library.

**Priority:** HIGH

**Key outcomes:**
- One accessible, deep-linkable modal + full-page detail pattern replaces five bespoke surfaces, closing existing focus-trap and Escape-key a11y gaps.
- Real per-format asset previews (image, PDF, code, markdown, DOCX, PPTX) replace the current `[Preview: {title}]` placeholder.
- WCAG AA contrast failures and missing Inter font load are corrected (P0 a11y).
- `@miethe/ui` design system is a live dependency, unblocking future component convergence with SkillMeat.

---

## 2. Context & background

### Current state

AA web (`/web`) uses Next.js 15 App Router, React 19, Tailwind 3.4, TanStack Query/Table/Virtual, and dnd-kit. The implementation is structurally sound at the layout and token level but has accumulated five inconsistent detail surfaces (shared `RightDrawer`; bespoke `fixed` BOM `SlotDetailPanel`; inline Coverage sidebar; persistent Template `<aside>`; Inbox center column), a placeholder asset-preview component, and several P0 a11y defects. AA does not currently depend on `@miethe/ui`.

### Problem space

- Detail surfaces are inconsistent: different open/close models, no shared focus-trap, BOM panel does not trap focus or wire Escape.
- `AssetPreview` renders `[Preview: {title}]` for text/code and a bare `<img>` for images; no PDF, DOCX, or PPTX support exists.
- `AssetCard` thumbnail is 32 px inline-left; mockups require a full-width top thumbnail area.
- `ink-faint` (#9ca3af) used as body text at ~2.9:1 contrast (WCAG AA fail).
- Inter font not loaded via `next/font`; may silently fall back to system-ui.
- No `prefers-reduced-motion` media block.
- `@miethe/ui` provides the missing primitives (BaseArtifactModal, Tabs, Card, ContentPane, FileTree) but adoption is blocked by a token collision (~330 shadcn semantic class references resolve to CSS vars AA lacks).

### Architectural context

- **Frontend:** Next.js 15 App Router + React 19; TanStack Query already provides `QueryClientProvider`.
- **Token layer:** CSS vars on `:root` — `--surface`, `--ink*`, `--bg`, `--border*`, `--status-*`, `--sens-*`; no shadcn semantic tokens. Token bridge is additive CSS only.
- **Backend (for PPTX):** FastAPI; a new convert endpoint and asset-fetch proxy seam are the only backend additions in scope.
- **Agent-access gate:** `AssetPreview` already gates on `agent_access`; the new `AssetViewer` inherits this gate. Sensitive assets remain metadata-only/preview-only per `CLAUDE.md`.

---

## 3. Problem statement

> "As an AA user, when I click any artifact's detail view, I get one of five visually inconsistent panels — some without focus-trap or keyboard dismiss — and no real content preview for text, PDF, DOCX, or PPTX files, instead of a consistent, accessible, deep-linkable detail experience with real-format previews."

**Technical root causes:**
- Five separate detail surfaces authored independently with no shared pattern, component, or accessibility contract.
- `AssetPreview` renders a static placeholder string; no fetch, no format dispatch.
- `app/globals.css` defines no shadcn semantic tokens, so any `@miethe/ui` import renders unstyled.
- `app/layout.tsx` loads Inter only via CSS `font-family`, not `next/font`.

---

## 4. Goals & success metrics

### Primary goals

**Goal 1: Unified, accessible detail surface**
Replace five bespoke surfaces with one canonical dual pattern (tabbed-modal preview + full-page route). Focus-trap, Escape dismiss, and ARIA attributes correct on all surfaces.

**Goal 2: Real multi-format asset preview**
`AssetViewer` dispatcher renders images, PDF, Markdown, DOCX, PPTX (via server-side conversion), and syntax-highlighted code. Binary formats are read-only; code-like/markdown is editable (gated by `agent_access`).

**Goal 3: WCAG AA compliance on P0 defects**
`ink-faint` contrast ≥ 4.5:1 for body text; Inter loaded via `next/font`; `prefers-reduced-motion` respected.

**Goal 4: @miethe/ui as a live, functional dependency**
Token bridge + build config land in Phase 1 before any component is consumed. ContentPane smoke-proof on one flagged screen passes before broad rollout.

**Goal 5: Card visual parity with mockups**
All card families (Asset, Pack, Slot, Template) adopt zone-composition with full-width top thumbnail, matching the spec mockups.

### Success metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Detail surfaces using canonical pattern | 0 of 5 | 5 of 5 | Code review + e2e |
| Asset formats with real preview | 0 (image only, bare `<img>`) | 6 (img, PDF, MD, DOCX, PPTX, code) | Manual + e2e smoke |
| Axe violations (modal focus) | Not measured | 0 critical/serious | axe-core in P6 |
| `ink-faint` contrast ratio (body text) | ~2.9:1 | ≥ 4.5:1 | Chrome DevTools / axe |
| `@miethe/ui` ContentPane smoke pass | n/a | Pass (P1 exit gate) | Visual + `tsc --noEmit` |
| `tsc --noEmit` errors (non-test) | Baseline at Phase 1 start | 0 regressions introduced | CI |

---

## 5. User personas & journeys

**Primary — AA operator / human curator**
Inspects assets, builds context packs, reviews BOM slot coverage. Needs: real file preview without leaving AA; deep-linkable detail views; keyboard-navigable modals.

**Secondary — AA agent (read path)**
Fetches asset previews via the MCP/CLI gateway. The `AssetViewer` security posture (sanitize, sandbox, agent-access gate) protects the agent path as much as the human path.

### High-level flow (detail surface)

```mermaid
graph TD
    A[User clicks asset / slot / pack / template card] --> B{Detail type}
    B -->|Quick inspect| C[Tabbed modal opens\n?item=&tab=preview]
    B -->|Deep-link / full view| D[Full-page route\n/assets/assetId?tab=preview]
    C --> E[Tab: Preview — AssetViewer]
    C --> F[Tab: Details / Links / BOM / Policy]
    C --> G[Open full page →]
    G --> D
    E --> H{Format dispatch}
    H -->|image| I[next/image]
    H -->|PDF| J[react-pdf 10.4.1]
    H -->|markdown + code| K[@miethe/ui ContentPane]
    H -->|DOCX| L[docx-preview 0.3.7]
    H -->|PPTX| M[server-side→PDF→react-pdf]
    H -->|access denied| N[Metadata-only placeholder]
```

---

## 6. Requirements

### 6.1 Functional requirements

| ID | Requirement | Priority | Notes |
|:--:|-------------|:--------:|-------|
| FR-1 | One canonical tabbed-modal component (`BaseArtifactModal`-based) with a shared tab registry, URL-driven via `?item=&tab=` search params, shared by all five detail surfaces. | Must | ADR-2; replaces `RightDrawer`, `SlotDetailPanel`, Coverage sidebar, Template aside, Inbox column |
| FR-2 | A "open full page" affordance in the modal navigates to the corresponding full-page route, sharing the same tab registry. | Must | `/assets/[assetId]` extended to packs/slots/templates per OQ-3 |
| FR-3 | Tab panels lazy-load via `React.lazy` + `Suspense`; modal closes on Escape; focus traps inside the modal; focus restores to the trigger element on close. | Must | a11y; closes leg-1 §9 gap |
| FR-4 | `AssetViewer` dispatcher component selects renderer by MIME / extension after the existing `agent_access` gate. | Must | ADR-4 |
| FR-5 | Image renderer uses `next/image` for raster formats; SVG renders via `<img>` only (never `innerHTML`). | Must | Security; ADR-4 |
| FR-6 | PDF renderer uses `react-pdf` 10.4.1; `GlobalWorkerOptions.workerSrc` set in the same `'use client'` module as `<Document>`; loaded via `next/dynamic({ssr:false})`. | Must | ADR-4; see CI assert in NFR-3 |
| FR-7 | Markdown and code render via `@miethe/ui` ContentPane (`sanitize={true}` for user-uploaded content). Only code-like and markdown text files are editable (gated by `agent_access` + canonical/promotion policy). Binary formats are strictly read-only. | Must | ADR-4; editable set defined by OQ-4 |
| FR-8 | DOCX renders via `docx-preview` 0.3.7 with `fetchRelated:false`; loaded `'use client'` + `next/dynamic`. | Must | ADR-4; SSRF mitigation |
| FR-9 | PPTX renders via a server-side PPTX→PDF conversion endpoint in the FastAPI backend; output renders via the existing `react-pdf` surface. A download fallback is shown while converting. | Must | ADR-4; no in-browser PPTX lib |
| FR-10 | All card families (AssetCard, PackCard, SlotCard, TemplateCard) rebuilt on a zone-composition model (HeaderZone / ContentZone / StatusZone / ActionZone, tier sizing, `border-l-4` source tint) with a full-width top thumbnail area (~96 px tall) rendering a real per-format preview thumbnail. | Must | ADR-3; leg-5 P1-1 |
| FR-11 | Card click-to-open guarded by `target.closest('button,a,input,[role=menuitem]')` so action-zone clicks do not also open the modal. | Must | ADR-3 |
| FR-12 | `@miethe/ui@0.6.0` added as a dependency; shadcn-compatible CSS-var + Tailwind-theme token bridge authored in `app/globals.css`; dist content glob added; `transpilePackages`/`serverExternalPackages` configured; single `@codemirror/state` instance enforced; `lucide-react` and `tailwind-merge` major-version duplicates resolved via package-manager overrides. | Must | ADR-1; Phase 1 hard gate |
| FR-13 | All `@miethe/ui` imports use granular subpath imports (`@miethe/ui/primitives`, `/editor`, `/content-viewer`, `/diff`); never the root barrel from a Server Component. | Must | ADR-1; RSC boundary |
| FR-14 | Inter and JetBrains Mono loaded via `next/font/google` in `app/layout.tsx`. | Must | leg-5 P0-1 |
| FR-15 | `ink-faint` color adjusted to ≥ #6b7280 for text-context usage, or body-text callsites switched to `ink-muted`, achieving ≥ 4.5:1 contrast on white. | Must | leg-5 P0-2; WCAG AA |
| FR-16 | `@media (prefers-reduced-motion: reduce)` block in `globals.css` disables `animate-pulse`, `animate-spin`, `animate-slide-in-right`, and `animate-fade-in`. | Must | leg-5 P0-3; WCAG 2.1 AA |
| FR-17 | `CollaborationFooter` wires a lightweight health probe (`fetch("/api/health")` with interval refetch) replacing the hardcoded "checking" state. | Should | leg-5 P0-4 |
| FR-18 | Sidebar navigation adds section grouping ("Project", "Content", "Tools") with section labels and a left accent bar on the active item. | Should | leg-5 P1-2 |
| FR-19 | Command-center `PageHeader` extended with project tag chips, last-sync timestamp, and primary CTAs. | Should | leg-5 P1-3 |
| FR-20 | Empty BOM slots render with `border-dashed border-purple-300 bg-purple-50` treatment. | Should | leg-5 P1-4 |
| FR-21 | Dashboard panel item rows (RecentAssets, Candidates, Canonical) include a 24×24 `AssetThumbnail`. | Should | leg-5 P1-5 |
| FR-22 | `MetricCard` delta values wired from `useDashboard` hook output. | Should | leg-5 P1-6 |
| FR-23 | Coverage readiness score renders as a circular progress ring. | Should | leg-5 P1-7 |
| FR-24 | `BoardColumn` header includes a 3 px top accent bar matching the column's `color` prop. | Should | leg-5 P1-8 |
| FR-25 | `EmptyState` callsites pass a surface-specific icon (e.g., `FolderOpen` for Asset Library, `Package` for BOM, `Layers` for Context Packs). | Should | leg-5 P1-10 |

### 6.2 Non-functional requirements

**Accessibility**

| ID | Requirement |
|----|-------------|
| NFR-A1 | Modals: focus traps inside on open; Escape closes; focus restores to trigger on close; `role="dialog"` + `aria-modal="true"` + `aria-labelledby` set. |
| NFR-A2 | All body-text color tokens achieve ≥ 4.5:1 contrast on their background (WCAG AA). `ink-faint` in text contexts must be ≥ #6b7280. |
| NFR-A3 | `prefers-reduced-motion: reduce` suppresses all CSS animations in `globals.css`. |
| NFR-A4 | Interactive card zones maintain a minimum 44 × 44 px touch target. |
| NFR-A5 | `AssetViewer` binary-format iframes (if used) carry `sandbox` attribute without `allow-scripts`. |

**Performance**

| ID | Requirement |
|----|-------------|
| NFR-P1 | All binary/heavy `AssetViewer` renderers (`react-pdf`, `docx-preview`, PPTX seam) loaded via `next/dynamic({ssr:false})`; never loaded on pages that cannot display those formats. |
| NFR-P2 | `react-pdf` / `pdfjs-dist` (~35 MB unpacked) lazy-loaded; does not inflate pages without PDFs. |
| NFR-P3 | Virtualized lists (`TanStack Virtual`) preserved in all gallery and table views after card redesign. |
| NFR-P4 | Preview thumbnail rendering strategy resolved per OQ-6 (client-on-demand vs. server-generated cache); no blocking full-file fetch for thumbnails. |

**Security**

| ID | Requirement |
|----|-------------|
| NFR-S1 | All asset fetches route through a backend proxy enforcing MIME type and stripping dangerous response headers. |
| NFR-S2 | Markdown rendered with `rehype-sanitize` (`sanitize={true}`) for user-uploaded / untrusted content. ContentPane `sanitize` default must not be left as `false` for untrusted inputs. |
| NFR-S3 | SVG assets served behind the proxy and rendered only via `<img>` (not `dangerouslySetInnerHTML`). |
| NFR-S4 | DOCX rendered with `fetchRelated:false`; mammoth (text extraction) stays server-side. |
| NFR-S5 | PDF.js JS execution disabled (default); `GlobalWorkerOptions.workerSrc` set explicitly to prevent ambiguous worker resolution. |
| NFR-S6 | Code content validated against shiki's known-language list before `codeToHtml()`. CM6 does not execute content. Edits sanitized on save. |
| NFR-S7 | PPTX conversion input validated (file-type check) before passing to LibreOffice/converter; output cached; conversion errors return a download fallback, not a 500 to the browser. |
| NFR-S8 | `agent_access === "none" | "metadata_only"` gate preserved in `AssetViewer` (inherits from existing `AssetPreview` logic). |

**CI / Build**

| ID | Requirement |
|----|-------------|
| NFR-B1 | `tsc --noEmit` (filtering pre-existing test errors) passes with zero new errors introduced. |
| NFR-B2 | `next build` passes with no new warnings about missing `transpilePackages` or ESM resolution. |
| NFR-B3 | CI asserts `@codemirror/state` resolves to exactly one version (`npm ls @codemirror/state` or equivalent). |
| NFR-B4 | CI asserts `react-pdf` worker version equals installed `pdfjs-dist` version. |

---

## 7. Scope

### In scope

- Pillar 1: Canonical tabbed-modal (preview) + full-page-route pattern; migration of all five existing detail surfaces; URL `?item=&tab=` state.
- Pillar 2: Zone-composition card redesign for AssetCard, PackCard, SlotCard, TemplateCard with real per-format top thumbnails.
- Pillar 3: `AssetViewer` dispatcher — images, PDF, Markdown, DOCX, PPTX (server-side→PDF seam), and formatted/editable code.
- Pillar 4: `@miethe/ui@0.6.0` adoption — token bridge, build config, subpath imports.
- Pillar 5 (facelift P0 + P1): Inter/JetBrains Mono font load, contrast fix, `prefers-reduced-motion`, footer health probe, sidebar grouping + active accent, PageHeader enrichment, BOM dotted-purple empty slots, dashboard thumbnails + KPI deltas, readiness ring, board column accents, surface-specific EmptyState icons.
- FastAPI backend: PPTX→PDF conversion endpoint and asset-fetch proxy seam (P4c).
- Phase 6 hardening: `tsc`/`next build` gates, axe a11y sweep, OpenAPI alignment for new endpoints, demo data, Playwright e2e.
- DECISIONS.md and `docs/mvp-backlog.md` updates.

### Out of scope

- Dark mode (deferred; AA is intentionally light-only; library dark styles dead per SPIKE verify:ui-adoption).
- Leg-5 P2 facelift items (filter-bar consolidation, view-mode toggle labels, board per-column add button, RightDrawer tab bar, context-pack token count, inbox queue classification tag, sidebar project switcher, MissingContextPanel urgency, PageHeader h1 size, "View all" click-target enlargement, global keyboard shortcuts).
- Leg-5 P3 facelift items (dark mode, collaborator facepile, publish destination radio, provenance ribbon, board Group By, pulse-subtle, BOM slot drag from BomOverview, Coverage recommendations rail).
- Preview formats beyond the six defined (images, PDF, MD, DOCX, PPTX, code-like text).
- Backend asset-blob storage changes beyond the preview/fetch proxy seam and PPTX conversion endpoint.
- New product features beyond rendering/polish.
- Upstream `@miethe/ui` additions (shiki in ContentPane, CM6 lang packs, reactive dark-mode MarkdownEditor, image-preview slot) — these are planned in `docs/project_plans/upstream/miethe-ui-additions-v1.md`.

---

## 8. Dependencies & assumptions

### External dependencies

| Dependency | Version | Notes |
|------------|---------|-------|
| `@miethe/ui` | **0.6.0** (to be published) | Hard prerequisite for Phase 1. ADR-1. Interim dev: workspace/`file:` link acceptable until npm publish. |
| `react-pdf` | 10.4.1 | Confirmed React 19 compatible (SPIKE verify:preview-compat). Worker version must equal `pdfjs-dist`. |
| `docx-preview` | 0.3.7 | Apache-2.0; framework-agnostic; confirmed compatible. |
| `next/image` | built-in (Next 15) | Zero added weight; used for raster images. |
| `shiki` | 4.2.0 | SSR/RSC-safe; **upstream task** — added to `@miethe/ui` ContentPane. AA consumes via ContentPane after upstream lands. Thin local shim acceptable if upstream is delayed. |
| LibreOffice headless (or Gotenberg) | server-side | PPTX→PDF conversion backend; engine choice per OQ-2. |

### Internal dependencies

| Dependency | Notes |
|------------|-------|
| Existing `AssetPreview` `agent_access` gate | `AssetViewer` inherits and preserves this gate. |
| Existing `/assets/[assetId]` full-page route | Extended to serve as the full-page surface for the tabbed pattern (packs/slots/templates per OQ-3). |
| `app/providers.tsx` `QueryClientProvider` | Already present; `AssetViewer` TanStack Query hooks reuse it. |
| FastAPI backend preview/fetch proxy | New in P4; required by NFR-S1. |
| `shared/openapi.yaml` | Must be updated in P6 for the PPTX-convert endpoint and preview proxy seam. |

### Assumptions

- `@miethe/ui@0.6.0` will be published to npm (or available via workspace link for dev) before Phase 1 begins. If not published, Phase 1 uses a `file:` link and the publish is treated as a hard prerequisite task.
- The shadcn token bridge is fully additive — it does not overwrite or rename any of AA's existing `--ink*`, `--surface`, `--brand`, or `--status-*` tokens.
- Only code-like and markdown text files are editable (`.md`, `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.json`, `.yml`, `.yaml`, `.toml`, `.txt`). Binary formats (images, PDF, DOCX, PPTX) are read-only. (OQ-4 may refine.)
- `@codemirror/state` deduplication is achievable via package-manager `overrides`. If not, the plan must account for a shim.
- PPTX→PDF latency is acceptable with an async convert + cache pattern and a download fallback during conversion.
- This work does not touch auth, payments, data deletion, or secret rotation — no Mode-D boundary applies, unless OQ-4 resolves to persisting writes to asset blob storage (flag if so).

### Feature flags

- `flag:ui-tabbed-modal` — gates the new canonical modal pattern per-surface during P2b migration; allows surface-by-surface rollout (OQ-5 to decide per-surface vs. global).
- `flag:asset-viewer-formats` — gates multi-format `AssetViewer`; enables format-by-format enablement.
- `flag:miethe-ui-ds` — gates `@miethe/ui` component usage until the Phase 1 smoke screen passes.
- `flag:pptx-server-conversion` — gates PPTX→PDF seam specifically; shows download fallback when off.

---

## 9. Risks & mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| R1: Token-bridge mismatch — ~330 shadcn class refs render wrong globally | High | Medium | Phase 1 is a hard gate with a single-screen `ContentPane` smoke proof before any rollout. Bridge is additive/reversible. |
| R2: `@codemirror/state` duplication → runtime ContentViewer errors | High | Medium | Dedupe via package-manager `overrides`; CI assert `npm ls @codemirror/state` shows one version. |
| R3: `@miethe/ui@0.6.0` not published in time — blocks Phase 1 | High | Medium | Use `file:`/pnpm-workspace link for dev; treat publish as an explicit P1 prerequisite task. |
| R4: PPTX server-side conversion adds backend infra (LibreOffice) and latency | Medium | Medium | Async convert + cache; download fallback while converting; PPTX behind feature flag. Engine choice per OQ-2. |
| R5: react-pdf worker misconfiguration silently breaks PDF rendering | Medium | Low | Set `workerSrc` in same `'use client'` module as `<Document>`; CI assert worker version == pdfjs-dist. |
| R6: Untrusted-file XSS/SSRF via rendered DOCX/MD/SVG/HTML | Medium-High | Low | `sanitize={true}`, `fetchRelated:false`, SVG via `<img>` only, backend proxy enforces MIME; `code-reviewer` signs P4 security checklist. |
| R7: Migration regression across 5 surfaces + all card families | Medium | Medium | One shared pattern (not 5 rewrites); migrate surface-by-surface behind feature flag; visual smoke + axe + e2e in P6. |
| R8: Bundle bloat from duplicate lucide-react / tailwind-merge + pdfjs | Low-Medium | Medium | Package-manager overrides + `next/dynamic` lazy-loading; measure with bundle analyzer. |

---

## 10. Target state (post-implementation)

**User experience:**
- Clicking any asset, pack, slot, or template opens a consistent tabbed modal with a "Preview" tab showing real content. "Open detail" navigates to the full-page route at a deep-linkable URL.
- The modal is keyboard-dismissible (Escape), focus-trapped, and screen-reader accessible.
- Asset cards in all gallery views show a full-width top thumbnail with a real per-format preview image.
- Inter loads on every page; `ink-faint` text passes WCAG AA contrast; animations respect `prefers-reduced-motion`.
- Sidebar is visually grouped with section labels and an active-item accent bar.

**Technical architecture:**
- `features/ui/components/EntityModal/` — shared tabbed modal + tab registry consumed by all five detail surfaces via URL `?item=&tab=` params.
- `features/assets/components/AssetViewer/` — format-dispatching viewer with six renderers; all heavy renderers lazy-loaded via `next/dynamic`.
- `app/globals.css` — additive shadcn-compatible token bridge layer alongside existing AA tokens.
- FastAPI backend — `/api/preview/convert/pptx` endpoint + asset-fetch proxy.
- `@miethe/ui@0.6.0` as a live npm dependency consumed via subpath imports.

**Observable outcomes:**
- Axe sweep in P6 reports zero new critical/serious violations.
- `tsc --noEmit` passes with zero new errors.
- e2e (Playwright) covers modal open/close/tab/deep-link and `AssetViewer` per-format happy paths.
- `docs/DECISIONS.md` records all six ADRs from the SPIKE.

---

## 11. Acceptance criteria

### AC-1: Canonical tabbed-modal pattern — all five detail surfaces

**Target surfaces:**
- `web/features/assets/components/AssetDrawerContent` (was: `RightDrawer`)
- `web/features/bom/components/SlotDetailPanel` (was: bespoke fixed overlay)
- `web/features/coverage/components/CoverageSidebar` (was: inline w-56 sidebar)
- `web/features/templates/components/TemplatePreviewAside` (was: persistent `<aside>`)
- `web/features/inbox/components/InboxDetailColumn` (was: permanent center column)

**Acceptance:**
- [ ] All five surfaces use the shared `EntityModal` component (or equivalent `BaseArtifactModal` wrapper).
- [ ] URL contains `?item=<id>&tab=<tabKey>` when a modal is open; removing the param closes the modal.
- [ ] "Open full page" affordance navigates to the full-page route while preserving the active `?tab=` param.
- [ ] Tab panels are code-split (`React.lazy`) and render a `Suspense` fallback skeleton.
- [ ] Pressing Escape closes the modal from any open tab.
- [ ] Focus is trapped inside the modal while open (`axe-core` focus-trap rule passes).
- [ ] On close, focus returns to the element that triggered the modal.
- [ ] `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wired to the modal title.
- [ ] Old bespoke panel code (`RightDrawer`, `SlotDetailPanel` fixed-inset, Coverage inline column, Template aside, Inbox center column) removed or deprecated.

**Resilience:** If the backend returns no `item` data, the modal shows a `MetadataUnavailable` placeholder instead of an error crash.

---

### AC-2: AssetViewer — per-format rendering

**Target surfaces:**
- `web/features/assets/components/AssetViewer/index.tsx` (dispatcher)
- Preview tab inside `EntityModal`
- Full-page asset route preview panel

| Format | Renderer | Editable | AC |
|--------|----------|----------|----|
| Images (png/jpg/gif/webp) | `next/image` | No | Renders without broken-image; respects `object-fit: contain`. |
| SVG | `<img>` (sanitized proxy) | No | Never `innerHTML`; no script execution. |
| PDF | `react-pdf` 10.4.1 | No | First page renders; page-turn controls visible; worker loads without console error. |
| Markdown | `@miethe/ui` ContentPane | Yes (code-like/md only) | Renders GFM; `sanitize={true}` for untrusted content; toolbar shows only when editable. |
| DOCX | `docx-preview` 0.3.7 | No | Document body renders; no remote asset fetch (`fetchRelated:false`). |
| PPTX | Server-side→PDF→react-pdf | No | First page renders after conversion; download fallback shown during conversion; PPTX behind `flag:pptx-server-conversion`. |
| Code-like text | `@miethe/ui` ContentPane (shiki view / CM6 edit) | Yes (gate: `agent_access` + policy) | Syntax-highlighted in view mode; editable in edit mode for authorized users. |

**Acceptance:**
- [ ] `agent_access === "none" | "metadata_only"` shows the metadata-only placeholder for all formats; no file content fetched.
- [ ] All heavy renderers load via `next/dynamic({ssr:false})`.
- [ ] SVG never rendered via `dangerouslySetInnerHTML`.
- [ ] DOCX renderer uses `fetchRelated:false`.
- [ ] PPTX conversion endpoint returns PDF bytes within a configurable timeout; errors show download fallback.
- [ ] `react-pdf` `GlobalWorkerOptions.workerSrc` set in the same module as `<Document>`.
- [ ] Code language validated against shiki's known-language list before highlight call.

**Resilience:** If the backend proxy returns a non-200 or MIME mismatch, `AssetViewer` shows an error tile with a download link, not a blank or crashed UI.

---

### AC-3: Card redesign — zone composition + top thumbnail

**Target surfaces:**
- `web/features/assets/components/AssetCard.tsx`
- `web/features/bom/components/SlotCard.tsx`
- `web/features/packs/components/PackCard.tsx`
- `web/features/templates/components/TemplateCard.tsx`

**Acceptance:**
- [ ] All four card families render a full-width top thumbnail area (~96 px tall containing the preview image/icon).
- [ ] Thumbnail renders a real per-format preview (reuses `AssetViewer` thumbnail mode or equivalent).
- [ ] Card body below thumbnail is structured in HeaderZone / ContentZone / StatusZone / ActionZone regions.
- [ ] `border-l-4` source tint applied per the tier/source palette.
- [ ] Card click opens the `EntityModal` (or navigates to full-page); click is guarded by `target.closest('button,a,input,[role=menuitem]')` so action-zone clicks do not also fire the modal.
- [ ] Keyboard: `Enter` / `Space` on the card (when focused as the card root) opens the modal.
- [ ] TanStack Virtual lists continue to render cards without layout thrash.

**Resilience:** If the per-format thumbnail fetch fails, card shows a format-type icon fallback; card itself remains functional.

---

### AC-4: @miethe/ui adoption — Phase 1 gate

**Target surfaces:**
- `web/app/globals.css` (token bridge)
- `web/tailwind.config.ts` (content glob + theme extension)
- `web/next.config.*` (`transpilePackages`, `serverExternalPackages`)
- `package.json` overrides

**Acceptance:**
- [ ] `@miethe/ui@0.6.0` resolves as a dependency (npm or workspace link).
- [ ] Shadcn-compatible CSS vars (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`) defined in `app/globals.css` mapped onto AA's existing palette.
- [ ] `./node_modules/@miethe/ui/dist/**/*.{js,mjs}` included in Tailwind `content` globs.
- [ ] `next build` passes; no "class not found" purge warnings for `@miethe/ui` classes.
- [ ] `tsc --noEmit` passes with zero new errors.
- [ ] `npm ls @codemirror/state` (or pnpm equivalent) shows exactly one resolved version.
- [ ] A ContentPane smoke screen on one feature-flagged page renders with correct tokens (visual review sign-off required before Phase 2 begins).
- [ ] No `@miethe/ui` import from a Server Component uses the root barrel `@miethe/ui`; all imports use granular subpaths.

---

### AC-5: Facelift P0 — a11y / correctness

**Target surfaces:**
- `web/app/layout.tsx` (font load)
- `web/app/globals.css` (contrast, reduced-motion)
- `web/features/shell/components/CollaborationFooter.tsx`

**Acceptance:**
- [ ] `next/font/google` imports Inter and JetBrains Mono in `app/layout.tsx`; Network tab confirms woff2 requests on first load.
- [ ] All body-text usages of `ink-faint` token achieve ≥ 4.5:1 contrast ratio on white (verified via axe or Chrome DevTools).
- [ ] `@media (prefers-reduced-motion: reduce)` block in `globals.css` sets `animation: none` for `animate-pulse`, `animate-spin`, `animate-slide-in-right`, `animate-fade-in`.
- [ ] `CollaborationFooter` fetches `/api/health` (or equivalent) on mount and at a configured interval; shows "connected" / "disconnected" / "checking" based on probe result, not a hardcoded string.

---

### AC-6: Facelift P1 — high-impact surfaces

**Target surfaces:**
- `web/features/shell/components/SidebarNav.tsx`
- `web/features/dashboard/components/CommandCenterView.tsx` (PageHeader)
- `web/features/bom/components/SlotCard.tsx` (empty state)
- `web/features/dashboard/components/KPIRow.tsx`
- `web/features/dashboard/panels/*.tsx` (item rows)
- `web/features/coverage/components/ReadinessScore.tsx`
- `web/features/board/components/BoardColumn.tsx`
- All `EmptyState` callsites

**Acceptance:**
- [ ] `SidebarNav` renders three section groupings with visible section labels; active item has a left accent bar.
- [ ] Command-center `PageHeader` displays project tag chips, last-sync timestamp, and at least two primary CTAs.
- [ ] Empty BOM `SlotCard` renders `border-dashed border-purple-300 bg-purple-50`.
- [ ] `MetricCard` in the KPI row displays a delta indicator when `delta` prop is non-null (values sourced from `useDashboard`).
- [ ] Dashboard panel item rows include a 24×24 `AssetThumbnail`.
- [ ] `ReadinessScore` renders a circular progress ring (dial) with percentage and color coding.
- [ ] `BoardColumn` header includes a 3 px top accent bar using the column's `color` prop.
- [ ] Each `EmptyState` callsite passes a surface-appropriate icon (at minimum: FolderOpen for Asset Library, Package for BOM, Layers for Context Packs).

---

### AC-7: Phase 6 hardening gates

**Acceptance:**
- [ ] `tsc --noEmit` (filtering `./__tests__/a11y/` pre-existing errors) exits 0 with no new errors vs. Phase 1 baseline.
- [ ] `next build` exits 0.
- [ ] `axe-core` automated sweep reports zero new critical or serious violations on modal + AssetViewer surfaces.
- [ ] Playwright e2e covers: (a) open modal from card click, (b) Escape closes modal + focus returns, (c) "Open full page" navigation, (d) `AssetViewer` renders each supported format happy path, (e) `agent_access` gate shows metadata-only placeholder.
- [ ] `shared/openapi.yaml` includes the PPTX-convert endpoint and preview proxy seam.
- [ ] `docs/DECISIONS.md` updated with all six ADRs.
- [ ] `docs/mvp-backlog.md` updated to reflect completed and deferred items.

---

## 12. Assumptions & open questions

### Assumptions

- `@miethe/ui` v0.3.0 (currently published) is insufficient; v0.6.0 (in source as of SPIKE) must be the consumed version.
- The shadcn token bridge is reversible and purely additive; no existing AA token is renamed or removed.
- No auth, payment, deletion, or secret-rotation code is touched; Mode-D boundary does not apply unless OQ-4 resolves to persisting blob writes.
- The PPTX conversion engine runs inside or alongside the existing FastAPI container.
- P5 P0 facelift items (font, contrast, reduced-motion, footer probe) can begin in parallel with Phase 1 since they touch independent files.

### Open questions

| ID | Question | Lean / Default | Blocking? |
|----|----------|----------------|-----------|
| OQ-1 | Consume `@miethe/ui@0.6.0` via published npm or workspace/`file:` link during dev? | Publish 0.6.0; `file:` link as dev interim. | Blocks P1 |
| OQ-2 | PPTX→PDF conversion engine: LibreOffice headless (`soffice`) vs. Gotenberg sidecar vs. hosted service? | Gotenberg sidecar preferred (no LibreOffice in API container); confirm with infra owner. | Blocks P4c |
| OQ-3 | Full-page detail route shape: extend `/assets/[assetId]` per entity type, or one generic `/detail/[type]/[id]`? | One generic route with type-keyed tab registries; avoids N route files. | Blocks P2a |
| OQ-4 | Editable set + persistence: which extensions are "code-like/editable", and do edits persist to the registry or stay preview-only? If writes persist asset blob content, re-check Mode boundary. | Default editable set: `.md .ts .tsx .js .jsx .py .json .yml .yaml .toml .txt`; preview-only for now (no write endpoint). | Scopes P4a |
| OQ-5 | Feature-flag strategy: per-surface flag vs. one global `ui-tabbed-modal` flag for P2b migration? | Per-surface flags during migration; global flag for final cutover. | Scopes P2b |
| OQ-6 | Preview thumbnails: render client-side on demand vs. server-generated cached thumbnails for large virtualized lists? | Client-on-demand for MVP; server cache deferred unless perf testing shows P4 NFR failure. | Scopes P3/P4 |

---

## 13. Deferred items

The following items are explicitly out of scope for this PRD. Each must have a design-spec authoring task in Phase 6 (DOC-006) to prevent loss.

| Item | Rationale for deferral | Future home |
|------|----------------------|-------------|
| Dark mode | AA is intentionally light-only; library dark styles dead (verify:ui-adoption); a whole new token axis. | Future PRD when AA product direction changes. |
| Leg-5 P2 facelift items (filter-bar consolidation, view-mode labels, board add-card, RightDrawer tabs, context-pack token count, inbox classification tag, sidebar project switcher, urgency panel, h1 size, "View all" click target, keyboard shortcuts) | High-impact but not P0/P1; scope control for Tier-3 feature. | `docs/mvp-backlog.md` P2 backlog. |
| Leg-5 P3 facelift items (collaborator facepile, publish destination radio, provenance ribbon, Board Group By, pulse-subtle, BOM slot drag, Coverage recommendations rail) | Lower impact; unclear product priority. | `docs/mvp-backlog.md` P3 backlog. |
| Preview formats beyond the six (video, audio, ZIP, spreadsheet, etc.) | Scope control; no verified compatible library. | Future `AssetViewer` extension PRD. |
| Upstream `@miethe/ui` additions (shiki in ContentPane, CM6 lang packs, reactive dark-mode MarkdownEditor, image-preview slot, root barrel `'use client'` fix, v0.6.0 publish docs) | Belongs in the `@miethe/ui` project, not AA. | `docs/project_plans/upstream/miethe-ui-additions-v1.md` |

---

## 14. Phase overview

Full implementation plan to be authored separately. Summary for orientation:

| # | Phase | Key deliverable | Est. pts |
|---|-------|-----------------|---------|
| P1 | Design-system foundation | Token bridge + build config; ContentPane smoke screen | 8 |
| P2a | Modal shell + tab registry | `EntityModal` component + URL state + a11y | 5 |
| P2b | Migrate 5 detail surfaces | All surfaces on canonical pattern; old panels removed | 8 |
| P3 | Card redesign & preview cards | Zone-composition cards + real top thumbnails | 8 |
| P4a | AssetViewer (images/PDF/MD/code) | Dispatcher + 4 renderers + security posture | 6 |
| P4b | AssetViewer DOCX | `docx-preview` renderer | 3 |
| P4c | PPTX server-side seam | FastAPI convert endpoint + react-pdf render | 4 |
| P5 | Facelift P0 + P1 | Font, contrast, reduced-motion, sidebar, dashboard, BOM, board | 8 |
| P6 | Hardening, a11y & docs | tsc/build/axe/e2e gates; OpenAPI; docs | 5 |

**Total: ~55 pts.** Phase 1 is a hard gate. Phases P5-P0 can begin in parallel with P1. Phases P4a and P2 can parallelize after P1.

**Dependency graph:** See `docs/project_plans/spikes/ui-polish-pass-spike.md` §6 and `.claude/worknotes/ui-polish-pass/decisions-block.md` §5.

---

## 15. Appendices & references

- **SPIKE (CONDITIONAL GO, 6 ADRs):** `docs/project_plans/spikes/ui-polish-pass-spike.md`
- **Decisions block (phase boundaries, risks, OQs):** `.claude/worknotes/ui-polish-pass/decisions-block.md`
- **UI/UX design spec + mockups:** `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md`
- **Upstream @miethe/ui plan (do not implement here):** `docs/project_plans/upstream/miethe-ui-additions-v1.md`
- **Discovery legs (grounding):** `.claude/worknotes/ui-polish-pass/discovery/leg-1-aa-frontend.md`, `leg-5-facelift-audit.md`
- **CLAUDE.md agent-access policy:** `CLAUDE.md` (agent writes to asset access / canonical promotion default to suggestion/draft)
