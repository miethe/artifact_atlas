# PF-1 Scope Brief — artifact_atlas host (Delivery-Report Hosting & Linking)

> Mode B artifact. Feeds a Tier-2 thin milestone plan + PRD for the `artifact_atlas` slice (PF-1)
> of the 3-repo "Delivery-Report Hosting & Linking" initiative (design spec §2 / §8.1). Verdict:
> GO (atlas leg 0.82). This brief grounds the gap in the current codebase and does not re-open leg
> findings. Gate numbering follows the atlas-spike / design-spec §2.2 gap set (G1–G6).

## PF-1 Scope (in/out)

**In — artifact_atlas builds the HOST + link-vocabulary/metadata:**
- **G2 — report-aware ingest composition.** A report-aware path (CLI `atlas report ingest <html>
  --envelope writeback.json`, or a report-aware create+link branch) that reads the PF-3 writeback
  envelope and does: store blob + tag (`artifact_type_id=delivery_report`, `generated_by=agent`,
  `mime_type=text/html`, `metadata.{route,revision,truth_status,subject}`) + create AssetLinks to
  the envelope's `subject` / `tracker_links[]` targets. **No new storage code** — pure composition
  of shipped `ImportService.import_content` + `AssetService.create_link`.
- **G3 — classify `preview_allowed` at ingest (load-bearing).** Ingest must set
  `agent_access=preview_allowed` explicitly, or the capsule route 403s (default is `metadata_only`).
- **G5 — dossier revisioning recipe.** A specified convention (not new code) for re-ingesting the
  same dossier slug each phase without orphaning links. Blocked on OQ-3.
- **Link vocabulary/metadata** for feature / project / intenttree_node scope — already present
  (`AssetLinkTargetType`); epic maps to `intenttree_node` (see G6).
- **ADR record** — a new `docs/DECISIONS.md` entry (D-018) recording the host decision.

**Out (explicit non-goals):**
- **G4 — cross-scope Reports lens** (bespoke `/reports` route with route/revision/truth_status
  columns + epic→features→reports rollup + dossier "you are here"). → **Tier-2 follow-on** (OQ-2). A
  per-project saved filter (`artifact_type_id=delivery_report`) is viable today but a true
  cross-scope lens needs a cross-project aggregate query the codebase lacks.
- **G1 — delivery-report export target** — belongs to **PF-3 C1** (upstream launchpad
  `delivery_report.py` + `aos-integration.md`), **not this repo**. PF-1 only agrees the envelope
  shape it consumes.
- **Backfill** of scattered `.claude/reports/…` HTML — non-goal (risk R7); `op fleet`-style sweep
  later, never a v1 blocker.
- **Dossier revisioning UI / cross-scope lens UI** — deferred with G4.
- **Deleting or repointing local canonical report files** — hard guardrail (R1/R8): atlas holds a
  *derived* index only.

## Gates

Cross-repo dependency direction: **PF-1 is the upstream producer; it hard-gates on nothing from
siblings and can land first / in parallel with PF-2's G1 verb.** Both siblings depend on PF-1.

| PF-1 gate | What it delivers | Which sibling hard-gates ON it (direction) |
|---|---|---|
| **G2 + G3** (ingest + `preview_allowed`) = **"an ingested report returns a stable servable URL"** `GET /api/preview/asset/{id}/html` → 200 | The core cross-repo unblocker | **PF-2 G1** (`external_path` must store the servable URL — PF-2 PRD §7 "storing an unservable URL" R2) **and PF-3 C2** (actuator call needs an ingested report → URL) **+ PF-3 C3** (phase-close hook composes it). Design spec §8.2: "PF-3 C2 depends on PF-1 G2/G3; PF-2 G1's clickable promise depends on PF-1 producing a servable URL." |
| **G5** (revisioning convention, = OQ-3) | Stable re-ingest per phase | **PF-3 M2/M3** — PF-3 frontmatter marks "OQ-3 (dossier-revisioning) — BLOCKS M2/M3." PF-1's G5 decision is a **blocking input to PF-3**. |
| **G4** (reports lens) | Cross-scope browse | Nothing hard-gates on it — follow-on. |
| **G1** (export target) | NOT PF-1 — it is **PF-3 C1** | — |

