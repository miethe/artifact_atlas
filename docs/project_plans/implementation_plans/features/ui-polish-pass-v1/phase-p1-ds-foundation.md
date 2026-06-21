---
schema_version: 2
doc_type: phase_plan
title: "P1: Design-System Foundation — UI Polish Pass"
status: draft
created: 2026-06-20
updated: 2026-06-20
phase: P1
phase_title: "Design-System Foundation"
feature_slug: ui-polish-pass
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
entry_criteria:
  - "@miethe/ui@0.6.0 available (npm publish or workspace file: link)"
  - "tsc --noEmit baseline recorded (pre-P1 error count)"
exit_criteria:
  - "ContentPane smoke screen renders with correct tokens on one feature-flagged page"
  - "tsc --noEmit passes (zero new errors vs baseline)"
  - "next build passes with no new transpilePackages/ESM warnings"
  - "npm ls @codemirror/state shows exactly one resolved version"
  - "task-completion-validator gate passes"
  - "karen mid-feature gate passes (P1 is the hard gate milestone)"
integration_owner: null
---

# P1: Design-System Foundation

**Estimate**: 8 pts
**Depends on**: None (prerequisite: `@miethe/ui@0.6.0` publish)
**Blocks**: All other phases — this is the HARD GATE
**Assigned Subagent(s)**: `frontend-architect` (design decisions), `ui-engineer-enhanced` (implementation)
**Model routing**: `frontend-architect` → opus (medium effort); `ui-engineer-enhanced` → sonnet (high effort)

> ADR-1: Adopt @miethe/ui via token-bridge, subpath imports, v0.6.0
> Risk 1 (token-bridge adoption) and Risk 2 (@miethe/ui@0.6.0 publish dependency) both land here.
> Do NOT start P2, P3, or P4 until this phase's exit gate is confirmed.

---

## Context

AA's `app/globals.css` defines no shadcn semantic tokens. Any `@miethe/ui` component that references `--background`, `--foreground`, `--card`, `--primary`, etc. renders unstyled. The SPIKE adversarial verify confirmed ~330 shadcn class references resolve to CSS vars AA lacks. Additionally:
- `@codemirror/state` must be a single instance or ContentPane throws runtime errors
- The root barrel `@miethe/ui` has no `'use client'` directive; it cannot be imported from Server Components
- `lucide-react` and `tailwind-merge` may have major-version duplicates after adding `@miethe/ui`
- The `dist/` content glob must be added to Tailwind's `content` array or library classes will be purged

---

## Task Breakdown

| Task ID | Task Name | Description | Estimate | Subagent(s) | Model | Effort | Dependencies |
|---------|-----------|-------------|----------|-------------|-------|--------|--------------|
| P1-001 | Confirm @miethe/ui@0.6.0 availability | Verify npm publish or configure `file:` / pnpm-workspace link to skillmeat package. Document which approach in plan notes. This is a prerequisite; block the phase if unresolved. | 0.5 pts | frontend-architect | opus | adaptive | None |
| P1-002 | Add @miethe/ui dependency + build config | Add `@miethe/ui@0.6.0` to `package.json`. Add to `transpilePackages` in `next.config.*`. Add to `serverExternalPackages` if any SSR-safe modules are used server-side. | 1 pt | ui-engineer-enhanced | sonnet | adaptive | P1-001 |
| P1-003 | Author shadcn token bridge in globals.css | Add shadcn-compatible CSS var block to `web/app/globals.css` (`:root` scope, additive — do NOT rename existing `--ink*`, `--surface`, `--brand`, `--status-*` tokens). Map shadcn vars to AA palette: `--background` → `--surface`, `--foreground` → `--ink`, `--card` → `--surface-raised`, `--primary` → `--brand-500`, `--muted` → `--bg-subtle`, `--muted-foreground` → `--ink-muted`, `--border` → `--border`, `--input` → `--border`, `--ring` → `--border-focus`, `--destructive` → `#ef4444`, etc. Full mapping per SPIKE ADR-1. | 2 pts | frontend-architect | opus | medium | P1-002 |
| P1-004 | Add dist content glob to tailwind.config.ts | Add `./node_modules/@miethe/ui/dist/**/*.{js,mjs}` to the `content` array in `web/tailwind.config.ts`. Verify no purge warnings after adding. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P1-003 |
| P1-005 | Resolve @codemirror/state single-instance | Add `overrides` (npm) or `resolutions` (yarn/pnpm) in `package.json` to pin `@codemirror/state` to a single version. Add CI assertion: `npm ls @codemirror/state 2>&1 \| grep -c "deduped\|@codemirror/state@" > 1 && echo "FAIL: multiple @codemirror/state" && exit 1`. | 1 pt | ui-engineer-enhanced | sonnet | adaptive | P1-002 |
| P1-006 | Resolve lucide-react / tailwind-merge duplicates | Check `npm ls lucide-react tailwind-merge` for major-version conflicts after adding `@miethe/ui`. Apply `overrides` or `resolutions` as needed. Document the resolved versions. | 0.5 pts | ui-engineer-enhanced | sonnet | adaptive | P1-002 |
| P1-007 | ContentPane smoke screen on one feature-flagged page | Import `ContentPane` from `@miethe/ui/content-viewer` (subpath import — NOT root barrel) on one flagged page (e.g., Asset Detail behind `flag:miethe-ui-ds`). Render with a static markdown string. Confirm: (a) tokens render correctly (no unstyled/gray-box), (b) `tsc --noEmit` passes, (c) `next build` passes, (d) no CSS purge warnings. Visual review sign-off required before P2 starts. | 2 pts | ui-engineer-enhanced | sonnet | high | P1-003, P1-004, P1-005, P1-006 |
| P1-008 | task-completion-validator gate | Run `task-completion-validator` against all P1 exit criteria. | — | task-completion-validator | (default) | — | P1-007 |

