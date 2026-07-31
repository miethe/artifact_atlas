---
type: progress
schema_version: 2
doc_type: progress
prd: delivery-report-hosting
feature_slug: delivery-report-hosting
phase: M2
phase_title: "Scope linking from the envelope"
status: pending
created: '2026-07-31'
updated: '2026-07-31'
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
context_class: C3
commit_refs: []
pr_refs: []
owners: []
contributors: []
depends_on: [M1]
routing_constraints:
  - "Scope-attribution / link-target correctness MUST stay claude-primary — a wrong-node link is a correctness failure (mirrors sibling PF-2 R1). No offload."
exit_criteria:
  - "Correct AssetLinks to subject + tracker_links[]; idempotent re-link; wrong/absent target fails loud."
tasks:
  - id: M2-001
    description: "Ingest creates AssetLink rows to the envelope's `subject` AND every `tracker_links[]` target (feature/project/intenttree_node) — multi-attach on write (OQ-4 decision)."
    status: pending
    dependencies: [M1-001]
  - id: M2-002
    description: "Idempotent re-link: a second ingest of the same report adds zero duplicate links."
    status: pending
    dependencies: [M2-001]
  - id: M2-003
    description: "Fail loud on a wrong/absent/unresolvable target (non-zero exit or 4xx) — never silent misattribution. Test both the happy path and the loud-failure path."
    status: pending
    dependencies: [M2-001]
---

# M2 — Scope linking from the envelope (G2 link, C3)

The correctness-critical milestone. Silent misattribution (a report linked to the wrong node) is
worse than an unlinked report; C3 because of that.

## AC → command → evidence

| AC | Command | Evidence |
|---|---|---|
| links + idempotency | `cd api && uv run pytest tests -k report_link` | links to subject+tracker_links[]; 2nd ingest adds 0 dup links; bad target raises |
