---
type: progress
schema_version: 2
doc_type: progress
prd: delivery-report-hosting
feature_slug: delivery-report-hosting
phase: M2
phase_title: Scope linking from the envelope
status: completed
created: '2026-07-31'
updated: '2026-08-01'
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
context_class: C3
commit_refs:
- 7bbae04
pr_refs: []
owners:
- python-backend-engineer
contributors: []
depends_on:
- M1
routing_constraints:
- "Scope-attribution / link-target correctness MUST stay claude-primary \u2014 a wrong-node\
  \ link is a correctness failure (mirrors sibling PF-2 R1). No offload."
exit_criteria:
- Correct AssetLinks to subject + tracker_links[]; idempotent re-link; wrong/absent
  target fails loud.
tasks:
- id: M2-001
  description: "Ingest creates AssetLink rows to the envelope's `subject` AND every\
    \ `tracker_links[]` target (feature/project/intenttree_node) \u2014 multi-attach\
    \ on write (OQ-4 decision)."
  status: completed
  dependencies:
  - M1-001
  started: 2026-08-02T02:00Z
  completed: 2026-08-02T02:25Z
  evidence:
  - test: api/tests/test_report_link.py::TestReportLinkService
  verified_by:
  - pytest:api/tests/test_report_link.py (11 passed; full suite 655 passed/2 skipped)
- id: M2-002
  description: 'Idempotent re-link: a second ingest of the same report adds zero duplicate
    links.'
  status: completed
  dependencies:
  - M2-001
  started: 2026-08-02T02:00Z
  completed: 2026-08-02T02:25Z
  evidence:
  - test: api/tests/test_report_link.py::TestReportLinkService::test_report_link_second_ingest_adds_zero_duplicate_links
  verified_by:
  - pytest:api/tests/test_report_link.py (11 passed; full suite 655 passed/2 skipped)
- id: M2-003
  description: "Fail loud on a wrong/absent/unresolvable target (non-zero exit or\
    \ 4xx) \u2014 never silent misattribution. Test both the happy path and the loud-failure\
    \ path."
  status: completed
  dependencies:
  - M2-001
  started: 2026-08-02T02:00Z
  completed: 2026-08-02T02:25Z
  evidence:
  - test: api/tests/test_report_link.py::TestReportLinkFailsLoud
  verified_by:
  - pytest:api/tests/test_report_link.py (11 passed; full suite 655 passed/2 skipped)
total_tasks: 3
completed_tasks: 3
in_progress_tasks: 0
blocked_tasks: 0
progress: 100
---

# M2 — Scope linking from the envelope (G2 link, C3)

The correctness-critical milestone. Silent misattribution (a report linked to the wrong node) is
worse than an unlinked report; C3 because of that.

## AC → command → evidence

| AC | Command | Evidence |
|---|---|---|
| links + idempotency | `cd api && uv run pytest tests -k report_link` | links to subject+tracker_links[]; 2nd ingest adds 0 dup links; bad target raises |

## Lint note (correction, 2026-08-01)

Ruff clean on M2-touched regions (`app/services/import_index.py`, `app/cli/atlas.py`,
`tests/test_report_link.py`) — `uv run ruff check` on those files reports zero errors. There is one
**pre-existing** finding elsewhere in `app/cli/atlas.py`: F841 `Local variable 'assignments' is
assigned to but never used` (introduced in `957b10f`, unrelated to M2, `cmd_bom_status`). It is out
of scope for M2 and was not fixed as part of it. (Corrects an earlier, inaccurate "ruff clean on all
changed/added files" claim.)
