---
it_schema: 1
feature_slug: delivery-report-hosting
title: "Delivery-Report Hosting (PF-1: artifact_atlas host) — implementation plan"
doc_type: implementation_plan
status: draft
tier: 2
priority: P2
points: 6
risk_level: medium
context_class: C3   # M2 (scope-attribution correctness) is C3; M1/M3 are C2, M4 is C1.
created: 2026-07-31
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
# IntentTree binding (captured 2026-07-31): feature node + 4 milestone nodes (M1-M4) with
# depends_on edges (M2/M3/M4 -> M1) live in the new artifact_atlas tree; sibling PF-2/PF-3
# relationships are external-links on M1/M3/feature (siblings not yet registered in itt).
intenttree_workspace: ws_01KV8VMWX9EJ6VDQKEBMYQZRXG   # Agentic OS (slug: agentic-os)
intenttree_tree: tree_01KYWGV76XTEM7B11GYWD7Q93Y      # artifact-atlas (new per-repo tree)
intenttree_node: node_01KYWGWKHF5BWAQYACK46NC1TC      # PF-1 feature work_package
spike_ref: ../agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/spikes/atlas-spike.md
adr_refs:
  - ../agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-proposed-adr.md
related_documents:
  - docs/project_plans/prds/features/delivery-report-hosting-v1.md
  - ../agentic_meta_dev/docs/project_plans/design-specs/delivery-report-hosting-and-linking-v1.md
  - ../agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-feasibility-brief.md
  - ../agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/spikes/atlas-spike.md
  # Sibling PF-3 (launchpad wiring) — hard-gates on PF-1 M1 + OQ-3:
  - ../agentic_meta_dev/docs/project_plans/implementation_plans/infrastructure/delivery-report-hosting-and-linking-v1.md
  # Sibling PF-2 (intenttree link+UI) — consumes PF-1's servable URL:
  - ../intenttree/docs/project_plans/implementation_plans/features/delivery-report-link-and-ui-v1.md
  - ../intenttree/docs/project_plans/PRDs/features/delivery-report-link-and-ui-v1.md
  # Superseded upstream (flip happens in agentic_meta_dev at sign-off):
  - ../agentic_meta_dev/docs/project_plans/exploration/artifact-atlas-agentic-catalog/artifact-atlas-agentic-catalog-proposed-adr.md
acceptance_criteria:
  - "M1: an envelope-driven ingest creates a delivery_report Asset whose GET /api/preview/asset/{id}/html returns 200 (not 403)."
  - "M2: ingest creates correct AssetLinks to subject + tracker_links[] targets; re-ingest does not duplicate; a wrong/absent target fails loud."
  - "M3: re-ingesting the same dossier slug updates the blob on a STABLE asset id (links intact), not a new asset."
  - "M4: D-018 recorded in docs/DECISIONS.md referencing the upstream proposed ADR; G4/G6/backfill/sensitivity captured as DI- rows."
open_questions:
  - "Envelope shape is frozen by PF-3 C1 (delivery_report writeback), not by this repo. VERIFY the emitted field set live at M1 start; the spike citation is not a contract. Fields expected: route,title,subject,revision,truth_status,generated_from,html/manifest paths,tracker_links[]."
  - "OQ-2 (reports-lens shape: saved-filter vs bespoke /reports route) — NON-blocking; deferred to the Tier-2 follow-on (G4)."
decisions:
  - decision: "OQ-3 revisioning: re-ingest updates a STABLE asset id via PUT /content keyed by envelope identity (route+subject/slug), NOT a supersedes-chain of new assets."
    rationale: "Keeps AssetLinks intact, matches the dossier 'one living record' model (design spec §6.1), and this decision is also the blocking input PF-3 M2/M3 wait on — settling it here unblocks the sibling."
    status: accepted
  - decision: "OQ-4: multi-attach on write — create links from BOTH subject and every tracker_links[] target (feature/project/intenttree_node)."
    rationale: "One report legitimately links many nodes (RF grounding precedent). route->scope->node_id resolution stays a PF-3 concern; atlas consumes envelope-provided targets."
    status: accepted
  - decision: "OQ-1: report ingest is invoked automatically by the PF-3 phase-close hook at status=candidate, never canonical."
    rationale: "Honors atlas agent-write doctrine (CLAUDE.md) — canonical promotion stays human (settings.py default_agent_access)."
    status: accepted
  - decision: "Atlas holds a DERIVED index/pointer only. Ingest never deletes, moves, or repoints canonical .claude/reports/… files."
    rationale: "Hard guardrail R1/R8 — files stay canonical, DB is derived (AOS constraint)."
    status: accepted
