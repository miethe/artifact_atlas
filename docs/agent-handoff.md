# Agent & CLI Handoff

This document describes how agents and CLI tools interact with Artifact Atlas.

## Before You Start

**Read in order**:
1. `CLAUDE.md` (project operating rules)
2. `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md` (source spec, sections 1–30)
3. `docs/architecture.md` (system design, data model, repositories)
4. `docs/DECISIONS.md` (policy, vocabulary, integration boundaries)
5. `.skillmeat/project.yaml` (project metadata and artifact stack)

## Agent Operating Rules

**Preserve boundaries**: Artifact Atlas owns asset metadata and BOM state; do not try to replace MeatyWiki (rationale), IntentTree (tasks), or SkillMeat (templates) as canonical stores.

**Query through API/MCP, not raw files**: Agents must use the REST API or MCP tools to interact with Artifact Atlas. Direct file reads from `registry/` are not supported; use documented endpoints instead.

**Respect policy gates**:
- Assets with `sensitivity: restricted` or `work_sensitive` return `metadata_only` or `none` access by default.
- Full content access requires `agent_access: read_allowed` or higher AND `sensitivity: public` or `personal`.
- Every agent query is logged to `registry/events.jsonl` as an audit trail.

**Favor read-first operations**: In MVP, agents are read-only via MCP tools. Write operations (asset creation, promotion, context-pack publish) are human-gated via the web UI or admin CLI.

**Draft-first for sensitive changes**: If an agent needs to propose canonical promotion or context-pack changes, create a draft record (not yet published) and log an audit event for human review.

**No network access in MVP**: Do not assume cloud storage, remote databases, or external APIs. All MVP state is local-first (JSONL) and portable.

## CLI Interface

All CLI commands are under `atlas` (implemented as `python3 -m app.cli.atlas`):

### Projects

```bash
atlas project list
# Output: JSONL-style list of projects

atlas project create --name "My Project" --description "..."
# Creates new project in registry/projects.jsonl

atlas project get --id proj-123
# Fetch single project with metadata
```

### Assets

```bash
atlas asset import <path> --project proj-123 [--sensitivity personal] [--type "Asset Type"]
# Import file(s) into inbox; generates thumbnail; returns asset ID(s)

atlas asset list --project proj-123 [--status raw] [--type "..."] [--tag "..."]
# List assets with optional filters; output is JSONL

atlas asset get --id asset-123
# Fetch single asset with full metadata (subject to policy)

atlas asset classify --id asset-123 --type "Product Brief" --sensitivity personal
# Transition asset from inbox -> raw -> candidate

atlas asset promote --id asset-123 --approve
# Promote asset to canonical status (human-gated, logs audit event)

atlas asset archive --id asset-123 --reason "superseded"
# Soft-delete asset; status -> archived
```

### BOM

```bash
atlas bom apply --project proj-123 --template new-product-app
# Apply template to project; creates BOM with empty slots

atlas bom status --project proj-123
# Display BOM coverage percentage and list of critical gaps

atlas bom slots --project proj-123 [--status missing]
# List slots, filter by status

atlas bom assign --project proj-123 --slot slot-456 --asset asset-123
# Assign asset to slot; updates slot status and coverage
```

### Context Packs

```bash
atlas context-pack list --project proj-123
# List draft and published packs

atlas context-pack create --project proj-123 --name "Phase 2 Pack"
# Create new draft pack

atlas context-pack add-asset --pack pack-789 --asset asset-123
# Add asset to pack

atlas context-pack export --pack pack-789 --format yaml [--output path/]
# Export pack as YAML, Markdown, or JSONL
```

### Search

```bash
atlas asset search --project proj-123 --query "keyword" [--type "..."]
# Full-text search across asset titles, tags, metadata
```

### Audit

```bash
atlas audit list --project proj-123 [--event-type asset_added] [--days 7]
# List audit events; filter by type and date range

atlas audit get --id event-123
# Fetch single event
```

