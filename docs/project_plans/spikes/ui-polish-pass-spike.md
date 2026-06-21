---
title: "UI Polish Pass — SPIKE"
slug: ui-polish-pass
status: complete
tier: 3
created: 2026-06-20
related:
  - .claude/worknotes/ui-polish-pass/discovery/leg-1-aa-frontend.md
  - .claude/worknotes/ui-polish-pass/discovery/leg-2-miethe-ui.md
  - .claude/worknotes/ui-polish-pass/discovery/leg-3-skillmeat-usage.md
  - .claude/worknotes/ui-polish-pass/discovery/leg-4-preview-tech.md
  - .claude/worknotes/ui-polish-pass/discovery/leg-5-facelift-audit.md
  - Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md
---

# UI Polish Pass — SPIKE

> Mode B (contract drafting). Pre-commitment investigation grounding a Tier-3 implementation plan.
> All claims cite discovery files (`leg-1`..`leg-5`) and two adversarial verification verdicts
> (`verify:ui-adoption` — REFUTED; `verify:preview-compat` — UNCERTAIN). Refuted / uncertain items
> are carried forward as hard constraints, not optimistic assumptions.

---

## 1. Problem Statement & Scope

Artifact Atlas web (`/web`, Next 15 App Router, React 19, Tailwind 3.4, TanStack Query/Table/Virtual,
dnd-kit) is **structurally spec-faithful but visually flat** (leg-5 exec summary). The UI Polish Pass
is a single coordinated feature spanning five pillars:

1. **Sidebar/detail panels → tabbed modals + "open detail" route.** Replace the current
   inconsistent detail surfaces (a shared `RightDrawer`, a bespoke `fixed` BOM `SlotDetailPanel`,
   an inline Coverage sidebar column, a persistent Template preview panel — leg-1 §3a–3j) with one
   canonical **tabbed-modal preview + full-page route** dual pattern, URL-driven via search params
   (the skillmeat `ConsolidatedEntityModal` / `MarketplaceBrowsePage` idiom — leg-3 §1, §4).
2. **Redesigned cards, including asset-preview cards.** AssetCard's thumbnail is small inline-left
   (~32px); mockups want a full-width thumbnail area at card top (leg-5 §3, P1-1). Cards should adopt
   the zone-composition / tier idiom from skillmeat's `ArtifactCard` (leg-3 §2) and render real
   per-format preview thumbnails.
3. **Multi-format asset viewer.** Images, PDF, Markdown, DOCX, PPTX, and code — rendered **formatted
   and (for code-like text only) editable**. Today `AssetPreview` renders a placeholder
   `[Preview: {title}]` for text/code and only a bare `<img>` for images (leg-1 §5, leg-4 §1). The
   editable-vs-readonly rule: **only code-like text files are editable** (markdown + source code via
   CodeMirror 6); images/PDF/DOCX/PPTX are strictly read-only.
4. **Adopt `@miethe/ui` design system into AA web.** AA does **not** currently depend on `@miethe/ui`
   (leg-1, leg-2). Adoption is the foundation for pillars 1–3 (BaseArtifactModal, Tabs, Card,
   ContentPane, FileTree, primitives). **Per `verify:ui-adoption`, adoption is NOT "clean"** — see §4.
5. **General facelift.** Typography (Inter not loaded via `next/font` — leg-5 P0-1), accessibility
   (ink-faint contrast fail P0-2, no `prefers-reduced-motion` P0-3), sidebar grouping, richer page
   headers, BOM dotted-purple empty slots, dashboard thumbnails, etc. (leg-5 prioritized backlog).

**Out of scope:** backend asset-blob storage changes beyond a preview/fetch proxy seam; dark mode
(deferred — AA is intentionally light-only, leg-1 §6, leg-5 P3-1, and library dark styles are dead per
`verify:ui-adoption`); new product features beyond rendering/polish.

**Non-negotiable constraints (from CLAUDE.md):** agent writes to asset access / canonical promotion
stay suggestion/draft; sensitive assets default to metadata-only/preview-only (the viewer must honor
`agent_access === "none" | "metadata_only"` — leg-1 §5 already gates this).

---

## 2. Current-State Summary of AA Web (leg-1)

