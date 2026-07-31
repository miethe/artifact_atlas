---
type: progress
schema_version: 2
doc_type: progress
prd: delivery-report-hosting
feature_slug: delivery-report-hosting
phase: M4
phase_title: "ADR + docs + deferrals"
status: pending
created: '2026-07-31'
updated: '2026-07-31'
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
context_class: C1
commit_refs: []
pr_refs: []
owners: []
contributors: []
depends_on: [M1]
routing_constraints:
  - "Docs/ADR/deferred-item rows are offload-eligible to an economy / free-tier model."
exit_criteria:
  - "D-018 in docs/DECISIONS.md; DI- rows for G4/G6/backfill/sensitivity; stale-posture note reconciled."
tasks:
  - id: M4-001
    description: "Record D-018 in docs/DECISIONS.md (host decision) cross-referencing the upstream proposed ADR; note it retains the still-valid 2026-06-12 catalog-ADR principles (HTML pages are first-class assets; local-first/non-public default; controlled API not broad FS; no LLM on render/browse)."
    status: pending
    dependencies: []
  - id: M4-002
    description: "Capture DI- rows for the deferred items: G4 cross-scope Reports lens (OQ-2), G6 epic AssetLinkTargetType alias, fleet-wide backfill of scattered .claude/reports HTML (R7), report-asset sensitivity defaulting."
    status: pending
    dependencies: []
  - id: M4-003
    description: "Reconcile the stale scattered-HTML posture note (docs referencing the pre-hosting model)."
    status: pending
    dependencies: []
---

# M4 — ADR + docs + deferrals (docs, C1)

Records the durable decision and parks the explicitly-deferred scope so nothing is silently dropped.

## AC → command → evidence

| AC | Command | Evidence |
|---|---|---|
| ADR + deferrals | `grep -n "D-018" docs/DECISIONS.md` | D-018 present; DI- rows exist for G4/G6/backfill/sensitivity |
