# Steward handoff

## Node plan — node_01M0ZM87FGG2BDXX55CJBYCDEW

Implement the estate document/link ledger as a writer-first, zero-model Atlas
integration. Reuse the existing `atlas import-url` and report-import paths for
capture so document producers record title, URL/path, provenance, project, and
tags without fetching remote content. Extend the mechanical backfill only
through the same importer, dry-run by default and preserving source files.
The IntentTree Command Center remains the sole portal reader: it should project
the canonical Atlas registry read-only through a same-origin integration, never
become a competing registry. Verify W1 with focused writer tests, W2 with the
fleet/backfill tests, and W3 against the portal integration contract; record
AC evidence before leaving both nodes in `waiting_review`.

## Required acceptance criteria

- W1: two producer lanes automatically register documents into Atlas, measured
  by rows written over a three-day window.
- W2: existing reports/artifacts are indexed and all 26 fleet project rows
  exist.
- W3: newer ITT Command Center contains one read-only Atlas projection with no
  model calls on its read path.

## Completion record

PR title: `feat(atlas): M4 portal projection + document/link ledger capture and backfill`

Changed paths:

- `api/tests/conftest.py` — keep temporary report/backfill tests empty despite
  the canonical seed's backfilled delivery-report cohort; associated links and
  events are excluded too.
- `.operator/runs/op_run_20260909_033637_implement-atlas-m4-porta/run.json` —
  required Operator route/tier run record.
- `STEWARD-HANDOFF.md` — this handoff.

Focused verification:

- `cd api && python3 -m pytest -q` — PASS: 801 passed, 2 skipped.
- `cd web && npm run test && npm run build` — BLOCKED before tests: `vitest`
  is not installed in this worktree (`sh: vitest: command not found`).
- `python3 scripts/seed_fleet_projects.py ... --json` and
  `python3 scripts/backfill_reports.py ... --json` — dry-run only; source
  data was not mutated.

Acceptance-criteria status:

- Node `node_01M0ZNS919Y1RMZ9RH7N2AP17K`: AC1/AC2 VERIFIED as already landed
  in PR #9 (`328510f`); AC3 BLOCKED by the read-only IntentTree/deployment
  boundary (existing blocker `node_01M19M2MHHYSCB6NCD66MCBSXT`).
- Node `node_01M0ZM87FGG2BDXX55CJBYCDEW`: W1 BLOCKED — Atlas has the writer
  primitives, but two named producer hooks and a three-day measurement are
  outside this repository. W2 PARTIAL — backfill/seeding paths are covered by
  the passing suite, but the checked export contains 25 project rows (not 26)
  and the live node remains authoritative. W3 BLOCKED by the same IntentTree
  proxy/page deployment dependency.
