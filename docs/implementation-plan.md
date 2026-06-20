# Artifact Atlas Implementation Plan

Detailed phase plan: `docs/project_plans/implementation_plans/features/artifact-atlas-app-completion-v1.md`

This file remains the scaffold-level roadmap. Use the detailed plan for task ownership, phase files, quality gates, and integration sequencing.

## Phase 0 - Local Schema and Registry

- Define JSONL/YAML registry conventions.
- Define Pydantic/OpenAPI schemas for projects, assets, BOM slots, templates, context packs, and events.
- Seed the New Product/App and Architecture Initiative Artifact BOM templates.
- Implement CLI-aligned service functions for import, classify, BOM status, and context-pack export.

## Phase 1 - Web App MVP

- Build the app shell, sidebar, top search, project home, and asset gallery.
- Add asset detail drawer/page.
- Add inbox triage UI.
- Add basic filters and metadata search.
- Add MeatyWiki export view/actions.

## Phase 2 - Artifact BOM and Templates

- Implement template application.
- Implement BOM overview, slot states, and coverage calculation.
- Implement inbox-to-BOM mapping.
- Add light Template Builder v0.

## Phase 3 - Context Packs and Agent Gateway

- Implement Context Pack Builder.
- Add policy envelope, token/payload estimate, and YAML export.
- Add read-first MCP tools: asset search, asset get metadata/preview, BOM coverage, node context, project snapshot.
- Add CLI entry points matching the spec's `atlas` examples.

## Phase 4 - Intelligence and Telemetry

- Add heuristic classification first.
- Add opt-in AI classification.
- Add duplicate/variant detection.
- Emit CCDash events for context pack publish, asset use, and BOM gap resolution.

## Phase 5 - Enterprise Hardening

- Add RBAC/ABAC and OIDC.
- Add external connectors.
- Add audit reporting and approval workflows.
