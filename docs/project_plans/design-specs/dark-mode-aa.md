---
schema_version: 2
doc_type: design-spec
title: "Design Spec: Dark Mode — Artifact Atlas"
status: in_progress
maturity: idea
created: '2026-06-21'
updated: '2026-07-08'
feature_slug: ui-polish-pass
source: "docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md (DEFER-1)"
defer_id: DEFER-1
defer_category: scope-cut
---

# Design Spec: Dark Mode — Artifact Atlas

> **Maturity: idea** — This is a forward-looking stub to preserve deferred scope. It is NOT a
> commitment or an implementation spec. Do not promote without an explicit product direction change.

---

## Summary

Artifact Atlas is intentionally light-only. Dark mode was explicitly out of scope for the UI
Polish Pass v1 (ADR-5) for two compounding reasons:

1. **Token axis cost.** Dark mode requires an entirely new token layer — surface ramps, ink
   ramps, shadow scales, and interactive-state overlays all need dark variants. The existing
   `globals.css` carries a single `color-scheme: light` block with no dark token layer.

2. **Library dark styles are dead.** Leg-4/leg-5 discovery confirmed that `@miethe/ui`'s dark
   styles are not currently shipped. AA cannot roll a dark theme without upstream support or a
   full local fork — both are out of scope for a polish pass.

The upstream plan (`docs/project_plans/upstream/miethe-ui-additions-v1.md`) includes reactive
dark-mode in `MarkdownEditor` as a future upstream addition; that work must precede or accompany
any AA dark-mode effort.

**Why deferred:** ADR-5 rationale — "dark mode conflicts with AA's intentional light-only stance
and the library's dead dark styles — deferring avoids a whole token axis."

---

## Implementation Status (2026-07-08, WS-4)

The token-foundation slice of this spec landed, flag-gated `dark-mode` (default **off** —
`web/lib/flags.ts`). No app behavior changes unless the flag is explicitly enabled.

- **DM-1 (token layer) — done.** `web/app/globals.css` gained a `[data-theme="dark"]` block with
  dark variants for every `--surface*`, `--ink*`, `--border*`, `--focus-ring`, and shadow-color
  token (the four `boxShadow` entries in `web/tailwind.config.ts` now resolve through
  `var(--shadow-*)` pairs instead of hardcoded `rgb(0 0 0 / …)`, so they invert automatically).
  `color-scheme: dark` is set inside the block. Palette + computed WCAG 2.1 contrast ratios are
  documented inline in `globals.css` directly above the `[data-theme="dark"]` rule (summary:
  ink/ink-muted/ink-faint on surface all ≥5.2:1, border-strong/border-focus on surface ≥3.1:1).
  Raw palette swatches (`--gray-*`, `--blue-*`, `--status-*`, `--sens-*`) and the `@miethe/ui`
  shadcn bridge (`--background`, `--card`, `--popover`, etc.) are intentionally **not** themed yet
  — see DM-2 below and the gap note under DM-5.
- **DM-3 (stray `dark:` audit) — done, zero found.** `grep`-verified no `dark:`-prefixed Tailwind
  utility classes exist anywhere under `web/` (app, components, features, lib). Tailwind's
  `darkMode: ['selector', '[data-theme="dark"]']` (added to `tailwind.config.ts`) is therefore
  currently inert for utility classes — the dark theming works entirely through the CSS-variable
  layer above, which is the correct axis per DM-1's design (components reference `var(--surface)`
  etc. via arbitrary-value classes, so they repaint automatically without per-component `dark:`
  variants).
- **DM-4 (toggle) — done, flag-gated.** New `dark-mode` flag in `web/lib/flags.ts` (default
  `false`). When on: `web/components/shell/ThemeToggle.tsx` (a 3-way light/dark/system
  `SegmentedControl`) mounts in `web/components/shell/TopBar.tsx`; preference persists to
  `localStorage` (`aa-theme` key, see `web/lib/theme.ts`) and defaults to `"system"`. A tiny inline
  script in `web/app/layout.tsx` (only rendered when the flag is on) resolves the stored
  preference to a concrete `data-theme` attribute on `<html>` before paint — no FOUC. When the flag
  is off, the script never renders and `data-theme` is never set, so light stays forced exactly as
  before.
