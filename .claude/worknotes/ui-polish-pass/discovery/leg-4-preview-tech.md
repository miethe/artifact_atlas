---
title: "Leg 4 — Multi-Format Asset Previewer: Library Stack Recommendation"
leg: "4"
date: "2026-06-20"
status: draft
scope: artifact_atlas/web
context: |
  Evaluating in-browser rendering libraries for a multi-format asset previewer
  in the Next.js 15 App Router / React 19 codebase. Grounded against the
  @miethe/ui ContentViewer (FileTree + ContentPane) discovered in leg-3.
---

# Leg 4 — Multi-Format Asset Previewer: Library Stack Recommendation

## Coverage Classification Key

| Tag | Meaning |
|-----|---------|
| **COVERED** | Already handled by `@miethe/ui` ContentViewer (ContentPane + FileTree) |
| **LOCAL** | New work needed locally in artifact_atlas/web (Artifact Atlas-specific use case) |
| **UPSTREAM** | New work should go into `@miethe/ui` so skillmeat-web and other consumers benefit |

---

## Format-by-Format Recommendations

### 1. Images

**Recommendation:** Native `<img>` / Next.js `<Image>` — no third-party library needed.

| Attribute | Detail |
|-----------|--------|
| Library | Next.js built-in `next/image` (Next.js 15.x) |
| Version | Ships with next@^15.0.0 (already installed) |
| React 19 / SSR compat | Native — no caveats |
| `'use client'` needed | No; `<Image>` works in Server Components |
| Web worker | Not applicable |
| Bundle weight | Zero additional weight |
| License | MIT (Next.js) |
| Security / XSS | SVG from untrusted sources is the only risk. Serve behind a proxy or strip SVG scripts server-side. Never render SVG as `dangerouslySetInnerHTML`. For raster images the browser sandbox is sufficient. Enable `Content-Security-Policy: img-src` header. |

**Coverage classification: COVERED (partially)**

`AssetPreview` already renders `<img>` for image MIME types. The existing component does not yet use `next/image` with `fill` / `sizes` for optimised delivery, but the format itself is handled. Any improvements (webp optimisation, proper `sizes`) are LOCAL polish inside `features/assets/components/AssetPreview.tsx`.

---

### 2. PDF

**Recommendation:** `react-pdf` (wraps PDF.js) for viewing.

| Attribute | Detail |
|-----------|--------|
| Library | `react-pdf` |
| Version | **10.4.1** (released 2025) |
| React 19 / SSR compat | Explicitly supports React ^16.8 – ^19.0 in peerDeps. Must be rendered in a `'use client'` component. |
| `'use client'` needed | Yes — canvas/DOM rendering |
| Web worker | Yes. PDF.js offloads parsing to a worker. Configure via `pdfjs-dist/build/pdf.worker.min.mjs` (copy to `public/` or use a CDN URL). In Next.js 15 set `workerSrc` in a client-only module. |
| Bundle weight | `react-pdf` ~309 KB unpacked; `pdfjs-dist` ~35 MB unpacked (tree-shaken to ~500 KB gzipped in practice with dynamic import). Use `next/dynamic` with `ssr: false`. |
| License | MIT (`react-pdf`), Apache-2.0 (`pdfjs-dist`) |
| Security | PDF.js runs in its worker; no arbitrary JS execution from PDF content reaches the main thread. Risk: embedded JavaScript in PDFs (AcroForms). PDF.js disables JS execution by default. For untrusted files, set `disableFontFaces: false` but keep JS disabled (default). Never use an `<iframe src="blob:...">` approach — no CSP control. |

**Coverage classification: LOCAL**

Artifact Atlas needs to render binary PDF blobs fetched from the backend. `@miethe/ui` ContentViewer only handles text-based content. A new `PdfViewer` component should be built locally at `features/assets/components/PdfViewer.tsx` behind `next/dynamic({ ssr: false })`. If PDF preview becomes a SkillMeat product need, promote UPSTREAM later.

---

### 3. Markdown

**Recommendation:** `react-markdown` + `remark-gfm` + `rehype-sanitize` — already in `@miethe/ui`.

| Attribute | Detail |
|-----------|--------|
| Library | `react-markdown` |
| Version | **10.1.0** |
| React 19 / SSR compat | peerDeps: `react >= 18` — fully compatible with React 19. Works in Server Components (pure JS transform, no DOM APIs). |
| `'use client'` needed | No for read-only rendering. ContentPane adds `'use client'` for edit state management. |
| Web worker | Not needed |
| Bundle weight | `react-markdown` ~53 KB unpacked; `remark-gfm` ~4 MB unpacked (AST plugins); negligible at runtime due to tree-shaking |
| License | MIT |
| Security | `react-markdown` does NOT use `dangerouslySetInnerHTML` by default — it builds a React tree. To strip unsafe raw HTML pass-through (from authors using `html` in markdown), add `rehype-sanitize` (v6.0.0, MIT). ContentPane already passes `sanitize={boolean}` prop that enables `rehypeSanitize`. For truly untrusted markdown, `sanitize={true}` is sufficient. |

