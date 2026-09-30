---
schema_version: 2
it_schema: 1
doc_type: implementation_plan
title: "Estate coherence M0 — Atlas honest states"
description: "Make live Atlas loading, error, count, and activity states report what their sources establish."
status: not_started
created: 2026-09-30
updated: 2026-09-30
feature_slug: estate-coherence-m0-atlas-honest-states
tier: 3
priority: high
risk_level: medium
effort_estimate: "8 points (m=5, s=2, xs=1)"
repo: artifact_atlas
branch: plan/estate-coherence-m0
intenttree_tree: tree_01M0G9CXTSEJAN3HPRS38H3YPQ
itt_node_id: node_01M3RA15KF42TXE9XD40K15JG3
related_documents:
  - /Users/miethe/dev/homelab/development/.wt/ec-m0plan/docs/project_plans/campaigns/2026-09-29/estate-coherence-spine-v1.md
  - /Users/miethe/dev/homelab/development/.wt/ec-m0plan/docs/project_plans/reports/estate-coherence-2026-09-29/L5-atlas-audit.md
  - /Users/miethe/dev/homelab/development/.wt/ec-m0plan/docs/project_plans/reports/estate-coherence-2026-09-29/L5-stage2-design.md
  - /Users/miethe/dev/homelab/development/.wt/ec-m0plan/docs/project_plans/reports/estate-coherence-2026-09-29/mockups/MOCKUP-LEDGER.md
  - /Users/miethe/dev/homelab/development/.wt/ec-m0plan/docs/project_plans/reports/estate-coherence-2026-09-29/screenshots/CAPTURE-LEDGER.md
wave_plan:
  phases:
    - id: P1
      title: "Remove fixture claims from live reader states"
      gate_lens: [security, validator]
      gate_lens_reason: untrusted-input
      waves:
        - id: W1
          tasks: [T1]
    - id: P2
      title: "Correct population and activity evidence"
      gate_lens: [validator]
      waves:
        - id: W1
          tasks: [T2, T3]
tasks:
  - id: T1
    title: "Remove silent fixture substitution from live Atlas reader queries"
    status: backlog
    node_type: atomic_task
    itt_node_id: node_01M3QYTMSR2DYGWBB3T9Q424P9
    assigned_to: codex
    effort: m
    files_affected: [web/lib/hooks/useProjects.ts, web/lib/hooks/useAssets.ts, web/lib/hooks/useDashboard.ts, web/lib/hooks/useBom.ts, web/lib/hooks/useInbox.ts, web/lib/hooks/useContextPacks.ts, web/features/context-packs/hooks.ts, web/features/templates/hooks.ts, web/features/dashboard/hooks/useBomGaps.ts, web/features/dashboard/hooks/useIntegrations.ts, web/features/dashboard/components/AgentActivityPanel.tsx, web/features/dashboard/components/ActiveNodesPanel.tsx, web/features/dashboard/components/KPIRow.tsx, web/features/node/NodeContextView.tsx, web/features/bom/BomOverview.tsx, web/features/coverage/hooks/useCoverageData.ts, web/features/coverage/CoverageView.tsx, web/e2e/happy-path.spec.ts, web/__tests__/honest-states.test.tsx]
    acceptance_criteria: ["Live server HTML and hydrated routes present loading, error, empty, or API-backed values; no unlabelled fixture project or asset counts appear as catalog truth.", "Forced API errors, including BOM 404, show a visible error or explicitly stale state with retry and never resolve to fixture records; successful queries still show verified live data."]
  - id: T2
    title: "Make global Browse Assets distinguish the page from the population"
    status: backlog
    node_type: atomic_task
    itt_node_id: node_01M3R0FSV30836Y4819H81D9VS
    assigned_to: codex
    effort: s
    files_affected: [api/app/services/assets.py, api/app/api/search.py, api/tests/test_routes_search.py, shared/openapi.yaml, web/features/assets/AssetBrowseView.tsx, web/__tests__/honest-states.test.tsx]
    acceptance_criteria: ["Global Browse Assets uses the API's filtered population total, or says 'N of TOTAL'; a test changes the API total while keeping one page fixed and asserts the displayed total changes.", "The search API returns a total computed before its 200-row cap for the same filters; GET and semantic search keep consistent total semantics, and an empty filtered result is displayed as empty rather than as an unknown whole-catalog count."]
  - id: T3
    title: "Remove NaN dates from Agent Activity and shared relative-time displays"
    status: backlog
    node_type: atomic_task
    itt_node_id: node_01M3R0HN9XWBCEVAN1FVNTYBEZ
    assigned_to: ica
    effort: xs
    files_affected: [web/lib/types.ts, web/lib/relativeTime.ts, web/features/dashboard/components/AgentActivityPanel.tsx, web/features/dashboard/CommandCenterView.tsx, web/features/dashboard/components/CanonicalArtifactsPanel.tsx, web/features/dashboard/components/RecentAssetsPanel.tsx, web/features/projects/components/ProjectCard.tsx, web/features/inbox/InboxQueueItem.tsx, web/features/context-packs/components/PackCard.tsx, web/__tests__/honest-states.test.tsx]
    acceptance_criteria: ["No Atlas panel renders the string 'NaN'; a unit test sends missing and invalid dates through the shared relativeTime helper and gets a non-NaN label.", "Agent Activity reads the API's timestamp field; a valid timestamp still produces a relative-time label."]
---

# Estate coherence M0 — Atlas honest states

This is the single-repo child reserved by the approved campaign spine. It covers the three `tasks[]` node IDs exactly once and ships their fixes together. M6 registry classification/project reconciliation and M7 curated-reader design are later children. This pass changes neither registry records nor curation marks, and creates no IntentTree tasks from BOM gaps.

## Routing and order