routing_constraints:
  - "Scope-attribution / link-target correctness (M2, C3) MUST stay claude-primary — a wrong-node link is a correctness failure (mirrors sibling PF-2 R1). No offload."
  - "Ingest composition + revisioning idempotency (M1/M3, C2) resolve to a workhorse-class executor; mechanical sub-steps are offload-eligible with re-run gates — but the servable-URL contract test (403->200) and the stable-id/idempotency assertions stay claude-verified."
  - "ADR + docs + deferred-item rows (M4, C1) are offload-eligible to an economy / free-tier model."
  - "MUST-stay classes (cross-repo merge, final synthesis, verdict) are never offloaded — resolved to claude unconditionally."
  - "No plan-time model/agent pins: delegation-router resolves provider+model per leg at dispatch against the live registry."
deferred_items_spec_refs: []
findings_doc_ref: null
changelog_required: true

wave_plan:
  waves: [["M1"], ["M2", "M3"], ["M4"]]
  phases:
    - id: M1
      title: "Report-aware ingest returns a servable preview URL"
      depends_on: []
      exit_criteria: ["Envelope-driven ingest yields a delivery_report Asset; GET /api/preview/asset/{id}/html returns 200."]
    - id: M2
      title: "Scope linking from the envelope"
      depends_on: ["M1"]
      exit_criteria: ["Correct AssetLinks to subject + tracker_links[]; idempotent re-link; wrong/absent target fails loud."]
    - id: M3
      title: "Dossier revisioning convention"
      depends_on: ["M1"]
      exit_criteria: ["Re-ingest of a dossier slug updates blob on a stable asset id via PUT /content; links intact; convention documented."]
    - id: M4
      title: "ADR + docs + deferrals"
      depends_on: ["M1"]
      exit_criteria: ["D-018 in docs/DECISIONS.md; DI- rows for G4/G6/backfill/sensitivity; stale-posture note reconciled."]
---

# Implementation Plan — Delivery-Report Hosting (PF-1: artifact_atlas host)

Today `/delivery-report` HTML lands as loose `.claude/reports/…` files with no host, index, or
linkage. When this is done, artifact_atlas ingests a rendered report + its writeback envelope into a
first-class `delivery_report` Asset that serves over the existing sandboxed capsule route and links
to the feature/project/intenttree_node it describes — the servable URL both sibling repos block on.

## Scope boundary

**In:** report-aware ingest composition (G2), `preview_allowed` classification at ingest (G3),
dossier-revisioning convention (G5), and the D-018 decision record. All by **composing shipped
primitives** (`ImportService.import_content` + `AssetService.create_link` + the capsule route) — no
new storage, render, viewer, or link-model code.

**Out (stated, not dropped):** G4 cross-scope Reports lens → Tier-2 follow-on (OQ-2); G1
delivery-report export target → **PF-3 C1**, not this repo; fleet backfill of pre-existing scattered
HTML → non-goal (R7); G6 first-class `epic` link alias → deferred (`intenttree_node` covers it).

## Rubric — what "good" looks like

The ingest verb is a thin composition over existing services, not a parallel ingest path — a
reviewer should see reused `ImportService`/`AssetService` calls, not reimplemented storage. Report
identity is explicit and stable (re-ingest is idempotent on both the blob and its links). The
`preview_allowed` classification is set at ingest and covered by a 403→200 regression test.
Attribution is correct-or-loud: a link to a wrong/absent node fails visibly, never silently. Nothing
touches canonical files.

## Named risks

- **The `preview_allowed` 403 trap (sharpest).** `default_agent_access=metadata_only`
  (`settings.py:148-151`); the capsule route 403s unless ingest sets `preview_allowed`
  (`preview.py:249-292`). M1's AC is specifically 403→200 to pin this.
- **Silent misattribution (C3).** A report linked to the wrong node is worse than an unlinked one.
  M2 must fail loud on an unresolved/absent target; mirror sibling PF-2 R1.
- **Envelope drift.** The envelope shape is owned by PF-3 C1 and may not be frozen yet — verify the
  live emitted fields at M1 start rather than coding to the spike citation.
- **Sensitivity leakage.** Reports carry commit hashes / internal paths / model-routing; confirm the
  report-asset `sensitivity` default is non-public at ingest (deferred item, but set the default now).

## References

Code first — the gap is composition, not new subsystems (all paths repo-relative):
- Capsule host (serves HTML, **no work needed**): `api/app/api/preview.py:633-746` (`get_asset_html`);
  the policy gate that 403s: `preview.py:249-292`; default access `api/app/settings.py:148-151`.
- Ingest to compose: `api/app/services/import_index.py` (`import_content:206`, accepts
  `artifact_type_id`/`agent_access`/`metadata`); CLI verbs `api/app/cli/atlas.py`
  (`cmd_import`, `cmd_asset_classify:206-227`, `cmd_asset_link:230-249`).