**Supporting libraries:**
- `remark-gfm` 4.0.1 — tables, strikethrough, task lists (MIT)
- `rehype-sanitize` 6.0.0 — safe HTML (MIT)

**Coverage classification: COVERED (upstream, in @miethe/ui)**

`ContentPane` in `@miethe/ui` renders markdown via `react-markdown + remark-gfm` with optional `rehype-sanitize`. Artifact Atlas should consume `ContentPane` for `.md` assets rather than rolling a parallel renderer. The `sanitize` prop MUST be set `true` for untrusted user-uploaded markdown.

---

### 4. DOCX

**Recommendation:** `docx-preview` for display; `mammoth` for Markdown extraction / simpler cases.

#### Option A — `docx-preview` (preferred for fidelity)

| Attribute | Detail |
|-----------|--------|
| Library | `docx-preview` |
| Version | **0.3.7** (last published 2025-09-30) |
| React 19 / SSR compat | No peerDeps (framework-agnostic). Renders into a DOM node. Must be `'use client'`. |
| `'use client'` needed | Yes — direct DOM manipulation |
| Web worker | Not built-in, but can be wrapped. Parsing blocks main thread briefly for large files; acceptable for typical docs. |
| Bundle weight | ~964 KB unpacked; ships its own CSS. Lazy-load with `next/dynamic`. |
| License | Apache-2.0 |
| Security | Renders DOCX into a sandboxed `<div>`. DOCX macros are not executed. Risk: embedded hyperlinks and OLE objects (strip on server, not client). ExternalLinks in DOCX can cause SSRF if auto-fetched — `docx-preview` does NOT auto-fetch remote images by default; configure `fetchRelated: false` to be explicit. No `eval`, no script execution. |

#### Option B — `mammoth` (for plain HTML/text extraction)

| Attribute | Detail |
|-----------|--------|
| Library | `mammoth` |
| Version | **1.12.0** |
| React 19 / SSR compat | Pure JS; no React dependency. Works in browser or Node (useful for server-side extraction). |
| `'use client'` needed | Yes for browser blob reading |
| Bundle weight | ~2.2 MB unpacked; heavier than docx-preview for browser use |
| License | BSD-2-Clause |
| Security | Produces HTML string — must be sanitized with `DOMPurify` (3.4.11, MPL-2.0/Apache-2.0) or `isomorphic-dompurify` (3.18.0) before `dangerouslySetInnerHTML`. Mammoth does strip macros and script elements from DOCX content. |

**Recommendation:** Use `docx-preview` for a native-looking document render. Use `mammoth` only if you need a plain-text/markdown extraction pipeline for agent indexing.

**Coverage classification: LOCAL**

Neither `@miethe/ui` ContentViewer nor the current `AssetPreview` handles DOCX. Build a new `DocxViewer` component locally in `features/assets/components/DocxViewer.tsx`. Not a candidate for UPSTREAM yet — DOCX rendering is an Artifact Atlas-specific concern; SkillMeat stores code/YAML artifacts, not Office documents.

---

### 5. PPTX

**Recommendation:** `@mkabatek/pptx-viewer` with caveats; fallback to server-side PDF conversion for production.

This is the most constrained format. There is no mature, widely-adopted open-source PPTX viewer for React.

#### Option A — `@mkabatek/pptx-viewer` (most capable React option, but new/risky)

| Attribute | Detail |
|-----------|--------|
| Library | `@mkabatek/pptx-viewer` |
| Version | **1.5.14** (last published 2026-06-08) |
| React 19 / SSR compat | peerDeps explicitly require `react ^19.2.5` — targets React 19 directly. `'use client'` required. |
| `'use client'` needed | Yes |
| Web worker | Unknown (undocumented); canvas rendering likely main-thread |
| Bundle weight | ~26 MB unpacked (large — includes `html2canvas-pro`, `jspdf`, `framer-motion`). Heavy. Lazy-load mandatory. |
| License | MIT |
| Security | Built on `pptx-viewer-core` (Apache-2.0). PPTX macros are not executed (ZIP/XML parse only). Embedded hyperlinks and remote images present SSRF risk — confirm network fetch behavior before use. No published CVE history (young package). Treat as ALPHA quality. |
| Maturity risk | Published by a single maintainer; 1.5.14 in June 2026 suggests active development but no long-term track record. |

#### Option B — `pptx-viewer` (lightweight, framework-agnostic)

