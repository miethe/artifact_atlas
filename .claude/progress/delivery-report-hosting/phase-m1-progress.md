---
type: progress
schema_version: 2
doc_type: progress
prd: delivery-report-hosting
feature_slug: delivery-report-hosting
phase: M1
phase_title: "Report-aware ingest returns a servable preview URL"
status: pending
created: '2026-07-31'
updated: '2026-07-31'
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
context_class: C2
commit_refs: []
pr_refs: []
owners: []
contributors: []
depends_on: []
routing_constraints:
  - "Workhorse-class executor; mechanical sub-steps offload-eligible with re-run gates, but the 403->200 contract test stays claude-verified."
exit_criteria:
  - "Envelope-driven ingest yields a delivery_report Asset; GET /api/preview/asset/{id}/html returns 200 (not 403)."
tasks:
  - id: M1-001
    description: "Report-aware ingest path (CLI `atlas report ingest <html> --envelope <writeback.json>` or report-aware create+classify branch) reads the PF-3 envelope, stores blob + tags (artifact_type_id=delivery_report, generated_by=agent, mime_type=text/html, metadata.{route,revision,truth_status,subject}) by composing ImportService.import_content. No new storage code."
    status: pending
    dependencies: []
  - id: M1-002
    description: "Classify agent_access=preview_allowed at ingest (G3) — else the capsule route 403s (default metadata_only)."
    status: pending
    dependencies: [M1-001]
  - id: M1-003
    description: "Regression test: GET /api/preview/asset/{id}/html returns 200 for an ingested report (403->200). Verify envelope shape live against PF-3 C1 first."
    status: pending
    dependencies: [M1-002]
---

# M1 — Report-aware ingest returns a servable preview URL (G2 store/tag + G3, C2)

The unblocker both siblings depend on. Compose shipped `ImportService`/`AssetService`; the only
load-bearing subtlety is setting `preview_allowed` at ingest.

## AC → command → evidence

| AC | Command | Evidence |
|---|---|---|
| servable URL | `atlas report ingest <html> --envelope <env.json>` then `curl -s -o /dev/null -w '%{http_code}' "$ATLAS_API/api/preview/asset/<id>/html"` | prints `200` |
| metadata/type | `cd api && uv run pytest tests -k report_ingest` | asset has `artifact_type_id=delivery_report`, `agent_access=preview_allowed` |
