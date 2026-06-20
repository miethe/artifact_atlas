---
title: "Context File Schema Specification"
description: "Standardized YAML frontmatter schema for all .claude/context/key-context/ files to enable programmatic discovery, filtering, and reuse."
type: specification
domain: ai-config
status: active
last_verified: 2026-05-26
related:
  - .claude/context/TEMPLATE.md
  - .claude/context/key-context/layered-context-governance.md
  - .claude/specs/doc-policy-spec.md
load_when: "When standardizing context file frontmatter or adding new context files"
---

# Context File Schema Specification

## Overview

This specification defines a standardized YAML frontmatter schema for all files under `.claude/context/key-context/`. The schema enables:

1. **Programmatic discovery** — agents and tools can filter context files by `type`, `domain`, and `status` without reading full file content
2. **Load-trigger matching** — `load_when` field guides agents to relevant context for their current task
3. **Consolidation tracking** — `supersedes` field documents file merges and consolidation lineage
4. **Relationship graphs** — `related` field enables cross-referencing and context traversal
5. **Cross-project reusability** — standardized metadata enables context files to be shared across projects and organizations

## Required Frontmatter Fields

All files under `.claude/context/key-context/` **MUST** include these fields in their YAML frontmatter block:

### `title` (string)

Human-readable title of the context file.

**Rules:**
- Must be between 5 and 100 characters
- Should start with a capital letter
- Should not end with punctuation
- Example: `"Router Patterns and Conventions"`

**Purpose:** Enables agents and tools to identify the file purpose at a glance without reading content.

### `description` (string)

One-line (1–2 sentence) summary of what this file contains and why agents should load it.

**Rules:**
- Must be 20–200 characters
- Written in imperative voice: "Defines X" or "Documents Y" or "Guides agents through Z"
- Must mention the primary domain or use case
- Example: `"Defines FastAPI router conventions, dependency injection patterns, and endpoint documentation strategies."`

**Purpose:** Enables discovery via search and helps agents decide if this file is relevant to their task.

### `type` (enum)

Controlled vocabulary describing the file's structural purpose.

**Valid values:**
- `playbook` — Step-by-step procedural guidance (how-to, workflow, operational runbook). Example: `context-loading-playbook.md`
- `patterns` — Code and design patterns, examples, and best practices. Example: `component-patterns.md`, `router-patterns.md`
- `reference` — Reference material, lookup tables, API documentation, term definitions. Example: `api-endpoint-mapping.md`, `artifact-type-reference.md`
- `architecture` — System architecture diagrams, design decisions, data flow documentation. Example: `data-flow-patterns.md`
- `guide` — Comprehensive guides, migration guides, troubleshooting guides. Example: `testing-patterns.md` (also a guide)
- `policy` — Rules, governance, constraints, and decision frameworks. Example: `layered-context-governance.md`

**Rules:**
- Must match exactly one enum value (case-sensitive, lowercase)
- A file may function as both a playbook and a guide; choose the primary purpose
- Example: `type: playbook` or `type: reference`

**Purpose:** Enables filtering by structural type (e.g., "load only playbooks for this task").

### `domain` (enum)

Controlled vocabulary describing the problem domain this file addresses.

**Valid values:**

| Domain | Purpose | Example Files |
|--------|---------|---------------|
| `api` | API design, HTTP routers, endpoint contracts | router-patterns.md, api-contract-source-of-truth.md |
| `frontend` | React, Next.js, UI components, page design | component-patterns.md, nextjs-patterns.md |
| `backend` | Python services, repositories, business logic | repository-architecture.md, cross-cutting-patterns.md |
| `infrastructure` | Deployment, containers, DevOps, CI/CD | (none currently; for future docs) |
| `ai-config` | Claude Code configuration, skills, agents | agent-teams-patterns.md, skill-spec-convention.md |
| `data` | Database, migrations, ORM patterns | migration-dialect-patterns.md, enterprise-seeding-patterns.md |
| `auth` | Authentication, authorization, RBAC | auth-architecture.md |
| `marketplace` | Artifact discovery, import flows, sources | marketplace-import-flows.md |
| `collection` | Personal collection, storage, sync | artifact-instance-model.md |
| `sync` | Sync workflows, diff viewing, deployment | sync-diff-patterns.md, version-history-patterns.md |
| `planning` | PRD, implementation plan, decomposition | (planning skill handles this) |
| `docs-site` | Documentation site, MkDocs, content sync | docs-site-patterns.md |
| `testing` | Test patterns, test doubles, CI validation | testing-patterns.md |
| `enterprise` | Enterprise-edition-specific features | enterprise-seeding-patterns.md, enterprise-intentional-stubs.md |
| `general` | Cross-cutting, meta, architecture overview | (use sparingly; prefer specific domain) |

