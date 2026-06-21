---
schema_version: 2
doc_type: design-spec
title: "Design Spec: Dark Mode — Artifact Atlas"
status: draft
maturity: idea
created: '2026-06-21'
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
