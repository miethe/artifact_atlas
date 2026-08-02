---
type: progress
schema_version: 2
doc_type: progress
prd: delivery-report-hosting
feature_slug: delivery-report-hosting
phase: M4
phase_title: ADR + docs + deferrals
status: completed
created: '2026-07-31'
updated: '2026-08-01'
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
context_class: C1
commit_refs:
- 84646b7
- ad53213
pr_refs: []
owners:
- documentation-writer
contributors: []
depends_on:
- M1
routing_constraints:
- Docs/ADR/deferred-item rows are offload-eligible to an economy / free-tier model.
exit_criteria:
- D-018 in docs/DECISIONS.md; DI- rows for G4/G6/backfill/sensitivity; stale-posture
  note reconciled.
tasks:
- id: M4-001
  description: Record D-018 in docs/DECISIONS.md (host decision) cross-referencing
    the upstream proposed ADR; note it retains the still-valid 2026-06-12 catalog-ADR
    principles (HTML pages are first-class assets; local-first/non-public default;
    controlled API not broad FS; no LLM on render/browse).
  status: completed
  dependencies: []
  started: '2026-08-01T22:40:00Z'
  completed: '2026-08-01T22:54:53Z'
  evidence:
  - commit: 84646b7
  - grep: D-018 docs/DECISIONS.md:837
  verified_by:
  - 'grep:D-018 docs/DECISIONS.md:837 (hit); DI rows: G4/G6/Backfill/Sensitivity/LinkTarget/SubjectCollapse
    present'
- id: M4-002
  description: 'Capture DI- rows for the deferred items: G4 cross-scope Reports lens
    (OQ-2), G6 epic AssetLinkTargetType alias, fleet-wide backfill of scattered .claude/reports
    HTML (R7), report-asset sensitivity defaulting.'
  status: completed
  dependencies: []
  started: '2026-08-01T22:40:00Z'
  completed: '2026-08-02T03:05:00Z'
  evidence:
  - commit: 84646b7
  - commit: ad53213
  verified_by:
  - 'grep:D-018 docs/DECISIONS.md:837 (hit); DI rows: G4/G6/Backfill/Sensitivity/LinkTarget/SubjectCollapse
    present'
- id: M4-003
  description: Reconcile the stale scattered-HTML posture note (docs referencing the
    pre-hosting model).
  status: completed
  dependencies: []
  started: '2026-08-02T02:55:00Z'
  completed: '2026-08-02T03:05:00Z'
  evidence:
  - commit: ad53213
  verified_by:
  - 'grep:D-018 docs/DECISIONS.md:837 (hit); DI rows: G4/G6/Backfill/Sensitivity/LinkTarget/SubjectCollapse
    present'
total_tasks: 3
completed_tasks: 3
in_progress_tasks: 0
blocked_tasks: 0
progress: 100
---

# M4 — ADR + docs + deferrals (docs, C1)

Records the durable decision and parks the explicitly-deferred scope so nothing is silently dropped.

## AC → command → evidence

| AC | Command | Evidence |
|---|---|---|
| ADR + deferrals | `grep -n "D-018" docs/DECISIONS.md` | D-018 present; DI- rows exist for G4/G6/backfill/sensitivity/link-target-existence |

## Deferred items queued for M4 (DI- rows)

Added 2026-08-01 (M2 reviewer fix, MEDIUM): **tracker/subject link-target existence validation
gap.** `_TRACKER_NODE_RE` and the `subject`→project-slug lookup (`api/app/services/import_index.py`)
validate *shape*/*Atlas-local existence* only — a well-formed `tracker_links[].tracker` id
(`node_<id>`/`tree_<id>`) that does not actually exist in IntentTree still creates a link, and a
`subject` that names neither an Atlas project nor a real feature still resolves to `target_type=
feature`. Building an IntentTree client to close this is out of the plan's scope boundary
(composition over shipped primitives, no new subsystem clients). Track as its own `DI-` row
alongside G4/G6/backfill/sensitivity when M4 runs. Full rationale:
`.claude/worknotes/delivery-report-hosting/implementation-notes.md` § "2026-08-01 — SCOPE NOTE".
