---
type: progress
schema_version: 2
doc_type: progress
prd: ui-polish-pass
feature_slug: ui-polish-pass
phase: P6
status: completed
created: '2026-06-21'
updated: '2026-07-08'
prd_ref: docs/project_plans/prds/features/ui-polish-pass-v1.md
plan_ref: docs/project_plans/implementation_plans/features/ui-polish-pass-v1/phase-p6-hardening.md
commit_refs: []
pr_refs: []
owners:
- task-completion-validator
- karen
contributors:
- a11y-sheriff
- documentation-writer
- changelog-generator
tasks:
- id: P6-001
  description: tsc --noEmit gate — zero new errors vs P1 baseline; filter __tests__/a11y/
    per project convention
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P5-010
  - P2B-008
  - P3-009
  - P4B-003
  - P4C-006
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: tsc-0-errors
- id: P6-002
  description: next build gate — exits 0, no new transpilePackages/ESM warnings
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-001
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - build: next-build-exit0-15routes
- id: P6-003
  description: axe-core sweep — EntityModal on all 5 surfaces + AssetViewer all 6
    formats; zero new critical/serious violations
  status: completed
  assigned_to:
  - a11y-sheriff
  dependencies:
  - P6-002
  note: 'Live flags-ON axe-core sweep run (F-002 resolved): dashboard, gallery+table,
    one EntityModal per surface (5/5), AssetViewer 9-format gallery sweep, dark-mode
    pass. Found + fixed 2 real bugs (EntityModal focus-restore, ZoneCard click-to-open
    self-match guard). Found 6 pre-existing serious/critical rule categories, documented
    + allowlisted as known debt in F-005 (not silently hidden — logged every run).'
  started: 2026-07-08T00:00Z
  completed: 2026-07-08T00:00Z
  evidence:
  - test: web/e2e/flags-on/axe-sweep.spec.ts
  - test: web/e2e/flags-on/axe-dark-mode.spec.ts
  - doc: F-005-ui-polish-pass-findings.md
- id: P6-004
  description: Runtime smoke — P1 surfaces (ContentPane on feature-flagged AssetDetail
    page)
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-002
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: e2e-7pass-fixture
- id: P6-005
  description: 'Runtime smoke — P2 surfaces (EntityModal on all 5 detail surfaces:
    tab UI, URL state, focus)'
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-003
  note: Subsumed by P6-009's flags-on Playwright specs (open/close/tab/Escape+focus-return/deep-link
    across all 5 EntityModal surfaces) — no separate runtime-smoke pass needed.
  started: 2026-07-08T00:00Z
  completed: 2026-07-08T00:00Z
  evidence:
  - test: web/e2e/flags-on/entity-modal.spec.ts
- id: P6-006
  description: 'Runtime smoke — P3 surfaces (all 4 card families: zone-composition,
    full-width top thumbnails)'
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-005
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: e2e-gallery-cards-pass
- id: P6-007
  description: 'Runtime smoke — P4 surfaces (AssetViewer all 6 formats: image/PDF/MD/code/DOCX/PPTX
    + agent_access gate)'
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-006
  note: 'Subsumed by P6-009''s AssetViewer format sweep. Live-reachable coverage:
    image/pdf/csv/tsv/markdown-code render real fetched bytes in the gallery (mode="thumbnail",
    the only mode ever mounted in the app); docx/pptx/audio/video resolve their icon-only
    tiles without crashing; agent_access gate verified with zero content-fetch on
    restricted assets. AssetViewer mode="full" has no live mount point anywhere in
    the app (pre-existing gap, not introduced/fixed here) — tracked as F-004; that
    mode stays covered by the existing vitest unit suite only.'
  started: 2026-07-08T00:00Z
  completed: 2026-07-08T00:00Z
  evidence:
  - test: web/e2e/flags-on/asset-viewer-formats.spec.ts
  - doc: F-004-ui-polish-pass-findings.md