- Link model + vocab (extend freely, `extra="allow"`): `api/app/models/asset.py:60-129`;
  `api/app/models/vocabulary.py:262-273` (`AssetLinkTargetType` has feature/project/intenttree_node).
- Revisioning path (G5): `api/app/api/assets.py:283` (`PUT /content`).
- Decisions log: `docs/DECISIONS.md` (latest D-017 → add D-018).

**Cross-repo context digest** (so an executor needs no sibling fetch): PF-1 is the **upstream
producer** — it hard-gates on nothing from siblings. Both siblings depend on **M1's servable URL**:
PF-2 G1 stores it as `external_path` (its R2 = "storing an unservable URL"); PF-3 C2 actuates the
link and C3's phase-close hook composes export+link. PF-1's **G5/OQ-3 decision (stable `PUT /content`)
is the blocking input PF-3 M2/M3 wait on**. Envelope fields PF-1 consumes:
`route∈{feature,dossier,program,phase,readiness}, title, subject, revision, truth_status,
generated_from, html+manifest paths, tracker_links[]`.

## Milestones

> A milestone is a reviewable state of the system, not a batch of tasks.

### M1 — Report-aware ingest returns a servable preview URL  (G2 store/tag + G3, C2)

An envelope-driven ingest path (CLI `atlas report ingest <html> --envelope <writeback.json>`, or a
report-aware create+classify branch) reads the PF-3 envelope and produces one Asset:
`artifact_type_id=delivery_report`, `generated_by=agent`, `mime_type=text/html`,
`metadata.{route,revision,truth_status,subject}`, and — load-bearing — `agent_access=preview_allowed`.

**AC:** the resulting `GET /api/preview/asset/{id}/html` returns **200, not 403**; the asset carries
the report metadata; no new storage code (reuses `import_content`).

### M2 — Scope linking from the envelope  (G2 link, C3)

The same ingest creates `AssetLink` rows to the envelope's `subject` and every `tracker_links[]`
target (feature/project/intenttree_node), multi-attach on write.

**AC:** correct links created for a well-formed envelope; a second ingest does **not** duplicate
links; an envelope naming a wrong/absent target **fails loud** (non-zero exit / 4xx), never silent.

### M3 — Dossier revisioning convention  (G5, C2 — executes the OQ-3 decision)

Re-ingesting the same dossier slug updates the blob on a **stable** asset id via `PUT /content`
(keyed by envelope identity), leaving links intact — not a new asset per phase. Convention written
into the ingest verb's help + a short note in the plan's worknotes.

**AC:** two ingests of the same slug resolve to one asset id; blob updated; links preserved.

### M4 — ADR + docs + deferrals  (docs, C1)

Record **D-018** in `docs/DECISIONS.md` (host decision, cross-referencing the upstream proposed
ADR); capture G4 lens (OQ-2), G6 epic alias, fleet backfill, and report-asset sensitivity defaulting
as `DI-` rows; reconcile the stale scattered-HTML posture note.

**AC:** `grep D-018 docs/DECISIONS.md` hits; each deferred item is a tracked `DI-` row.

## AC → command → evidence

| AC | Command | Evidence of pass |
|---|---|---|
| M1 servable URL | `atlas report ingest <html> --envelope <env.json>` then `curl -s -o /dev/null -w '%{http_code}' "$ATLAS_API/api/preview/asset/<id>/html"` | prints `200` |
| M1 metadata/type | `cd api && uv run pytest tests -k report_ingest` | asset has `artifact_type_id=delivery_report`, `agent_access=preview_allowed` |
| M2 links + idempotency | `cd api && uv run pytest tests -k report_link` | links to subject+tracker_links[]; 2nd ingest adds 0 dup links; bad target raises |
| M3 stable revision | `cd api && uv run pytest tests -k report_revision` | re-ingest → same asset id, blob changed, links intact |
| M4 ADR + deferrals | `grep -n "D-018" docs/DECISIONS.md` | D-018 present; DI- rows exist for G4/G6/backfill/sensitivity |

## Sequencing (load-bearing)

**M1 before M2 and M3** — both consume the Asset + servable URL that M1 mints; this is a real data
dependency, not house style. M2 and M3 are independent of each other (run concurrently). M4 needs
only M1's shape settled. No other ordering is imposed.

## Execution ledger

Deviations logged to `.claude/worknotes/delivery-report-hosting/implementation-notes.md`, reviewed at
each milestone boundary. **Blockers still stop.** No Mode-D surface (`PUT /content` writes a derived
blob, not a schema change or canonical-file mutation) — but if M3 turns out to need a migration, that
is a Mode-D boundary and halts for approval.
