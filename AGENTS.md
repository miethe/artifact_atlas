# Codex Agent Instructions

Always delegate to subagents when reasonable.

## Project Context

Artifact Atlas is a T4 Agentic OS project for a project asset graph, Artifact BOM, and context-pack builder. The source specification is:

`Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md`

## Required Skills

- Use `op` for route x tier decisions, T4 project motions, run records, and gates.
- Use `skillmeat-cli` for scaffold/setup, artifact stack discovery, bundle references, and SkillMeat project operations.
- Use delegated explorer/worker agents for broad spec extraction, independent implementation slices, and review passes.

## Architecture Defaults

- Frontend: `web/` with Next.js, React, TypeScript.
- Backend: `api/` with FastAPI and Pydantic.
- Shared API contract: `shared/openapi.yaml`.
- Local-first registry exports: `registry/*.jsonl`.
- Seed Artifact BOM templates: `templates/*.yaml`.
- Agent handoff outputs: `exports/context-packs/*.yaml`.

## Safety Rules

- Do not make broad filesystem access part of the agent-facing design. Agents should use CLI/API/MCP/context-pack paths.
- Treat asset content access as policy-controlled. Metadata-only is the default for sensitive assets.
- Do not silently promote assets to canonical.
- Do not auto-create IntentTree tasks from BOM gaps unless explicitly requested.
- Do not replace MeatyWiki or IntentTree; integrate with them.

## Verification

Prefer focused validation:

```bash
cd api && python3 -m pytest -q
node .agents/skills/skillmeat-cli/scripts/analyze-project.js .
```