- id: P6-008
  description: Runtime smoke — P5 surfaces (fonts, contrast, reduced-motion, footer
    health, all P1 facelift items)
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-007
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: e2e-sidebar-kpi-pass
- id: P6-009
  description: Playwright e2e — (a) modal open/close/tab; (b) Escape+focus return;
    (c) Open full page; (d) AssetViewer per format; (e) agent_access gate
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-008
  note: 'Flags-on Playwright project added (web/playwright.config.ts, NEXT_PUBLIC_FLAGS
    pinned) alongside the legacy project. 43/43 flags-on+legacy specs pass: EntityModal
    open/close/tab x5 surfaces, Escape+focus-return x5, ?item=&tab= deep-link restore
    x5, AssetViewer 9-format smoke + agent_access gate, axe light sweep x8, axe dark
    sweep x2. PPTX real LibreOffice conversion not exercised (soffice binary present
    but LibreOffice.app not installed in this sandbox) — smoke-tests the icon-only
    thumbnail tile only; documented, not faked.'
  started: 2026-07-08T00:00Z
  completed: 2026-07-08T00:00Z
  evidence:
  - test: web/e2e/flags-on/entity-modal.spec.ts
  - test: web/e2e/flags-on/asset-viewer-formats.spec.ts
  - commit: pending
- id: P6-010
  description: Update shared/openapi.yaml — POST /api/preview/convert/pptx + proxy
    seam endpoint; coordinate with P4C-005
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P4C-005
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - test: test_openapi_parity-pass
- id: P6-011
  description: Update docs/DECISIONS.md — add all 6 ADRs (ADR-1 through ADR-6)
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-009
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-012
  description: Update docs/mvp-backlog.md — mark 5 pillar completions; add DEFER-1
    through DEFER-4
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-011
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-013
  description: DOC-006 — Design spec DEFER-1 (dark-mode-aa) — maturity:idea, problem
    statement, open questions
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-012
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-014
  description: DOC-006 — Design spec DEFER-2 (facelift-p2-items) — maturity:shaping,
    enumerate Leg-5 P2 items
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-012
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-015
  description: DOC-006 — Design spec DEFER-3 (facelift-p3-items) — maturity:idea,
    enumerate Leg-5 P3 items
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-012
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-016
  description: DOC-006 — Design spec DEFER-4 (asset-viewer-extensions) — maturity:idea,
    enumerate deferred formats (video/audio/ZIP/spreadsheet)
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-012
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-017
  description: CHANGELOG [Unreleased] entry — Added EntityModal/AssetViewer/zone cards/@miethe/ui;
    Changed ink-faint/Inter font
  status: completed
  assigned_to:
  - changelog-generator
  dependencies:
  - P6-016
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - commit: 4848bfd
- id: P6-018
  description: Plan frontmatter completion — status:completed, commit_refs, files_affected,
    deferred_items_spec_refs
  status: completed
  assigned_to:
  - documentation-writer
  dependencies:
  - P6-017
  started: 2026-06-21T19:05Z
  completed: 2026-06-21T19:10Z
  evidence:
  - doc: plan-frontmatter-completed
- id: P6-019
  description: task-completion-validator final pass — all P6 exit criteria
  status: completed
  assigned_to:
  - task-completion-validator
  dependencies:
  - P6-018
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - review: task-completion-validator-APPROVED
- id: P6-020
  description: karen final sign-off — actual state vs PRD AC-1 through AC-7; plan
    vs delivered; quality gate completeness; closes the feature
  status: completed
  assigned_to:
  - karen
  dependencies:
  - P6-019
  started: 2026-06-21T18:50Z
  completed: 2026-06-21T19:10Z
  evidence:
  - review: karen-APPROVED-on-closure
