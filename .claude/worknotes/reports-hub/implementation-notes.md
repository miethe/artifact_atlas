# Reports Hub implementation notes

## 2026-09-08 — preflight

- PR #9 (`328510f`) landed after the held plans were authored. It already supplies
  cross-project `GET /api/search`, `/assets`, and a Workspace navigation section.
  Reports still need a purpose-built API because search omits metadata, links,
  cursor pagination, and full-set facets.
- Baseline `make test`: 33 failed, 768 passed, 2 skipped. The failures are caused
  by seeded delivery-report rows leaking into report tests that assume an empty
  corpus. Tracked separately as `node_01M2242NJKCRBKTP2G5YK24W2M`.
- Baseline web: 110 Vitest tests passed; typecheck and production build passed.
- `op` routing run `op_run_20260909_033840_execute-existing-artifac` recorded the
  tasks/T3 route but its IntentTree hop failed because this repo has no unique
  default tree binding. Execution uses the explicit tree and node IDs.
- The 2026-09-08 re-measurement falsifies the overview plan's old “gap widened”
  claim. Git remains a complementary checkout-local signal; fleet membership and
  tracker mapping must be registry-driven, with provenance disclosed per figure.