- **Shell.** `AppShell` = `SidebarNav` (208px / 48px collapsed) + `TopBar` (h-11) + `<main>` +
  optional unused `rightRail` slot + `CollaborationFooter`. The `rightRail`/`rightRailOpen` props
  are wired but **no page injects them** (leg-1 §2, §9) — there is no shared persistent inspector.
- **Detail surfaces are inconsistent (leg-1 §3, §9):** shared `RightDrawer` (Asset Library inspector,
  Context Pack builder); **bespoke** `fixed inset-y-0 right-0 w-80` `SlotDetailPanel` in BOM that
  does **not** trap focus / wire Escape; inline w-56 Coverage sidebar; persistent Template preview
  `<aside>`; permanent Inbox center column. Five separate `Dialog` modals per BOM `SlotCard`.
  Asset Detail is a full route (`/assets/[assetId]`) with a two-column layout.
- **Cards (leg-1 §4):** `AssetCard`, `DraggableAssetCard`, `InboxItemCard`, `InboxQueueItem`,
  `SlotCard`, `PackCard`, `TemplateCard`, `MetricCard`. AssetCard thumbnail is `w-9 h-9` inline-left.
- **Preview (leg-1 §5):** `AssetPreview` (4 sizes) gates on `agent_access`; image path uses bare
  `<img>` (no `next/image`); text/code path renders placeholder `[Preview: {title}]` — **no real
  content fetch**; everything else → MIME icon. No PDF/DOCX/PPTX scaffold.
- **Primitives present (leg-1 §6):** Button, IconButton, StatusBadge, SensitivityBadge, TagChip,
  MetricCard, EmptyState, Skeleton(+Card/Row), Tooltip, **Dialog (focus-trapped)**, SegmentedControl.
  **Missing:** Dropdown/Select, Checkbox, Radio, Toast, Combobox, Popover, Avatar, Accordion,
  shared DataTable. Many are ad-hoc.
- **Tokens (leg-1 §6):** CSS vars on `:root` — `--surface`, `--ink*`, `--bg`, `--border*`,
  `--status-*`, `--sens-*`; Tailwind palettes `brand`/`purple`/`status`/`sensitivity`/`access`.
  **No shadcn semantic tokens** (`--background`, `--foreground`, `--primary`, `--muted-foreground`,
  `--ring`, etc.). `color-scheme: light`, **no `darkMode` key** in tailwind config. Tailwind `content`
  globs cover only `./app`, `./components`, `./features`, `./lib` (confirmed by `verify:ui-adoption`).
- **Data (leg-1 §7):** all hooks in `lib/hooks/` on TanStack Query — `QueryClientProvider` already
  mounted in `app/providers.tsx`.

---

## 3. Asset-Viewer Architecture & Per-Format Library Stack (leg-4 + verify:preview-compat)

### 3.1 Dispatcher architecture

Introduce one **`AssetViewer` dispatcher** (`features/assets/components/AssetViewer/`) that selects a
renderer by MIME / extension, after the existing `agent_access` gate (leg-1 §5). All binary/heavy
renderers load via `next/dynamic({ ssr: false })` and live behind the access gate. The viewer is the
content of the **Preview tab** in the new tabbed modal (pillar 1) and of the full asset route.

### 3.2 Editable-vs-read-only rule

| Class | Formats | Renderer | Editable? |
|---|---|---|---|
| Code-like text | `.md`, `.ts/.tsx/.js/.jsx`, `.py`, `.json`, `.yml/.yaml`, `.toml`, `.txt` | shiki (read) / CodeMirror 6 (edit) via `@miethe/ui` ContentPane | **Yes** (gated by `agent_access` + canonical/policy rules) |
| Markdown | `.md` | `@miethe/ui` ContentPane / SplitPreview / ArticleViewer | **Yes** |
| Images | png/jpg/gif/svg/webp | `next/image` (raster) / sanitized `<img>` (svg) | No |
| PDF | `application/pdf` | `react-pdf` 10.4.1 | No |
| DOCX | `.docx` | `docx-preview` 0.3.7 | No |
| PPTX | `.pptx` | **server-side → PDF → react-pdf** (see §3.4) | No |

Rule: **only code-like / markdown text is editable**; all rich/binary formats are read-only. Edits
save server-side (sanitize on save, not display — leg-4 §7).

### 3.3 Recommended stack (versions verified live against npm, June 2026 — verify:preview-compat)

