# E2E-BASELINE — estate-coherence M0 (Atlas honest states)

Two-sided Playwright baseline, run 2026-09-30, for node `node_01M3S83FAX8H5529EVXD0KA4RB`
(remainder leg). Purpose: determine whether each of the 3 e2e failures reported by the prior
leg is pre-existing (fails at base too) or a regression introduced by T1/T2/T3.

## Command

Identical command, env, and Playwright config resolution rules on both sides (each side uses
its own committed `web/playwright.config.ts` and `web/e2e/**`, since T1 changed both):

```
cd web && npx playwright test --reporter=list
```

- **base** (`4e21d03`, worktree `.wt/ec-m0x-atlas-base`): `npm ci` then `npm run build`
  (base's webServer config for the `chromium` project is `npm run start`, which requires a
  pre-built `.next`; base predates T1's build-in-webServer change), then the command above.
- **head** (`279e979`, this worktree): `npx playwright test --reporter=list` directly — head's
  webServer config builds the demo bundle itself (`NEXT_PUBLIC_ATLAS_DEMO_DATA=1`,
  `NEXT_DIST_DIR=.next-demo` / `.next-flags-on`).
- Chromium browser: shared Playwright cache, already installed; no live Atlas ports touched
  (`:3040`/`:8042` untouched — this suite uses `:3000`/`:3100` and fixture data only).

## Totals

| Side | Commit | Total | Passed | Failed |
|---|---|---|---|---|
| base | `4e21d03` | 43 | 40 | 3 |
| head | `279e979` | 44 | 41 | 3 |

Head has one more test than base: `demo build shows the DEMO DATA banner`
(`happy-path.spec.ts`), added by T1 (P1) — it passes on both the count and content check.

## Per-test result (every test that fails on either side)

| Test | Base (`4e21d03`) | Head (`279e979`) | Verdict |
|---|---|---|---|
| `happy-path.spec.ts` › `root redirect → command center loads` | **FAIL** — `page.waitForURL` timeout (30s); navigates to `/`, never reaches `/projects/proj_artifact_atlas` | **FAIL** — identical: same timeout, same log (`navigated to "http://localhost:3000/"`) | **Pre-existing.** Root page is a Projects index (not a redirect) already at base; the spec's docstring/assertion is stale, unrelated to T1/T2/T3. |
| `happy-path.spec.ts` › `asset library — table view toggle` | **FAIL** — `getByRole('radio', { name: 'Table', exact: true })` not found (15s timeout) | **FAIL** — identical locator, identical timeout | **Pre-existing.** The "Table" radio-with-that-name no longer exists in the Asset Library view chrome at base already; not a T1/T2/T3 removal. |
| `flags-on/axe-sweep.spec.ts` › `Asset library — table view` | **FAIL** — same `Table` radio click times out (30s) | **FAIL** — identical | **Pre-existing.** Same root cause as the row above, exercised from the flags-on project. |

No test flips base-pass → head-fail (no regression) and no test flips base-fail → head-pass.
Head's failure set is a strict subset check of base's: identical 3 tests, identical error
messages, identical line numbers modulo the file's insertions. No fix was required.

## Disposition

Both findings this baseline confirms as pre-existing were already filed by the prior (P2) leg
and are attached to, not duplicated by, this leg:

- `node_01M3SBHVJ7R89Y5K1HQ4H7MFHB` — "Atlas e2e specs stale: root redirect and Table view
  radio" — this baseline promotes it from "inferred pre-existing, not baselined at HEAD" to
  **measured** pre-existing (dedup-checked here; evidence attached, not duplicated).
- `node_01M3SBHVB9R2ESJZXJ4VYPT52J` — "Atlas test_routes_preview out-of-bounds range 416 test
  fails on development" (R4 of this leg) — re-confirmed failing at base 4e21d03 directly
  (`uv run --extra dev --with python-multipart pytest
  tests/test_routes_preview.py::TestGetAssetContentRange::test_out_of_bounds_range_returns_416`):
  `AssertionError: assert 'bytes */1024' == '*/1024'` — Starlette now emits a `bytes ` prefix on
  the `Content-Range` header for 416 responses; the test's expected value predates that. Same
  failure at base, unchanged by M0.
