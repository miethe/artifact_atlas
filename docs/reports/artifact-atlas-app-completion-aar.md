---
title: "AAR — Artifact Atlas App Completion (MVP)"
doc_type: report
report_category: aar
status: final
created: 2026-06-20
feature_slug: artifact-atlas-app-completion-v1
plan_ref: docs/project_plans/implementation_plans/features/artifact-atlas-app-completion-v1.md
related:
  - .claude/progress/artifact-atlas-app-completion-v1/plan-completion.md
---

# After-Action Review — Artifact Atlas App Completion (MVP)

## What we set out to do

Execute the full XL implementation plan that turns the Artifact Atlas scaffold (static Next.js shell + minimal FastAPI + seed JSONL) into a working local-first MVP: registry-backed API, web app (asset library / inbox / BOM / coverage / context packs), template-driven Artifact BOM, read-first CLI + MCP agent gateway, and local-first integration export seams. Directive: **commit per phase to `main`, using workflow orchestration**, in ultracode mode.

## What we delivered

A working, tested local-first MVP on `main` (HEAD `a48f620`), built in 6 phases + a remediation pass:

- **Backend** (~12.8K LOC + ~9.4K test LOC): Pydantic v2 models with a canonical vocabulary enum source of truth; atomic JSONL repositories (temp-file replace, tombstone delete, unknown-field preservation); services (assets/import/preview/policy/audit/BOM/coverage/context-packs); 10 FastAPI routers matching a 70-schema OpenAPI contract; `atlas` CLI; 8 read-first, policy-enforced, audited MCP tools. **555 pytest pass / 2 skip.**
- **Frontend** (~26K LOC): Tailwind design system + 13 shared atoms + app shell + command palette; 13 routes; asset library (filters/gallery/table/detail), inbox triage, feature board, BOM overview + slot interactions, coverage/gaps, inbox→BOM mapping, context-pack builder; React Query hooks with demo-fixture fallback. **typecheck + build clean; 75 vitest tests + 7 Playwright E2E.**
- **Integrations** (local-first, drafts/refs only): MeatyWiki cards + decision notes, IntentTree node adapter + gap→task suggestion payload, SkillMeat refs, CCDash event export, Control Plane snapshot.

Diff vs the baseline scaffold: **253 files, +60K lines.** Nine clean per-phase/fix commits on `main`.

## What went well

1. **Frozen Phase-0 contracts were the coherence anchor.** Locking the OpenAPI surface + canonical vocabulary enums in Phase 0 let later parallel agents (who can't see each other's in-flight work) stay mutually consistent. Every downstream layer referenced the same contract.
2. **The orchestration shape held up.** Sequential layered fan-out for the backend (models→repos→services→routes, each writing its own tests) and parallel-by-file-ownership for frontend feature modules produced **0 fix rounds on all six per-phase reviewer gates**. File-ownership batching (disjoint dirs/files) made parallelism conflict-free.
3. **Adversarial verification earned its cost.** A read-only `task-completion-validator` per phase that *runs the real gate commands*, plus Opus re-running pytest/tsc/build before every commit, kept each commit genuinely green. The Tier-3 `karen` gate then caught what per-phase gates missed (below).
4. **Commit-per-phase to `main`** gave durable, reviewable checkpoints — nothing was ever at risk of being lost, and each commit message is a faithful phase record.

## What didn't go well / what we missed

1. **Per-phase verifiers passed two release-gate claims that were literally false** — CCDash event export was *dead code* (a real writer with zero runtime callers) and destructive-action audit was *mislabeled* (`delete_asset` emitted `asset_promoted`; link/project/template deletes emitted nothing). They passed because the phase-4 acceptance leaned on **unit tests that instantiate clients directly** rather than asserting the code is *wired into a runtime path* and that the artifact actually appears on disk. The Tier-3 gate caught all of it. **This is the headline lesson.**
2. **Context-pack Markdown export was simply not built** (YAML only) despite being an explicit acceptance criterion — the per-phase gate didn't cross-check the AC wording ("YAML *and* Markdown").
3. **Runtime smoke tests polluted the real registry.** CLI `pack build` / event recording wrote to `registry/*.jsonl` and `exports/events/` because they default to repo paths; caught and cleaned twice, then prevented by isolating via `ATLAS_REGISTRY_DIR`/`ATLAS_EXPORTS_DIR`.
4. **LSP (Pyright) diagnostics were persistently stale** (unaware of `pythonpath=["."]`), firing import-resolution false positives after every batch. Trusting the authoritative gates (`pytest`/`tsc`) per the project's lsp-diagnostics rule was the correct and necessary discipline.

## Lessons / process changes

- **Export & integration gates need a "runtime-caller + artifact-on-disk" smoke, not just unit tests.** Any gate of the form "X export works in local-first mode" must drive a real audited/triggered action and assert the output file appears — and ideally grep that a runtime caller of the writer exists. Add this to completion-criteria for integration/export work. (This single check would have caught finding #1 at phase 4.)
- **Verifiers must cross-check AC wording literally** (e.g. "YAML and Markdown") — a structured AC↔implementation check beats prose verification.
- **Standardize runtime isolation in verifier/agent prompts**: any CLI/runtime smoke sets `ATLAS_REGISTRY_DIR`/`ATLAS_EXPORTS_DIR` to a temp dir. Bake into the workflow SHARED context.
- **A Tier-3 end-of-feature gate (karen) is worth its cost** even when every per-phase gate is green — it's the difference between "claims complete" and "actually complete." Keep it mandatory for XL plans.

## Metrics

- ~38 subagent runs across 6 phase workflows + 1 remediation workflow + 1 karen review; ~3.5M subagent output tokens; ~165 min cumulative workflow wall-clock.
- 0 fix rounds on all six per-phase gates; 1 fix round total (inside karen remediation).
- Final gates: 555 pytest / 2 skip · tsc clean · next build 14 routes · 75 vitest · 7 Playwright E2E · export-validation 8 files/0 errors.

## Recommended next actions

1. Human visual-fidelity pass over the 11 MVP screens at 1672×941 / 1440×900 / 1280×800 (Playwright visual specs scaffolded).
2. Run the perf baseline against `fixtures/perf/10k` (approach documented in `fixtures/perf/README.md`).
3. Pilot with ~25 real ChatGPT image outputs per `docs/pilot-checklist.md`.
4. **Phase 6 (v1 expansion)** when ready: AI suggestions, semantic search (pgvector), live connectors, hosted/Docker mode, and the JSONL→SQLite/Postgres migration (path designed in ADR D-007).