- **DM-5 (smoke/a11y pass) — partially done.** Token-level contrast is verified analytically (see
  DM-1 above and the ratio table in `globals.css`). A live `axe-core` sweep with the flag flipped
  on, plus visual QA of every surface with the toggle set to "dark", is **still pending** — the
  existing `__tests__/a11y.test.tsx` suite only exercises the light (default) theme.
- **DM-2 (`@miethe/ui` dark adoption) — blocked upstream, not attempted.** `@miethe/ui`'s shipped
  styles have no dark variant (confirmed dead in the leg-4/leg-5 audit referenced below), so
  `ContentPane`, `MarkdownEditor`, and other library primitives will **remain visually light**
  even with `dark-mode` on and `data-theme="dark"` set — a jarring light-panel-in-a-dark-shell
  seam is expected until upstream publishes dark tokens/variants. This is why the flag defaults
  off: flipping it today produces a functional but visually inconsistent theme. Do not attempt a
  local fork or workaround here; track upstream progress via
  `docs/project_plans/upstream/miethe-ui-additions-v1.md`.

**Net effect:** the foundation is in place and inert by default. Enabling `dark-mode` today is
useful for local smoke-testing the token layer and toggle wiring, but is not yet a shippable
end-user surface until DM-2 (upstream) and the full DM-5 a11y sweep land.

---

## Promotion Trigger

A product direction change that explicitly declares dark mode as a requirement for Artifact Atlas.
Minimum prerequisites before promotion to `planned`:

- `@miethe/ui` publishes a dark-mode token layer and dark `MarkdownEditor` variant.
- Product confirms whether to use system-preference-driven (`prefers-color-scheme`) or
  toggle-driven (`.dark` class) switching.
- Token bridge strategy for `globals.css` is documented (CSS custom property swap vs. separate
  class scope).

---

## Scope Sketch

When promoted, this spec should cover at minimum:

- **Token layer** — add a `@media (prefers-color-scheme: dark)` (or `.dark` selector) block in
  `globals.css` mapping all `--surface-*`, `--ink-*`, `--border-*`, and shadow tokens to dark
  values (surface → ~`#1a1d23`, ink → ~`#e5e7eb`).
- **`@miethe/ui` dark-mode adoption** — consume dark variants from upstream once published;
  confirm `ContentPane`, `MarkdownEditor`, and all shared primitives render correctly.
- **Tailwind `dark:` leak audit** — scan AA codebase for stray `dark:` utility classes that may
  have been added without a dark layer; remove or wire them.
- **Toggle surface** (if product prefers explicit toggle) — add a theme-switcher control to the
  shell and persist preference to `localStorage`.
- **Smoke/a11y pass** — axe-core sweep in dark mode; confirm contrast ratios meet WCAG 2.1 AA
  for all ink-on-surface pairings.

---

## Open Questions

1. Has `@miethe/ui` dark-mode landed upstream, or is it still planned?
2. System-preference-driven vs. explicit toggle — what does the product roadmap say?
3. Does the token bridge in `globals.css` support a `.dark` class scope, or only
   `prefers-color-scheme`?
4. Are there any surfaces (e.g., PPTX/PDF preview via server-side conversion) that are
   inherently light-only and need special treatment?

---

## References

- **Parent plan / deferred table**: `docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md` § Deferred Items Triage
- **ADR-5** (facelift scope, defer dark mode): `docs/project_plans/spikes/ui-polish-pass-spike.md` § ADR-5
- **Upstream plan**: `docs/project_plans/upstream/miethe-ui-additions-v1.md`
- **Leg-5 audit entry** (P3-1): `.claude/worknotes/ui-polish-pass/discovery/leg-5-facelift-audit.md` § P3
