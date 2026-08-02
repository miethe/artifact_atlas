# Implementation notes — delivery-report-hosting (PF-1)

Execution ledger per the plan's "Execution ledger" section. Deviations + verified external
contracts. Reviewed at each milestone boundary.

---

## 2026-08-01 — PRE-FLIGHT: external-contract verification (plan OQ-1)

The plan required verifying the writeback-envelope field set **live** against PF-3 C1 at M1 start
("the spike citation is not a contract"). Done. **Verdict: IMPLEMENTED-BUT-DIVERGENT** — the
envelope is live deterministic code, a superset of the expected field set, with one structural
surprise that changes M2's design.

### Authoritative envelope (VERIFIED — emitter code + a live run)

Emitter: `../agentic_meta_dev/.claude/skills/delivery-report/scripts/delivery_report.py:1373-1401`
(`build_export`). CLI: `delivery_report.py export --manifest … --html … --target … --out …`.
There is **no JSON schema** for the envelope — "frozen" is a code-level guarantee only.

Flat, single level (only `generated_from` nests). 16 keys:

| field | type | presence | notes |
|---|---|---|---|
| `envelope_version` | str `"1.0"` | always | literal |
| `artifact_type` | str `"delivery-report"` | always | literal |
| `target` | str | always | `{skillmeat,intenttree,meatywiki,ccdash}` — **no `atlas` value yet** |
| `route` | str | always | `feature\|dossier\|program\|phase\|readiness` |
| `title` | str\|null | nullable | **may be null** |
| `subject` | str\|null | nullable | `report.subject or report.project`; a **slug**, not an instance key |
| `revision` | **int**\|null | nullable | int in practice (`1`) — PF-2 types it `str`; coerce |
| `truth_status` | str\|null | nullable | e.g. `not_executed` |
| `generated_from` | obj\|null | nullable | `{repo, ref, commit}` |
| `generated_by` | str\|null | nullable | extra vs spike list |
| `generated_at` | str ISO-Z\|null | nullable | extra vs spike list |
| `manifest_path` | str | always | **absolute LOCAL fs path** |
| `html_path` | str\|null | nullable | **absolute LOCAL fs path** |
| `tracker_links` | array | always (may be `[]`) | see below — **read this** |
| `item_count` | int | always | extra vs spike list |

### `tracker_links[]` — the structural surprise (load-bearing for M2)

`delivery_report.py:1380-1384` emits exactly:

```python
{"item": item.get("id"), "tracker": h["tracker"], "kind": item.get("kind")}
```

**There is no `node_id`, `scope`, `type`, or `url` key.** Target identity is buried in the
free-form `tracker` string. The documented convention is `"node_… — title"`
(`delivery-report/references/aos-integration.md:83`) but it is enforced only by a **warning-only**
soft check that fires if `"node_" in tracker`. Real emitted data violates it: a live
`report.json` carries `tracker="tree_01KVTH95ETM8YRYCV2ENHVR124"` — a **tree** id, bare, no title.

**Consequence for M2:** the plan's phrasing ("every `tracker_links[]` target
(feature/project/intenttree_node)") is **not directly satisfiable** — the envelope does not supply
a typed target. M2 must parse `tracker`, tolerate `node_…`/`tree_…`/bare/`"id — title"` forms, and
treat anything it cannot confidently resolve as a **loud failure**, not a silent skip. M2's
"fail loud" AC is therefore the *dominant* path, not an edge case. Do NOT invent a typed target.

### PF-2 (intenttree consumer) is COMPLETE — its URL contract is FROZEN AND SHIPPED

`../intenttree/.../delivery-report-link-and-ui-v1.md` → `status: completed`, `merge_commit: 5bf3f1b`,
`pr_refs: ["#9"]`. Shipped surfaces: `ExternalSystem.DELIVERY_REPORT`, `itt link report`, MCP
`link_report`.

- Field: `ExternalLink.external_path` (mirrored to `stored_ref.url`).
- **Shape: absolute `http://` or `https://` ONLY** — hard-validated:
  `if not report_url.startswith(("http://","https://")): raise BadParameter`
  (`intenttree/client/src/intenttree_client/cli/commands/link_cmd.py:372-376`). Read surfaces gate
  the anchor on the same regex, so a relative path is both rejected at write time and inert in UI.
- Link identity PF-1 should mirror: `external_id = report:{route}:{subject}`
  (`link_cmd.py:378`), upsert on `(target_type, target_id, source_system, external_id)`.