### Integration Exports

```bash
atlas export meatywiki --project proj-123 [--output ~/MeatyWiki/]
# Export assets as Markdown cards to MeatyWiki folder

atlas export context-pack --pack pack-789 --format yaml [--output path/]
# Alias for context-pack export

atlas sync ccdash --project proj-123
# Append recent events to CCDash export file

atlas sync control-plane --project proj-123
# Generate project snapshot YAML for Control Plane
```

### Utilities

```bash
atlas validate registry
# Check all JSONL files for format compliance and schema alignment

atlas export registry --format jsonl [--output backup/]
# Full registry export (for backup or migration)
```

## MCP Tools (read-only)

MCP server at `app/mcp/` exposes read-only tools for agent access:

### `atlas_list_assets`

```json
{
  "project_id": "proj-123",
  "status": "in_progress",
  "sensitivity": "personal",
  "limit": 100
}
```

Returns: Array of `Asset` objects (subject to `agent_access` policy).

- Filters by project, status, sensitivity
- Respects `agent_access` field: `none` → 403, `metadata_only` → no `preview_text` or content, `preview_allowed` → includes preview, `read_allowed` → full asset
- All queries logged to `registry/events.jsonl`

### `atlas_get_asset`

```json
{
  "asset_id": "asset-123"
}
```

Returns: Single `Asset` object (if access allowed; otherwise 403 + audit event).

### `atlas_get_bom`

```json
{
  "project_id": "proj-123"
}
```

Returns: `BOM` object with domains, slots, and current coverage score.

- Slot status is computed (not stored): `missing`, `partial`, `in_progress`, `complete`, `stale`, `blocked`, `not_applicable`
- Coverage score is `(assigned_complete_slots / total_required_slots) * 100`

### `atlas_get_context_pack`

```json
{
  "pack_id": "pack-789"
}
```

Returns: `ContextPack` object with asset list and policy envelope.

- Asset content filtered by `policy_mode` (sensitive assets masked if mode is `exclude_sensitive`)
- Includes token estimate and asset access summary
- Never includes assets outside `agent_access` level granted

### `atlas_search`

```json
{
  "project_id": "proj-123",
  "query": "keyword",
  "type": "Product Brief"
}
```

Returns: Array of matching `Asset` objects (subject to access policy).

### Error Response Format

All tools return structured errors:

```json
{
  "error": "policy_denied",
  "reason": "Asset sensitivity is restricted; no agent access granted",
  "asset_id": "asset-123",
  "requested_access": "read_allowed",
  "granted_access": "none"
}
```

A corresponding `policy_denied` audit event is always logged before returning 403.

## Integration Patterns

### Importing Assets from MeatyWiki

MeatyWiki can export a project index as YAML. Artifact Atlas reads this file and links assets:

```bash
# In Artifact Atlas:
atlas sync meatywiki --import ~/MeatyWiki/project-index.yaml --project proj-123
# Reads page_id, title, tags from MeatyWiki YAML
# Creates or links corresponding Artifact Atlas assets
```

### Exporting Context Packs for Agents

A context pack is a frozen snapshot of assets with policy applied:

```bash
# Create a pack from BOM:
atlas context-pack create --project proj-123 --name "phase-2" --from-bom

# Export for agent consumption:
atlas context-pack export --pack phase-2 --format yaml

# Result: exports/context-packs/phase-2-<timestamp>.yaml
# Agent reads file and respects policy envelope metadata
```

### Linking to IntentTree Nodes

Store node references in `registry/assets.jsonl` under `intent_tree_links`:

```json
{
  "id": "asset-123",
  "title": "Product Brief",
  "intent_tree_links": [
    {"node_id": "node-456", "relationship": "required_for", "confidence": 0.95}
  ]
}
```

Query via API:

```bash
atlas search --project proj-123 --intent-node node-456
# Returns assets linked to this IntentTree node
```