**Interface contract PF-1 must honor (from PF-3, verify live at plan start):** writeback envelope
fields = `route ∈ {feature,dossier,program,phase,readiness}`, `title`, `subject`, `revision`,
`truth_status`, `generated_from`, HTML + manifest paths, `tracker_links[]`. Atlas ingest reads these;
do not assume from spike citations — verify the emitted shape when PF-3 C1 lands.

## Current-state anchors

All paths under `/Users/miethe/dev/homelab/development/artifact_atlas/`.

- **Capsule host (EXISTS, no viewer work):** `api/app/api/preview.py:633-746` `get_asset_html` —
  serves HTML inline under CSP `sandbox allow-scripts` (header `:736`); MIME eligibility (incl.
  extensionless content-addressed blobs) `:703-729`. **GAP → none for serving.** The load-bearing
  trap: policy gate `_check_preview_access` `preview.py:249-292` denies `agent_access ∈
  {none, metadata_only}` with 403; default is `metadata_only` (`settings.py:148-151`). **GAP (G3):
  ingest must set `preview_allowed` or hosting silently 403s.**
- **Asset model (EXTENDS freely):** `api/app/models/asset.py:27-57` (`Asset`, `extra="allow"`);
  `AssetCreate:60-77` (`agent_access` default `metadata_only` at `:75`); `AssetLink`/
  `AssetLinkCreate:109-129`; `AssetRelationship:132-142`. **GAP (G2): no report-aware create path;
  `artifact_type_id` is a free string so no schema change needed.**
- **Link vocabulary:** `api/app/models/vocabulary.py:262-273` `AssetLinkTargetType` — has
  `feature`, `project`, `intenttree_node` (NO `epic`); `AssetRelationshipType.supersedes /
  superseded_by:255-256`; `AgentAccess.preview_allowed:59`; `SourceKind.local:113`;
  `GeneratedBy.agent:136`. **GAP (G6, optional/none): `epic` alias absent — epic = a `work_area`
  node, already covered via `intenttree_node`. Add alias only if a first-class label is wanted.**
