---
title: "PRD: Delivery-Report Hosting — artifact_atlas Host (PF-1)"
schema_version: 2
doc_type: prd
it_schema: 1
description: "artifact_atlas closes the HOST seam for shipped /delivery-report HTML: an envelope-driven, report-aware ingest path stores the report as a first-class Atlas asset, serves it via the existing sandboxed preview capsule, and links it to its owning feature/project/intenttree scope — composing shipped primitives with no new storage or render code."
status: draft
created: 2026-07-31
updated: 2026-07-31
feature_slug: delivery-report-hosting
feature_version: "v1"
tier: 2
effort_estimate: "~6 pts (5–7)"
prd_ref: null
plan_ref: docs/project_plans/implementation_plans/features/delivery-report-hosting-v1.md
related_documents:
  - agentic_meta_dev/docs/project_plans/design-specs/delivery-report-hosting-and-linking-v1.md # design spec (§2 A, §6 compose, §8 decomposition)
  - agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-proposed-adr.md # proposed ADR
  - agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/spikes/atlas-spike.md # atlas spike (fitness/gap for PF-1)
  - agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-feasibility-brief.md # feasibility brief (verdict: GO, atlas leg 0.82)
  - agentic_meta_dev/docs/project_plans/implementation_plans/infrastructure/delivery-report-hosting-and-linking-v1.md # sibling PF-3 — hard-gates on PF-1 M1 + OQ-3
  - intenttree/docs/project_plans/implementation_plans/features/delivery-report-link-and-ui-v1.md # sibling PF-2 plan — consumes PF-1's servable URL
  - intenttree/docs/project_plans/PRDs/features/delivery-report-link-and-ui-v1.md # sibling PF-2 PRD
  - agentic_meta_dev/docs/project_plans/exploration/artifact-atlas-agentic-catalog/artifact-atlas-agentic-catalog-proposed-adr.md # superseded catalog ADR (reconciled by D-018)
references:
  user_docs: []
  context: []
  specs: []
  related_prds: []
spike_ref: agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/spikes/atlas-spike.md
adr_refs:
  - agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-proposed-adr.md
charter_ref: null
changelog_ref: null
test_plan_ref: null
owner: nick
contributors: []
priority: P2
risk_level: medium
category: "product-planning"
tags: [prd, planning, feature, delivery-report, hosting, artifact-atlas]
milestone: null
commit_refs: []
pr_refs: []
files_affected: []
open_questions:
  - q: "OQ-3 — dossier revisioning: stable PUT /content vs supersedes-chain?"
    owner: "PF-1 (blocks its own M3; also a blocking input to PF-3 M2/M3)"
    status: "decided — stable-asset PUT /content keyed by envelope identity"
  - q: "OQ-4 — which envelope fields become AssetLinks: subject-only vs subject + tracker_links[]?"
    owner: "PF-1 (scope-decision only; route→scope→node_id resolution stays a PF-3/delivery-report-skill decision)"
    status: "decided — multi-attach-on-write from subject + tracker_links[]"
  - q: "OQ-1 — who calls the ingest verb, and at what asset status?"
    owner: "PF-3 phase-close hook (consumer); PF-1 defines the verb"
    status: "decided — auto-ingest via PF-3 phase-close hook at status=candidate; canonical promotion stays human"
  - q: "OQ-2 — reports-lens shape: saved filter vs bespoke /reports route (G4)?"
    owner: "Tier-2 follow-on"
    status: "deferred — non-blocking for this PRD"
decisions:
  - decision: "Dossier revisioning uses a stable-asset PUT /content keyed by envelope identity (G5/OQ-3)."
    rationale: "Keeps AssetLinks intact across re-ingest; matches the 'one living record' dossier lifecycle; unblocks sibling PF-3 M2/M3."
    status: "accepted"
  - decision: "Ingest multi-attaches AssetLinks from envelope subject + tracker_links[] (OQ-4)."
    rationale: "One report legitimately links many nodes (RF-grounding precedent); node-resolution logic stays PF-3/delivery-report-skill's responsibility — atlas only decides which already-resolved fields become links."
    status: "accepted"
  - decision: "Auto-ingest is triggered by the PF-3 phase-close hook at status=candidate, never canonical (OQ-1)."
    rationale: "Honors atlas's agent-write doctrine (CLAUDE.md): default agent writes affecting BOM/asset-access/canonical state are suggestion/draft; canonical promotion stays a human action."
    status: "accepted"
  - decision: "Atlas holds a derived index/pointer only; ingest never deletes or repoints canonical .claude/reports/… files (R1/R8 guardrail)."
    rationale: "Preserves the project boundary in CLAUDE.md — atlas is not the system of record for every upstream file blob."
    status: "accepted"
