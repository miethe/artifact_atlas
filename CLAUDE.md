# Artifact Atlas - Claude Project Instructions

Artifact Atlas is a T4 Agentic OS project initialized through the Operator scaffold and SkillMeat project setup.

## Canonical Model

> Intent defines the destination. Task trees define the path. Agent postures define the cognitive style. SkillMeat stores the reusable stacks. CCDash proves what works. MeatyWiki remembers why. The control plane routes the next move.

## Project Purpose

Build the asset graph, Artifact BOM, and context-pack builder described in `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md`.

Artifact Atlas should index and relate artifacts. It should not become the canonical system of record for every upstream file blob.

Primary boundaries:

- MeatyWiki remembers rationale and project memory.
- Artifact Atlas owns asset metadata, relationships, BOM state, context-pack workflow state, and agent access policy.
- IntentTree owns task hierarchy and execution intent.
- SkillMeat owns reusable skills, templates, and Golden Context Pack candidates.
- CCDash owns execution telemetry and workflow evidence.

## Agent Operating Rules

- Always delegate to subagents when reasonable.
- Use `/op` or the `op` skill for route/tier decisions, T4 project motions, run status, or gate handling.
- Use `skillmeat-cli` for artifact discovery, scaffold/setup, bundle references, and project artifact stack decisions.
- Retrieve project context through scoped docs, registry files, CLI/API/MCP surfaces, or context packs. Do not assume broad raw filesystem access is acceptable for agent workflows.
- Default agent writes that affect BOM slots, asset access, context-pack publication, or canonical promotion to suggestion/draft unless explicitly approved.
- Canonical promotion requires human review unless a future policy file says otherwise.
- Sensitive assets default to metadata-only or preview-only agent access.

## Implementation Direction

Use the spec-backed MVP architecture:

- Frontend: Next.js, React, TypeScript, Tailwind/design tokens, TanStack Query/Table/Virtual, dnd-kit, React Flow when graph views arrive.
- Backend: FastAPI, Pydantic schemas, local JSONL/SQLite first, Postgres/pgvector later.
- Agent gateway: read-first MCP tools plus CLI commands matching the `atlas` examples in the spec.
- Registry: keep JSONL/YAML exports readable and portable.

## Quality Gates

- Keep changes scoped and spec-backed.
- Update `docs/DECISIONS.md` for architecture decisions.
- Update `docs/mvp-backlog.md` when adding or completing MVP work.
- Keep API contracts in `shared/openapi.yaml` aligned with backend route stubs.
- Run available tests before handoff and report any missing dependency blockers.