| Format | Library (version) | Verdict | Integration notes |
|---|---|---|---|
| Images | `next/image` (built-in) | CONFIRMED | Zero added weight; SVG only via `<img>`, never `innerHTML`; serve behind proxy with `img-src` CSP |
| PDF | `react-pdf` 10.4.1 (+ `pdfjs-dist`, Apache-2.0) | CONFIRMED React 19 | **Fragile worker setup:** set `GlobalWorkerOptions.workerSrc` with `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` in the **same** `'use client'` module as `<Document>`; load via `next/dynamic({ssr:false})`; **CI assert worker version == pdfjs-dist version** |
| Markdown (view) | `react-markdown` 10.1.0 + `remark-gfm` 4.0.1 + `rehype-sanitize` 6.0.0 | CONFIRMED (via `@miethe/ui` ContentPane) | Consume ContentPane; **`sanitize={true}` for untrusted uploads** |
| Markdown (edit) | CodeMirror 6 (in `@miethe/ui` MarkdownEditor) | CONFIRMED | Consume ContentPane; do not roll a second editor |
| Code (view, syntax-hl) | `shiki` 4.2.0 | CONFIRMED, SSR/RSC-safe | Validate language against shiki's known-language list before `codeToHtml()`; **UPSTREAM** into ContentPane (§7) |
| Code (edit, multi-lang) | `@codemirror/lang-*` on existing CM6 | CONFIRMED | Add lang packs; **UPSTREAM** into ContentPane (§7); single `@codemirror/state` instance is mandatory (dedupe) |
| DOCX | `docx-preview` 0.3.7 (Apache-2.0) | CONFIRMED (framework-agnostic) | `'use client'` + `next/dynamic`; **`fetchRelated:false`** (SSRF); keep `mammoth` extraction server-side only |
| PPTX | **server-side PPTX→PDF (LibreOffice/soffice headless)** | **CONSTRAINED — see below** | NOT in-browser for MVP |

### 3.4 PPTX is the refuting case (verify:preview-compat → UNCERTAIN)

`@mkabatek/pptx-viewer` 1.5.14 is **NOT production-safe**: 26.5 MB unpacked, single maintainer, and a
`react` peerDep of `^19.2.5` — a caret on a patch version that **excludes** AA's resolved `^19.0.x`,
causing peer-dependency install friction; near-zero issue/CVE history → alpha. **Decision: drop the
client PPTX viewer for MVP.** Render PPTX via **server-side conversion to PDF** (LibreOffice headless
in the FastAPI backend) and reuse the already-vetted `react-pdf` pipeline — one rendering surface, no
26 MB client dep, no peerDep conflict. Revisit in-browser PPTX only if page-turn/animation/speaker
notes become a hard product requirement.

### 3.5 Untrusted-file security posture (leg-4 §"Security Summary", verify:preview-compat risks)

- **All asset fetches route through a backend proxy** that enforces MIME and strips dangerous headers.
- **Markdown:** `sanitize={true}` (rehype-sanitize) for user uploads — ContentPane defaults `sanitize`
  to false, a ship-blocking footgun if left as-is.
- **PDF:** keep PDF.js JS execution disabled (default); lazy-load (pdfjs-dist ~35 MB unpacked) so it
  never bloats pages that can't reach a PDF.
- **DOCX:** `fetchRelated:false`; `mammoth` (text extraction) stays server-side, out of the bundle.
- **SVG:** render only via `<img>` or strip scripts server-side; never `dangerouslySetInnerHTML`.
- **Code:** validate language string before shiki; CM6 does not execute content; sanitize on save.
- **React 19 StrictMode:** CM6 double-mounts effects — `EditorView.destroy()` in effect cleanup.

---

## 4. @miethe/ui Capability + Adoption Analysis (leg-2/leg-3 + verify:ui-adoption)

### 4.1 What the library provides (leg-2)

Tree-shakeable subpath exports. Directly relevant: **`@miethe/ui/primitives`** — `BaseArtifactModal`
(Dialog + ModalHeader + TabNavigation + slot), `Tabs`/`TabsList/Trigger/Content`, `TabNavigation`
(underline), `VerticalTabNavigation`, `Card`/`CardHeader/Content/Footer`, `Badge`, `Popover`,
`DropdownMenu` (full suite), `Tooltip`, `SearchableCombobox`, `WizardShell`, `StatusChip`, `cn`.
**`@miethe/ui/content-viewer`** — `FileTree`, `ContentPane`, `ArticleViewer`, `ContentViewerProvider`.
**`@miethe/ui/editor`** — `MarkdownEditor`, `SplitPreview`. **`@miethe/ui/diff`** — `DiffViewer`.
**`@miethe/ui/display`** — `FilePreviewPane`, `FrontmatterDisplay`. These fill nearly all of AA's
"missing primitives" list (leg-1 §6) and the modal/card/content-viewer needs of pillars 1–3.