### Syncing Events to CCDash

Artifact Atlas appends events to an export JSONL file. CCDash can ingest:

```bash
atlas sync ccdash --project proj-123
# Appends recent events to exports/ccdash-events.jsonl
```

CCDash sees:
- `asset_added`, `asset_promoted`, `context_pack_created` events
- Event timestamps, actor, and resource IDs
- Full audit trail for compliance

## Testing & Validation

**Run all tests**:
```bash
cd api && python3 -m pytest -q
# 469 tests covering models, services, routes, policy, integrations
```

**Test a specific feature**:
```bash
cd api && python3 -m pytest tests/test_routes_assets.py -v
# Asset endpoint tests
```

**Validate registry**:
```bash
python3 scripts/validate_registry_exports.py
# Check JSONL format and schema alignment
```

**Smoke test CLI**:
```bash
atlas project list
atlas project create --name "test" --description "test"
atlas project get --id <id-from-list>
```

## Common Agent Workflows

### 1. Find All Assets for a Node

```bash
# Agent has IntentTree node ID
node_id="node-789"

# Via CLI:
atlas search --project proj-123 --intent-node $node_id

# Via MCP:
{
  "tool": "atlas_search",
  "query": "...",
  "intent_node": "node-789"
}
```

### 2. Build Context Pack from BOM

```bash
# Agent needs context for node
atlas context-pack create --project proj-123 --name "node-context" --from-bom
# Pack contains all assets currently assigned to BOM slots

atlas context-pack export --pack node-context --format yaml
# Agent reads YAML file with policy envelope
```

### 3. Query Sensitive Asset (Denied)

```bash
# Agent queries restricted asset:
atlas asset get --id asset-restricted

# Result:
{
  "error": "policy_denied",
  "reason": "Asset sensitivity is restricted; no agent access granted",
  "asset_id": "asset-restricted",
  "requested_access": "read_allowed",
  "granted_access": "none"
}

# Audit log entry created:
{
  "event_type": "policy_denied",
  "asset_id": "asset-restricted",
  "actor": "mcp_tool_atlas_get_asset",
  "requested_access": "read_allowed",
  "granted_access": "none",
  "timestamp": "2026-06-20T14:30:00Z"
}
```

### 4. Propose Asset Classification

Agent can suggest classification; human approves via UI:

```bash
# Agent imports file (via CLI or API):
atlas asset import /path/to/file --project proj-123 --type "suggested_type" --sensitivity personal

# Asset lands in inbox with suggested type
# Human reviews in Inbox view and confirms or changes
# Agent is NOT permitted to auto-promote or publish
```

## Troubleshooting

**API not running**: Start with `cd api && uvicorn app.main:app --reload`

**JSONL format errors**: Run `python3 scripts/validate_registry_exports.py` to identify issues

**Policy denials**: Check `registry/events.jsonl` for `policy_denied` entries with reason and asset ID

**Missing assets in list**: Check asset status (archived assets don't appear in default list) and sensitivity/access policy

**Tests failing**: Review test output; often a missing dependency or environment variable (check `api/.env.example`)

## Useful Commands

```bash
# Analyze project structure:
node .agents/skills/skillmeat-cli/scripts/analyze-project.js .

# Run all tests:
cd api && python3 -m pytest -q

# Validate registry:
python3 scripts/validate_registry_exports.py

# Interactive Python shell with Artifact Atlas models:
cd api && python3
>>> from app.models import Asset, Project
>>> from app.repositories import AssetRepository
>>> repo = AssetRepository()
>>> assets = repo.find_all()
```

## Phase 6 Roadmap (Deferred)

MVP integrations are file/export-based (D-010). Future phases will add:
- Live MeatyWiki API connector
- Live IntentTree API linkage
- Live SkillMeat bundle sync
- Live CCDash event push
- OAuth/RBAC for multi-user deployments

Agents should not assume these in MVP; use file-based exports.
