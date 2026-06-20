# Phase 6: v1 Expansion

**Parent Plan**: [Artifact Atlas App Completion](../artifact-atlas-app-completion-v1.md)  
**Duration**: 6-12+ weeks after MVP  
**Effort**: 70+ points  
**Dependencies**: MVP complete and pilot findings reviewed  
**Primary Subagents**: lead-architect, backend-architect, data-layer-expert, frontend-developer, react-performance-optimizer, DevOps

## Phase Overview

Phase 6 captures the v1 work that is designed in the source spec but should not block the local-first MVP: AI-assisted classification, semantic search, duplicate/variant detection, richer external connectors, stronger telemetry feedback, hosted/server mode, and enterprise governance.

## Goals

- Add opt-in AI and semantic capabilities without changing local-first defaults.
- Introduce SQLite/Postgres/pgvector storage path once repository contracts prove stable.
- Add richer connectors for Figma, GitHub, Google Drive/SharePoint, Notion/Confluence, and media libraries.
- Add context-pack versioning, Golden Context Pack candidate promotion, and SkillMeat/SAM sync.
- Add CCDash feedback loops and quality metrics.
- Prepare homelab/server and enterprise deployment models.

## Architecture Focus

- **Layer**: Intelligence, search, connector workers, database migration, enterprise controls.
- **Patterns**: Optional adapters, background jobs, connector capability flags, review gates, event-driven sync.
- **Standards**: Source spec sections 18.4, 21 phases 4-5, 23 deployment models, 24 metrics, 25 governance.

## Task Breakdown

### Epic: Intelligence And Search

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| V1-AI-001 | Heuristic Classifier Expansion | Improve local rules using filename, folder, MIME, templates, prior classifications. | Suggestions include confidence/rationale and never auto-apply without rules. | 5 | backend-architect | MVP |
| V1-AI-002 | Opt-In AI Classification | Add external/local model adapter behind explicit workspace policy. | No external calls happen unless enabled; outputs are suggestions. | 8 | backend-architect, python-backend-engineer | V1-AI-001 |
| V1-SEARCH-001 | Full-Text Search | Add indexed metadata/text search beyond simple filters. | Common searches return under target latency for 10k assets. | 6 | data-layer-expert | MVP |
| V1-SEARCH-002 | Semantic Search | Add embeddings/vector store for opted-in projects. | Semantic search under 2s for 10k assets or benchmarked alternative. | 10 | data-layer-expert, backend-architect | V1-SEARCH-001 |
| V1-AI-003 | Duplicate And Variant Detection | Detect duplicates, variants, supersedes/superseded relationships. | Candidate relationships are reviewable and reversible. | 6 | python-backend-engineer | V1-SEARCH-001 |

### Epic: Storage And Workers

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| V1-DB-001 | SQLite Migration | Add SQLite metadata backend using repository interfaces. | JSONL export/import remains supported. | 8 | data-layer-expert, python-backend-engineer | MVP |
| V1-DB-002 | Postgres/pgvector Mode | Add server-mode storage and vector support. | Docker Compose can run API, web, Postgres, optional worker. | 10 | data-layer-expert, DevOps | V1-DB-001 |
| V1-WORK-001 | Background Worker Queue | Add durable index/extract/thumbnail/classify/sync jobs. | Jobs report progress and survive failures where practical. | 8 | backend-architect, DevOps | V1-DB-001 |
| V1-WORK-002 | Advanced Previews | Add PDF text/thumbnail, OCR, video/audio metadata, code preview. | Previews degrade safely when dependencies missing. | 8 | python-backend-engineer | V1-WORK-001 |

### Epic: Connectors

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| V1-CONN-001 | GitHub Connector | Sync repo path metadata, raw file links, commits/PR artifact refs. | Connector is scoped and does not crawl unexpected repos. | 6 | backend-architect | MVP |
| V1-CONN-002 | Figma Connector | Sync file refs, thumbnails, comments/metadata where allowed. | Manual URL import can be upgraded to connector record. | 8 | frontend-developer, backend-architect | MVP |
| V1-CONN-003 | Drive/SharePoint Connector | Add OAuth/manual scoped sync for docs and previews. | Access is policy-scoped and auditable. | 10 | backend-architect, DevOps | MVP |
| V1-CONN-004 | Notion/Confluence Connector | Sync page refs and metadata. | Pages can become context pack items without broad export. | 8 | backend-architect | MVP |
| V1-CONN-005 | Media Library Connectors | Add Eagle/TagSpaces/Immich/Nextcloud adapters as optional plugins. | Connectors are isolated and can be disabled. | 10 | backend-architect | MVP |

### Epic: Governance, Telemetry, And Hosted Mode

| Task ID | Task Name | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) | Dependencies |
|---|---|---|---|---:|---|---|
| V1-GOV-001 | Context Pack Versioning | Version packs, approvals, Golden candidates, expiration. | Pack history and approval state are queryable. | 6 | backend-architect | Phase 4 |
| V1-GOV-002 | RBAC/ABAC | Add roles, groups, project policies, and OIDC-ready auth model. | Enterprise controls are enforced in API/MCP. | 12 | backend-architect, DevOps | V1-DB-002 |
| V1-GOV-003 | Approval Workflows | Add canonical promotion and sensitive publish approval queues. | Human review state is visible and auditable. | 8 | frontend-developer, backend-architect | V1-GOV-002 |
| V1-TEL-001 | CCDash Feedback Loop | Ingest outcome/rework/usefulness metrics back from CCDash. | Context pack and asset success metrics are visible. | 8 | backend-architect | Phase 4 CCDash export |
| V1-DEP-001 | Homelab Deployment | Docker Compose with API/web/db/object storage/worker. | Documented deployment works on local network. | 8 | DevOps | V1-DB-002 |
| V1-DEP-002 | Enterprise Deployment Design | Kubernetes/OpenShift, OIDC, audit retention, connector workers, hosted MCP gateway. | Architecture doc and deployment checklist complete. | 8 | DevOps, documentation-complex | V1-GOV-002 |

## Design Constraints

- AI classification remains opt-in and explainable.
- External connectors must be scoped and auditable.
- JSONL/YAML/Markdown export remains a product guarantee, not an MVP-only shortcut.
- Agent write operations remain suggestions unless policy explicitly permits direct mutation.
- Enterprise controls build on the MVP policy model rather than bypassing it.

## Quality Gates

- [ ] Pilot findings from MVP are reviewed and reflected in v1 backlog.
- [ ] AI and connector features are behind explicit policy/config toggles.
- [ ] Database mode migration preserves existing registry exports.
- [ ] Semantic search and large-library UI meet performance targets.
- [ ] Approval workflows protect canonical promotion and sensitive pack publish.
- [ ] Hosted/homelab deployment docs are validated.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Connectors dominate roadmap | High | Prioritize local/GitHub/Figma first; treat others as optional adapters. |
| AI classification reduces trust | High | Keep confidence, rationale, review, undo, and no silent apply. |
| Database migration breaks portability | High | Keep export/import tests as release blockers. |
| Enterprise auth adds too much surface | Medium | Add local token and OIDC-compatible abstractions before full RBAC/ABAC. |

[Return to Parent Plan](../artifact-atlas-app-completion-v1.md)