- Caveat: PF-2 was never clicked live (its DI-275 open) — the deployed node lacks the enum.

**Consequence for M1:** the servable URL PF-1 reports must be **origin-qualified absolute**
(e.g. `http://10.42.10.76:8042/api/preview/asset/<id>/html`), not `/api/preview/...`. This is the
plan's R2 risk and it is real shipped behavior, not theoretical.

### Corrections to statements found during verification

- **`/api/preview/asset/{assetId}/html` DOES exist** — `api/app/api/preview.py:634`,
  `shared/openapi.yaml:2035`. (An intermediate check claimed only `/content` existed; it had missed
  the second route.) M1's AC command is executable exactly as the plan writes it.
- The plan's frontmatter cites PF-3 at `.../implementation_plans/infrastructure/delivery-report-hosting-and-linking-v1.md`;
  the real path is `.../implementation_plans/delivery-report-hosting-and-linking-v1.md`
  (no `infrastructure/` subdir). Fix in M4.
- **PF-3 is `status: not_started`.** No `atlas` export target exists upstream and nothing emits
  `--target atlas` today. PF-1 therefore **defines** the ingest contract; there is no upstream
  constraint to conform to beyond the envelope fields above. Ingest must accept the envelope
  as-emitted (any `target` value) and must not require `target == "atlas"`.
- `manifest_path`/`html_path` are absolute paths **on the generating machine** — unusable as remote
  ingest sources. Ingest takes a local HTML file argument + uploads content (matches the plan's
  `atlas report ingest <html> --envelope <env.json>` shape). Do not build a path-reference ingest.

### Known upstream footgun inherited by M3 (DI-283 / PF-3 OQ-5, unsettled upstream)

