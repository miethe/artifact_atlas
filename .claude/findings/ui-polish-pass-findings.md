---
schema_version: 2
doc_type: report
report_category: findings
title: "In-Flight Findings: UI Polish Pass"
status: in_progress
created: '2026-06-21'
updated: '2026-06-21'
feature_slug: ui-polish-pass
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1.md
---

# In-Flight Findings — UI Polish Pass

Discoveries made during execution that were not anticipated in the plan/spike.

## F-001 — `.gitignore` `coverage/` rule silently ignored the entire Coverage feature dir

**Severity:** High (latent data-loss / fresh-clone breakage)
**Discovered:** P2b (Wave 3), 2026-06-21
**Phase:** P2B-003 (CoverageView → EntityModal migration)

### Symptom
While migrating CoverageView onto EntityModal, the new EntityModal tab panels under
`web/features/coverage/components/EntityModal/` did not appear in `git status`, yet
`tsc` compiled them. `git check-ignore -v` revealed `.gitignore:12 coverage/` was
matching the path.

### Root cause
`.gitignore` line 12 was a bare `coverage/`, intended to ignore test-coverage report
output (vitest/pytest). A bare directory pattern with no leading slash matches a
directory of that name **at any depth** — so it also matched `web/features/coverage/`,
the Coverage *feature* directory.

### Impact
`git ls-files web/features/coverage/` returned **0 tracked files** — the entire
Coverage feature (including the pre-existing `CoverageView.tsx`) had **never been
committed**. It worked in local dev only because the files exist on disk. A fresh
clone would be missing the Coverage feature entirely.

### Fix
Scoped the rule in `.gitignore` from `coverage/` to anchored paths that match only
real coverage-report output:
```
/coverage/
/web/coverage/
```
Then added the full `web/features/coverage/` feature tree to git as part of the P2b
commit (this is the first time the feature is tracked).

### Follow-up
- Confirm no other feature dir collides with a bare gitignore pattern.
- The Coverage feature being newly-tracked means its first commit carries pre-existing
  (non-P2b) code; this is expected and called out in the P2b commit message.
- **Second exposed dir:** scoping the rule also revealed the Next.js *route*
  `web/app/(projects)/projects/[projectId]/coverage/page.tsx` (pre-existing, Jun-20)
  was likewise ignored and never committed — a fresh clone would 404 the coverage route
  and fail `next build`. Tracked in the P3 commit. Swept for further `coverage` dirs:
  none remain ignored.