success_metrics:
  - "An ingested delivery-report asset returns HTTP 200 (not 403) from GET /api/preview/asset/{id}/html."
  - "100% of ingested reports carry AssetLink rows to every target resolved from the envelope's subject + tracker_links[]."
  - "Re-ingesting the same dossier slug produces zero duplicate assets — stable asset id via PUT /content, links intact."
  - "D-018 recorded in docs/DECISIONS.md, cross-referencing and reconciling the upstream proposed ADR."
agent_title: "artifact_atlas: delivery-report host (ingest + link + revision)"
agent_summary: "Compose shipped ImportService.import_content + AssetService.create_link into a report-aware ingest verb so a shipped delivery-report HTML gets a stable servable preview URL, correct scope links, and stable-id revisioning — no new storage/render/link-model code."
required_artifacts: []
changelog_required: true
---

# Feature Brief & Metadata

**Feature Name:**

> Delivery-Report Hosting — artifact_atlas Host (PF-1)

**Filepath Name:**

> `delivery-report-hosting-v1`

**Date:**

> 2026-07-31

**Author:**

> nick (drafted by Claude per the PF-1 scope brief)

**Related Epic(s)/PRD ID(s):**

> PF-1 of the 3-repo "Delivery-Report Hosting & Linking" initiative. Siblings: PF-2 (intenttree
> link + UI, consumes PF-1's servable URL) and PF-3 (agentic_meta_dev wiring, hard-gates on PF-1
> M1 + OQ-3). Exploration verdict: **GO** (atlas leg confidence 0.82).

**Related Documents:**

> See frontmatter `related_documents` — design spec, proposed ADR, atlas spike, feasibility brief,
> both PF-3 and PF-2 planning docs, and the superseded catalog ADR.

---

## 1. Executive Summary

Shipped `/delivery-report` HTML today lands as loose files under `.claude/reports/…` with no
host, index, or linkage back to the feature or epic that produced it. This PRD scopes the
**artifact_atlas slice (PF-1)** of the initiative: a report-aware ingest path that reads the PF-3
writeback envelope and composes two already-shipped primitives — `ImportService.import_content`
and `AssetService.create_link` — to store the report as a first-class Atlas asset, make it
servable at a stable URL via the existing sandboxed preview capsule, and link it to its owning
scope. This closes the one seam both sibling repos hard-gate on. No new storage, render, or
link-model code is introduced.

**Priority:** MEDIUM (P2)

**Key Outcomes:**
- An ingested delivery-report asset returns a stable, servable preview URL
  (`GET /api/preview/asset/{id}/html` → 200, not the current default 403).
- The report carries correct `AssetLink`s to its owning feature/project/intenttree_node, resolved
  from the envelope's `subject` and `tracker_links[]`.
- Re-ingesting the same dossier phase-close revision updates a **stable** asset in place instead
  of accumulating orphaned duplicates.

---

## 2. Context & Background

### Current State

Artifact Atlas already has everything needed to host HTML except the report-aware composition
glue: a sandboxed HTML capsule route (`api/app/api/preview.py:633-746`, CSP `sandbox
allow-scripts`), a free-form `Asset` model with `extra="allow"` metadata, a link vocabulary
(`AssetLinkTargetType`: `feature`, `project`, `intenttree_node`), and an ingestion CLI/service
(`atlas import`, `ImportService.import_content`). None of this is report-aware today — ingest is
three manual, unlinked calls, and the default `agent_access=metadata_only` silently 403s any HTML
capsule request unless a caller remembers to override it.

### Problem Space

