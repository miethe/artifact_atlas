# MVP User Workflows

This guide walks through the core workflows in Artifact Atlas: importing assets, classifying them, assigning them to a project BOM, and exporting context packs.

## Workflow 1: Import Assets

### CLI

```bash
# Watch a folder for new files and import them as inbox assets
atlas watch ~/Downloads/images

# Or import a single file
atlas import ~/my-doc.pdf --project my-project
```

Imported assets land in the **Inbox** with status `inbox` and default sensitivity `personal`. They are not yet classified.

### Web UI

1. Go to **Assets** page
2. Click **Import** button (top right)
3. Select file(s) from your computer
4. Assets appear in **Inbox** list with `inbox` status badge

**Behind the scenes**:
- File metadata is extracted (title from filename, size, type)
- Thumbnail is generated if image/PDF
- Asset record is created in `registry/assets.jsonl`
- Original file path is stored as `source_uri`; the actual file remains on disk

## Workflow 2: Inbox Triage & Classification

The **Inbox** page shows assets waiting for classification (status: `inbox` or `raw`).

### Via Web UI

1. Go to **Inbox** page
2. Click an asset to open the detail drawer
3. In the drawer, fill in:
   - **Artifact Type** (e.g., "Product Brief," "UI Mockup," "Research Note")
   - **Project** (which project owns this asset)
   - **Sensitivity** (public, personal, work_sensitive, client_sensitive, or restricted)
   - **Tags** (optional, comma-separated)
4. Click **Classify**

Status changes from `inbox` → `raw` (metadata extracted and classified).

### Bulk Assign

1. In **Inbox**, select multiple assets (checkboxes)
2. Click **Bulk Assign**
3. Choose shared artifact type, project, sensitivity
4. Click **Apply**

All selected assets are classified in one action.

## Workflow 3: Apply a BOM Template

A **Template** defines the structure of a project's Artifact BOM — domains and slot types.

### Via Web UI

1. Go to **Command Center** (project home) or the project detail page
2. Click **Apply Template** button
3. **Template Library** modal opens
4. Browse available templates:
   - **"New Product App"**: Strategy, Product, Architecture, Frontend Design, GTM domains
   - **"Architecture Initiative"**: Architecture, Decision, Implementation, Testing domains
   - **"Agentic OS"**: Core, Integration, Configuration domains
5. Click a template to preview
6. Click **Apply**

A new **Artifact BOM** is created for the project with empty slots. Each domain and artifact type in the template creates one or more slots.

### Via CLI

```bash
atlas bom apply --project my-project --template new-product-app
```

**Behind the scenes**:
- Template YAML is loaded from `templates/`
- Slot records are created in `registry/bom.jsonl`
- Slot status is initialized to `missing` (no assigned assets yet)

## Workflow 4: Assign Assets to Slots

Once a BOM is applied, you can fill slots by assigning assets.

### Via Web UI

1. Go to **Artifact BOM** page
2. View the BOM structure: domains, slots, and current status (missing/partial/complete/stale)
3. Click on a slot (or drag an asset onto it)
4. **Assign Asset** drawer opens
5. Click **Select Asset** to search/browse your assets
6. Choose an asset from the list (filtered by artifact type)
7. Click **Assign**

Asset assignment status changes from `suggested` (agent-proposed) → `accepted` (human approved). The slot status recalculates: if minimum assets are met and all are in acceptable status, the slot becomes `complete`.

### Inbox-to-BOM Mapping

When an asset is in the **Inbox**, you can assign it directly to a slot:

1. Go to **Inbox**
2. Open an asset detail drawer
3. Click **Assign to BOM Slot**
4. Choose a project and slot from the BOM
5. Click **Assign**