**Rules:**
- Must match exactly one enum value (case-sensitive, lowercase)
- Choose the domain that best describes PRIMARY use case
- Example: `domain: api` or `domain: frontend`

**Purpose:** Enables domain-scoped loading (e.g., "only load frontend context files when working on Next.js").

### `status` (enum)

Controlled vocabulary describing the file's lifecycle state.

**Valid values:**
- `active` — File is current, maintained, and referenced from CLAUDE.md or active skills
- `draft` — File is under development; not yet referenced or relied upon
- `archived` — File is superseded or obsolete but retained for historical reference; moved to `.claude/context/archive/`
- `deprecated` — File is actively discouraged from new use; will be archived in a future cleanup

**Rules:**
- `active` files must be referenced from CLAUDE.md or rule files and maintained regularly
- `draft` files may not be loaded automatically and are discovery-only
- `archived` files must reside in `.claude/context/archive/` directory
- `deprecated` files must have a `supersedes` field pointing to their replacement
- Example: `status: active`

**Purpose:** Enables filtering to avoid loading stale, archived, or deprecated content.

### `load_when` (string)

Natural-language trigger phrase describing when an agent should load this file into their context.

**Rules:**
- Must be a concise phrase (10–80 characters)
- Should start with "When" or "For"
- Should describe a concrete task or trigger, not abstract concepts
- Should be actionable by an agent reading it
- Example: `"When adding or modifying API endpoints"` ✓
- Example: `"When working on routers"` ✓
- Example: `"API documentation"` ✗ (not actionable; unclear when to load)

**Controlled vocabulary of trigger phrases** (agents should use exactly these phrases in their context-loading decisions):

| Trigger Phrase | Domain | Example Files |
|---|---|---|
| `When adding or modifying API endpoints` | api | router-patterns.md |
| `When working on FastAPI routers or dependencies` | api | router-patterns.md |
| `When adding auth, modifying middleware, or debugging 401/403 errors` | auth | auth-architecture.md |
| `When working on React components or UI` | frontend | component-patterns.md |
| `When working on Next.js app routes or server/client patterns` | frontend | nextjs-patterns.md |
| `When debugging or investigating a bug` | general | debugging-patterns.md |
| `When working on data models, repositories, or database operations` | backend | repository-architecture.md |
| `When writing or modifying database migrations` | data | migration-dialect-patterns.md |
| `When working on version history, DVCS, branching, or restores` | sync | version-history-patterns.md |
| `When working on sync, diff viewing, or deployments` | sync | sync-diff-patterns.md |
| `When working on artifact instances or linking` | collection | artifact-instance-model.md |
| `When working on marketplace, artifact import, or discovery` | marketplace | marketplace-import-flows.md |
| `When planning, authoring PRDs, or executing implementation phases` | planning | (planning skill provides guidance) |
| `When configuring Claude Code or designing multi-agent systems` | ai-config | agent-teams-patterns.md |
| `When writing or modifying tests` | testing | testing-patterns.md |
| `When onboarding a new project with SkillMeat` | general | project-onboarding-playbook.md |
| `When working on MkDocs or the documentation site` | docs-site | docs-site-patterns.md |
| `When working on enterprise edition features` | enterprise | enterprise-seeding-patterns.md |

**Purpose:** Enables agents and tools to match task context to relevant files without reading all file content.

## Optional Frontmatter Fields

### `last_verified` (date string, format: YYYY-MM-DD)

The date when this file's content was last confirmed to be accurate against the current codebase.

**Rules:**
- Format must be `YYYY-MM-DD` (ISO 8601)
- Should be updated during monthly drift checks (see `.claude/context/key-context/layered-context-governance.md`)
- If older than 30 days, agents should treat content as potentially stale
- Example: `last_verified: 2026-05-26`

**Purpose:** Enables agents to identify potentially outdated context and escalate to human review if needed.

