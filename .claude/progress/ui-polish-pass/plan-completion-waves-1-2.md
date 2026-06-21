# UI Polish Pass — Wave Completion Report (Waves 1–2, through P4a)

**Plan**: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md (Tier 3)
**Run scope**: "complete phases in waves, completing through phase p4a or similar"
**Date**: 2026-06-21
**Base**: P5-P0 facelift (already merged, `fa78ee6` / `4285699`)
**Landing pointer (squash-merge → main)**: `c51a202c278ce5512b3e6a3f988cccff6d522be0`
**Branch (squashed, deleted)**: `feat/ui-polish-p1-p4a` — granular commits `4b4f003` (P1), `7615147` (P2a+P4a)

---

## Per-wave summary

| Wave | Phases | Execution | Isolation | Reviewer verdicts |
|------|--------|-----------|-----------|-------------------|
| 1 | P1 (design-system foundation, HARD GATE) | in-session `ui-engineer-enhanced` (opus) | branch | task-completion-validator APPROVED · karen mid-feature APPROVED |
| 2 | P2a (modal pattern) ∥ P4a (AssetViewer) | P2a in-session `ui-engineer-enhanced` (opus); **P4a delegated to ICA `claude-sonnet-4-6[1m]`**, re-gated in-session | branch | P2a: a11y-sheriff PASS + validator APPROVED. P4a: code-reviewer security PASS (7/7) + validator APPROVED + karen mid-feature APPROVED |

**Delegation split** (per ica-delegate "split that works"): design-system/CSS (P1) and the taste-critical canonical modal pattern (P2a) stayed in-session; the spec-complete, bounded AssetViewer build (P4a) was cost-shifted to free-tier ICA and fully re-gated in-session (security checklist verified against code, not the delegate's self-attestation).

## Authoritative gates (all re-run in-session on merged main)

- `tsc --noEmit`: **0 errors** (filtered for pre-existing `__tests__/a11y/`).
- `npm run build`: **succeeds, 15/15 routes** (new `/projects/[projectId]/detail/[type]/[id]`); no transpilePackages/ESM/'use client'/purge warnings.
- `npm ls @codemirror/state`: **single version** (6.6.0, overridden) — holds across @miethe/ui + react-pdf + lowlight.
- `npm run test` (vitest): **75/75 pass** (7 files). Pre-existing `act()` warnings in CommandPalette only.
- `npm run lint`: unconfigured in repo (`next lint` not set up) — pre-existing, not a regression.

## Key deviations (all reviewer-adjudicated as acceptable)

1. **@miethe/ui uses lowlight, not Shiki** (per upstream v0.6.0 README). P4a installs `lowlight@3.3.0` + `highlight.js@11.11.1` (`github.css`, light) + `warmHighlightCache()` for real syntax-highlight color. Plan text said "shiki" — outdated.
2. **Token bridge as HSL channel triplets** (not hex aliases) because @miethe/ui wraps in `hsl()`; `--border`/`--input`/`--ring` kept as AA hex (wired via Tailwind theme) to protect ~240 direct `var(--border)` usages. Tailwind shadcn color keys added (purge survival) beyond the dist glob.
3. **npm `overrides`** dedup `@codemirror/state` (^6.4.0), `lucide-react` (^1.21.0), `tailwind-merge` (^3.6.0) — AA's newer majors; verified all 42 lucide icons @miethe/ui imports exist.
4. **`react-hook-form ^7.80.0` + `zod ^4.4.3`** added — genuine @miethe/ui peerDependencies (surfaced once P2a's `@miethe/ui/primitives` entered the tree).
5. **PDF worker `.mjs`** (pdfjs-dist v5 is ESM-only) served locally; **`prebuild` script** (`web/scripts/copy-pdf-worker.mjs`) re-copies it from `node_modules` each build — closes karen's P4A-003 version-staleness gap.
6. **`next/image` `unoptimized`** as an MVP bridge (next.config out of P4a scope).

## Carry-forward debt (non-blocking; for downstream phases)

- **P4a CI version assertion**: the prebuild copy script now self-heals the worker; a hard version-equality assertion (pdfjs-dist == react-pdf pin) can be added in P6 hardening.
- **AssetViewer is orphaned by design** — `AssetPreview` stub still wired in `AssetDetail.tsx` + `AssetDrawerContent.tsx`. A downstream phase (P2b/P3) must replace it.
- **ContentRenderer `onSave` is a no-op** pending a write endpoint (OQ-4 preview-only) — surface before P6.
- **ErrorTile download link hidden in thumbnail mode** — P6 polish note.
- **AC P1-A visual screenshot** (ContentPane palette) not captured headlessly — build-proven; both reviewers ruled non-blocking; hard visual sign-off is P1-007/P6-004 on a running dev server (`miethe-ui-ds` flag dev-default ON).
- **No EntityModal/AssetViewer-specific axe tests yet** — deferred to P6-003 per plan.

## Remaining phases (not in this run)

P2b (surface migration) → P3 (card redesign) → P4b (DOCX) ∥ P4c (PPTX seam) → P5-P1 (facelift) → P6 (hardening + final visual/a11y gates + PR).
