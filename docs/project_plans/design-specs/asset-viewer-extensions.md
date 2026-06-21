---
schema_version: 2
doc_type: design-spec
title: "Design Spec: Asset Viewer Extensions — Artifact Atlas"
status: draft
maturity: idea
created: '2026-06-21'
feature_slug: ui-polish-pass
source: "docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md (DEFER-4)"
defer_id: DEFER-4
defer_category: scope-cut
---

# Design Spec: Asset Viewer Extensions — Artifact Atlas

> **Maturity: idea** — This stub preserves deferred AssetViewer format support beyond the 6
> formats shipped in UI Polish Pass v1. Do NOT promote a format to `planned` until a
> verified-compatible library is confirmed for Next.js 15 / React 19.

---

## Summary

The v1 `AssetViewer` dispatcher ships support for **6 formats**: image (`next/image`), PDF
(`react-pdf`), Markdown (`@miethe/ui` ContentPane), code (ContentPane, shiki), DOCX
(`docx-preview`), and PPTX (server-side conversion → PDF). Additional preview formats — video,
audio, ZIP/archive, and spreadsheet — were explicitly out of scope.

The primary gate for adding any new format is confirming library compatibility with the project's
React 19 / Next.js 15 constraint. This constraint caused the PPTX client-side renderer to be
rejected (alpha, 26 MB, peerDep `^19.2.5` conflict) and replaced with server-side conversion.
The same verification step is required for each candidate format before promotion.

**Why deferred:** ADR-4 — formats beyond the 6 defined require a verified-compatible library.

---

## Promotion Trigger

A specific format's promotion trigger is: **a verified-compatible library** for that format is
confirmed against Next.js 15 / React 19, AND a product request or agent-access use case exists
for that format in the AA asset graph.

Promotion is per-format. Each format may be promoted and implemented independently as a new
renderer under `web/features/assets/components/AssetViewer/renderers/`.

---

## Scope Sketch

Candidate formats and implementation notes:

- **Video** (`.mp4`, `.webm`, `.mov`)
  - Browser native `<video>` element is likely sufficient — no third-party lib dependency.
  - Main concern: streaming large blobs through the preview proxy without buffering the entire
    file. Range-request support in the preview proxy seam may be required.
  - Renderer: thin wrapper around `<video controls>` with `src` from the preview proxy URL.

- **Audio** (`.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`)
  - Browser native `<audio>` element covers playback.
  - Nice-to-have: waveform visualization (e.g., `wavesurfer.js` — verify React 19 compat) and
    metadata display (title, duration, artist from ID3 tags via `music-metadata-browser`).

- **ZIP / archive** (`.zip`, `.tar.gz`, `.tar`)
  - Goal: directory listing view (file tree + entry count + total size), not full decompression.
  - Candidate library: `fflate` (WASM-free, MIT) or `JSZip` — verify React 19 / Next 15 compat.
  - Large archives should show entry count + truncated listing, not expand everything in-browser.

- **Spreadsheet** (`.xlsx`, `.csv`, `.tsv`)
  - CSV/TSV: plain text parse + TanStack Table render — no library needed beyond existing deps.
  - XLSX: `SheetJS` (`xlsx` npm package) is the standard choice; must verify React 19 / Next 15
    compatibility and check bundle size impact (SheetJS full build is ~750 KB).
  - Consider a server-side conversion path (XLSX → CSV) similar to PPTX → PDF to keep the
    client bundle thin.

**Implementation pattern for any new format:**
1. Add a MIME type / extension branch in `AssetViewer/index.tsx` (the dispatcher).
2. Author a new `renderers/<format>Renderer.tsx` co-located with existing renderers.
3. Apply the §3.5 security posture: `sanitize=true`, `fetchRelated: false`, no inline script
   execution, restrict renderer to the asset preview proxy URL.
4. Add the format to the P6-equivalent smoke-check list and the Playwright e2e suite.

---

## Open Questions

1. Does the preview proxy seam (`POST /api/preview/convert/*`) need to be extended for
   server-side spreadsheet conversion, or is client-side acceptable given typical XLSX sizes?
2. What is the file-size ceiling policy for in-browser video/audio streaming before a
   "download only" fallback is shown?
3. Is `wavesurfer.js` compatible with React 19 / Next 15? (Not yet verified.)
4. Is `SheetJS` acceptable from a license perspective? (Apache-2.0 for the community edition —
   verify no relicensing changes in recent releases.)
5. Should ZIP browsing support extracting and previewing individual entries inline, or is
   listing-only the correct scope?

---

## References

- **Parent plan / deferred table**: `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md` § Deferred Items Triage
- **ADR-4** (asset-viewer stack): `docs/project_plans/spikes/ui-polish-pass-spike.md` § ADR-4
- **Existing dispatcher**: `web/features/assets/components/AssetViewer/index.tsx`
- **PPTX server-side conversion precedent**: `web/features/assets/components/AssetViewer/renderers/PptxRenderer.tsx` + `api/routes/preview.py`
