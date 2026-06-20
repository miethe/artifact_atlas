# Architecture

## System Shape

```text
web/ Next.js UI
  -> shared/openapi.yaml
  -> api/ FastAPI service
    -> registry/*.jsonl for local-first mode
    -> assets/thumbnails and assets/previews
    -> exports/context-packs
    -> future SQLite/Postgres storage
```

## Ownership Boundaries

| Data | System of record |
|---|---|
| Asset metadata | Artifact Atlas |
| Original files | Source system or configured local/object storage |
| Project rationale | MeatyWiki |
| Task hierarchy | IntentTree |
| Reusable skills/templates | SkillMeat/SAM plus Artifact Atlas template refs |
| Execution telemetry | CCDash |
| Routing decisions | Agentic Control Plane |

## Agent Access Rule

Agents should query through scoped CLI/API/MCP/context-pack surfaces. Raw file reads are not the product contract.