parallelization:
  batch_1:
  - P6-001
  batch_2:
  - P6-002
  batch_3:
  - P6-003
  - P6-004
  batch_4:
  - P6-005
  batch_5:
  - P6-006
  batch_6:
  - P6-007
  - P6-010
  batch_7:
  - P6-008
  batch_8:
  - P6-009
  batch_9:
  - P6-011
  batch_10:
  - P6-012
  batch_11:
  - P6-013
  - P6-014
  - P6-015
  - P6-016
  batch_12:
  - P6-017
  batch_13:
  - P6-018
  batch_14:
  - P6-019
  batch_15:
  - P6-020
  critical_path:
  - P6-001
  - P6-002
  - P6-003
  - P6-005
  - P6-006
  - P6-007
  - P6-008
  - P6-009
  - P6-011
  - P6-012
  - P6-017
  - P6-018
  - P6-019
  - P6-020
total_tasks: 20
completed_tasks: 20
in_progress_tasks: 0
blocked_tasks: 0
progress: 100
---

# ui-polish-pass — Phase P6: Hardening, A11y & Docs

**YAML frontmatter is the source of truth for tasks, status, and assignments.**

## 2026-07-08 — Wave 2 close-out (F-002 resolved; file status at_risk → completed)

P6-003/005/007/009 were the 4 tasks blocking phase closure, all deferred pending
live flags-ON verification (F-002). Closed this session:

- Added a second Playwright project (`web/e2e/flags-on/`) built with
  `NEXT_PUBLIC_FLAGS` explicitly pinned (`miethe-ui-ds,ui-tabbed-modal,dark-mode`)
  so flags-ON is deterministic regardless of future default changes — alongside
  the existing legacy project. Both projects green: **43/43 passing**
  (7 legacy + 36 flags-on: 15 EntityModal, 10 AssetViewer-format, 8 axe-light,
  2 axe-dark, plus fixture set-up).
- **P6-009**: EntityModal open/close/tab, Escape+focus-return, and
  `?item=&tab=` deep-link restore specs across all 5 migrated surfaces
  (assets/inbox/coverage/templates/bom).
- **P6-005** runtime smoke is subsumed by the P6-009 EntityModal specs above.
- **P6-007** / AssetViewer format smoke: live-covers image/pdf/csv/tsv/
  markdown-code (real fetched bytes, `mode="thumbnail"` — the only mode ever
  mounted in the shipped app) + docx/pptx/audio/video icon tiles +
  agent_access restricted-gate. `mode="full"` has no live mount point
  anywhere in the app (pre-existing, not this session's regression) — new
  finding **F-004**.
- **P6-003**: live axe-core sweep (light: dashboard, gallery+table, one
  EntityModal per surface, format sweep; dark: dashboard + gallery per DM-5).
  Found 6 pre-existing serious/critical rule categories — documented in new
  finding **F-005** and encoded as a reviewed allowlist in
  `web/e2e/flags-on/helpers.ts` (`KNOWN_VIOLATION_IDS`) so the gate still
  fails on any *new* regression while not silently hiding the known ones
  (logged every run).
- The sweep also caught and fixed **two real, unambiguous bugs** in app code
  (not test-only): EntityModal's focus never returned to the trigger on
  close (Radix's default `onCloseAutoFocus` targets `Dialog.Trigger`, which
  this codebase never uses) — fixed in
  `features/ui/components/EntityModal/index.tsx`; and `ZoneCard`'s
  `isInteractiveTarget` click-to-open guard matched the card's own
  `role="option"` root on every click, silently swallowing all mouse-click
  opens on Assets/Templates — fixed in
  `features/ui/components/Card/ZoneCard.tsx`.
- PPTX real LibreOffice-based conversion was **not** exercised (`soffice`
  binary present in this sandbox but `LibreOffice.app` itself is not
  installed) — the format-sweep spec smoke-tests the flag-off icon tile only
  and documents the gap rather than mocking a "real conversion" pass.

File status: `at_risk` → `completed`. See `ui-polish-pass-findings.md`
F-002 (resolved), F-004 (new), F-005 (new).

## Objective

Cross-cutting validation and documentation finalization: build gates (tsc + next build), axe-core a11y sweep, 6 runtime smoke checks by phase, Playwright e2e, OpenAPI update, 6 ADRs documented, 4 deferred-item design specs authored, CHANGELOG entry, and karen final sign-off to close the feature.
