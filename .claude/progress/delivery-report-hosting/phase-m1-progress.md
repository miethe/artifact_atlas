---
type: progress
schema_version: 2
doc_type: progress
prd: delivery-report-hosting
feature_slug: delivery-report-hosting
phase: M1
phase_title: Report-aware ingest returns a servable preview URL
status: completed
created: '2026-07-31'
updated: '2026-08-01'
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
context_class: C2
commit_refs:
- 86fb931
pr_refs: []
owners:
- python-backend-engineer
contributors: []
depends_on: []
routing_constraints:
- Workhorse-class executor; mechanical sub-steps offload-eligible with re-run gates,
  but the 403->200 contract test stays claude-verified.
exit_criteria:
- Envelope-driven ingest yields a delivery_report Asset; GET /api/preview/asset/{id}/html
  returns 200 (not 403).
tasks:
- id: M1-001
  description: Report-aware ingest path (CLI `atlas report ingest <html> --envelope
    <writeback.json>` or report-aware create+classify branch) reads the PF-3 envelope,
    stores blob + tags (artifact_type_id=delivery_report, generated_by=agent, mime_type=text/html,
    metadata.{route,revision,truth_status,subject}) by composing ImportService.import_content.
    No new storage code.
  status: completed
  dependencies: []
  started: 2026-08-01T21:50Z
  completed: 2026-08-02T01:55Z
  evidence:
  - commit: 86fb931
  - test: api/tests/test_report_ingest.py::TestReportIngestService
  verified_by:
  - pytest:api/tests/test_report_ingest.py (13 passed; full suite 644 passed/2 skipped)
- id: M1-002
  description: "Classify agent_access=preview_allowed at ingest (G3) \u2014 else the\
    \ capsule route 403s (default metadata_only)."
  status: completed
  dependencies:
  - M1-001
  started: 2026-08-01T21:50Z
  completed: 2026-08-02T01:55Z
  evidence:
  - commit: 86fb931
  - test: api/tests/test_report_ingest.py::TestReportIngestService::test_report_ingest_sets_delivery_report_fields
  verified_by:
  - pytest:api/tests/test_report_ingest.py (13 passed; full suite 644 passed/2 skipped)
- id: M1-003
  description: 'Regression test: GET /api/preview/asset/{id}/html returns 200 for
    an ingested report (403->200). Verify envelope shape live against PF-3 C1 first.'
  status: completed
  dependencies:
  - M1-002
  started: 2026-08-01T21:50Z
  completed: 2026-08-02T01:55Z
  evidence:
  - commit: 86fb931
  - test: api/tests/test_report_ingest.py::TestReportIngestPreviewRoute
  verified_by:
  - pytest:api/tests/test_report_ingest.py (13 passed; full suite 644 passed/2 skipped)
total_tasks: 3
completed_tasks: 3
in_progress_tasks: 0
blocked_tasks: 0
progress: 100
---

# M1 — Report-aware ingest returns a servable preview URL (G2 store/tag + G3, C2)

The unblocker both siblings depend on. Compose shipped `ImportService`/`AssetService`; the only
load-bearing subtlety is setting `preview_allowed` at ingest.

## AC → command → evidence

| AC | Command | Evidence |
|---|---|---|
| servable URL | `atlas report ingest <html> --envelope <env.json>` then `curl -s -o /dev/null -w '%{http_code}' "$ATLAS_API/api/preview/asset/<id>/html"` | prints `200` |
| metadata/type | `cd api && uv run pytest tests -k report_ingest` | asset has `artifact_type_id=delivery_report`, `agent_access=preview_allowed` |
