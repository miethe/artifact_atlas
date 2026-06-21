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

## F-002 — Flags-ON live verification not yet run (residual risk; tracked follow-up)

**Severity:** Medium (verification gap, not a code defect)
**Raised by:** P6-019 (task-completion-validator) + P6-020 (karen) final gates.

### Detail
The session's gates are strong but flags-OFF for the runtime path: `tsc` 0, `next build`
exit 0 (15 routes), vitest 75/75, **Playwright e2e 7/7 (fixture-fallback = legacy flags-OFF
paths)**, api pytest 571, static a11y-sheriff APPROVED, per-phase validators APPROVED, and a
senior-code-reviewer security pass on the P4c backend. NOT yet run:
- **P6-003** live axe-core sweep with `ui-tabbed-modal=true` over the 5 EntityModal surfaces
  + AssetViewer for all 6 formats.
- **P6-009** Playwright specs for the flags-ON paths: modal open/close/tab/Escape+focus-return,
  `?item=&tab=` deep-link, AssetViewer per-format, agent_access gate.

### Disposition
Accepted as documented residual risk (both final reviewers concurred it is not a blocker given
flag-gating + static a11y + the security review). **Recommended before global prod cutover**
(see ADR-7): one flags-ON Playwright project (set `NEXT_PUBLIC_FLAGS`) + axe pass. Tracked as a
P6 follow-up.

## F-003 — Disclosed in-panel deferrals (backlog, not stubs)

**Severity:** Low (honest scope limit).
Two EntityModal sub-panels render real content with disclosed placeholders, confirmed as
intentional backlog items (not silent stubs):
- `BomSlotAssignmentsTabPanel` — assignment-table editing deferred to a future BOM epic.
- `AssetLinksTabPanel` — graph sub-section deferred to the P5 Graph Explorer.
Both should remain tracked in `docs/mvp-backlog.md`.