Skillmeat usage patterns (leg-3) are the integration playbook: `ConsolidatedEntityModal`
(registry-driven tabs, `React.Suspense`/`React.lazy` per panel, URL `?tab=` sync), `ArtifactCard`
(zone composition + tier + `border-l-4` tint + click-to-modal with `target.closest(...)` guard),
ContentPane read-only vs editable wiring, and the **"open in modal + open full page" dual pattern**
sharing one tab registry (`MarketplaceBrowsePage` ↔ `ConsumerItemPage` via `?item=&tab=`).

### 4.2 Adoption is NOT clean — verify:ui-adoption = REFUTED

The verifier refuted "clean npm adoption." Carry these as **hard constraints**:

1. **Version reality.** Published npm latest = **0.3.0** (only 0.2.0/0.3.0 published); the source tree
   `package.json` shows **0.6.0 (unpublished WIP)**. 0.3.0 **lacks** `ArticleViewer` (added 0.5.0) and
   the react-hook-form/zod form components (0.6.0). **Decision required (ADR-1):** publish & consume
   **0.6.0** to match the discovered source surface — do not silently consume the older 0.3.0.
2. **Token collision is decisive (FAIL).** The dist is built against **shadcn semantic tokens** —
   ~330 references (`text-muted-foreground` ×86, `bg-accent` ×35, `ring-ring` ×29, `bg-muted` ×25,
   `text-foreground` ×24, `bg-primary` ×22, `bg-background` ×15, `border-border` ×13, …). AA defines
   **none** of `--background/--foreground/--primary/--muted-foreground/--ring/...`. Until AA authors a
   shadcn-compatible token bridge, **every imported component renders unstyled.**
3. **Tailwind content glob (FAIL as-is).** AA's globs (`./app,./components,./features,./lib`) do **not**
   include `node_modules/@miethe/ui/dist`, so the library's classes are purged → no CSS even with tokens.
   Must add `./node_modules/@miethe/ui/dist/**/*.{js,mjs}`.
4. **RSC boundary gotcha.** dist is pure ESM; client components emit `'use client'`, but the **root
   barrel `@miethe/ui` has no `'use client'`** and re-exports client modules — importing it from a
   Server Component can throw. **Use granular subpath imports** (`@miethe/ui/primitives`, `/editor`,
   `/content-viewer`, `/diff`) and wrap usage in client components.
5. **Transitive ESM / bundler config.** `react-markdown@9`/unified/remark/rehype + `@codemirror/*` need
   `next.config` `transpilePackages`/`serverExternalPackages` tuning. **`@codemirror/state` MUST resolve
   to a single instance** (dedupe / overrides) or ContentViewer errors at runtime.
6. **Duplicate-major deps.** AA `lucide-react ^1.21.0` vs library `^0.575.0`, and `tailwind-merge ^3.x`
   vs `^2.5.4` → two copies each (no dedupe across major gap). Add package-manager overrides or accept
   bundle cost knowingly.
7. **Dark-mode mismatch.** dist emits `dark:` variants and expects `darkMode:'class'`; AA is light-only.
   Library dark styles are dead. Acceptable since dark mode is out of scope — but audit no `dark:` leaks.

### 4.3 Adoption strategy (the de-risked path)

- **Token bridge first (foundation, blocking).** Author a shadcn-compatible layer in
  `app/globals.css`: define `--background/--foreground/--card/--popover/--primary/--secondary/--muted/
  --muted-foreground/--accent/--accent-foreground/--destructive/--border/--input/--ring` mapped onto
  AA's existing `surface/ink/brand` palette, and mirror them as Tailwind `theme.colors` so the
  library's semantic classes resolve. This is pure additive CSS — does not disturb AA's existing tokens.
- **Build wiring:** add the dist content glob; add `transpilePackages`/`serverExternalPackages`; add
  overrides forcing single `@codemirror/state` and resolving `lucide-react`/`tailwind-merge` duplicates.
