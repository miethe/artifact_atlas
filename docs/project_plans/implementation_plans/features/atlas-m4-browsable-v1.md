---
it_schema: 1
schema_version: 2
feature_slug: atlas-m4-browsable
title: "Atlas M4 — organized + browsable: cross-project browse view, Asset.tags, portal projection"
doc_type: implementation_plan
status: not_started
tier: 2
priority: medium
points: null
effort_size: l
risk_level: low
context_class: C3
created: '2026-08-29'
repo: artifact_atlas
target_repo: /Users/miethe/dev/homelab/development/artifact_atlas
plan_structure: independent
intenttree_workspace: ws_01KV8VMWX9EJ6VDQKEBMYQZRXG
intenttree_tree: tree_01M0Z8MYMPQSGRR0J479D7AA5E
intenttree_node: node_01M0ZNS919Y1RMZ9RH7N2AP17K
related_documents:
- ../agentic_meta_dev/docs/project_plans/reports/docket-2026-08-26/atlas-audit-part1-capabilities.md
routing_constraints:
- "Do NOT build more reader surface ahead of confirmed writer activity — the parent WP body says
   so explicitly; M2/M3 writer activity (env-020 ingest AC chain, HTTP 200 native verify) is the
   gate this plan assumes cleared before M1 below starts."
- "Atlas registry files stay canonical (constraint 2); the newer-ITT-CC portal page in M3 is a
   read-only PROJECTION, never a competing surface."
---

# Implementation Plan: Atlas M4 — organized + browsable

Plan ID: `IMPL-2026-08-29-ATLAS-M4-BROWSABLE`. Thin milestone-based plan per the `planning` skill
default shape (l/xl plan-link soft rule, `node_01M12YP69876BFGTMAZM0W9YQG`, commit `16f522eb`) —
3 reviewable-state milestones, no wave/gate machinery; this is a single flat `atomic_task`, not a
campaign.

## Context

Two measured capability gaps block Nick from actually browsing what M2/M3 populate (full detail
on `node_01M0ZNS919Y1RMZ9RH7N2AP17K`):

1. **No `Asset.tags` field.** `asset.py:27-58` has no tags column; only `Project.tags` exists.
2. **No cross-project browse view.** `web/app/page.tsx:13-19` renders `ProjectsIndexView` → one
   card per project — browse-by-project only. `GET /api/search` (`search.py:36-68`) already
   supports the right filter set (`q, project_id, status[], source_kind[], sensitivity[],
   artifact_type[], limit`) — the gap is a missing UI page over an existing capable endpoint.
3. Parent WP's W3: one read-only portal page projecting the atlas registry in the newer ITT
   Command Center (`node_01M0Z9Z1G8TWVS596TDM32T24Z`).

## M1 — `Asset.tags` field (model + migration + population)

- Add `Asset.tags: list[str]` mirroring `Project.tags`'s existing shape.
- Alembic migration for the field; default `[]` for existing rows.
- Expose in `AssetCreate`/`AssetUpdate` schemas.
- Populate for backfilled M3 assets where a tag is mechanically derivable (doc-class, repo) —
  do not hand-author tags for assets where nothing is derivable.

**Reviewable state:** migration applied on a clean DB, `AssetCreate`/`AssetUpdate` round-trip a
tags list, and a spot-check of N backfilled assets shows derived tags present where derivable.

## M2 — cross-project browse view (web UI)

- New `web/app/assets/page.tsx` (or equivalent route) backed by `GET /api/search`, with filters
  for `artifact_type`, `tag` (from M1), `date`, `source_kind`.
- Navigate to it and confirm assets from **2+ projects** render in one view (the AC's own bar).

**Reviewable state:** the route is reachable from the app shell, and a live screenshot/verification
shows ≥2 distinct `project_id` values in the rendered result set for an unfiltered or lightly
filtered query.

## M3 — portal projection in the newer ITT Command Center

- One read-only page in the newer ITT CC projecting the atlas registry (closes parent WP's W3 AC).
- Zero model calls on the read path (constraint 4) — a direct read of the atlas store/API, no LLM
  in the loop.

**Reviewable state:** the portal page renders atlas registry content, verified against a known
registry entry, and the read path is confirmed to make no model call (code read + a live request
trace).

## Acceptance criteria (from the node, carried verbatim)

- `Asset.tags: list[str]` field exists on the model, is exposed in `AssetCreate`/`AssetUpdate`,
  and is populated for at least the backfilled M3 assets where a tag is derivable.
- A cross-project browse view (by artifact_type, tag, date, or source_kind) exists in the web UI,
  verified by navigating to it and seeing assets from 2+ projects in one view.
- One portal page in the newer ITT Command Center projects the atlas registry read-only, zero
  model calls on the read path.
