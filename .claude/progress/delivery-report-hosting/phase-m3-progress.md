---
type: progress
schema_version: 2
doc_type: progress
prd: delivery-report-hosting
feature_slug: delivery-report-hosting
phase: M3
phase_title: Dossier revisioning convention
status: completed
created: '2026-07-31'
updated: '2026-08-01'
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
context_class: C2
commit_refs:
- 7acc148
pr_refs: []
owners:
- python-backend-engineer
contributors: []
depends_on:
- M1
routing_constraints:
- Workhorse-class; the stable-id / idempotency assertions stay claude-verified.
exit_criteria:
- Re-ingest of a dossier slug updates blob on a stable asset id via PUT /content;
  links intact; convention documented.
tasks:
- id: M3-001
  description: 'Resolve a stable asset id keyed by envelope identity (route+subject/slug)
    so re-ingest targets the SAME asset (OQ-3 decision: stable PUT /content, not a
    supersedes-chain).'
  status: completed
  dependencies:
  - M1-001
  started: 2026-08-01T22:36Z
  completed: 2026-08-01T22:44Z
  evidence:
  - commit: 7acc148
  - test: api/tests/test_report_revision.py::TestReportRevisionService::test_report_revision_same_identity_updates_stable_asset_id
  verified_by:
  - pytest:api/tests/test_report_revision.py (8 passed; full suite 664 passed/2 skipped)
- id: M3-002
  description: 'Re-ingest updates the blob via PUT /content on that stable id; existing
    AssetLinks are preserved. Test: two ingests of one slug => one asset id, blob
    changed, links intact.'
  status: completed
  dependencies:
  - M3-001
  started: 2026-08-01T22:44Z
  completed: 2026-08-01T22:50Z
  evidence:
  - commit: 7acc148
  - test: api/tests/test_report_revision.py::TestReportRevisionSubjectCollapseLimitation
  verified_by:
  - pytest:api/tests/test_report_revision.py (8 passed; full suite 664 passed/2 skipped)
- id: M3-003
  description: Document the revisioning convention (ingest verb help + a note in .claude/worknotes/delivery-report-hosting/implementation-notes.md).
  status: completed
  dependencies:
  - M3-002
  started: 2026-08-01T22:50Z
  completed: 2026-08-01T22:52Z
  evidence:
  - commit: 7acc148
  - doc: .claude/worknotes/delivery-report-hosting/implementation-notes.md#m3-dossier-revisioning-convention
  verified_by:
  - pytest:api/tests/test_report_revision.py (8 passed; full suite 664 passed/2 skipped)
total_tasks: 3
completed_tasks: 3
in_progress_tasks: 0
blocked_tasks: 0
progress: 100
---

# M3 — Dossier revisioning convention (G5, C2 — executes the OQ-3 decision)

Re-ingesting a dossier each phase must update one living asset, not mint a new one per phase. This
milestone's decision (stable `PUT /content`) is also the blocking input PF-3 M2/M3 wait on.

## AC → command → evidence

| AC | Command | Evidence |
|---|---|---|
| stable revision | `cd api && uv run pytest tests -k report_revision` | re-ingest → same asset id, blob changed, links intact |