- **Import discipline:** subpath imports only; never root barrel from a Server Component.
- **Prove on one screen behind a flag** — ContentViewer is the highest-risk surface (CodeMirror + ESM).
  Run `tsc --noEmit` + a Next build + a visual/runtime smoke test before broad rollout.
- **Version:** target/consume **0.6.0** (publish it from the source tree); add `react-hook-form`/`zod`
  if form entrypoints are used.

---

## 5. ADR-Style Recommendations

### ADR-1 — Adopt `@miethe/ui` via token-bridge layer, subpath imports, consume v0.6.0
**Decision:** Add `@miethe/ui@0.6.0` (publish from source first) as an npm dep. Gate adoption on a
shadcn-compatible CSS-var + Tailwind-theme **token bridge** in `app/globals.css`, the dist content
glob, `transpilePackages`/`serverExternalPackages`, and single-instance `@codemirror/state`. Import
only from granular subpaths; never the root barrel from Server Components.
**Rationale:** `verify:ui-adoption` REFUTED clean adoption — ~330 shadcn semantic classes resolve to
CSS vars AA lacks; content globs purge library CSS; root barrel lacks `'use client'`; 0.3.0 (published)
lacks ArticleViewer + form deps present in 0.6.0. The bridge is additive and reversible; subpath
imports avoid the RSC boundary throw; 0.6.0 matches the discovered surface.

### ADR-2 — Canonical detail pattern: tabbed modal (preview) + full-page route, URL-driven
**Decision:** Replace the inconsistent drawers/panels (leg-1 §3) with one dual surface: a
`BaseArtifactModal`-based **tabbed preview modal** and a **full-page route** sharing a single tab
registry, both driven by `?item=&tab=` search params (skillmeat `ConsolidatedEntityModal` /
`MarketplaceBrowsePage` ↔ `ConsumerItemPage` idiom — leg-3 §1, §4). Lazy-load tab panels with
`React.lazy` + `Suspense`. Migrate the bespoke BOM `SlotDetailPanel` and Coverage inline sidebar onto
this pattern (closing the focus-trap/Escape a11y gaps — leg-1 §9, leg-5 §15).
**Rationale:** One accessible, deep-linkable pattern replaces five bespoke ones; preview ↔ full-page
parity is a proven idiom; AA already has the route (`/assets/[assetId]`) and `QueryClientProvider`.

### ADR-3 — Preview-card pattern: zone-composition card with top thumbnail + real per-format preview
**Decision:** Redesign cards on the skillmeat `ArtifactCard` zone-composition model (HeaderZone /
ContentZone / StatusZone / ActionZone, tier sizing, `border-l-4` source tint) with a **full-width top
thumbnail area** that renders a real per-format preview thumbnail (image, PDF first page, code/MD
snippet), replacing the ~32px inline-left thumbnail. Click-to-open guarded by
`target.closest('button,a,input,[role=menuitem]')` (leg-3 §2, §7; leg-5 P1-1).
**Rationale:** Mockups want top thumbnails (leg-5 §3); the zone idiom is already proven in skillmeat
and composes with `@miethe/ui` Card; real previews land as a byproduct of the §3 viewer work.

### ADR-4 — Asset-viewer stack: dispatcher + per-format libs; PPTX server-side→PDF; code-only editable
**Decision:** Build an `AssetViewer` dispatcher using `next/image` (images), `react-pdf` 10.4.1 (PDF),
`@miethe/ui` ContentPane (markdown + code, with shiki + CM6 lang packs added **upstream**),
`docx-preview` 0.3.7 (DOCX), and **server-side PPTX→PDF** rendered through react-pdf. Only code-like /
markdown is editable; all binary formats are read-only. Enforce the §3.5 security posture.
**Rationale:** `verify:preview-compat` confirmed every lib except PPTX for Next 15/React 19; PPTX's
only React option is alpha (26 MB, peerDep `^19.2.5` conflict), so server-side conversion is the
production-safe path and reuses one rendering surface.

