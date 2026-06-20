# Artifact Atlas

Artifact Atlas is a project-centric asset graph, Artifact BOM, and context-pack builder for the Agentic OS.

It indexes and relates project materials across local files, MeatyWiki pages, IntentTree nodes, design assets, generated outputs, and external references. The MVP is a local-first system with a Next.js UI, FastAPI service, JSONL/YAML registry exports, and a policy-aware CLI/MCP agent gateway.

## Quick Start

### Install Dependencies

**API (FastAPI backend):**
```bash
cd api
pip install -r requirements.txt
```

**Web (Next.js frontend):**
```bash
cd web
npm install
```

### Run

**API development server:**
```bash
cd api && uvicorn app.main:app --reload
# Server runs on http://127.0.0.1:8000
# API docs: http://127.0.0.1:8000/docs
```

**Web development server:**
```bash
cd web && npm run dev
# App runs on http://localhost:3000
```

### Test

**API tests:**
```bash
cd api && python3 -m pytest -q
# 469 tests across models, services, repositories, API routes, policy, integrations
```

**Web tests:**
```bash
cd web && npm run test
# Unit and component tests via Vitest
```

**E2E tests:**
```bash
cd web && npm run test:e2e
# Playwright-based smoke tests for core workflows
```

**Validate registry exports:**
```bash
python3 scripts/validate_registry_exports.py
# Checks JSONL/YAML format compliance and schema alignment
```

## Local-First Mode

Artifact Atlas is **designed for single-user local operation**. By default:

- API binds to `127.0.0.1:8000` (loopback only, no authentication required)
- Registry files live in `registry/*.jsonl` and are human-readable and portable
- No external network connectivity required for core workflows
- Data is fully under user control; no cloud upload or SaaS dependency

**Warning**: If you bind the API to non-loopback addresses (e.g., `--bind 0.0.0.0`), the system is **not authenticated and should not be exposed to untrusted networks**. See `docs/DECISIONS.md` section D-009 for policy details.

## Project Structure

```text
api/          FastAPI service, models, repositories, services, CLI, MCP
web/          Next.js 15 app with design system, features, hooks
shared/       OpenAPI contract (source of truth for API schema)
config/       Workspace and integration configuration
registry/     JSONL registry exports (assets, projects, BOMs, templates, events)
templates/    Seed Artifact BOM templates (YAML)
exports/      Context-pack and report outputs (YAML, Markdown)
docs/         Architecture decisions, user guides, implementation plans
assets/       Generated thumbnails and previews (created at ingest time)
.claude/      Claude project context and SkillMeat bundle
.agents/      Codex agent skills and context
```

## Documentation

- **Setup & Deployment**: This README
- **Architecture & Decisions**: `docs/architecture.md` and `docs/DECISIONS.md`
- **User Workflows**: `docs/user-workflows.md` (how to ingest, classify, assign, export)
- **Agent & CLI Usage**: `docs/agent-handoff.md`
- **MVP Scope & Backlog**: `docs/mvp-backlog.md`
- **Full Specification**: `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md`

## Key Concepts

**Asset**: A file, link, or record (image, PDF, markdown, URL) captured and indexed with metadata (type, status, sensitivity, tags).

**Project**: A container organizing assets and artifact BOMs. The first project is pre-seeded.

**Artifact BOM**: A Bill of Materials for a project, organized by domain (e.g., Strategy, Product, Frontend Design). Slots within each domain can be filled with assets.

**Context Pack**: A curated, exportable collection of assets from the BOM, with policy controls for agent access and sensitivity masking.

**Template**: A reusable BOM blueprint (e.g., "New Product App," "Architecture Initiative") that can be applied to new projects to create consistent structure.

**Policy**: Rules governing agent access (none, metadata-only, preview, read, context-pack) and sensitivity levels (public, personal, work, client, restricted).

## Status

**Phase 5 (MVP Release Hardening)** is in progress. Phases 0–4 are feature-complete:
- Phase 0: Decisions and contract
- Phase 1: Local registry API, web shell, asset import, inbox triage
- Phase 2: Artifact BOM, templates, coverage calculation
- Phase 3: Context packs, agent MCP/CLI gateway, integrations
- Phase 4: (Deferred to Phase 6) Intelligence features, telemetry

Phase 5 focuses on test coverage, documentation, visual QA, and hardening before local-first pilot deployment.

## Support

For questions or issues, consult:
- `CLAUDE.md` (project operating instructions)
- `docs/agent-handoff.md` (for agent/CLI usage)
- Test suite (`api/tests/` and `web/__tests__/`) for usage examples
- Phase plans in `docs/project_plans/` for detailed scope and decisions
