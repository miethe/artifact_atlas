# P4a Completion Note — AssetViewer Dispatcher + Image/PDF/MD/Code Renderers

**Phase**: P4a  
**Date**: 2026-06-21  
**Agent**: ui-engineer-enhanced (Mode C — Autonomous bounded sprint)  
**Branch**: feat/ui-polish-p1-p4a

---

## Per-Task Status

| Task ID | Status | Notes |
|---------|--------|-------|
| P4A-001 | ✅ COMPLETE | `web/features/assets/components/AssetViewer/index.tsx` — dispatcher with agent_access gate, MIME/extension dispatch, lazy-load PdfRenderer + ContentRenderer |
| P4A-002 | ✅ COMPLETE | `ImageRenderer.tsx` — raster via `next/image` (unoptimized); SVG via `<img>` only; error tile + download link |
| P4A-003 | ✅ COMPLETE | `PdfRenderer.tsx` — react-pdf 10.4.1; `GlobalWorkerOptions.workerSrc` set; lazy-loaded; page controls in full mode |
| P4A-004 | ✅ COMPLETE | `ContentRenderer.tsx` — ContentPane from `@miethe/ui/content-viewer`; `sanitize={true}`; `codeHighlight={true}`; toolbar gated on editable; thumbnail = plain snippet |
| P4A-005 | ✅ COMPLETE | Editable gating in ContentRenderer: extension ∈ EDITABLE_EXTENSIONS AND agentAccess ∈ {read_allowed, context_pack_allowed} AND editable prop true |
| P4A-006 | ✅ SELF-ATTESTED | Security checklist reviewed inline; see attestation section below |
| P4A-007 | ⏳ PENDING | task-completion-validator gate — to be run by orchestrator |

**Additional files created**:
- `AccessRestrictedPlaceholder.tsx` — gate tile for restricted access
- `ErrorTile.tsx` — shared error tile with download link (used by all renderers)

---

## Installed Versions

| Package | Version |
|---------|---------|
| `react-pdf` | `10.4.1` |
| `pdfjs-dist` | `5.4.296` (direct dep of react-pdf, not a peer dep) |
| `lowlight` | `3.3.0` |
| `highlight.js` | `11.11.1` |
| `react-hook-form` | latest (installed to fix pre-existing peer dep blocker — see below) |
| `zod` | latest (installed to fix pre-existing peer dep blocker — see below) |

**pdfjs-dist CI assertion**: `react-pdf@10.4.1` ships `pdfjs-dist@5.4.296` as a fixed direct dependency (not a peer dep). Installed version confirmed: `5.4.296`. ✅

---

## Highlight.js Theme

| Item | Value |
|------|-------|
| Theme chosen | `github.css` (light mode) |
| Import location | `web/features/assets/components/AssetViewer/ContentRenderer.tsx` line ~11: `import "highlight.js/styles/github.css"` |
| Rationale | AA is light-only; `github.css` is the standard light highlight.js theme matching the @miethe/ui README example |

**warmHighlightCache()**: Called at module scope in `ContentRenderer.tsx` (`void warmHighlightCache()`), executed when ContentRenderer is first dynamically imported. No cold-flash after first load; first-ever load may show brief plain text (expected for lazy-loaded modules).

---

## PDF Worker Setup

| Item | Detail |
|------|--------|
| Worker file | `pdfjs-dist/build/pdf.worker.min.mjs` (ESM, pdfjs-dist v5 only ships .mjs) |
| Public path | `web/public/pdf-worker/pdf.worker.min.mjs` |
| Served at | `/pdf-worker/pdf.worker.min.mjs` (static from Next.js public dir) |
| workerSrc set | `pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs"` at module scope in `PdfRenderer.tsx` (same 'use client' module as `<Document>`) |
| Worker format | `.mjs` (ESM) — pdfjs-dist v5 ships ESM-only workers; browsers handle ESM workers natively |

**Note**: The plan says `.js` extension in the workerSrc path, but pdfjs-dist@5.4.296 ships only `.mjs`. The worker is referenced as `/pdf-worker/pdf.worker.min.mjs` to match the actual file. This is a correct deviation from the plan text (which was written for an earlier pdfjs version).

---

## Self-Verification Results

### `npx tsc --noEmit`
```
EXIT: 0
```
Zero TypeScript errors (all errors from pre-existing test files remain absent from the filter).

### `npm run build`
```
✓ Compiled successfully in 5.6s
✓ Generating static pages (4/4)
```
Build succeeds. All routes compile.

**Pre-existing blocker fixed**: `react-hook-form` and `zod` were missing @miethe/ui peer dependencies that caused a pre-existing build failure (`Module not found: Can't resolve 'react-hook-form'`). Both installed as part of this phase to unblock the build. This blocker pre-dates P4a (present before any P4a changes).

### `npm ls @codemirror/state react-pdf pdfjs-dist lowlight`
```
artifact-atlas-web@0.1.0 /Users/miethe/dev/homelab/development/artifact_atlas/web
├─┬ @miethe/ui@0.6.0
│ ├─┬ @codemirror/commands@6.10.3
│ │ └── @codemirror/state@6.6.0 deduped
│ ├─┬ @codemirror/lang-css@6.3.1
│ │ ├─┬ @codemirror/autocomplete@6.20.3
│ │ │ └── @codemirror/state@6.6.0 deduped
│ │ └── @codemirror/state@6.6.0 deduped
│ ├─┬ @codemirror/lang-javascript@6.2.5
│ │ ├─┬ @codemirror/lint@6.9.7
│ │ │ └── @codemirror/state@6.6.0 deduped
│ │ └── @codemirror/state@6.6.0 deduped
│ ├─┬ @codemirror/lang-markdown@6.5.0
│ │ ├─┬ @codemirror/lang-html@6.4.11
│ │ │ └── @codemirror/state@6.6.0 deduped
│ │ └── @codemirror/state@6.6.0 deduped
│ ├─┬ @codemirror/lang-python@6.2.1
│ │ └── @codemirror/state@6.6.0 deduped
│ ├─┬ @codemirror/language@6.12.3
│ │ └── @codemirror/state@6.6.0 deduped
│ ├── @codemirror/state@6.6.0 overridden
│ └─┬ @codemirror/view@6.43.1
│   └── @codemirror/state@6.6.0 deduped
├── lowlight@3.3.0
└─┬ react-pdf@10.4.1
  └── pdfjs-dist@5.4.296
```
✅ Single `@codemirror/state@6.6.0` instance — all deduped via npm overrides from P1.