`subject` is a feature/project **slug**, not a per-instance key. Keying a stable asset id on
`route+subject` is correct for `dossier`/`feature` (one living record — the plan's intent) but
**collapses** `phase`/`program`/`readiness` reports for the same project onto one asset, silently
overwriting. This is unsettled upstream. M3 should implement the plan's OQ-3 decision as written
**and explicitly document the collapse**, plus capture it as a `DI-` row in M4 rather than
inventing a discriminator this repo cannot make authoritative.

---

## 2026-08-01 — DEVIATION: wave restructure for file ownership

**Plan's `wave_plan.waves`:** `[["M1"], ["M2","M3"], ["M4"]]`
**Executing as:** `[["M1"], ["M2"], ["M3"], ["M4"]]` (fully serial)

**Why — two independent hazards, one fix.**

1. *Parallel-edit.* The plan parallelizes M2 and M3 on **dependency** grounds — correctly, they have
   no data dependency on each other (both depend only on M1). But both **extend the same ingest
   module / CLI verb that M1 creates**: M2 adds link creation to it, M3 adds stable-id resolution +
   `PUT /content` to it. Concurrent agents on one file violates the file-ownership rule and risks
   lost writes in the correctness-critical C3 milestone.
2. *Concurrent-commit.* All phases commit to this one shared worktree branch (no per-agent
   worktree isolation, so there are no cross-worktree merges to get wrong). Two agents committing
   concurrently contend on `.git/index.lock`. Serializing removes the race outright rather than
   relying on retry.

**Data dependencies are unchanged and still honored** — M2/M3/M4 all still land after M1. Cost is
wall-clock only, and this is a 6-point plan of small milestones; correctness is worth more here.

**Bonus, not incidental:** running M4 **last** means the ADR + `DI-` rows document what M1–M3
*actually* did — including whether M3 confirmed the DI-283 `subject`-collapse footgun — instead of
recording decisions from assumptions. The plan already placed M4 in its final wave; this deviation
only splits M2 from M3.

---

## 2026-08-01 — SCOPE NOTE (M2 reviewer fix, MEDIUM): link-target existence validation is out of scope

`_TRACKER_NODE_RE` in `api/app/services/import_index.py` validates only the **shape** of a
`tracker_links[].tracker` id (does it look like `node_<id>`/`tree_<id>`) — it does not verify the
target actually **exists** in IntentTree. A well-formed but nonexistent id (e.g.
`node_DOESNOTEXIST`) creates a link silently. Likewise, the `subject` → `project` typing fix (M2
reviewer HIGH finding) only checks existence against Atlas's *own* `ProjectRepository` — it does
not verify a `feature` subject or an `intenttree_node` tracker target against IntentTree.

**Why this is unverified by design, not an oversight:** the plan's scope boundary explicitly
excludes building new subsystem clients — M2 composes shipped primitives
(`ImportService`/`AssetService`), and an IntentTree client would be new integration surface outside
that boundary. Building one just to existence-check a link target is disproportionate to M2's
6-point scope, and the plan never scoped a network round-trip into the ingest hot path.

**Consequence:** this is the precise mechanism by which the plan's C3 "silent misattribution" risk
could still occur — not from a malformed id (that path fails loud), but from a well-formed id that
simply doesn't refer to anything. This is a real, tracked gap, not a fixed one.

**Disposition:** documented here + one sentence each in `_resolve_tracker`'s docstring and the
`atlas report ingest` CLI help (both in `api/app/services/import_index.py` /
`api/app/cli/atlas.py`); queued as a `DI-` row for M4 (see
`.claude/progress/delivery-report-hosting/phase-m4-progress.md` and the plan's M4 section) alongside
G4/G6/backfill/sensitivity so it is tracked at the same durability tier as the other deferred items,
not silently dropped.

---

## 2026-08-01 — M3: dossier revisioning convention (OQ-3 decision, executed)

**Implementation.** `ImportService.import_report` now resolves a stable identity key —
`(envelope.route, envelope.subject)` — before deciding create-vs-revise:

- Both present and non-blank: `_find_report_by_identity` scans existing `delivery_report` assets
  for a metadata match. A hit routes to `_revise_report_asset`, which composes `attach_content`
  (the exact primitive `PUT /assets/{assetId}/content` uses, `api/app/api/assets.py:283`) to stream
  the new HTML bytes onto the **same** asset id, then replaces `metadata` wholesale from the fresh
  envelope. No new asset is created; the asset's existing `AssetLink` rows (keyed on `asset_id`) are
  never touched by a blob-only update, so they survive unchanged — the milestone's "links intact" AC.
- Either field absent/blank: falls through to the existing `import_content` create path unchanged
  (M1/M2 behavior for a genuine first ingest, or an envelope that supplies no stable identity signal
  at all — e.g. the sparse-envelope test case).

**Byte-identical vs revised.** `_revise_report_asset` hashes the new file first (`_sha256_file`,
no store write) and compares to the existing asset's `hash_sha256`. Equal hash → true no-op
(`is_duplicate=True`, nothing written), mirroring `import_content`'s own hash-duplicate semantics.
Different hash → the revision write happens and `is_duplicate=False`, with `duplicate_of` set to the
(unchanged) stable asset id so callers — the CLI now prints `Report revised: <id>` — can tell "revised"
apart from "brand new" and from "no-op duplicate".

**DI-283 confirmed, not fixed.** Wrote a dedicated test
(`TestReportRevisionSubjectCollapseLimitation` in `api/tests/test_report_revision.py`) that ingests
two *distinct* `route=program` reports (different revisions, different HTML bytes) for the same
`subject="artifact-atlas"` and asserts they land on **one** asset id, with the second overwriting the
first's blob. This is the plan's OQ-3/DI-283 footgun made concrete: `(route, subject)` is correct and
sufficient identity for `feature`/`dossier` (one living record per subject, the plan's actual intent)
but under-specified for `program`/`phase`/`readiness`, which have no per-instance discriminator in the
envelope. Not invented here — carried forward as the `DI-` row queued for M4, per the plan's explicit
instruction not to invent an authoritative discriminator this repo cannot own.

**Sensitivity/agent_access are not re-derived on revision.** `_revise_report_asset` never touches
`sensitivity` or `agent_access` — a revision keeps whatever was set at first ingest. Deliberate:
a later re-ingest silently loosening/tightening an existing report's access would be its own kind of
misattribution risk, and the plan scoped M3 to blob + metadata revisioning, not a policy re-evaluation.

**Verification:** `cd api && uv run pytest tests -k report_revision` — 8 passed (5 service-layer cases:
stable id + no-op vs revision + sensitivity/access preservation + no-prior-identity +
missing-subject fallback; 1 DI-283 collapse regression; 1 end-to-end 200-not-403 check on the revised
asset; 1 CLI "revised" surfacing check). Full suite: `cd api && uv run pytest tests -q` — 664 passed, 2 skipped
(pre-existing, unrelated). `uv run ruff check app/services/import_index.py app/cli/atlas.py
tests/test_report_revision.py` — clean (the one ruff finding in `atlas.py` at the time of this check,
an unused `assignments` local in `_find_project_bom`'s BOM-status command, predates this milestone —
verified via `git show HEAD:api/app/cli/atlas.py`, not introduced by M3).

---

## 2026-08-02 — POST-REVIEW FIXES (end-of-feature karen gate: APPROVED-WITH-FOLLOWUPS)

Three defects fixed after the per-phase gates passed. Two were found by the end-of-feature
reviewer; one I found while independently verifying the PF-2 integration contract.

### 1. Relative preview URL broke the PF-2 contract (found in orchestrator verification)

`atlas.py` printed `Preview URL:  /api/preview/asset/<id>/html` — a **relative** path. PF-2 has
shipped and hard-rejects any report url not starting `http(s)://` (`link_cmd.py:372-376` raises
BadParameter; its UI read surfaces gate the anchor on the same regex). So the one artifact this
feature exists to produce — "the servable URL both sibling repos block on" — was emitted in a form
the downstream consumer refuses.

Why the gates missed it: the plan's AC table only checks 403→200 and asset metadata. The
origin-qualified requirement came from the PRE-FLIGHT PF-2 verification above, not from the plan, so
no phase AC encoded it.

Fix: new `ATLAS_PUBLIC_BASE_URL` setting (`settings.py`, default `http://localhost:8042`,
trailing-slash normalised) + absolute URL at the CLI. Pinned by
`test_report_ingest_cli_prints_origin_qualified_absolute_url`, which asserts `startswith("http://")`
and no `//api/preview` double-slash.

### 2. Sensitivity: silent DOWNGRADE of a stricter workspace default

`import_report` passed `sensitivity or "personal"`. That expression is always truthy, so
`import_content`'s own `sensitivity or self._default_sensitivity` (`import_index.py:361`) was never
reached — a workspace set to `client_sensitive` silently produced `personal` reports. This is the
plan's named sensitivity-leakage risk landing in the opposite direction from the one anticipated.

Fix: `ImportService._report_sensitivity` — defer to the workspace default, floor only `public`
(reports embed commit hashes / internal paths, so publishing by default must stay impossible).
Note this is *more* composition, not less: the hardcoded literal was reimplementing a default the
composed service already owned. Pinned by two regression tests.

### 3. Two ADR statements misdescribed shipped code

D-018 claimed reports "inherit the workspace's default sensitivity" (they did not — see #2), and
DI-LinkTarget cited a "link preview UI" mitigation **that does not exist**. Both corrected in
`docs/DECISIONS.md`, each with an explicit note that the prior wording was wrong. An ADR is the
durable record; a plausible-but-false one is worse than a gap.

### Corrected: DI-SubjectCollapse was under-described as purely upstream

The reviewer was right. The *inability to separate instances* is upstream (no discriminator in the
envelope). But the *silent overwrite* is a **local** choice: route-gating the stable-id path to
`{feature, dossier}` would convert data loss into new-asset-per-ingest using only data Atlas already
owns. Not done here because OQ-3 is a human-accepted decision whose letter forbids new assets, and
narrowing it for 3 of 5 routes deserves an explicit amendment rather than a close-out edit. Recorded
as the preferred handling on the DI row.

### Test/lint state after fixes

`cd api && uv run pytest tests` → **667 passed, 2 skipped** (was 664; +3 new regression tests).
Ruff on all touched files: clean except one PRE-EXISTING unused-variable in `cmd_bom_status`
(present at base `6c29ea9`, unrelated to PF-1, left alone).

### Inconclusive: the gpt-5.6 cross-family lens

Routing planned an independent Codex `gpt-5.6-sol` AC-validation pass. It **did not converge** — the
run wandered into unrelated repo files and its own session history (~434 KB) and was stopped without
producing a verdict. It contributed nothing to this gate; the end-of-feature `karen` review plus
orchestrator verification carried it. Not retried — the two defects it was meant to hunt were both
found by other means. A future run should give Codex a pre-extracted diff rather than repo access.

### Reviewer follow-up NOT taken (recorded, not silently dropped)

`_find_report_by_identity` is an O(n) full-asset scan per ingest. Fine at current scale (~14 assets),
unmeasured beyond that. Left as-is; noted here so it is not rediscovered as a surprise.