Asset jumps to `candidate` or `in_progress` status (depending on the slot's workflow) and the assignment is recorded.

### Via CLI

```bash
atlas bom assign --project my-project --slot product-brief --asset my-asset-id
```

## Workflow 5: View Coverage & Gaps

The **Coverage & Gaps** page shows BOM completion health.

### Via Web UI

1. Go to **Coverage & Gaps** page
2. View **BOM Coverage Score**: percentage of required slots filled to target
3. View **Critical Gaps**: required slots still missing or in `missing`/`partial` status
4. Recommendations list stale assets and under-filled slots
5. Click a gap to jump to the BOM and assign an asset

### Via CLI

```bash
atlas bom status --project my-project
```

Output:
```
Project: my-project
BOM Coverage: 65/100 (65%)
Critical Gaps:
  - Strategy/Product Strategy (missing)
  - Frontend Design/UI Kit (partial, needs 1 more)
Stale Assets:
  - old-research.pdf (last updated 30 days ago)
```

## Workflow 6: Build & Export Context Packs

A **Context Pack** is a curated, exportable collection of assets for use by agents or external systems.

### Via Web UI

1. Go to **Context Pack Builder**
2. Click **New Pack**
3. Give the pack a name and description
4. **Add Assets**:
   - Click **Select Assets** to search and choose
   - Or drag assets from the **Asset Gallery** sidebar
5. Set **Policy Mode**:
   - **Include Sensitive**: Include work_sensitive and client_sensitive assets (not recommended for external agents)
   - **Exclude Sensitive**: Mask sensitive content; agents see metadata-only
   - **Public Only**: Only public and personal assets included
6. Click **Preview** to see token estimate and asset list
7. Click **Export** to choose format:
   - **YAML Manifest**: Machine-readable pack definition with metadata
   - **Markdown Report**: Human-readable asset cards with descriptions
   - **JSONL Export**: Portable line-delimited JSON for agents

**Export location**: Files are written to `exports/context-packs/` and timestamped.

### Via CLI

```bash
# Create a pack from BOM slot assignments
atlas context-pack create --project my-project --name "phase-2-context" --from-bom

# Or list and export existing packs
atlas context-pack list --project my-project
atlas context-pack export --pack phase-2-context --format yaml
```

### Policy Envelope

Every context pack includes a **policy envelope** metadata block:

```yaml
context_pack:
  id: pack-12345
  name: "Phase 2 Context Pack"
  created_at: "2026-06-20T14:30:00Z"
  policy:
    sensitivity_mode: "exclude_sensitive"
    asset_access: "preview_allowed"
    required_approval_for_publish: true
  assets:
    - id: asset-001
      title: "Product Strategy"
      sensitivity: "personal"
      access_allowed: true
    - id: asset-002
      title: "Client Confidential Brief"
      sensitivity: "client_sensitive"
      access_allowed: false  # masked by policy mode
```

Agents can inspect the policy envelope before consuming the pack.

## Workflow 7: Promote an Asset to Canonical

Once an asset is well-vetted and ready to be the **authoritative version**, promote it to `canonical` status.

### Via Web UI

1. Go to **Assets** or **Asset Detail**
2. Click the status badge (e.g., `in_progress`)
3. Select **Promote to Canonical**
4. Confirm the action (requires human approval)

A promotion request is logged as an audit event. Status changes to `canonical`.

### Via CLI

```bash
atlas asset promote --asset my-asset-id --approve
```

**Behind the scenes**:
- Asset status transitions from `selected` or `in_progress` to `canonical`
- An `asset_promoted` audit event is recorded with timestamp and actor
- UI reflects the change immediately; other assets of the same type are de-emphasized

## Workflow 8: Export Registry for External Use

All Artifact Atlas data is exportable in portable formats.

### Export Registry Snapshot

```bash
# Export all projects, assets, and BOMs as JSONL
python3 scripts/validate_registry_exports.py

# Or copy the registry directly
cp -r registry/ my-backup/artifact-atlas-registry
```

Each file is one JSON object per line, human-readable and diffable:

```json
{"id": "proj-001", "name": "My Project", "description": "...", "created_at": "...", ...}
```

### Export for MeatyWiki

Assets can be exported as MeatyWiki-compatible Markdown cards:

```bash
atlas asset export --asset my-asset-id --format meatywiki --output ~/MeatyWiki/artifacts/
```

Output is a Markdown file with YAML frontmatter:

```yaml
---
type: artifact_asset
artifact_id: my-asset-id
project_id: proj-001
created_at: 2026-06-20T10:00:00Z
---

# My Asset Title

Asset description and metadata here.

## Related Assets

- link-001
- link-002
```

### Export for Control Plane

Generate a project snapshot for the Agentic Control Plane:

```bash
atlas sync control-plane
```

Writes `exports/control-plane-snapshot.yaml` with BOM coverage, critical gaps, and available context packs for routing decisions.

## Common Patterns

### Find Assets by Type

```bash
# Via CLI
atlas asset list --project my-project --type "Product Brief"

# Via Web UI: Assets page → Artifact Type filter
```

### Search by Tag

```bash
# Via CLI
atlas asset list --project my-project --tag "high-priority"

# Via Web UI: Assets page → search bar
```

### Archive an Asset

```bash
# Via CLI
atlas asset archive --asset my-asset-id --reason "superseded by v2"

# Via Web UI: Asset detail → click status menu → Archive
```

Asset status changes to `archived`. It no longer appears in active workflows but remains in audit logs for compliance.

### Apply a Template to Update BOM

If a project already has a BOM, applying a template again will **merge** new slots or warn about conflicts. The system prevents duplicate slots but allows adding new domains.

## Tips & Gotchas

1. **Status is workflow-managed**: Asset status progresses `inbox → raw → candidate → in_review → in_progress → selected → canonical`. You cannot jump backwards or skip steps.

2. **Sensitivity defaults to personal**: All new assets are `personal` by default. Manually upgrade to `work_sensitive` or `client_sensitive` if needed.

3. **Slots auto-calculate status**: BOM slot status (`missing`, `partial`, `complete`, `stale`) is computed on-the-fly from assignments; you don't manually set it. Use the coverage endpoint to see current health.

4. **Context packs are drafts until exported**: Creating a pack in the UI does not export it. Click **Export** to choose format and write to disk.

5. **Canonical promotion is audited**: Every `canonical` promotion is logged with timestamp, actor, and asset ID. Check `registry/events.jsonl` for compliance.

6. **Policy denials are logged too**: If an agent or user is denied access to sensitive content, a `policy_denied` event is recorded. Use this to debug access issues and track policy violations.

7. **Exports are snapshots**: YAML/Markdown exports are static snapshots. They do not auto-sync; export again if assets are updated.

## Next Steps

- See `docs/architecture.md` for system design details
- See `docs/DECISIONS.md` for policy and design rationale
- See `docs/agent-handoff.md` for MCP/CLI usage by agents
- See the spec `Artifact_Atlas_PRD_UIUX_Implementation_Spec.md` for detailed requirements