### `related` (list of strings)

Paths to related context files that provide complementary information.

**Rules:**
- Must be a YAML list of file paths (relative to repository root)
- Paths should point to files under `.claude/context/` or `.claude/specs/` or `.claude/rules/`
- Each path must exist and be valid
- Keep the list to 3–5 related files (avoid bloat)
- Example:
  ```yaml
  related:
    - .claude/context/key-context/component-patterns.md
    - .claude/context/key-context/nextjs-patterns.md
    - .claude/specs/doc-policy-spec.md
  ```

**Purpose:** Enables agents to traverse context relationships and find additional relevant guidance without explicit task-level loading.

### `supersedes` (string or list of strings)

Path(s) to the file(s) this file replaces, consolidates, or replaces.

**Rules:**
- Must point to a file that is now `archived` or `deprecated`
- Use when consolidating multiple files into one (e.g., marketplace-import-flows.md consolidates 3 marketplace files)
- Keep as a list if superseding multiple files
- Example (single):
  ```yaml
  supersedes: .claude/context/old-marketplace-file.md
  ```
- Example (multiple):
  ```yaml
  supersedes:
    - .claude/context/exploration/marketplace-v1.md
    - .claude/context/exploration/marketplace-v2.md
  ```

**Purpose:** Documents consolidation and migration lineage, enabling humans to trace why files were merged and where their content went.

## Full Schema Template

```yaml
---
title: "Human-Readable Title"
description: "One-line summary of what this file contains."
type: playbook                     # Required: playbook, patterns, reference, architecture, guide, policy
domain: api                        # Required: api, frontend, backend, infrastructure, ai-config, data, auth, marketplace, collection, sync, planning, docs-site, testing, enterprise, general
status: active                     # Required: active, draft, archived, deprecated
last_verified: 2026-05-26          # Optional: YYYY-MM-DD
related:                           # Optional: list of related file paths
  - .claude/context/key-context/related-file-1.md
  - .claude/context/key-context/related-file-2.md
load_when: "When working on X"     # Required: trigger phrase from controlled vocabulary
supersedes:                        # Optional: path or list of paths this file replaces
  - .claude/context/old-file-1.md
  - .claude/context/old-file-2.md
---

# File Content Here

Your markdown content starts here...
```

## Validation Checklist

When adding or updating a context file, verify:

- [ ] All required fields (`title`, `description`, `type`, `domain`, `status`, `load_when`) are present
- [ ] `type` value is from the enum: `playbook`, `patterns`, `reference`, `architecture`, `guide`, `policy`
- [ ] `domain` value is from the enum (see table above)
- [ ] `status` value is from the enum: `active`, `draft`, `archived`, `deprecated`
- [ ] `load_when` matches or closely paraphrases a phrase from the controlled vocabulary table
- [ ] If `status: archived`, file is located in `.claude/context/archive/`
- [ ] If `status: deprecated`, `supersedes` field is populated
- [ ] `related` field (if present) contains only valid, existing file paths
- [ ] `last_verified` (if present) is in `YYYY-MM-DD` format
- [ ] File starts with `---` and ends YAML block with `---`
- [ ] Content below frontmatter is valid Markdown

## Example: Complete File with All Fields

```yaml
---
title: "API Router Patterns and Conventions"
description: "Defines FastAPI router organization, dependency injection patterns, and OpenAPI contract workflow for SkillMeat API."
type: patterns
domain: api
status: active
last_verified: 2026-05-26
related:
  - .claude/context/key-context/api-contract-source-of-truth.md
  - .claude/context/key-context/router-patterns.md
  - .claude/specs/multi-model-usage-spec.md
load_when: "When adding or modifying API endpoints"
---

# API Router Patterns and Conventions

Content goes here...
```

## Schema Versioning

This schema is version 1.0 and is effective 2026-05-26.

**Future versions** may add fields (e.g., `load_priority`, `estimated_read_time`, `keywords`) without breaking existing files. New fields will be optional until consensus on adoption.

## Related Documents

- **Template for new files**: `.claude/context/TEMPLATE.md`
- **Governance & token budgets**: `.claude/context/key-context/layered-context-governance.md`
- **Documentation policy**: `.claude/specs/doc-policy-spec.md`
- **Context loading playbook**: `.claude/context/key-context/context-loading-playbook.md`