| Attribute | Detail |
|-----------|--------|
| Library | `pptx-viewer` |
| Version | **0.2.2** (published 2026-04-13) |
| React 19 / SSR compat | No peerDeps. Plain DOM manipulation — wrap in `useEffect` + ref. |
| Bundle weight | Small (unknown — no unpacked size in registry) |
| License | MIT |
| Security | Minimal — evaluate source before use |

#### Option C — Server-side PDF conversion (recommended for production)

Convert PPTX to PDF on the backend (LibreOffice headless / CloudConvert API) and serve as PDF, which `react-pdf` renders. This eliminates all client-side PPTX parsing risk, delivers consistent rendering, and avoids shipping a large JS parser.

**Recommendation matrix:**
- **MVP / low-risk:** Server-side PPTX→PDF conversion + `react-pdf` viewer.
- **If client-side is required:** `@mkabatek/pptx-viewer` behind a feature flag; treat as beta. Confirm SSRF and remote-fetch behavior in sandbox before enabling for untrusted files.

**Coverage classification: LOCAL (server-side recommended)**

No upstream PPTX support in `@miethe/ui`. Build locally. If client-side rendering is chosen, put the viewer behind `next/dynamic({ ssr: false })` in `features/assets/components/PptxViewer.tsx`. Server-side pipeline belongs in the FastAPI backend.

---

### 6. Code Files — Syntax-Highlighted View

**Recommendation:** `shiki` for server-side / static highlighting.

| Attribute | Detail |
|-----------|--------|
| Library | `shiki` |
| Version | **4.2.0** |
| React 19 / SSR compat | Pure JS; works in Server Components (no DOM dependency). Produces static HTML. |
| `'use client'` needed | No — ideal for SSR/RSC |
| Web worker | Not needed for server-side usage; for client-only use, can run in a worker via `createHighlighterCore` |
| Bundle weight | ~602 KB unpacked; grammar files are loaded on demand (only selected languages). The core + a few grammars is ~150 KB gzipped. |
| License | MIT |
| Security | Produces escaped HTML strings — no XSS risk when inserted via `dangerouslySetInnerHTML` IF you trust shiki's output (it escapes user code). Do NOT allow user-controlled language strings without validation against shiki's known language list. |

**Alternative: `rehype-highlight`** (v7.0.2, MIT) uses highlight.js on the remark/rehype pipeline — lighter but less accurate theme support. Prefer shiki for quality; use rehype-highlight only if you already have a unified pipeline.

**Current gap in @miethe/ui ContentPane:** Non-markdown code files are rendered as plain `<pre>` text in `ContentDisplay` — no syntax highlighting. This is the primary visual gap.

**Coverage classification: UPSTREAM**

Shiki should be added to `@miethe/ui` ContentPane to replace the unstyled `ContentDisplay` component. This improves code file rendering for all consumers (SkillMeat artifact tabs, Artifact Atlas asset previewer). The change is small: detect file extension → call `codeToHtml()` server-side or in an RSC wrapper → render result. File a `@miethe/ui` upstream task.

---

### 7. Code Files — Editable

**Recommendation:** CodeMirror 6 (`@codemirror/*`) via `@uiw/react-codemirror`.

| Attribute | Detail |
|-----------|--------|
| Library | `@uiw/react-codemirror` wrapper over `@codemirror/*` |
| Version | `@uiw/react-codemirror` **4.25.10**; `@codemirror/view` **6.43.1**; `codemirror` **6.0.2** |
| React 19 / SSR compat | peerDeps: `react >= 17`. Fully compatible with React 19. Must be `'use client'`. Already used in `@miethe/ui` (MarkdownEditor) with raw `@codemirror/*` APIs. |
| `'use client'` needed | Yes |
| Web worker | Not required; CM6 is synchronous but highly optimized. |
| Bundle weight | `@codemirror/view` ~1.2 MB unpacked; full CM6 setup (state + view + lang packs) ~3–4 MB unpacked, ~200 KB gzipped. Lazy-load with `next/dynamic`. |
| License | MIT |
| Security | Content editing is local only — no execution of user code. The editor's `contenteditable` DOM does not execute scripts. Sanitize on SAVE, not on display. |

**Versus Monaco Editor:**

| | CodeMirror 6 | Monaco Editor |
|--|--|--|
| Bundle (gzip) | ~200 KB | ~1.5–2 MB (requires web worker, separate chunks) |
| SSR | Friendly (`'use client'` only for the editor itself) | Requires `next/dynamic` + `ssr: false` + worker config |
| React wrapper | `@uiw/react-codemirror` (MIT, 4.25.10) | `@monaco-editor/react` (MIT, 4.7.0) — supports React 19 |
| Mobile | Good | Poor (designed for desktop IDE) |
| Customisation | Highly compositional (functional extensions) | Plugin/API based; more opinionated |
| Already in codebase | Yes (`@miethe/ui` MarkdownEditor uses raw CM6) | No |

