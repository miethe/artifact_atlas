---
type: context
schema_version: 2
doc_type: context
prd: "delivery-report-hosting"
feature_slug: delivery-report-hosting
title: "Delivery-Report Hosting (PF-1: artifact_atlas host) — Development Context"
status: active
created: 2026-07-31
updated: 2026-07-31
prd_ref: docs/project_plans/prds/features/delivery-report-hosting-v1.md
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
critical_notes_count: 4
implementation_decisions_count: 4
active_gotchas_count: 4
agent_contributors: []
agents: []
---
---

## Feature Goal

artifact_atlas becomes the HOST for `/delivery-report` HTML: a report-aware ingest composes shipped
primitives (`ImportService.import_content` + `AssetService.create_link` + the sandboxed capsule
route) into a first-class `delivery_report` Asset that serves over `GET /api/preview/asset/{id}/html`
and links to the feature/project/intenttree_node it describes. PF-1 is the **upstream producer** of
the three-repo split — its M1 servable URL is what both sibling plans (PF-2 intenttree link+UI, PF-3
launchpad wiring) block on. Verdict: GO (atlas leg 0.82).

---
---

## Critical Notes

1. **PF-1 hard-gates on nothing from siblings; both siblings gate on PF-1 M1.** Land M1 (servable
   URL) first. PF-2 G1 stores it as `external_path`; PF-3 C2/C3 actuate + compose it.
2. **The envelope shape is owned by PF-3 C1, not this repo.** Verify the live emitted field set at
   M1 start; do not code to spike citations. Expected: `route, title, subject, revision,
   truth_status, generated_from, html/manifest paths, tracker_links[]`.
3. **This is composition, not new subsystems.** No new storage/render/viewer/link-model code — the
   capsule host (`preview.py:633-746`) and browsable per-project asset list already ship.
4. **Atlas holds a DERIVED index/pointer only.** Ingest never deletes, moves, or repoints canonical
   `.claude/reports/…` files (guardrail R1/R8).

---
---

## Implementation Decisions

1. **OQ-3 revisioning → stable-asset `PUT /content`** keyed by envelope identity (route+subject/slug),
   NOT a supersedes-chain. Keeps links intact; also the blocking input PF-3 M2/M3 wait on.
2. **OQ-4 → multi-attach on write** from `subject` + every `tracker_links[]` target.
3. **OQ-1 → auto-ingest via the PF-3 phase-close hook at `status=candidate`** (canonical promotion
   stays human).
4. **D-018** records the host decision in `docs/DECISIONS.md`, cross-referencing the upstream
   proposed ADR (the `proposed→superseded` flip on the 2026-06-12 catalog ADR happens upstream at
   sign-off, not in this repo).

---
---

## Active Gotchas

1. **The 403 trap:** `default_agent_access=metadata_only` (`settings.py:148-151`) → the capsule route
   403s unless ingest explicitly sets `agent_access=preview_allowed` (`preview.py:249-292`). M1 AC is
   literally 403→200.
2. **Extensionless content-addressed blobs:** MIME eligibility handled at `preview.py:703-729`; ensure
   `mime_type=text/html` is set so HTML serves inline.
3. **Sensitivity leakage:** reports embed commit hashes / internal paths / model-routing — set the
   report-asset `sensitivity` default non-public at ingest (deferred item, but default it now).
4. **Re-ingest idempotency must cover BOTH blob and links** — a stable asset id with duplicated links
   is still a bug (M2 + M3 together).

---
---

## Cross-Repo Map

- **PF-2** (intenttree link+UI, consumes PF-1 URL): `../intenttree/docs/project_plans/implementation_plans/features/delivery-report-link-and-ui-v1.md`
- **PF-3** (launchpad wiring, gates on PF-1 M1+OQ-3): `../agentic_meta_dev/docs/project_plans/implementation_plans/infrastructure/delivery-report-hosting-and-linking-v1.md`
- **Scope brief** (grounded gap analysis): `.claude/worknotes/delivery-report-hosting/scope-brief.md`