- **Ingestion CLI (COMPOSE, don't rebuild):** `api/app/cli/atlas.py` — `cmd_import:112-141`
  (`import --store` `:455` → `ImportService.import_content`), `cmd_attach:144-167`,
  `cmd_asset_classify:206-227` (sets `agent_access`), `cmd_asset_link:230-249` (`create_link`,
  `--target-type intenttree_node`). **GAP (G2): no `report ingest --envelope` verb; today ingest is
  3 manual, report-unaware calls.**
- **Ingest service:** `api/app/services/import_index.py` — `import_local_path:73` + `import_content:206`
  accept `artifact_type_id` / `agent_access` / `metadata`; guesses `.html→text/html` `:131`. **GAP
  (G2): no envelope reader; no report identity / idempotency key.**
- **HTTP:** `api/app/api/assets.py` — POST create `:134`, POST link `:190`, **PUT content `:283`
  (the dossier-regen path for G5)**, list `:70-133` (supports `artifact_type_id` + `q` filters →
  saved-filter G4 viable, **but per-project only**). **GAP (G4): no cross-project aggregate for a
  cross-scope lens.**
- **Settings:** `api/app/settings.py:99-102` `reports_dir`→`exports/reports`; **`:148-151`
  `default_agent_access="metadata_only"` (the G3 trap)**; `:167` `bind_host="127.0.0.1"` (C3 ✓);
  integration export dirs `:121-141`.
- **Web (browsable index EXISTS):** list `web/app/(projects)/projects/[projectId]/assets/page.tsx`
  + detail `.../[assetId]/page.tsx`; projects index `web/app/page.tsx` (`ProjectsIndexView`).
  `HtmlRenderer`/`AssetViewer` already dispatch `text/html` (spike). **GAP (G4): no cross-scope
  `/reports` route or reports-filtered lens.**
- **Decisions:** `docs/DECISIONS.md` — latest is **D-017**; next = **D-018**. **No reports-hosting
  ADR exists in this repo** (the stale one lives in agentic_meta_dev — see ADR action).
- **Greenfield confirmed:** `delivery_report` / `delivery-report` absent repo-wide (grep of `api`
  + `web`).

## Proposed milestones (candidates)

Thin plan, 4 reviewable-state milestones. `context_class` per the plan convention (C1 doc/single-file,
C2 cross-module one repo, C3 correctness-critical, C4 highest).

| M | Milestone | One-line acceptance criterion | Gate | context_class |
|---|---|---|---|---|
| **M1** | Report-aware ingest returns a servable preview URL | An envelope-driven ingest creates an Asset (`artifact_type_id=delivery_report`, `metadata.{route,revision,truth_status,subject}`, `agent_access=preview_allowed`) whose `GET /api/preview/asset/{id}/html` returns **200, not 403**. | G2 (store/tag) + G3 | **C2** |
| **M2** | Scope linking from the envelope | Ingest creates the correct `AssetLink` rows to the envelope's `subject` + `tracker_links[]` targets (feature/project/intenttree_node); re-ingest does not duplicate links; a wrong/absent target fails loud, not silent. | G2 (link) | **C3** (scope-attribution correctness — mirrors sibling R1) |
| **M3** | Dossier revisioning convention | Re-ingesting the same dossier slug updates the blob on a **stable** asset id via `PUT /content` (links intact) rather than minting a new asset; convention documented. | G5 | **C2** (gated on OQ-3) |
| **M4** | ADR + docs + deferrals | D-018 recorded referencing the upstream proposed ADR; G4 (lens) + G6 (epic alias) + backfill captured as `DI-` rows; stale-posture note reconciled. | (docs) | **C1** |

M1 is the item both siblings block on — land it first. M2 depends on M1. M3 gated on OQ-3. M4 parallel.

## Point estimate

**PF-1 MVP (M1–M4, i.e. G2+G3+G5+ADR/docs) = 6 points** (range 5–7).

Reasoning (bottom-up): G3 is XS (~0.5–1 — one explicit flag + a 403→200 test); G2 is the real work
(~2.5–3 — envelope parse, store+tag, multi-target link, idempotency, tests) but composes shipped
primitives with **no new storage/render/viewer/link-model**; G5 is a convention + a stable-id
PUT-content branch (~1–1.5); M4 docs/ADR/deferrals (~1). Materially smaller than the sibling plans
(PF-3 authored at 8pt, PF-2 at 7pt) because those carry the actuator/hook correctness and 3-scope
UI; PF-1 wires an export target to existing ingest/link/serve. Adding a **bespoke** G4 lens would
push to ~10–13 (spec's upper band) — but G4 is deferred, so it stays out of the MVP number. This
sits at the lower-middle of the design-spec §2.2 5–10 band, consistent with the ~13pt 3-repo core.

## Open questions (blocking vs non-blocking)

- **OQ-3 — dossier revisioning (stable `PUT /content` vs `supersedes`-chain).** Touches PF-1 G5
  directly. **BLOCKS-M3** here; also a **blocking input to PF-3 M2/M3.** Recommend **stable-asset
  `PUT /content`** keyed by envelope identity (route+subject/slug) — keeps links intact, matches
  "one living record" and composes with the dossier lifecycle (design spec §6.1).
- **OQ-4 — scope→node resolution / attach model.** The `route→scope→node_id` resolution is a
  **PF-3 / delivery-report-skill decision**, not PF-1's — atlas consumes envelope-provided targets.
  For PF-1 it only decides *which envelope fields* become links. **Partially BLOCKS-M2** (subject-only
  vs subject+`tracker_links[]`, single vs multi-attach). Recommend **multi-attach-on-write** from
  `subject` + `tracker_links[]` (RF-grounding precedent — one report legitimately links many nodes).
- **OQ-1 — ingest ownership / save-after gate.** Who calls `atlas import` and at what status.
  **Non-blocking** for building the verb (M1); it governs who invokes it (PF-3 hook) + status.
  Recommend **auto via the PF-3 phase-close hook at `status=candidate`** (not `canonical`), honoring
  atlas's agent-write doctrine (`CLAUDE.md:29`; canonical promotion stays human — `settings.py:161`).
- **OQ-2 — reports-lens shape (saved filter vs bespoke `/reports` route).** The G4 decision.
  **Non-blocking; deferred** to the Tier-2 follow-on. This single decision most moves any future
  estimate.

## Deferred items

For the plan's final DOC task (capture as `DI-` rows):
- **G4 cross-scope Reports lens** (bespoke `/reports` route + cross-project aggregate query the API
  lacks today) → Tier-2 follow-on (OQ-2).
- **G6 `epic` first-class `AssetLinkTargetType` alias** — optional; `intenttree_node` covers it.
- **Fleet-wide backfill** of pre-existing scattered `.claude/reports/…` HTML — non-goal (R7).
- **Sensitivity defaulting for report assets** — apply atlas's `sensitivity` field so LAN-bound
  reports (commit hashes / internal paths / model-routing) default non-public (risk R3); confirm
  the ingest default in-plan.

## ADR action

**Finding:** there is **no reports-hosting ADR inside the artifact_atlas repo** to supersede. The
stale, never-accepted ADR lives upstream:
`agentic_meta_dev/docs/project_plans/exploration/artifact-atlas-agentic-catalog/artifact-atlas-agentic-catalog-proposed-adr.md`
("Artifact Atlas Catalog Ownership and HTML Capsule Hosting", `status: proposed`, 2026-06-12,
Decision #1 "MeatyWiki owns catalog metadata", #3 "static hosting is an adapter"). The new proposed
ADR (`.../delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-proposed-adr.md`)
already carries `supersedes:` pointing at it; the `proposed→accepted/superseded` flip on both files
happens **in agentic_meta_dev at human sign-off**, not in this repo.

**PF-1's ADR action (this repo):** add **`D-018`** to `docs/DECISIONS.md` (latest is D-017):
*"Delivery-report HTML is hosted as a first-class Atlas asset (`artifact_type_id=delivery_report`,
`generated_by=agent`, `mime_type=text/html`, `agent_access=preview_allowed`) served via the existing
sandboxed `/api/preview/asset/{id}/html` capsule route; Atlas holds a derived index/pointer only —
`.claude/reports/…` files stay canonical; cross-scope reports lens (G4) and epic alias (G6) deferred;
revisioning per OQ-3."* Cross-reference the upstream proposed ADR and note it reconciles/supersedes
the 2026-06-12 catalog ADR (whose still-valid principles — HTML pages are first-class assets, hosting
stays local-first/non-public by default, agents use a controlled API not broad FS access, no LLM on
render/browse — are retained).

## Cross-links

For `related_documents` in the PF-1 plan + PRD:
- Design spec: `agentic_meta_dev/docs/project_plans/design-specs/delivery-report-hosting-and-linking-v1.md` (§2 A, §6 compose, §8 decomposition)
- Proposed ADR: `agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-proposed-adr.md`
- Atlas spike: `agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/spikes/atlas-spike.md`
- Feasibility brief: `agentic_meta_dev/docs/project_plans/exploration/delivery-report-hosting-and-linking/delivery-report-hosting-and-linking-feasibility-brief.md`
- Sibling PF-3 (launchpad wiring — hard-gates on PF-1 M1 + OQ-3): `agentic_meta_dev/docs/project_plans/implementation_plans/infrastructure/delivery-report-hosting-and-linking-v1.md`
- Sibling PF-2 (intenttree link+UI — consumes PF-1's servable URL): `intenttree/docs/project_plans/implementation_plans/features/delivery-report-link-and-ui-v1.md` + PRD `intenttree/docs/project_plans/PRDs/features/delivery-report-link-and-ui-v1.md`
- Superseded (upstream): `agentic_meta_dev/docs/project_plans/exploration/artifact-atlas-agentic-catalog/artifact-atlas-agentic-catalog-proposed-adr.md`