---

## Acceptance Criteria

### AC P1-A: Token bridge is additive and complete

- target_surfaces:
    - web/app/globals.css
    - web/tailwind.config.ts
    - web/next.config.ts (or next.config.js)
    - web/package.json
- propagation_contract: Shadcn CSS vars defined in globals.css `:root` block; consumed by @miethe/ui component classes via Tailwind's CSS-var resolution. No AA existing token is renamed or overwritten.
- resilience: If a shadcn var is missing (mapping gap), @miethe/ui component renders with browser default (white/inherit), not a crash. Map all 14+ required vars per ADR-1.
- visual_evidence_required: Screenshot of ContentPane on flagged page showing correct AA palette colors (not gray/unstyled)
- verified_by: [P1-007, P6-004]

### AC P1-B: Build gates pass

- target_surfaces:
    - web/app/globals.css
    - web/tailwind.config.ts
    - web/next.config.ts
- propagation_contract: tsc --noEmit and next build invoked in CI; must produce zero new errors vs P1 baseline
- resilience: If next build fails due to ESM resolution, check transpilePackages; if tsc fails due to missing types, add @types declaration
- visual_evidence_required: false
- verified_by: [P1-007, P6-001, P6-002]

### AC P1-C: @codemirror/state single instance

- target_surfaces:
    - web/package.json (overrides/resolutions)
- propagation_contract: npm/pnpm resolves exactly one version of @codemirror/state; CI assertion script verifies this
- resilience: If deduplication fails, ContentPane editor mode will throw at runtime. CI assertion fails the build early.
- visual_evidence_required: false
- verified_by: [P1-005, P6-001]

### AC P1-D: Subpath imports only

- target_surfaces:
    - web/features/assets/AssetDetail.tsx (smoke screen import site)
    - Any other @miethe/ui import in the codebase
- propagation_contract: All @miethe/ui imports use granular subpaths (`@miethe/ui/primitives`, `/editor`, `/content-viewer`, `/diff`). No import of root barrel `@miethe/ui` from a Server Component.
- resilience: If a Server Component imports the root barrel, Next.js throws "You're importing a component that needs 'use client'". Catch this in code review and P6-001 tsc gate.
- visual_evidence_required: false
- verified_by: [P1-007, P6-001]

---

## Phase Quality Gates

- [ ] `@miethe/ui@0.6.0` resolves as a dependency (npm or workspace link documented)
- [ ] Shadcn CSS vars (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`) all defined in `globals.css`
- [ ] Tailwind `content` glob includes `@miethe/ui/dist/**/*.{js,mjs}`
- [ ] `next build` passes with no new warnings
- [ ] `tsc --noEmit` passes with zero new errors
- [ ] `npm ls @codemirror/state` shows exactly one resolved version
- [ ] ContentPane smoke screen renders with correct tokens (visual review sign-off)
- [ ] No `@miethe/ui` root barrel import from a Server Component
- [ ] `task-completion-validator` passes
- [ ] `karen` mid-feature gate passes (P1 hard gate milestone)

---

## Key Files

| File | Change Type | Notes |
|------|-------------|-------|
| `web/package.json` | Modify | Add @miethe/ui dependency + overrides for @codemirror/state, lucide-react, tailwind-merge |
| `web/next.config.ts` | Modify | Add transpilePackages, serverExternalPackages |
| `web/app/globals.css` | Modify | Add shadcn token bridge block (additive only) |
| `web/tailwind.config.ts` | Modify | Add dist content glob |
| `web/features/assets/AssetDetail.tsx` | Modify | Add ContentPane import + smoke screen (behind flag) |