### ADR-5 — Facelift scope: P0 a11y/correctness + P1 high-impact; defer dark mode
**Decision:** Land all leg-5 **P0** items (Inter via `next/font`; ink-faint contrast bump;
`prefers-reduced-motion`; footer health probe) and the **P1** facelift core (full-width card thumbnail,
sidebar grouping + active accent bar, richer command-center PageHeader, BOM dotted-purple empty slots,
dashboard row thumbnails, KPI deltas, readiness ring, board column accent, EmptyState surface icons).
P2 opportunistically; **defer dark mode (P3-1)** and other P3 items.
**Rationale:** P0 are correctness/WCAG failures (contrast ~2.9:1, missing font load, no reduced-motion);
P1 are the visible delta from mockups; dark mode conflicts with AA's intentional light-only stance and
the library's dead dark styles — deferring avoids a whole token axis.

### ADR-6 — Upstream-vs-local split policy
**Decision:** Work that benefits all `@miethe/ui` consumers (shiki code highlighting in ContentPane;
multi-language CM6 lang packs; reactive dark-mode in MarkdownEditor; an optional image-preview slot in
ContentPane) goes **UPSTREAM** as a separate plan handed to the `@miethe/ui` project (§7). AA-specific
work (PDF/DOCX/PPTX viewers, AssetViewer dispatcher, AA card redesign, token bridge, facelift) stays
**LOCAL**. AA does not fork the library or roll parallel renderers; it consumes published versions and
files upstream tasks for shared gaps.
**Rationale:** leg-4 already classifies each format COVERED/LOCAL/UPSTREAM; honoring it keeps AA thin
(per CLAUDE.md: AA indexes/relates artifacts, is not a system of record) and lets SkillMeat and other
consumers benefit from the shared improvements.

---

## 6. Proposed Phase Breakdown (Tier-3 implementation plan)

Ordered for dependency safety: design-system foundation → primitives/modals → cards/previews →
asset viewer → facelift → hardening/docs. Story points are rough (Fibonacci-ish).

| # | Phase | Summary | Pts |
|---|---|---|---|
| 1 | Design-system foundation | Add `@miethe/ui@0.6.0`; author shadcn token bridge in globals.css + Tailwind theme; dist content glob; transpile/serverExternal + single-`@codemirror/state` + lucide/tailwind-merge overrides; prove ContentPane on one flagged screen | 8 |
| 2 | Primitives & tabbed-modal pattern | Stand up canonical `BaseArtifactModal` tabbed-preview + full-page route sharing one tab registry, URL `?item=&tab=` driven; migrate Asset inspector, BOM SlotDetailPanel, Coverage sidebar onto it (focus-trap/Escape fixed) | 13 |
| 3 | Card redesign & preview cards | Rebuild AssetCard (+ Pack/Slot/Template) on zone-composition + tier + top full-width thumbnail; real per-format preview thumbnails; click-to-modal guard | 8 |
| 4 | Multi-format asset viewer | `AssetViewer` dispatcher: next/image, react-pdf (worker + CI version assert), ContentPane (md+code, editable-only-for-code), docx-preview, PPTX→PDF server seam; full §3.5 security posture | 13 |
| 5 | Facelift pass | P0 (Inter next/font, contrast, reduced-motion, footer probe) + P1 core (sidebar grouping/accent, PageHeader, BOM dotted slots, dashboard thumbnails/KPI deltas, readiness ring, board accents, EmptyState icons) | 8 |
| 6 | Hardening, a11y & docs | tsc/build/visual smoke gates, axe a11y sweep, DECISIONS.md + mvp-backlog.md updates, openapi.yaml alignment for preview/PPTX-convert seams, demo data, e2e | 5 |

**Total ≈ 55 pts.** Phase 1 is the hard gate; Phases 3–4 can partially parallelize after Phase 2.
Upstream `@miethe/ui` work (§7) is a **parallel external track** — Phase 4 can ship with a thin local
shiki/CM-langpack shim if upstream lands late.

---

## 7. Upstream `@miethe/ui` Additions (separate plan handed to that project)