---

## Security Checklist Self-Attestation

| # | Check | Status | Location |
|---|-------|--------|----------|
| 1 | No SVG via innerHTML — `<img>` only | ✅ PASS | `ImageRenderer.tsx`: SVG uses `<img src={src}>`. `dangerouslySetInnerHTML` not used anywhere in AssetViewer. |
| 2 | `sanitize={true}` for all untrusted MD/HTML in ContentPane | ✅ PASS | `ContentRenderer.tsx`: `sanitize={true}` hardcoded unconditionally. |
| 3 | react-pdf JS execution left at default (disabled) | ✅ PASS | `PdfRenderer.tsx`: No `renderMode="custom"` or JS execution override. react-pdf defaults JS execution to disabled. |
| 4 | `workerSrc` set explicitly | ✅ PASS | `PdfRenderer.tsx` module scope: `pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs"` — co-located with `<Document>`. No CDN/unpkg fallback. |
| 5 | All heavy renderers lazy-loaded via `next/dynamic({ssr:false})` | ✅ PASS | `index.tsx`: `PdfRenderer` and `ContentRenderer` both wrapped in `dynamic(() => import(...), { ssr: false })`. `ImageRenderer` is lightweight (no heavy deps) — loaded eagerly as intended. |
| 6 | `agent_access` gate enforced before ANY fetch/render; absent field → metadata_only | ✅ PASS | `index.tsx`: First operation checks `asset.agent_access ?? "metadata_only"` against RESTRICTED_ACCESS set. Returns `<AccessRestrictedPlaceholder>` immediately with no fetch for "none" or "metadata_only". |
| 7 | Error tile + download link on any failure or non-200 proxy response | ✅ PASS | `ErrorTile.tsx` used by all renderers. `ImageRenderer` has `onError` → ErrorTile. `PdfRenderer` has `onLoadError` → ErrorTile. `ContentRenderer` has `fetchError` state → ErrorTile. Each error tile includes `<a href={originalUrl} download>Download original</a>`. |

---

## Files Created/Modified

### New files
```
web/features/assets/components/AssetViewer/
  index.tsx                        — dispatcher (P4A-001)
  ImageRenderer.tsx                — raster + SVG (P4A-002)
  PdfRenderer.tsx                  — react-pdf 10.4.1 (P4A-003)
  ContentRenderer.tsx              — @miethe/ui ContentPane (P4A-004, P4A-005)
  AccessRestrictedPlaceholder.tsx  — agent_access gate UI
  ErrorTile.tsx                    — shared error tile

web/public/pdf-worker/
  pdf.worker.min.mjs               — pdfjs-dist v5 worker (served statically)
```

### Modified files
```
web/package.json    — added react-pdf@10.4.1, lowlight@3.3.0, highlight.js@11.11.1,
                      react-hook-form (peer dep fix), zod (peer dep fix)
web/package-lock.json — updated lockfile
```

### Left untouched (as specified)
```
web/app/globals.css
web/tailwind.config.ts
web/next.config.mjs
web/features/assets/components/AssetPreview.tsx  — kept as compatibility shim
web/features/ui/                                 — not touched
```

---

## Deviations from Plan

1. **Worker extension `.mjs` not `.js`**: pdfjs-dist@5.4.296 ships `pdf.worker.min.mjs` (ESM). The plan text says `/pdf-worker/pdf.worker.min.js`. Correct deviation: referenced as `.mjs` to match the actual file. ESM workers are supported by all modern browsers.

2. **`next/image` with `unoptimized={true}`**: The plan says "use next/image with object-fit: contain". `next/image` requires `remotePatterns` configuration in `next.config.mjs` for external URLs. Since `next.config.mjs` is out-of-scope for this phase, `unoptimized={true}` is used as a bridge approach — it preserves the `next/image` API while avoiding the remote-patterns constraint. This is explicitly noted in the component as an MVP trade-off.

3. **warmHighlightCache() location**: Called in `ContentRenderer.tsx` at module scope rather than at "app startup". Since ContentRenderer is lazy-loaded, it runs on first use rather than at page load. This is optimal given the file-scope constraint (cannot modify providers.tsx or layout.tsx). The cold-flash only occurs the first time ContentRenderer loads in a session.

4. **highlight.js CSS import location**: Imported in `ContentRenderer.tsx` (lazy-loaded module) rather than a global entry. CSS loads with the component that needs it. Since AA is light-only and ContentRenderer is the only consumer of syntax highlighting, this is correct.

5. **Pre-existing build blocker fixed**: `react-hook-form` and `zod` (missing @miethe/ui peer deps) were installed to unblock the build. These were absent before P4a and caused a pre-existing `Module not found` error.

6. **Language validation**: ContentPane/lowlight handles unknown language validation internally (falls back to plain text — never throws). No additional language validation layer is implemented in ContentRenderer, matching the @miethe/ui README statement: "Without lowlight, code renders as plain text with no error or warning."
