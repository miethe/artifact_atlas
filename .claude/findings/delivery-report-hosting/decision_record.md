# ARC Decision Record

**Run:** `20260802-m1`
**Target:** phase-taskout / M1 — Report-aware ingest returns a servable preview URL
**Timestamp:** 2026-08-02T01:45:49Z

## Recommendation

- [x] proceed with conditions
- [ ] proceed
- [ ] narrow scope
- [ ] pause and validate
- [ ] redesign
- [ ] reject

## Rationale

Zero accepted findings reach the severity>=high blocking bar (`blocking_count: 0`, per the
adjudication summary supplied to this record-writer step), so M1 is not gated shut. However, one
accepted medium-severity finding (ADJ-01) is a genuine correctness/concurrency gap in the
duplicate-hash short-circuit that can return a pre-existing, non-report asset unchanged on a hash
match — skipping the `delivery_report` classification and `preview_allowed` access the M1
acceptance criterion depends on — with no regression test covering the path. That is real, unfixed
risk against the pinned AC under a specific (currently untested) scenario, not a cosmetic nit, so
"proceed" without qualification would overstate confidence. "Proceed with conditions" reflects: ship
M1 as-is, but the ADJ-01 fix (or an explicit, test-pinned risk acceptance) and the ADJ-02 test-count
correction are required before the milestone record is treated as clean.

**Input-completeness caveat (material to this record's authority):** the adjudication payload
handed to this writer step was truncated. The orchestrator's own summary counted 12 total findings
(3 accepted, 3 rejected, 1 disputed, 5 watchlist) but only 2 findings (ADJ-01, ADJ-02) arrived with
full content, a 3rd (ADJ-03) arrived as a title fragment only, and the 9 rejected/disputed/watchlist
findings arrived with zero content — not even titles. This decision record therefore documents only
what was actually received (plus a meta-finding, `META-INPUT-GAP-01`, naming the gap) and should
**not** be read as a complete disposition of everything the adjudicator actually found. See
`findings.yaml` and `risk_register.yaml` (`RISK-03`, `RISK-04`) for the specifics.

## Accepted findings

- **ADJ-01** (medium, bug) — Duplicate-hash short-circuit can return a pre-existing asset without
  applying `delivery_report` classification or `preview_allowed` access. See `findings.yaml` for
  full claim/evidence/recommendation.
- **ADJ-02** (low, gap) — Completion-report test count (17) does not match the actual test suite
  (13). Reporting-accuracy issue, not a functional defect.
- **ADJ-03** (info, unclear — **input truncated**) — Title fragment only
  ("CLI input-validation/exception-handling gaps violate the documented ..."); full claim, evidence,
  and recommendation were not received. Recorded as accepted per the orchestrator's summary count,
  but its actual content and severity are unverified. Do not treat as benign.

## Rejected findings

**Not received.** The adjudication summary counted 3 rejected findings; none of their content (not
even titles) reached this record-writer step. Nothing can be honestly recorded here beyond that
gap — see `META-INPUT-GAP-01` in `findings.yaml`.

## Disputed findings

**Not received.** The adjudication summary counted 1 disputed finding; its content did not reach
this record-writer step. See `META-INPUT-GAP-01` in `findings.yaml`.

## Watchlist

- **META-INPUT-GAP-01** (info, gap) — 9 of the 12 adjudicated findings (3 rejected, 1 disputed, 5
  watchlist) referenced by the run summary were never transmitted to this writer step; recorded as
  watchlist because it is a process observation about this run's data pipeline, not a code defect,
  but it should be tracked until reconciled.
- The 5 watchlist findings counted by the adjudication summary itself: **not received** — no
  content arrived for them.

## Required validation

See `validation_plan.md` for the per-finding validation steps (ADJ-01, ADJ-02, ADJ-03,
META-INPUT-GAP-01).

## Human approval

Approver:
Date:
Decision:
