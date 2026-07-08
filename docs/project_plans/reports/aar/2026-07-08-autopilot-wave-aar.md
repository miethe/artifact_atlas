# AAR — Autopilot Planning Wave (Artifact Atlas, 2026-07-08)

---
type: aar
project: artifact_atlas
date: 2026-07-08
feature: autopilot-planning-wave
commit: 831b2e7
status: final
---

## What happened

A single autopilot session took the 2026-07-08 planning-status report and shipped the
entire queued design-spec backlog to main in one squash commit (`831b2e7`):

- **Dark-mode design-token foundation** (DM-1/3/4, flag-gated OFF; DM-2 blocked upstream
  on `@miethe/ui` dark variants) with an analytically AA-verified palette.
- **Facelift P2 completed** (10 items shipped, P2-5 verified superseded by EntityModal)
  plus 3 cheap P3 items (publish destination, board groupBy, pulse dot).
- **AssetViewer extensions** (D-014): CSV/TSV, audio, video renderers + RFC 7233 Range
  streaming; ZIP/XLSX stay deferred pending library verification.
- **P6/F-002 closed**: flags-ON Playwright project (36 specs) + live axe sweeps
  (light + dark), which found and fixed two real production bugs (EntityModal focus
  return; ZoneCard swallowing mouse click-to-open on Assets/Templates).
- **Security hardening from an external Codex review**: `agent_access` policy gate on
  the preview content/cache endpoints (critical, pre-existing gap widened by the wave),
  Content-Disposition CRLF hardening, Range pre-validation, shortcut guards.
- **Planning artifacts reconciled**: 4 progress files' checkbox drift fixed, spec/PRD
  statuses updated, F-004/F-005/F-006 findings recorded.

Final gates: tsc 0 errors · vitest 89/89 · pytest 604 · Playwright 43/43 (both
projects) · visual-fidelity pass against the spec-package mockups.

## Delegation profile

9 delegated legs: 5 on ICA (`claude-sonnet-5[1m]` ×4, free-tier Haiku ×1 for docs),
3 in-session Sonnet agents (dark tokens, e2e/axe authoring, review-fix), 1 Codex
gpt-5.5 read-only review. Routing resolved and audit-logged via `delegation-router`.
Orchestrator (Fable 5) did no mechanical implementation — scoping, adjudication,
integration, commits, and gates only.

## What worked

1. **Adversarial verification earned its cost twice.** The Codex second-opinion review
   found a genuine critical (unenforced `agent_access` on the preview proxy — verified
   real by cross-checking the policy-gated convention in `assets.py`, not taken on
   faith). Live e2e authoring found two UI bugs that unit tests and static a11y passes
   had masked for weeks.
2. **The visual-fidelity protocol** (structural-selector capture → mockup comparison →
   adjudicate {real/artifact/misread/accepted}) produced 1 real fix, 1 new tracked
   finding (F-006), and correctly dismissed 2 capture artifacts instead of "fixing" them.
3. **Scoped file-ownership per parallel leg** (explicit do-not-touch lists) allowed 4
   concurrent legs editing one working tree with zero merge conflicts.
4. **Free/cheap offload worked**: all mechanical implementation ran on ICA (cost-shifted)
   or session Sonnet; the docs reconciliation ran on free-tier Haiku with a fully
   itemized brief and verified perfectly.

## What didn't

1. **ICA turn caps were too tight for multi-item waves.** Both 70–80-turn legs (8 items,
   3-format implementation) died at `--max-turns` with no completion report. Recovery:
   resume legs with narrowed "verify what's done, finish the rest, report FIRST" briefs —
   both recovered cleanly and cheaply. **Lesson: cap ICA legs at ~6 S/M items or budget
   100+ turns, and always require the report be written before final polish so a
   cap-kill leaves evidence.**
2. **One transient ICA gateway drop** ("Server error mid-response" at turn ~1) — the
   documented retry-once pattern resolved it; no prompt changes needed.
3. **LSP diagnostics were persistently stale** across parallel-agent batches (repeated
   phantom module-resolution errors). The project rule — never react without an
   authoritative `tsc --noEmit` — was validated every single time.
4. **`next lint` is a dead gate**: no ESLint config has ever existed in this repo. Either
   stand one up or drop the script.

## Follow-ups (tracked)

- F-004: `AssetViewer mode="full"` has no live mount point — docx/pptx/audio/video real
  rendering paths have zero live browser exercise.
- F-005: 6 pre-existing serious/critical axe rule categories (allowlisted, gate stays
  strict on new violations).
- F-006: Inbox flag-on layout wastes the vacated preview/classification panes.
- DM-2: upstream `@miethe/ui` dark variants — dark-mode flag stays OFF until it lands.
- DEFER-4 remainder: ZIP and XLSX viewers pending library verification.
- ESLint config decision.