At execution, route each task through **ICA → Codex → CC-1x → CC-primary**, stopping at the first capable lane under the current routing policy; `assigned_to` is the minimum evidenced implementation lane, not a fixed model. T1 and T2 need Codex for cross-route state logic and the search contract; T3 is bounded enough for ICA. A browser-capable ICA or Claude Code lane owns screenshot verification, because Chromium cannot create a page in the Codex sandbox ([visual-verification.md](/Users/miethe/dev/homelab/development/agentic_meta_dev/docs/rules/visual-verification.md)). Direct execution fan-out is at most five, nesting depth at most two.

P1 precedes P2 where `useAssets.ts` and `AgentActivityPanel.tsx` overlap. P2's T2 and T3 can proceed in parallel after P1. The campaign M0 gate is **security + validator**; P1 applies the security lens to API/fixture input provenance (`untrusted-input` in schema v2) and the validator lens to state transitions. This Atlas child does not touch the spine's separate IntentTree credential path. Render and navigation paths make **zero model calls**; projectors and drift readers make zero model calls. The mockup gives visual direction, not pixel-level requirements.

## Implementation anchors and measured baseline

- T1: `web/lib/hooks/useProjects.ts:33-42,52-60`, `useAssets.ts:54-65,95-106,116-128`, and `useDashboard.ts:24-35` return fixtures on errors; `useBom.ts:26-40` also presents a fixture on 404. `web/features/dashboard/components/ActiveNodesPanel.tsx:97-141` and `web/features/node/NodeContextView.tsx:49-75` display fixture nodes without a live node API. Sweep the other listed live-query hooks and their consumers so first paint, failure, and empty states stay honest. Permit a fixture only behind an explicit demo route/flag with a visible **DEMO DATA** label. Update `web/e2e/happy-path.spec.ts:4-6,78-100`, which currently relies on automatic fallback. Preserve the existing `/overview` error pattern at `web/features/overview/OverviewView.tsx:135-141`.
- T2: `api/app/api/search.py:48,65-77` caps results at 200 and sets `total` to `len(results)`; `api/app/services/assets.py:357-396` filters then slices. `web/features/assets/AssetBrowseView.tsx:26-45,89-93` calls that API and labels its page length and page-only project set as a population. Correct the service/API total before displaying a whole-catalog number. Do not infer a global project count from the page's distinct IDs.
- T3: live `/api/audit/events?project_id=proj_agentic_meta_dev&limit=1` returns `timestamp`, matching `api/app/models/audit.py:18-27`; `web/lib/types.ts:471-480` and `AgentActivityPanel.tsx:67-76,140-142` expect `created_at`. Consolidate the copied relative-time logic in `CommandCenterView.tsx:54-63`, `CanonicalArtifactsPanel.tsx:36-45`, and `RecentAssetsPanel.tsx:22-31` with an invalid-date guard.
- Read-only live API probe on **2026-09-30**: `/api/projects?limit=200` returned 28 projects; summing `/api/projects/{id}/assets?limit=1` totals returned 14,779 project-attributed assets; `proj_agentic_meta_dev` returned 2,559; `/api/search?limit=200` returned 200 rows with `total: 200`; audit returned 2,567 events and a sample with `timestamp` but no `created_at`. Recount at execution because the registry changes. The 2026-09-30 [capture ledger](/Users/miethe/dev/homelab/development/.wt/ec-m0plan/docs/project_plans/reports/estate-coherence-2026-09-29/screenshots/CAPTURE-LEDGER.md) separately shows post-hydration fixture BOM/coverage/nodes, `200 assets across 3 projects`, and `NaNd ago`; its screenshots are evidence of that capture, not a current browser probe.

## Already satisfied — verify only

| Existing behavior | Evidence | Execution check |
|---|---|---|
| `/overview` shows an API error without fixture data | `web/features/overview/OverviewView.tsx:135-141`; `web/__tests__/overview-surface.test.tsx:111-119` | Re-run the error test; do not rebuild this route. |
| Context Packs shows an honest empty state | Stage-2 `screenshots/CAPTURE-LEDGER.md` row 16 | Re-capture after M0 and confirm it remains empty, not demo data. |
| Project asset API exposes a total | Live `/api/projects/proj_agentic_meta_dev/assets?limit=1` returned `total: 2559` | Keep this positive control while correcting cross-project search. |

## Validation

At parent `450a627f67d33c05fe06cf6b18e98f17cb4469bc` (`origin/development` at plan creation), capture the baseline before implementation, then re-run focused checks after each task: `cd api && python3 -m pytest -q tests/test_routes_search.py`; `cd web && npm test -- __tests__/honest-states.test.tsx` (once created); `cd web && npm run typecheck`. Run `cd api && python3 -m pytest -q` and `cd web && npm test` at child exit. On this planning worktree, those baseline commands cannot collect/run yet: `fastapi` is missing and `npm test` exits `sh: vitest: command not found`; install declared project dependencies in the execution environment, then record a clean baseline. The frontmatter validator is `.claude/skills/artifact-tracking/scripts/validate-plan-frontmatter.py`.

Tests must prove **both sides**: an unknown/unverified first paint or failed/404 query renders as unknown/error with no fixture values or green API-connected claim, **and** a successful query still renders its verified live value and panel-local connected state. Check zero-result versus truncated-result cases, API total changing while page size stays 200, and missing/invalid versus valid audit timestamps. A browser-capable ICA or Claude Code lane captures the same home, project, `/assets`, BOM, coverage, and node routes before and after hydration, plus a forced API failure; compare screenshots with the capture ledger and review the visible labels. No screenshot is claimed from this Codex sandbox. The exit re-probe records current project count, summed project asset total, browse page length and API total, and confirms no live route silently displays fixtures or `NaN`.