| Component | Gap | Proposed addition |
|---|---|---|
| ContentPane `ContentDisplay` | Non-markdown code files render as unstyled plain `<pre>` (leg-2 §2.2, leg-4 §6) | Add **shiki 4.2.0** server/RSC syntax highlighting; detect extension → `codeToHtml()` (validate language); benefits all consumers |
| ContentPane / MarkdownEditor | CM6 ships only `@codemirror/lang-markdown`; `.ts/.py/.json/.yaml` editing falls to read-only `<pre>` (leg-2 §2.3, leg-4 §7) | Add `@codemirror/lang-javascript/-python/-json/-yaml` (and a `CodeEditor` surface) so non-markdown code is editable for all consumers |
| MarkdownEditor | CM6 theme chosen once at mount from `matchMedia`; no reactive dark switch (leg-2 §5) | Make theme reactive to runtime dark/light changes |
| ContentPane / ContentViewer | No image/PDF/DOCX preview path (leg-2 §5) | Add an **optional image-preview slot / pluggable renderer hook** so binary previewers can be injected (keeps heavy deps out of the core but standardizes the seam) |
| Package publishing | npm latest is stale **0.3.0**; source is **0.6.0** unpublished; 0.3.0 lacks ArticleViewer + form deps (verify:ui-adoption) | **Publish 0.6.0** (and document the shadcn token contract + required content glob + subpath-import rule prominently in README) |
| Root barrel | `@miethe/ui` root `index.js` lacks `'use client'`, re-exports client modules → RSC import throw (verify:ui-adoption) | Add a `'use client'` boundary or document/enforce subpath-only imports as the supported path |

---

## 8. Open Questions & Risks

**Open questions**

1. Will `@miethe/ui` 0.6.0 be **published** before/with this work, or must AA consume via a workspace
   link / private registry? (Blocks Phase 1; ADR-1 assumes publish.)
2. Backend ownership of the **PPTX→PDF conversion** (LibreOffice/soffice headless in FastAPI) and the
   **asset-fetch proxy** — is that in-scope for this feature's backend track or a prerequisite?
3. Is a **shared persistent right rail** (the unused `AppShell.rightRail` slot, leg-1 §9) wanted, or
   does the tabbed-modal + full-page pattern fully replace the rail concept?
4. Token-bridge values: should shadcn `--primary`/`--accent` map to AA `brand` or `purple` (AI accent)?
   Needs a design decision to avoid semantic drift.
5. Editability policy for code assets — which `agent_access` / canonical/promotion states permit edits
   vs. suggestion-only (per CLAUDE.md default-to-suggestion)?
6. Which assets are "trusted" vs "untrusted" for sanitization defaults (`sanitize`/`fetchRelated`)?

**Risks**

- **R1 (high):** Token bridge mismatch — if shadcn vars are mis-mapped, ~330 class references render
  wrong globally. Mitigation: bridge-only PR + visual smoke on one screen before rollout (Phase 1 gate).
- **R2 (high):** `@codemirror/state` duplication → runtime errors in ContentViewer. Mitigation: dedupe/
  overrides + `npm ls @codemirror/state` CI assert.
- **R3 (med):** react-pdf worker misconfig silently breaks rendering / version drift breaks at runtime.
  Mitigation: workerSrc in same module + CI assert worker==pdfjs-dist version.
- **R4 (med):** PPTX server-side conversion adds backend infra (LibreOffice) and latency. Mitigation:
  async convert + cache; PPTX is Medium-Low priority (leg-4).
- **R5 (med):** Upstream shiki/CM-langpack work slips → code rendering degraded. Mitigation: thin local
  shim in Phase 4; upstream is a parallel track.
- **R6 (low-med):** Bundle bloat from duplicate `lucide-react`/`tailwind-merge` majors + pdfjs.
  Mitigation: overrides + `next/dynamic` lazy-loading; measure with bundle analyzer.
- **R7 (low):** Dark `dark:` style leaks from the library into AA's light-only shell. Mitigation: audit;
  no `darkMode` key keeps variants inert.

---

## 9. Compatibility Verdict

**CONDITIONAL GO.** Every required asset-preview library (images, PDF, markdown, DOCX, code view/edit)
is verified compatible with Next 15 / React 19 (`verify:preview-compat`), and `@miethe/ui` adoption is
**feasible but explicitly not "clean"** (`verify:ui-adoption` REFUTED) — it is gated on a shadcn token
bridge, content-glob + bundler config, single-`@codemirror/state`, subpath-only imports, and consuming
the (to-be-published) **0.6.0** rather than the stale 0.3.0. The two refuting/uncertain findings are
load-bearing: **PPTX must be server-side→PDF, not the alpha `@mkabatek/pptx-viewer`**, and **Phase 1
(token-bridge foundation) is a hard gate** before any `@miethe/ui` component is trusted. With those
constraints honored, the five pillars are deliverable as the six-phase Tier-3 plan in §6.
