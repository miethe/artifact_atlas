# P1 — Design-System Foundation: Completion Note

**Phase**: P1 (HARD GATE) · **Implemented by**: ui-engineer-enhanced (Mode C, P1 scope)
**Date**: 2026-06-21
**Result**: All P1 self-verify gates pass. No git commit performed (orchestrator commits).

---

## Per-task status

| Task | Status | Notes |
|------|--------|-------|
| P1-002 — dep + build config | DONE | `@miethe/ui@^0.6.0` added to `package.json` deps (installed cleanly from configured registry — no workspace link needed). `transpilePackages: ["@miethe/ui"]` added to `next.config.mjs`. `serverExternalPackages` NOT added (no SSR-side use of the package; smoke screen is in a client component). |
| P1-003 — shadcn token bridge | DONE | Additive HSL-triplet block added to existing `:root` in `app/globals.css`. No AA hex token renamed/removed. |
| P1-004 — Tailwind dist glob | DONE | `./node_modules/@miethe/ui/dist/**/*.{js,mjs}` added to `content` in `tailwind.config.ts`. Plus shadcn color theme keys added (required for `bg-background` etc. to survive purge — see deviation 1). |
| P1-005 — @codemirror/state single instance | DONE | `overrides: { "@codemirror/state": "^6.4.0" }`. `npm ls` shows exactly ONE version (6.6.0, overridden). |
| P1-006 — lucide-react / tailwind-merge dedup | DONE | `overrides` pin `lucide-react: ^1.21.0` and `tailwind-merge: ^3.6.0` (AA's newer majors). Both resolve to a single version. |
| P1-007 — ContentPane smoke screen | DONE | `lib/flags.ts` (`isFlagEnabled` + `miethe-ui-ds` flag, dev-default ON). `features/assets/AssetDetail.tsx` renders `ContentPane` from the `@miethe/ui/content-viewer` SUBPATH behind the flag, with a static markdown string, in the already-client AssetDetail component. |

---

## Chosen override versions

```json
"overrides": {
  "@codemirror/state": "^6.4.0",
  "lucide-react": "^1.21.0",
  "tailwind-merge": "^3.6.0"
}
```

Rationale: AA pre-declared `lucide-react ^1.21.0` and `tailwind-merge ^3.6.0` (newer than @miethe/ui's pins of `^0.575.0` / `^2.5.4`). Verified safe to force to AA's versions:
- **lucide-react**: all 42 distinct lucide icon names imported by `@miethe/ui/dist` exist in `lucide-react@1.21.0` (zero missing — checked programmatically against the installed package).
- **tailwind-merge**: runtime className-merge utility, API-stable for the `twMerge`/`cn` usage across v2→v3.
- **@codemirror/state**: already deduped to 6.6.0 pre-override; override added per the @miethe/ui README to guarantee it stays single (ContentPane editor mode throws on multiple instances).

## tsc baseline vs after

- **Baseline (pre-P1)**: `0` errors (`tsc --noEmit`, filtered for `__tests__/a11y/` per project LSP rule).
- **After P1**: `0` errors. Zero new errors introduced.

## Build result

`npm run build` → **succeeds**. "Compiled successfully in 7.6s". All 14 routes generated. No transpilePackages warning, no ESM/'use client' warning, no CSS purge warning. Asset detail route First Load JS = 189 kB (ContentPane bundled).

## `npm ls @codemirror/state` output

```
└── @codemirror/state@6.6.0 overridden
```
Exactly **one** resolved version.

## Exact shadcn vars added (to `app/globals.css` :root)

HSL channel triplets (`H S% L%`) — required because `@miethe/ui` consumes them via `hsl(var(--X))` both as Tailwind utility classes (`bg-background`) and raw inline values:

```
--background: 0 0% 100%;          --foreground: 221 39% 11%;
--card: 0 0% 100%;                --card-foreground: 221 39% 11%;
--popover: 0 0% 100%;             --popover-foreground: 221 39% 11%;
--primary: 221 83% 53%;           --primary-foreground: 0 0% 100%;
--secondary: 0 0% 100%;           --secondary-foreground: 221 39% 11%;
--muted: 218 21% 93%;             --muted-foreground: 219 10% 40%;
--accent: 0 0% 100%;              --accent-foreground: 221 39% 11%;
--destructive: 0 84% 60%;         --destructive-foreground: 0 0% 100%;
```

The remaining shadcn keys from the Quality Gates (`--border`, `--input`, `--ring`) are satisfied at the **Tailwind theme layer** rather than as new CSS vars (see deviation 2): `input → var(--border)`, `ring → var(--border-focus)`, and AA's pre-existing `border.DEFAULT → var(--border)` covers `border-border`.

## Deviations from the literal phase-plan instruction

1. **Tailwind theme color keys were required (not just the dist glob).** The phase plan's P1-004 only mentioned the dist content glob, but `@miethe/ui` uses Tailwind utility classes (`bg-background`, `text-muted-foreground`, `border-input`, `ring-ring`, etc. — 600+ occurrences in dist). Those classes only exist if the Tailwind theme defines matching color keys. Added a shadcn color block to `tailwind.config.ts` mapping each key to `hsl(var(--X))`. Without this, the classes purge and components render unstyled — so this was necessary to satisfy AC P1-A.

2. **Token bridge values are HSL triplets, and `--border` was NOT redefined.** The phase-plan mapping table said `--background → --surface` etc. (implying re-aliasing to AA's hex vars). That cannot work literally: `@miethe/ui` wraps these in `hsl(...)`, and `hsl(#ffffff)` is invalid. So the bridge defines HSL channel triplets matching the AA hex palette values instead of aliasing the hex vars. Critically, **`--border` was kept as AA's hex** — AA uses `var(--border)` directly in ~240 places expecting a hex value; redefining it to an HSL triplet would have broken all of them. `@miethe/ui` only consumes `--border` via the `border-border`/`border-input` Tailwind classes (never raw `hsl(var(--border))`, verified in dist), so the hex value works for the library too. `input`/`ring` are likewise wired to AA hex vars via the Tailwind theme. The shadcn `--destructive` is `0 84% 60%` (= `#ef4444`, the AA `--red-500`), matching the plan's `--destructive → #ef4444`.

3. **No `serverExternalPackages`.** P1-002 said "if any SSR-safe modules are used server-side." None are — the only `@miethe/ui` consumer is the client-component AssetDetail. Omitted intentionally.

## AC P1-A visual evidence note

`visual_evidence_required: true` for AC P1-A (screenshot of ContentPane rendering with AA palette, not gray). A static screenshot was not captured in this headless sprint. The build-level proof is in place (token bridge resolves, classes survive purge, no unstyled fallback in compiled CSS). Visual review sign-off (P1-007 / P6-004) should confirm on the running dev server at the Asset Detail page with `miethe-ui-ds` on (default in dev).

## Files changed

- `web/package.json` — `@miethe/ui` dep + `overrides` block
- `web/package-lock.json` — regenerated by `npm install`
- `web/next.config.mjs` — `transpilePackages`
- `web/app/globals.css` — additive shadcn HSL-triplet bridge block
- `web/tailwind.config.ts` — dist content glob + shadcn color theme keys
- `web/lib/flags.ts` — new minimal feature-flag helper
- `web/features/assets/AssetDetail.tsx` — flagged ContentPane smoke screen (subpath import)