**Verdict:** CodeMirror 6 is already the foundation of `@miethe/ui`'s MarkdownEditor. Extending it to arbitrary language editing avoids a second large editor dependency. Monaco is only worth adding if the product roadmap requires a full IDE-like experience (IntelliSense, LSP, etc.).

**Coverage classification: COVERED (upstream, in @miethe/ui) — for Markdown only. UPSTREAM gap for other languages.**

`@miethe/ui` MarkdownEditor uses raw `@codemirror/*` with only `@codemirror/lang-markdown`. To support editing `.ts`, `.py`, `.json`, etc., add language packs (`@codemirror/lang-javascript`, `lang-python`, `lang-json`, etc.) to the ContentPane editor path. This is an UPSTREAM `@miethe/ui` enhancement. Artifact Atlas should not roll a separate editor.

---

## Consolidated Coverage Table

| Format | Library (version) | Coverage | Work location | Priority |
|--------|--------------------|----------|---------------|----------|
| Images | `next/image` (built-in) | COVERED (partial — no `next/image` optimisation yet) | LOCAL polish in `AssetPreview.tsx` | Low |
| PDF | `react-pdf` 10.4.1 | NOT COVERED | LOCAL: `features/assets/components/PdfViewer.tsx` | High |
| Markdown (view) | `react-markdown` 10.1.0 + `remark-gfm` 4.0.1 + `rehype-sanitize` 6.0.0 | COVERED (upstream, in `@miethe/ui` ContentPane) | Consume via `ContentPane` with `sanitize={true}` | Done |
| Markdown (edit) | `@codemirror/*` 6.x (MarkdownEditor in `@miethe/ui`) | COVERED (upstream) | Consume via `ContentPane` | Done |
| DOCX | `docx-preview` 0.3.7 | NOT COVERED | LOCAL: `features/assets/components/DocxViewer.tsx` | Medium |
| PPTX | `@mkabatek/pptx-viewer` 1.5.14 or server-side PDF | NOT COVERED | LOCAL (client) or Backend (PDF conversion) | Medium-Low |
| Code view (syntax-hl) | `shiki` 4.2.0 | PARTIALLY COVERED — plain `<pre>` only | UPSTREAM: add shiki to `@miethe/ui` ContentPane | High |
| Code edit (multi-lang) | `@codemirror/*` 6.x (already in `@miethe/ui`) | PARTIALLY COVERED — markdown only | UPSTREAM: add language packs to ContentPane | Medium |

---

## Security Summary for Untrusted Files

| Format | Key risk | Mitigation |
|--------|----------|------------|
| Image | SVG script execution | Never `innerHTML` SVG; use `<img>` or sanitize SVG server-side |
| PDF | AcroForm JS | PDF.js disables JS by default; keep it disabled |
| Markdown | XSS via raw HTML | `rehype-sanitize` (set `sanitize={true}` on ContentPane) |
| DOCX | Embedded hyperlinks / OLE | `docx-preview` with `fetchRelated: false`; strip on server before serving |
| PPTX | Remote resource fetch (SSRF) | Prefer server-side PDF conversion; if client-side, audit `@mkabatek/pptx-viewer` fetch behavior |
| Code (view) | None (static HTML output from shiki is escaped) | Validate language string against known list |
| Code (edit) | None (CM6 does not execute content) | Sanitize on save server-side |

---

## Implementation Order (Suggested)

1. **UPSTREAM first:** File a task to add `shiki` syntax highlighting to `@miethe/ui` ContentPane for non-markdown code files. Low risk, high visual payoff, benefits SkillMeat too.
2. **PDF (LOCAL):** Build `PdfViewer.tsx` with `react-pdf` + worker config. Highest asset-type coverage gain.
3. **DOCX (LOCAL):** Build `DocxViewer.tsx` with `docx-preview`. Medium lift.
4. **PPTX:** Implement server-side PPTX→PDF conversion in FastAPI first; use `PdfViewer` to display the result. Defer client-side PPTX viewer unless product specifically requires in-browser slide navigation.
5. **UPSTREAM second:** Add multi-language CM6 packs to `@miethe/ui` ContentPane editor path for `.ts`, `.py`, `.json`, etc.
6. **Image polish (LOCAL):** Migrate `AssetPreview` `<img>` to `next/image` with `fill` and `sizes`.

---

## Notes on Next.js 15 / React 19 Compatibility

- All `'use client'` viewer components must be wrapped in `next/dynamic` with `ssr: false` for PDF, DOCX, PPTX.
- Shiki and `react-markdown` work in React Server Components — prefer RSC for read-only renderers to reduce client JS.
- CodeMirror 6 is client-only; the existing `lazy()` split in ContentPane is the correct pattern.
- No library in this stack has known React 19 regressions as of June 2026. `@mkabatek/pptx-viewer` explicitly targets React 19 in its peerDeps.
