# Artifact Atlas

Artifact Atlas is a project-centric asset graph, Artifact BOM, and context-pack builder for the Agentic OS.

It indexes and relates project materials across local files, MeatyWiki pages, IntentTree nodes, design assets, generated outputs, and external references. The first implementation target is a local-first MVP with a Next.js UI, FastAPI service, JSONL/YAML registry exports, and a policy-aware CLI/MCP agent gateway.

## Start Here

- `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md` is the source specification.
- `AGENTS.md` is the Codex/agent operating contract.
- `CLAUDE.md` is the Claude Code operating contract.
- `docs/charter.md` explains the T4 project scope.
- `docs/implementation-plan.md` breaks the work into phases.
- `docs/mvp-backlog.md` contains the first build slice.
- `.skillmeat/project.yaml` records the SkillMeat scaffold intent and required artifact stack.

## Scaffold Shape

```text
api/          FastAPI service, schemas, and tests
web/          Next.js app shell scaffold
shared/       OpenAPI and shared contracts
config/       Local workspace and integration config
registry/     JSONL local-first registry exports
templates/    Seed Artifact BOM templates
exports/      Context-pack and report outputs
docs/         Project planning, decisions, and handoff docs
.claude/      Claude project skills and context
.agents/      Codex/agent project skills and context
.operator/    op T4 run records
```

## Local Commands

```bash
# API tests
cd api && python3 -m pytest -q

# API dev server once dependencies are installed
cd api && uvicorn app.main:app --reload

# Web app once dependencies are installed
cd web && npm install && npm run dev
```

The SkillMeat CLI was not on PATH during initialization, so the starter bundle is recorded but not fully materialized. Retry when available:

```bash
skillmeat bundle deploy skillmeat-instance-starter --project .
```