A `delivery-report` HTML file produced by the launchpad's `/delivery-report` skill (PF-3) has no
durable, clickable, linked home. Consumers (a human, or IntentTree's node detail view in PF-2)
have no stable URL to point at and no record of which feature/epic/dossier the report belongs to.

### Current Alternatives / Workarounds

Operators share the local HTML file path directly, or paste ad hoc summaries elsewhere. Neither
produces a durable, linked, servable artifact; both lose the connection to the originating
feature/phase once the local file moves or is cleaned up.

### Architectural Context

This feature is **pure composition**, not new architecture: it reuses the existing MP-aligned
layers (routers → services → repositories) already shipped for asset ingest, linking, and
preview. The only new surface is a report-aware CLI verb / ingest branch that reads an envelope
and calls the existing service methods with the right arguments.

---

## 3. Problem Statement

> As the AOS operator, when a phase-close hook produces a delivery-report HTML artifact, I get a
> loose file with no host, index, or linkage — instead of a stable, servable, scope-linked asset
> I can click from IntentTree or CCDash.

**Technical Root Cause (gap IDs from the atlas spike / design spec §2.2):**
- **G2** — no report-aware ingest path; today's ingest is three manual, report-unaware calls.
  `api/app/cli/atlas.py`, `api/app/services/import_index.py`.
- **G3** — `agent_access` defaults to `metadata_only` (`api/app/settings.py:148-151`); the preview
  capsule's policy gate (`preview.py:249-292`) 403s unless ingest explicitly sets
  `preview_allowed`. This is the load-bearing trap: hosting silently fails without it.
- **G5** — no convention for re-ingesting the same dossier slug across phase closes without
  orphaning links or minting duplicate assets.

---

## 4. Goals & Success Metrics

### Primary Goals

**Goal 1: Servable host**
- An envelope-driven ingest produces an asset whose preview URL returns 200.
- Success: `GET /api/preview/asset/{id}/html` → 200 for every ingested delivery-report asset.

**Goal 2: Correct scope linking**
- Ingest resolves the envelope's `subject` and `tracker_links[]` into `AssetLink` rows against the
  right feature/project/intenttree_node targets.
- Success: every ingested report has ≥1 `AssetLink`; re-ingest does not duplicate links.

**Goal 3: Stable revisioning**
- Re-ingesting the same dossier identity (route + subject/slug) updates the existing asset's blob
  via `PUT /content` rather than minting a new asset.
- Success: N re-ingests of the same dossier slug → 1 asset id, N blob revisions, 0 duplicates.

### Success Metrics

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|---------------------|
| Preview URL status for ingested report | N/A (no host today) | 200 | `GET /api/preview/asset/{id}/html` after ingest |
| AssetLinks per ingested report | 0 | ≥1, matching envelope `subject`/`tracker_links[]` | `GET /api/assets/{id}/links` |
| Duplicate assets per dossier slug after N re-ingests | N/A | 0 | Query by dossier identity; count distinct asset ids |
| D-018 ADR entry present | Absent | Present, cross-referencing upstream proposed ADR | `docs/DECISIONS.md` |

---

## 5. User Personas & Journeys

**Audience note:** this is an internal, single-user AOS tool. The exploration deliberately skipped
a value/market leg for this reason (feasibility brief) — no external personas or market metrics
are introduced here.

**Primary Persona: AOS operator**
- Role: the single human operator of the Agentic OS, working through Claude Code and its
  subagents across repos.
- Needs: a clickable, durable, scope-linked home for a delivery-report so it can be surfaced from
  IntentTree, CCDash, or a direct link, without hunting for a local file path.
- Pain Points: today, a delivery-report is a loose file with no index and no link back to the
  feature/epic it documents; re-running the same phase's report produces no stable identity.

### High-level Flow

```mermaid
graph TD
    A[PF-3 phase-close hook emits writeback envelope] --> B[atlas report ingest --envelope]
    B --> C[Store blob + tag: artifact_type_id=delivery_report, agent_access=preview_allowed]
    C --> D[Create AssetLinks: subject + tracker_links[] targets]
    D --> E[GET /api/preview/asset/id/html -> 200]
    E --> F[PF-2: intenttree node stores servable URL]
    D --> G[Re-ingest same dossier slug]
    G --> H[PUT /content on stable asset id -- links intact]
```

---

## 6. Requirements

### 6.1 Functional Requirements

| ID | Requirement | Priority | Notes |
| :-: | ----------- | :------: | ----- |
| FR-1 | A report-aware ingest path (`atlas report ingest <html> --envelope writeback.json`, or a report-aware create+link branch) reads the PF-3 writeback envelope and calls `ImportService.import_content` to store the blob, tagging `artifact_type_id=delivery_report`, `generated_by=agent`, `mime_type=text/html`, and `metadata.{route,revision,truth_status,subject}`. | Must | G2. No new storage code — pure composition. |
| FR-2 | Ingest explicitly sets `agent_access=preview_allowed` on the created/updated asset. | Must | G3. Without this the capsule route 403s (default is `metadata_only`). |
| FR-3 | Ingest creates `AssetLink` rows from the asset to every target resolved from the envelope's `subject` and each entry in `tracker_links[]` (multi-attach). | Must | G2 + OQ-4. Uses existing `AssetService.create_link` / `AssetLinkTargetType` (`feature`, `project`, `intenttree_node`). |
| FR-4 | Re-ingesting the same dossier identity (route + subject/slug) updates the blob of the existing stable asset via `PUT /content` rather than creating a new asset; existing `AssetLink`s are preserved. | Must | G5 / OQ-3. |
| FR-5 | Ingest fails loudly (non-zero exit, clear error) when an envelope target cannot be resolved to a valid link target, rather than silently skipping the link. | Must | Mirrors sibling R1 correctness guardrail. |
| FR-6 | A `docs/DECISIONS.md` entry (D-018) records the host decision, cross-referencing and reconciling the upstream proposed ADR and the superseded 2026-06-12 catalog ADR. | Must | See §13 ADR action. |
| FR-7 | Deferred items (G4 reports lens, G6 epic alias, fleet backfill, report-asset sensitivity defaulting) are captured as `DI-` rows in the deferred backlog. | Should | Non-blocking; see §7 Out of Scope. |

### 6.2 Non-Functional Requirements

**Security:**
- Atlas ingest never deletes or repoints the canonical `.claude/reports/…` HTML files — it holds a
  **derived** index/pointer only (hard guardrail R1/R8).
- Canonical promotion (elevating a `candidate`-status ingested asset to canonical) stays a human
  action per `CLAUDE.md` — the PF-3 phase-close hook auto-ingests at `status=candidate`, never
  `canonical`.
- Report assets should default to a non-public `sensitivity` posture (LAN-bound reports may
  contain commit hashes, internal paths, or model-routing detail) — confirmed as an in-plan
  default, tracked as a deferred sensitivity-defaulting item if not fully resolved in M1.

**Reliability:**
- Ingest is idempotent per dossier identity: repeated runs against the same envelope/slug converge
  to one stable asset, not N duplicates.

**Observability:**
- Reuses existing structured logging / spans already emitted by `ImportService` and
  `AssetService` — no new telemetry surface required for the MVP.

**Performance / Accessibility:**
- Not applicable beyond what the existing preview capsule and asset list/detail views already
  provide — no new render or UI surface is introduced by PF-1.

---

## 7. Scope

### In Scope

- **G2 — report-aware ingest composition.** Envelope → store + tag → link, composing shipped
  `ImportService.import_content` + `AssetService.create_link`. No new storage code.
- **G3 — `agent_access=preview_allowed` classification at ingest**, load-bearing (else the capsule
  route 403s).
- **G5 — dossier-revisioning convention**: stable `PUT /content` keyed by envelope identity, not
  new code beyond the convention + a stable-id branch.
- **D-018 ADR record** in `docs/DECISIONS.md`.
- Existing link vocabulary for feature/project/intenttree_node scope (already present — no schema
  change required).

### Out of Scope

- **G4 — cross-scope Reports lens** (bespoke `/reports` route with route/revision/truth_status
  columns + epic→features→reports rollup). Deferred as a **Tier-2 follow-on** (OQ-2) — a
  per-project saved filter is viable today, but a true cross-scope lens needs a cross-project
  aggregate query the API lacks. Not part of this PRD.
- **G1 — delivery-report export target.** Belongs to **PF-3 C1** (upstream `delivery_report.py` +
  `aos-integration.md`), not this repo. PF-1 only agrees the envelope shape it consumes (§8).
- **Fleet-wide backfill** of pre-existing scattered `.claude/reports/…` HTML (risk R7) — never a
  v1 blocker; a future `op fleet`-style sweep.
- **Dossier revisioning UI / cross-scope lens UI** — deferred alongside G4.
- **Deleting or repointing local canonical report files** — explicitly never in scope; atlas holds
  a derived index only (R1/R8 guardrail).
- **G6 — `epic` first-class `AssetLinkTargetType` alias** — optional; `intenttree_node` already
  covers an epic (a `work_area` node). Add only if a first-class label is later wanted.

---

## 8. Dependencies & Assumptions

### Cross-Repo Contract — writeback envelope (external dependency, verify live)

PF-1 ingest **consumes** a writeback envelope produced upstream by PF-3. The fields below are the
frozen shape per the PF-3 C1 contract, per the scope brief:

| Field | Description |
|---|---|
| `route` | One of `feature \| dossier \| program \| phase \| readiness` |
| `title` | Human-readable report title |
| `subject` | Primary scope target (feature/project/node identity) — becomes the primary `AssetLink` |
| `revision` | Revision/version marker used for dossier-identity + `PUT /content` matching (G5) |
| `truth_status` | Report's truth/confidence status, carried into `metadata.truth_status` |
| `generated_from` | Provenance pointer (what produced the report) |
| HTML + manifest paths | Local file paths ingest reads to build the asset blob |
| `tracker_links[]` | Additional link targets — multi-attach per OQ-4 |

**This is the one open external dependency for this feature.** The exact emitted shape is frozen
by **PF-3 C1** and is not yet observable in this repo; **verify the live envelope shape when PF-3
C1 lands, at the start of implementation**, before finalizing the envelope-reader task. Do not
implement against the spike-cited shape alone without that verification.

### Internal Dependencies

- **`ImportService.import_content`** (`api/app/services/import_index.py:206`) — shipped; ingest
  composes it, does not modify it.
- **`AssetService.create_link`** (via `api/app/api/assets.py:190`, CLI `cmd_asset_link:230-249`) —
  shipped; used as-is for multi-attach.
- **Preview capsule route** (`api/app/api/preview.py:633-746`) — shipped; no viewer work needed.
- **`AssetLinkTargetType` vocabulary** (`api/app/models/vocabulary.py:262-273`) — already has
  `feature`, `project`, `intenttree_node`; no schema change required for M1/M2.

### Assumptions

- The PF-3 phase-close hook is the sole caller of the new ingest verb in v1 (OQ-1); it invokes
  ingest at `status=candidate`.
- `.claude/reports/…` files remain the canonical source of truth; Atlas's copy is always derived.
- `artifact_type_id` stays a free string (per current model), so no schema migration is required
  to introduce `delivery_report` as a value.

### Feature Flags

- None required — per-asset `agent_access` already gates preview exposure; no new flag surface is
  introduced.

---

## 9. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
| ----- | :----: | :--------: | ---------- |
| Envelope shape drifts from what's assumed at plan time (the one open cross-repo dependency) | High | Med | Verify the live PF-3 C1 envelope shape at execution start before finalizing the reader; do not implement against spike citations alone. |
| Ingest omits `agent_access=preview_allowed`, silently 403ing the capsule route (G3 trap) | High | Med | FR-2 makes this an explicit, tested step; add a 403→200 regression test. |
| Re-ingest of the same dossier slug mints a duplicate asset instead of updating in place (G5) | Med | Med | FR-4 + OQ-3 decision (stable `PUT /content` keyed by envelope identity); test N re-ingests → 1 asset id. |
| Ingest deletes, moves, or repoints a canonical `.claude/reports/…` file (violates R1/R8 guardrail) | High | Low | Ingest is read-only against the canonical file; never write, move, or delete it. Explicit guardrail in FR/ADR. |
| Report assets default to a public-ish sensitivity posture, exposing LAN-internal detail | Med | Low | Confirm/set a non-public default at ingest; track as deferred item if not resolved in M1. |
| Sibling PF-2/PF-3 work is blocked if PF-1 M1 slips (both hard-gate on the servable-URL seam) | High | Low | M1 lands first per the milestone sequencing; PF-1 has no upstream hard-gate of its own. |

---

## 10. Target State (Post-Implementation)

**User Experience:**
- The AOS operator (or a downstream consumer like PF-2's IntentTree node view) can follow a stable
  URL to a hosted delivery-report and see it correctly linked to its owning feature/project/node.
- Re-running the same phase-close report updates the same living asset rather than accumulating
  clutter.

**Technical Architecture:**
- A single new report-aware ingest composition path sits in front of the existing
  import/link/preview services — no new tables, models, or render surfaces.
- `docs/DECISIONS.md` carries D-018 documenting the host decision and its relationship to the
  upstream (now-superseded) catalog ADR.

**Observable Outcomes:**
- `GET /api/preview/asset/{id}/html` → 200 for every ingested delivery-report asset.
- `AssetLink` rows correctly reflect envelope-provided scope.
- Zero duplicate assets across repeated re-ingests of the same dossier slug.

---

## 11. Overall Acceptance Criteria (Definition of Done)

Organized by the four milestones this PRD's implementation plan will execute against.

### M1 — Report-aware ingest returns a servable preview URL (gates G2 store/tag + G3)

- [ ] Running the envelope-driven ingest verb against a sample writeback envelope creates an
      `Asset` with `artifact_type_id=delivery_report`, `metadata.{route,revision,truth_status,subject}`
      populated from the envelope, and `agent_access=preview_allowed`.
- [ ] `GET /api/preview/asset/{id}/html` for that asset returns **200**, not 403.
- [ ] A regression test asserts 403 without `preview_allowed` and 200 with it (proves G3 is not
      silently skipped).

### M2 — Scope linking from the envelope (gates G2 link)

- [ ] Ingest creates `AssetLink` rows to the envelope's `subject` and every `tracker_links[]`
      target (feature/project/intenttree_node), verified via `GET /api/assets/{id}/links`.
- [ ] Re-ingesting the same envelope does not create duplicate `AssetLink` rows.
- [ ] A wrong or unresolvable link target fails loudly (non-zero exit / explicit error), not
      silently — per FR-5.

### M3 — Dossier revisioning convention (gates G5, gated on OQ-3)

- [ ] Re-ingesting the same dossier slug (same route + subject/revision identity) updates the blob
      of the **same** asset id via `PUT /content` rather than minting a new asset.
- [ ] Existing `AssetLink`s on that asset remain intact after the revision update.
- [ ] The revisioning convention is documented (in the ADR or an adjacent doc) so future callers
      (including PF-3 M2/M3) can rely on it without re-deriving it.

### M4 — ADR + docs + deferrals

- [ ] `docs/DECISIONS.md` carries a new **D-018** entry per §13, cross-referencing the upstream
      proposed ADR and reconciling the superseded 2026-06-12 catalog ADR.
- [ ] G4 (reports lens), G6 (epic alias), fleet backfill, and sensitivity-defaulting are captured
      as `DI-` rows in the deferred items backlog (not silently dropped).
- [ ] CHANGELOG `[Unreleased]` entry added for the new host capability (`changelog_required: true`).

---

## 12. Assumptions & Open Questions

### Assumptions

- PF-3's phase-close hook is the intended (and, for v1, only) caller of the ingest verb.
- The envelope fields listed in §8 are correct as of this PRD's authoring but **must be verified
  live** once PF-3 C1 lands, before the envelope-reader task is finalized.
- No UI work is required in this repo — the existing asset list/detail views already surface any
  asset with `artifact_type_id=delivery_report` via existing filters.

### Open Questions

See frontmatter `open_questions` for the machine-readable form (OQ-1 through OQ-4, all decided or
explicitly deferred as of this draft). Narrative summary:

- [x] **OQ-3**: Dossier revisioning — stable `PUT /content` vs `supersedes`-chain?
  - **A**: Decided — stable-asset `PUT /content` keyed by envelope identity. Blocks M3 here; also a
    blocking input to sibling PF-3 M2/M3.
- [x] **OQ-4**: Which envelope fields become `AssetLink`s?
  - **A**: Decided — multi-attach-on-write from `subject` + `tracker_links[]`. The
    route→scope→node_id *resolution* itself stays a PF-3/delivery-report-skill decision; PF-1 only
    decides which already-resolved fields become links.
- [x] **OQ-1**: Who calls ingest, and at what status?
  - **A**: Decided — auto via the PF-3 phase-close hook at `status=candidate`; canonical promotion
    stays human.
- [ ] **OQ-2**: Reports-lens shape (saved filter vs bespoke `/reports` route) — the G4 decision.
  - **A**: Deferred to the Tier-2 follow-on; non-blocking for this PRD.

---

## 13. Appendices & References

### ADR Action

There is **no reports-hosting ADR inside the artifact_atlas repo** to supersede directly. The
stale, never-accepted ADR lives upstream at
`agentic_meta_dev/docs/project_plans/exploration/artifact-atlas-agentic-catalog/artifact-atlas-agentic-catalog-proposed-adr.md`
("Artifact Atlas Catalog Ownership and HTML Capsule Hosting", `status: proposed`, 2026-06-12). The
new proposed ADR already carries `supersedes:` pointing at it; the `proposed → accepted/superseded`
flip on both files happens **in agentic_meta_dev at human sign-off**, not in this repo.

**PF-1's ADR action (this repo):** add **D-018** to `docs/DECISIONS.md` (latest existing entry is
D-017): *"Delivery-report HTML is hosted as a first-class Atlas asset
(`artifact_type_id=delivery_report`, `generated_by=agent`, `mime_type=text/html`,
`agent_access=preview_allowed`) served via the existing sandboxed `/api/preview/asset/{id}/html`
capsule route; Atlas holds a derived index/pointer only — `.claude/reports/…` files stay canonical;
cross-scope reports lens (G4) and epic alias (G6) deferred; revisioning per OQ-3."* Cross-reference
the upstream proposed ADR and note that it reconciles/supersedes the 2026-06-12 catalog ADR, whose
still-valid principles (HTML pages are first-class assets; hosting stays local-first/non-public by
default; agents use a controlled API, not broad filesystem access; no LLM on render/browse) are
retained.

### Related Documentation

- Design spec, proposed ADR, atlas spike, feasibility brief, sibling PF-2/PF-3 plans, and the
  superseded catalog ADR — see frontmatter `related_documents`.

### Symbol References (current-state anchors from the atlas spike)

- Preview capsule + policy gate: `api/app/api/preview.py:633-746,249-292`.
- Asset model + links: `api/app/models/asset.py:27-142`.
- Link vocabulary: `api/app/models/vocabulary.py:262-273` (`AssetLinkTargetType`).
- Ingestion CLI: `api/app/cli/atlas.py:112-249`. Ingest service: `api/app/services/import_index.py:73-206`.
- HTTP: `api/app/api/assets.py` (create `:134`, link `:190`, content `PUT :283`, list `:70-133`).
- Settings: `api/app/settings.py:99-151` (`reports_dir`, `default_agent_access`).
- `docs/DECISIONS.md` — latest existing entry D-017; this feature adds D-018.

---

## Implementation

Milestone breakdown, sequencing, `routing_constraints`, and `context_class` assignments live in
the companion implementation plan (`plan_ref` above). Summary: M1 (G2 store/tag + G3, C2) lands
first — both siblings block on it; M2 (G2 link, C3) depends on M1; M3 (G5/OQ-3, C2) is gated on
the already-made OQ-3 decision; M4 (docs, C1) runs in parallel. Total estimate **~6 pts (5–7)** —
see the plan's Estimation Sanity Check for the bottom-up H1–H7 breakdown.

---

**Progress Tracking:**

See progress tracking (created alongside the implementation plan):
`.claude/progress/delivery-report-hosting/all-phases-progress.md`
