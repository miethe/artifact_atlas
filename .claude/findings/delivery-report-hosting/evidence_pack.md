# Evidence Pack

**Run:** `20260802-m1`

## Target

phase-taskout / M1 — Report-aware ingest returns a servable preview URL
(`.claude/progress/delivery-report-hosting/phase-m1-progress.md`, status: completed, commit
`86fb931`).

## Objective

Verify M1's pinned acceptance criterion — "an envelope-driven ingest creates a `delivery_report`
Asset whose `GET /api/preview/asset/{id}/html` returns 200, not 403" — actually holds across the
paths a real caller can hit, including the duplicate-hash short-circuit, and check the completion
report's evidence claims against the committed test suite.

## Source artifacts

- `api/app/services/import_index.py` — `import_content` (duplicate-hash dedup path, lines
  ~262-281), `import_report` (composition point, ~lines 501-515), `_find_by_hash` (~lines 654-660).
- `api/tests/test_report_ingest.py` — `TestReportIngestService`,
  `TestReportIngestService::test_report_ingest_sets_delivery_report_fields`,
  `TestReportIngestPreviewRoute`.
- `.claude/progress/delivery-report-hosting/phase-m1-progress.md` — M1 progress record
  (tasks M1-001/002/003, `verified_by: pytest:api/tests/test_report_ingest.py (13 passed; full
  suite 644 passed/2 skipped)`).

## Expected workflows

- `atlas report ingest <html> --envelope <writeback.json>` → `GET
  /api/preview/asset/{id}/html` → `200`.
- Re-ingest of the same report (or a hash-colliding prior asset) via the same command.

## Constraints

- Reviewer operates Mode E (read diff/artifacts, no edits).
- This decision-record-writer step received a **truncated adjudication payload** — see Open
  Questions below. All content in this evidence pack traces to what was actually transmitted plus
  the direct-read confirmations independent reviewers performed on the named source files; nothing
  here is reconstructed or inferred beyond that.

## Evidence collected

| ID | Source | Locator | Summary | Relevance |
|---|---|---|---|---|
| EV-01 | `api/app/services/import_index.py` | lines 262-281 | `import_content`'s dedup path returns the pre-existing asset verbatim (`is_duplicate=True, duplicate_of=existing.id`) with no re-classification step on a hash match. | Root cause for ADJ-01. |
| EV-02 | `api/app/services/import_index.py` | lines 654-660 (`_find_by_hash`) | Hash lookup scans ALL non-tombstoned assets regardless of `artifact_type_id`/sensitivity/`agent_access`. | Confirms the lookup is type-agnostic, so a collision with any prior asset (not just other reports) can trigger the short-circuit. |
| EV-03 | `api/app/services/import_index.py` | `import_report` → `import_content` call, ~lines 501-515 | `on_duplicate=on_duplicate` defaults to `'return_existing'`, inherited unchanged by the report path. | Confirms `import_report` does not override the default to force re-classification. |
| EV-04 | `api/tests/test_report_ingest.py` | grep `duplicate`; line 77 | Only test touching duplication asserts `is_duplicate is False`; no test exercises a true duplicate hit through `import_report`. | Confirms zero regression coverage of the ADJ-01 path; the suite explicitly avoids it via `on_duplicate='create_new'` for unrelated tests. |
| EV-05 | `api/tests/test_report_ingest.py` | direct file read | 13 `def test_` methods counted. | Ground truth for ADJ-02's test-count discrepancy. |
| EV-06 | `.claude/progress/delivery-report-hosting/phase-m1-progress.md` | `verified_by` field, all 3 tasks | States `13 passed; full suite 644 passed/2 skipped`. | Progress file's own evidence corroborates 13, contradicting the completion report's stated 17. |
| EV-07 | orchestrator adjudication summary (this task's prompt) | header counts | `Accepted: 3 / Rejected: 3 / Disputed: 1 / Watchlist: 5 / Blocking: 0` | Declares 12 total findings; only 3 (2 full, 1 partial) were transmitted with content — root evidence for `META-INPUT-GAP-01`. |
| EV-08 | orchestrator adjudication payload (this task's prompt) | ADJ-03 claim field | Text ends mid-sentence: `"...violate the documented "` before the file-writing instructions begin. | Root evidence for ADJ-03's `input_truncated: true` flag. |

## Deterministic checks

| Check | Command/source | Result | Notes |
|---|---|---|---|
| Test suite count | `grep -c 'def test_' api/tests/test_report_ingest.py` (as reported by the correctness-lens reviewer) | 13 | Matches progress-file `verified_by`; contradicts completion report's claimed 17 (ADJ-02). |
| Duplicate-hit regression coverage | grep for `duplicate` across `api/tests/test_report_ingest.py` | 1 hit, asserts `is_duplicate is False` | No test drives a true duplicate through `import_report` (ADJ-01). |
| `arc validate` | `uv run arc validate runs/20260802-m1` | run after all six files written | See `arc_validate_passed` in the returned scorecard summary. |

## Open questions

- **What are the full contents of ADJ-03, and of the 3 rejected / 1 disputed / 5 watchlist
  findings the adjudication summary counted?** Not answerable from this task's input — the payload
  was truncated before this record-writer step received it. Requires the orchestrator to re-transmit
  the complete adjudicated-findings set.
- **Is the ADJ-01 duplicate-hash gap already accepted as a known M1 risk elsewhere in the plan
  (e.g., a note in the M2/M3 plan text), or is it genuinely unaddressed?** Not verifiable from the
  artifacts this reviewer had access to; recommend the orchestrator check
  `docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md` before deciding
  whether ADJ-01 needs a code fix now or a documented risk-acceptance note.
