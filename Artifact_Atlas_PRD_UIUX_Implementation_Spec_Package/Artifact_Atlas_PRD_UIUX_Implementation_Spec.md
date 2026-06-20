---
schema_version: 0.1
id: artifact_atlas_prd_uiux_implementation_spec_v0_1
type: artifact
artifact_kind: prd_uiux_implementation_spec
title: Artifact Atlas PRD, UI/UX Design Spec, and Implementation Architecture
project: MeatyWiki / Artifact Atlas
domain: project_asset_management_agent_context
status: candidate_artifact
owner: Nick Miethe
created_at: 2026-06-17
updated_at: 2026-06-17
system_of_record: MeatyWiki
current_location: /mnt/data/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md
related_systems:
  - Agentic Operating System
  - MeatyWiki
  - IntentTree
  - Intent and I-BOM
  - SkillMeat / SAM
  - CCDash
  - Agentic Control Plane
  - Execution Engine
  - Governance and Evaluation
source_context: Based on the Artifact Atlas app concept, generated UI mockups, and Agentic OS seed specs.
intended_use: Product definition, UI/UX handoff, engineering architecture, and implementation planning for Artifact Atlas.
next_action: Convert this candidate spec into MeatyWiki project artifact and create an MVP backlog.
review_cadence: weekly during MVP design/build
confidentiality: personal
tags:
  - artifact-atlas
  - meatywiki
  - ui-ux
  - prd
  - implementation-spec
  - artifact-bom
  - mcp
  - agent-context
---

# Artifact Atlas PRD, UI/UX Design Spec, and Implementation Architecture

## 0. Executive summary

**Artifact Atlas** is a project-centric asset, context, and template coverage application for the Agentic Operating System.

It is a companion front end to **MeatyWiki**, **IntentTree**, **SkillMeat/SAM**, **CCDash**, and the **Agentic Control Plane**. It lets humans and agents see, curate, classify, and retrieve all relevant project materials, even when those materials live outside the main vault.

The app begins as a visual asset browser for project artifacts: generated ChatGPT images, diagrams, PDFs, markdown specs, Figma files, local screenshots, GitHub files, Drive docs, MeatyWiki pages, and other references. It then expands into a **template-driven Artifact BOM** system: each project or idea can have one or more templates that define the expected artifact types for a project type, domain, phase, or workflow. As assets are added, they can be labeled, dragged into slots, auto-mapped from the inbox, or suggested by agents. This creates a visible project readiness map.

The key product thesis:

> A project is not just a set of notes or tasks. It is a living graph of intents, task nodes, assets, expected artifacts, context packs, evidence, and decisions.

Artifact Atlas provides the human UX and agent-safe access layer for that graph.

## 1. Product position in the Agentic OS

Artifact Atlas belongs primarily to the **MeatyWiki Memory Layer**, with strong relationships to the **I-BOM / Context Snapshot Layer**, **IntentTree / Planning Layer**, **SkillMeat / SAM Skill Stack Layer**, **Execution Layer**, **CCDash Telemetry Layer**, **Agentic Control Plane Routing Layer**, and **Governance and Evaluation Layer**.

### 1.1 Layer ownership

| Dimension | Decision |
|---|---|
| Primary owning project | MeatyWiki |
| Product/component name | Artifact Atlas |
| Internal capability family | Project Asset Graph + Artifact BOM + Context Pack Builder |
| Primary user value | Find, classify, assemble, and govern project context |
| Primary agent value | Retrieve the right assets for the right intent/task without broad file access |
| Personal/enterprise orientation | Personal-first MVP, enterprise-compatible architecture |
| System of record | MeatyWiki for rationale and canonical project memory; Artifact Atlas for asset metadata and visual workflow state |
| Telemetry source | CCDash execution and usage events |
| Reusable asset source | SkillMeat/SAM templates, context packs, and SkillBOM links |
| Routing consumer | Agentic Control Plane |

### 1.2 Design principle

Artifact Atlas should **index and relate artifacts**, not necessarily own every artifact.

It should be able to show:

- Files inside MeatyWiki or Obsidian vaults.
- Local files in AI output folders.
- ChatGPT/Claude generated images downloaded locally.
- Figma/Canva/Miro/Excalidraw design references.
- Google Drive, SharePoint, Notion, GitHub, and web references.
- Eagle, TagSpaces, Immich, or Nextcloud assets when those tools are used as visual/file layers.

Artifact Atlas stores the **metadata, relationships, status, permissions, and workflow state** around each artifact.

## 2. Problem statement

Project context is scattered across too many places:

- MeatyWiki pages explain why things matter.
- IntentTree nodes define what work needs to happen.
- ChatGPT and Claude generate images, diagrams, drafts, and outputs.
- Figma, Miro, Draw.io, Excalidraw, and Canva store design assets.
- GitHub stores code, schemas, ADRs, and docs.
- Drive/SharePoint/Notion store docs and collaboration artifacts.
- Local folders store screenshots, exports, PDFs, and generated images.
- Agents need context but should not get unbounded filesystem access.

The user problem is not only “I cannot find files.” It is:

1. I cannot see all project-relevant materials in one place.
2. I cannot tell which assets are raw, candidate, selected, canonical, stale, or missing.
3. I cannot easily map generated outputs to topics, features, or task nodes.
4. I cannot tell what a project still needs by project type.
5. I cannot safely hand the right context to an agent.
6. I cannot preserve artifact lineage, prompt provenance, and why an artifact mattered.
7. I cannot reuse project structures and artifact expectations across similar projects.

## 3. Product goals and non-goals

### 3.1 Goals

| Goal | Description |
|---|---|
| Unified project asset view | Show all relevant project materials, regardless of storage location. |
| Visual-first curation | Make screenshots, generated images, diagrams, and design artifacts easy to browse. |
| IntentTree-linked context | Map assets to intent nodes, topics, features, domains, phases, and expected outputs. |
| Artifact BOM coverage | Define expected artifact types for project templates and show filled/missing/stale coverage. |
| Agent-safe retrieval | Expose controlled APIs, CLI, and MCP tools for agents to retrieve relevant assets and context packs. |
| Low-friction capture | Provide inbox and auto-classification workflows for generated outputs and new files. |
| Template reuse | Allow reusable project/idea templates with expected artifact types by domain and phase. |
| Governance and traceability | Preserve provenance, sensitivity, access policy, audit logs, and approval state. |
| Context pack generation | Assemble agent-ready bundles from selected assets, MeatyWiki pages, IntentTree nodes, and instructions. |
| Evidence loop | Emit usage, output, reuse, quality, and drift events to CCDash. |

### 3.2 Non-goals for MVP

| Non-goal | Rationale |
|---|---|
| Replace MeatyWiki | MeatyWiki remains the rationale and memory layer. Artifact Atlas is the asset/context front end. |
| Replace IntentTree | Artifact Atlas links to and uses IntentTree nodes but does not become the canonical planning system. |
| Replace Figma/Eagle/Drive/GitHub | Artifact Atlas should integrate and index rather than replace specialist tools. |
| Store every file blob in the database | The system should support external references, local paths, and object storage. |
| Fully autonomous project management | MVP supports human curation plus agent suggestions, not unsupervised canonicalization. |
| Enterprise SSO/RBAC first | MVP can support local auth or single-user use; enterprise controls should be designed but phased. |

## 4. Personas

### 4.1 Founder-architect / power user

Needs to capture and organize high-context projects without losing conceptual coherence. Wants to see project materials, task context, expected artifacts, and gaps without creating another heavy PM tool.

### 4.2 Designer / visual curator

Needs to browse generated images, Figma files, diagrams, screenshots, and variants; compare candidates; mark selected/canonical; and associate visuals with features or tasks.

### 4.3 Builder / engineer

Needs task-specific context: architecture diagrams, APIs, specs, ADRs, constraints, required outputs, and existing design materials.

### 4.4 Agent / automation client

Needs bounded, queryable access to project context, assets, expected outputs, and policies. Should receive only what is needed for the active task.

### 4.5 Reviewer / governance owner

Needs to know which assets are canonical, sensitive, stale, approved, reusable, or safe to include in context packs.

### 4.6 Enterprise operator / platform owner

Needs artifact templates, coverage visibility, integration with existing systems, approval workflows, audit trails, and evidence of what worked.

## 5. Concept model

Artifact Atlas introduces three tightly connected product models.

### 5.1 Asset Graph

A project-level graph of files, URLs, pages, generated outputs, designs, screenshots, docs, code, and references.

Key relationships:

- Asset belongs to project.
- Asset can map to topics, features, domains, phases, and IntentTree nodes.
- Asset can satisfy one or more Artifact BOM slots.
- Asset can be included in context packs.
- Asset can derive from a prompt, conversation, source file, or prior asset.
- Asset can be used as input/output evidence in CCDash events.

### 5.2 Artifact BOM

A template-driven bill of materials for expected project artifacts.

Example: a “New Product / App” template may expect:

- Strategy: positioning statement, goals, roadmap, success metrics.
- Product: PRD, user stories, personas, acceptance criteria.
- Architecture: architecture diagram, API spec, data model, ADR log.
- Frontend Design: user flows, wireframes, UI mockups, design system, component library.
- Engineering: tech spec, integration plan, test plan, deployment guide.
- GTM: messaging deck, launch brief, sales one-pager, content calendar.
- Operations: runbook, monitoring plan, incident playbook.

The BOM provides visual cues: filled, missing, partial, in progress, stale, optional, blocked, or not applicable.

### 5.3 Context Packs

Agent-ready bundles assembled from assets, MeatyWiki pages, IntentTree nodes, artifact slots, instructions, policies, and output expectations.

A context pack can be created manually, suggested by the system, generated from an IntentTree node, or generated from BOM gaps.

## 6. Information architecture

### 6.1 Global navigation

Primary navigation:

1. **Projects**
2. **Topics**
3. **IntentTree**
4. **Assets**
5. **Artifact BOM**
6. **Templates**
7. **Design**
8. **Context Packs**
9. **Coverage & Gaps**
10. **Recent**
11. **Inbox**
12. **Settings**

For MVP, “Artifact BOM,” “Templates,” and “Coverage & Gaps” may live under Project tabs rather than global nav items.

### 6.2 Project-level tabs

Inside a project:

- Overview
- Topics
- IntentTree
- Assets
- Artifact BOM
- Templates
- Design
- Context Packs
- Coverage & Gaps
- Activity
- Settings

### 6.3 Primary routes

```text
/projects
/projects/:projectId
/projects/:projectId/assets
/projects/:projectId/assets/:assetId
/projects/:projectId/inbox
/projects/:projectId/intenttree/:nodeId
/projects/:projectId/board
/projects/:projectId/bom
/projects/:projectId/bom/slots/:slotId
/projects/:projectId/templates
/projects/:projectId/templates/apply
/projects/:projectId/templates/builder/:templateId
/projects/:projectId/bom/mapping
/projects/:projectId/coverage
/projects/:projectId/context-packs
/projects/:projectId/context-packs/new
/settings/integrations
/settings/agents
/settings/policies
```

## 7. UI/UX design system

### 7.1 UX principles

1. **Context first, storage second**: users should browse by project, task, feature, domain, and artifact type before worrying where files live.
2. **Visible coverage beats hidden checklists**: BOM slots should show what is needed, missing, stale, and complete.
3. **Inbox before perfection**: assets should be captured quickly and organized later.
4. **Drag, label, or auto-map**: all classification workflows should support manual drag/drop, metadata forms, and AI suggestions.
5. **Human and agent symmetry**: every view should make sense to humans and produce structured data for agents.
6. **Canonicalization is explicit**: raw assets should not silently become canonical.
7. **Provenance is always nearby**: source, prompt, conversation, file path, creator, and modification history should be visible.
8. **No broad agent access by default**: agents retrieve assets through scoped APIs and context packs.
9. **Scannable density**: screens should support many artifacts without feeling like a spreadsheet.
10. **Lightweight but governed**: personal UX should feel low-friction, while enterprise controls remain possible.

### 7.2 Visual language

| Element | Direction |
|---|---|
| Base theme | Light enterprise SaaS, white background, subtle gray dividers |
| Primary accent | Blue for primary actions and active state |
| Secondary accents | Purple for intent/template, green for complete/canonical, orange for partial/warning, red for critical/missing |
| Typography | Clean sans-serif, high density but readable |
| Layout | Persistent left sidebar, top search/command bar, main workspace, optional right drawer |
| Cards | Rounded, subtle border, low shadow, clear header and footer actions |
| Tiles | Asset cards and BOM slots with thumbnails, badges, status chips, and quick actions |
| Empty states | Dotted drop zones with clear labels and AI suggestions |
| Status chips | Raw, New, Candidate, In Review, In Progress, Selected, Canonical, Missing, Stale, Archived |

### 7.3 Component inventory

| Component | Use |
|---|---|
| App shell | Persistent sidebar, top search, filters, profile/status controls |
| Project header | Breadcrumb, title, tags, sync status, primary actions |
| KPI card | Counts, coverage, readiness, linked nodes, open gaps |
| Asset card | Thumbnail, title, source, tags, status, quick actions |
| Asset detail drawer | Preview, metadata, associations, provenance, policies, actions |
| BOM slot | Expected artifact type, filled/missing state, accepted file types, assignment controls |
| Domain section | Group expected artifacts by Architecture, Design, Marketing, Research, etc. |
| Phase swimlane | Discovery, Design, Build, Launch, Operate, Review |
| Template card | Reusable project type with domains, counts, status, readiness |
| Coverage matrix | Artifact types vs domains/phases/status |
| Context pack item row | Asset rows with inclusion, token estimate, policy state |
| Classification panel | Project/topic/feature/node/type/status/sensitivity assignment |
| Agent action panel | Create context pack, summarize, find similar, mark canonical |
| Policy panel | Agent access, sensitivity, training allowed, external data, code execution |
| Activity feed | Project events, asset updates, mappings, context pack events |
| Recommendation card | Gap, stale asset, orphan asset, missing context, next action |

### 7.4 Keyboard and command palette

Core shortcuts:

| Shortcut | Action |
|---|---|
| Cmd/Ctrl+K | Open command palette |
| / | Focus search |
| A | Add asset |
| I | Open inbox |
| B | Open Artifact BOM |
| T | Open template library |
| C | Create context pack |
| L | Link selected asset to node/slot |
| M | Move/map selected assets |
| G | Review gaps |
| Esc | Close drawer/modal |

Command palette actions:

- Add asset from file.
- Capture from clipboard.
- Search assets.
- Open current project BOM.
- Apply template.
- Create context pack for current node.
- Show missing artifacts.
- Find orphaned assets.
- Sync MeatyWiki.
- Start MCP server.

## 8. Screen specifications

### 8.1 Project Home / Command Center

**Purpose:** Give a project-level view of assets, IntentTree nodes, context packs, canonical artifacts, gaps, and agent activity.

**Primary users:** founder-architect, project owner, agent operator.

**Key UI regions:**

- Project title, description, tags, sync status.
- Primary actions: Add Asset, Create Context Pack, Open in MeatyWiki, Apply Template.
- KPI cards: All Assets, Candidate Assets, Canonical Assets, Linked Intent Nodes, Open Tasks, BOM Coverage.
- Panels:
  - Active IntentTree Nodes.
  - Recent Assets.
  - Canonical Artifacts.
  - Candidate Assets.
  - Missing Context / Attention Needed.
  - Context Packs.
  - Agent Activity / Suggested Next Actions.

**Interactions:**

- Clicking a node opens IntentTree Node Context View.
- Clicking an asset opens Asset Detail.
- Clicking a gap opens the BOM slot or missing-context item.
- “Create Context Pack” can default to selected active node or project-level pack.

### 8.2 Asset Library / Gallery

**Purpose:** Browse, filter, sort, preview, and manage all project assets.

**Key controls:**

- Filters: project, source, type, status, topic, feature, IntentTree node, date, sensitivity, artifact type, BOM slot.
- View modes: Gallery, Table, Board, Timeline.
- Sort: recently updated, created date, canonical status, relevance, source, coverage impact.
- Actions: Add Asset, Import, Export, Bulk Actions.

**Asset card fields:**

- Thumbnail or type icon.
- Title.
- Source: ChatGPT, Figma, Vault, GitHub, Drive, Local, Eagle, etc.
- Artifact type.
- Tags.
- Status.
- Linked node count.
- BOM slot state.
- Comments/annotations.
- Quick actions: preview, favorite, link, add to pack, menu.

**Right drawer:**

- Preview.
- Details.
- Tags.
- IntentTree links.
- BOM slot assignments.
- Sensitivity.
- Quick actions.

### 8.3 Asset Detail / Review

**Purpose:** Curate a single asset, inspect provenance, manage relationships, and decide whether it should become selected/canonical.

**Key sections:**

- Large preview with zoom, pan, thumbnails, variants.
- Title, status, file type, size, dimensions, created/updated.
- Action buttons: Open Original, Link to Node, Assign to BOM Slot, Add to Context Pack, Compare Variants.
- Status selector: Raw, Candidate, Selected, Canonical, Archived.
- Details: source, format, created by, modified at.
- IntentTree links.
- BOM slot assignments.
- Project/topic/feature/domain/phase associations.
- Provenance: prompt, conversation URL, model, run ID, parent assets.
- Version history.
- Related assets.
- AI-generated summary.
- Agent access policy.
- Annotations and comments.

**Important rule:** Canonical promotion requires explicit action and optional human review.

### 8.4 Inbox / Capture & Triage

**Purpose:** Bring in new assets quickly and classify them later.

**Sources:**

- Local watched folders.
- Drag and drop.
- Clipboard paste.
- ChatGPT image download folder.
- Screenshot capture.
- Figma/Drive/GitHub imports.
- Browser extension.
- CLI import.

**Workflow steps:**

1. Capture.
2. Classify.
3. Link.
4. Review.

**Layout:**

- Left: inbox list with selected assets and status.
- Center: asset preview and thumbnail carousel.
- Bottom/center: AI-suggested metadata.
- Right: classification form with project, topic, feature, IntentTree node, artifact type, BOM slot, source, status, tags, sensitivity, notes.

**Bulk operations:**

- Apply metadata to selected.
- Auto-suggest for selected.
- Assign to project/topic.
- Assign to BOM slots.
- Mark as raw/candidate.
- Archive/delete.

### 8.5 IntentTree Node Context View

**Purpose:** Show all context, required artifacts, linked assets, and agent actions for a specific IntentTree node.

**Key regions:**

- Node summary: title, level, owner, status, priority, parent path, dependencies.
- Linked topic and feature.
- Required context list.
- Referenced assets.
- Candidate outputs.
- Related MeatyWiki pages.
- Linked skills/context packs.
- Agent actions.
- Right panel: Create Context Pack, Summarize for Agent, Mark as Canonical, Quick Info.

**Agent relevance:** This is the primary human-readable version of what an agent should receive when executing a node.

### 8.6 Feature / Topic Board

**Purpose:** Organize assets by feature, topic, or status using a board-style flow.

**Group options:**

- By artifact status: Raw Captures, Candidate, Selected, Canonical, Archived.
- By feature: Agent Shell, Control Plane, Governance, Context Packs.
- By topic: Architecture, GTM, Research, UI Design.
- By domain: Frontend Design, Architecture, Marketing, Research.

**Interactions:**

- Drag card between columns to update status or classification.
- Add asset to column.
- Open asset detail.
- Multi-select for bulk assignment.
- Filter by node, source, sensitivity, or template.

### 8.7 Artifact BOM Overview

**Purpose:** Visually track required artifacts and coverage for a project based on selected templates.

**Core page elements:**

- Header: Artifact BOM title, sync status, Apply Template, Add Domain Template, More.
- KPI cards:
  - Total Expected Types.
  - Filled.
  - Missing.
  - Coverage %.
  - Active Templates.
- Domain tabs: All Domains, Architecture, Frontend Design, Marketing, Research, Operations, Custom.
- Domain sections with artifact slots.
- Right panel: Quick Actions, Template Sources, Insights, Legend.

**Slot states:**

| State | UI treatment | Meaning |
|---|---|---|
| Empty/Missing | Dotted purple drop zone | Expected artifact has no assigned asset |
| Filled | Solid card with thumbnail | Slot has at least one assigned asset |
| Complete | Green chip | Required slot is satisfied and reviewed |
| In Progress | Blue or green chip | Asset exists but still evolving |
| Partial | Orange chip | Slot partially satisfied or uncertain |
| Stale | Purple/clock chip | Assigned asset is outdated |
| Optional | Muted label | Slot is useful but not required |
| Blocked | Red/warning chip | Slot cannot be filled due to dependency or missing source |
| Not Applicable | Gray | Template slot intentionally excluded |

**Interactions:**

- Drop asset onto slot to assign and auto-label.
- Click empty slot to open missing-slot details.
- Click filled slot to open assigned asset list.
- Auto-label from Inbox.
- Compare coverage by domain/template/phase.
- Export BOM readiness report.

### 8.8 Template Library

**Purpose:** Browse and apply reusable project/idea templates.

**Template examples:**

- New Product / App.
- Architecture Initiative.
- Thought Leadership / GTM.
- Research Project.
- Client Proposal.
- Platform Capability.
- Design System Upgrade.
- Agentic Workflow Pilot.
- Enterprise Readiness Assessment.

**List/table fields:**

- Template name.
- Description.
- Domains.
- Estimated artifact count.
- Readiness coverage when applied to current project.
- Created by.
- Status: Core, Recommended, Optional, Experimental, Deprecated.
- Updated.

**Preview drawer:**

- Use Template.
- Preview BOM.
- Duplicate Template.
- Domains included.
- Artifact type count.
- Setup estimate.
- Details/history.

### 8.9 Apply Templates Wizard

**Purpose:** Apply one or more templates to a project or a specific project section/phase.

**Steps:**

1. Choose Templates.
2. Configure Domains.
3. Review Expected Artifact Types.
4. Apply.

**Configuration options:**

- Add as new BOM section.
- Merge with existing BOM.
- Mark some artifact types optional.
- Apply to current project phase only.
- Apply to selected IntentTree node/subtree.
- Apply to selected domain only.
- Generate missing slots as tasks.
- Create context pack skeleton.

**Output:**

- Artifact BOM sections and slots.
- Expected artifact types.
- Optional/required rules.
- Auto-labeling rules.
- Coverage baseline event.

### 8.10 BOM Builder / Project Builder

**Purpose:** Design or edit a reusable Artifact BOM template.

**Layout:** Three-panel builder.

#### Left panel: Artifact Type Library

Groups:

- Strategy & Discovery.
- Product & Requirements.
- Architecture & Design.
- Implementation.
- Research & Validation.
- GTM & Marketing.
- Operations & Support.
- Governance & Evaluation.

Items:

- PRD.
- Competitive Analysis.
- Messaging Matrix.
- Architecture Diagram.
- API Specification.
- Data Model.
- Wireframes.
- UI Mockups.
- Component Library.
- Technical Specification.
- Integration Plan.
- Test Plan.
- Launch Brief.
- User Research Report.
- Evaluation Matrix.

#### Center panel: BOM Structure Canvas

Organized by:

- Domain.
- Phase.
- IntentTree level.
- Project section.

Example phase columns:

- Discovery.
- Design.
- Build.
- Launch.
- Operate.
- Review.

#### Right panel: Artifact Properties

Fields:

- Artifact type.
- Required/optional.
- Domain.
- Phase.
- Linked IntentTree node.
- Accepted file types.
- Naming convention.
- Auto-label rules.
- Guidance/instructions.
- Status.
- Review requirements.
- Validity/staleness rules.

**Actions:**

- Duplicate from Template.
- Create Section.
- Preview BOM.
- Save Template.
- Apply to Project.
- View Change History.

### 8.11 Inbox to BOM Mapping

**Purpose:** Map incoming assets directly into expected BOM slots using drag/drop or AI suggestions.

**Layout:**

- Left: Inbox list.
- Center: Artifact BOM slots grouped by domain.
- Right: Suggested Classification panel.

**Interactions:**

- Drag an inbox item onto an empty slot.
- Select multiple inbox items and auto-suggest matches.
- Review AI confidence and reasoning.
- Apply to selected.
- Auto-fill empty slots.
- Review unmatched items.
- Publish mapping.

**Mapping confidence states:**

| Confidence | UI treatment | Behavior |
|---|---|---|
| High | Green match | Can auto-apply with confirmation |
| Medium | Yellow partial | Requires review |
| Low | Gray/uncertain | Suggest only, no auto-apply |
| Conflict | Red warning | Needs manual resolution |

### 8.12 Coverage & Gaps / BOM Readiness

**Purpose:** Make missing, stale, and incomplete artifacts actionable.

**Key widgets:**

- Overall readiness score.
- Critical missing.
- Optional pending.
- Stale/outdated.
- Recently completed.

**Main matrix:**

Rows: artifact types.

Columns: domains, phases, templates, or owners.

Cells: Complete, In Progress, Partial, Missing, Stale, N/A.

**Right recommendations panel:**

- Missing launch brief in Marketing.
- Architecture diagram outdated.
- No competitive analysis attached.
- Journey map partially complete.
- Stale assets need attention.
- Content plan in progress.

**Quick actions:**

- Open Missing Slots.
- Request Asset.
- Apply Another Template.
- Generate Report.
- Create Tasks in IntentTree.
- Create Context Pack for Gaps.

### 8.13 Context Pack Builder / Agent Handoff

**Purpose:** Assemble project/node-specific assets and instructions for an agent.

**Steps:**

1. Select Node.
2. Choose Assets.
3. Set Instructions.
4. Review.
5. Publish.

**Inputs:**

- IntentTree node.
- Assets.
- MeatyWiki pages.
- Required BOM slots.
- Policy constraints.
- Agent target audience.
- Output expectations.

**Controls:**

- Auto-suggest assets.
- Preview pack.
- Publish to agent.
- Save draft.
- Include optional assets.
- Token estimate.
- Sensitivity and network policy.

**Outputs:**

- Context pack manifest.
- Agent instructions.
- Selected assets and pages.
- Policy envelope.
- Telemetry event.

## 9. User flows

### 9.1 Capture ChatGPT image output into project

1. User downloads image to watched `AI-Outputs/ChatGPT/YYYY-MM-DD` folder.
2. Local indexer detects file.
3. Asset record is created with source kind `chatgpt_image`.
4. Thumbnail and hash are generated.
5. Asset appears in Inbox.
6. AI suggests project/topic/feature/node/artifact type.
7. User confirms or edits classification.
8. Asset is moved from Inbox to Asset Library.
9. If it satisfies a BOM slot, the slot updates to Filled or In Progress.
10. CCDash records capture/classification event if enabled.

### 9.2 Apply a project template after project already exists

1. User opens Project > Artifact BOM.
2. User selects Apply Template.
3. User chooses “Architecture Initiative” and “Thought Leadership / GTM.”
4. System previews expected artifact types and domain overlap.
5. User chooses Merge with existing BOM.
6. System creates missing slots and maps existing assets where possible.
7. Coverage baseline is calculated.
8. Missing slots can optionally become IntentTree tasks.
9. A MeatyWiki decision note may be suggested: “Applied template X to project Y.”

### 9.3 Drag asset from inbox into BOM slot

1. User opens Inbox to BOM Mapping.
2. User selects `dashboard_metrics.png`.
3. System suggests `Frontend Design > UI Mockups` with 94% confidence.
4. User drags the item into the UI Mockups slot.
5. System assigns asset to slot, applies labels, updates asset status to Candidate or In Progress.
6. Slot coverage updates.
7. User publishes mapping.
8. Audit event is recorded.

### 9.4 Create a custom project template

1. User opens Template Library > Create New Template.
2. User starts from blank or duplicates “New Product / App.”
3. User opens BOM Builder.
4. User drags artifact types into domains/phases.
5. User sets required/optional rules, file types, naming conventions, staleness windows, and auto-label rules.
6. User previews BOM.
7. User saves template as Core, Recommended, Optional, or Experimental.
8. Template becomes available for future projects.

### 9.5 Create agent handoff from IntentTree node

1. User opens node `IT-128 — Agent Interface & Shell`.
2. User selects Create Context Pack.
3. System includes required context, referenced assets, related MeatyWiki pages, and canonical BOM slots.
4. User reviews included assets and agent instructions.
5. Policy controls are applied.
6. User publishes to agent, CLI, or MCP client.
7. CCDash records context pack usage and later captures output quality/rework.

## 10. Functional requirements

### 10.1 Asset ingestion

| Requirement | Priority |
|---|---|
| Add asset by drag/drop | P0 |
| Add asset by file picker | P0 |
| Add asset by watched local folder | P0 |
| Add external URL asset | P0 |
| Import from MeatyWiki vault | P0 |
| Import from GitHub repo paths | P1 |
| Import from Google Drive/SharePoint | P1 |
| Import from Figma | P1 |
| Import from Eagle/TagSpaces/Immich | P2 |
| Browser extension capture | P2 |
| ChatGPT/Claude export ingestion | P2 |

### 10.2 Asset processing

| Requirement | Priority |
|---|---|
| Generate thumbnail | P0 |
| Compute SHA-256 hash | P0 |
| Extract basic metadata | P0 |
| Preview images/PDF/markdown/text | P0 |
| Preview video/audio metadata | P1 |
| Extract text from PDFs | P1 |
| OCR screenshots/images | P1 |
| Detect duplicates | P1 |
| Generate embeddings | P1 |
| AI summary | P1 |
| Variant grouping | P2 |

### 10.3 Classification and relationships

| Requirement | Priority |
|---|---|
| Assign project/topic/feature | P0 |
| Assign asset status | P0 |
| Assign sensitivity | P0 |
| Link to IntentTree node | P0 |
| Assign to BOM slot | P0 |
| Bulk assign metadata | P0 |
| AI-suggested classification | P1 |
| Explain classification confidence | P1 |
| Auto-label based on templates | P1 |
| Multi-parent relationships | P1 |
| Derivation/lineage links | P1 |

### 10.4 Artifact BOM and templates

| Requirement | Priority |
|---|---|
| Create project BOM | P0 |
| Apply template to project | P0 |
| Define domains and slots | P0 |
| Required/optional slots | P0 |
| Slot assignment | P0 |
| Coverage calculation | P0 |
| Missing/stale/partial states | P0 |
| Template library | P1 |
| BOM Builder | P1 |
| Multiple active templates | P1 |
| Merge templates into existing BOM | P1 |
| Phase/domain scoped templates | P1 |
| Generate IntentTree tasks from gaps | P2 |
| Version templates | P2 |
| Template inheritance | P2 |

### 10.5 Context packs

| Requirement | Priority |
|---|---|
| Create context pack from selected assets | P0 |
| Create context pack from IntentTree node | P0 |
| Include MeatyWiki pages | P0 |
| Include policy metadata | P0 |
| Estimate token/payload size | P1 |
| Publish pack to MCP/CLI | P1 |
| Version context packs | P1 |
| Mark pack as Golden/Approved | P2 |

### 10.6 Search and discovery

| Requirement | Priority |
|---|---|
| Keyword search assets | P0 |
| Filter by metadata | P0 |
| Search by project/topic/node | P0 |
| Search by BOM slot | P0 |
| Semantic search | P1 |
| Visual similarity search | P2 |
| Saved views | P2 |

### 10.7 Governance

| Requirement | Priority |
|---|---|
| Sensitivity labels | P0 |
| Agent access policy per asset | P0 |
| Audit log | P0 |
| Human review status | P0 |
| Canonical promotion workflow | P1 |
| Redaction flag | P1 |
| Retention rules | P1 |
| RBAC/ABAC | P2 |
| Enterprise SSO | P2 |

## 11. Non-functional requirements

| Category | Requirement |
|---|---|
| Performance | Asset grid loads first 100 visible assets in under 1s locally, with virtualized loading for large libraries. |
| Scale | MVP should support 10k assets locally; v1 should support 100k+ assets with external object storage. |
| Search | Metadata search under 250ms for common filters; semantic search under 2s for 10k assets. |
| Reliability | File watcher should avoid duplicate records and tolerate moved/renamed files. |
| Privacy | No external model calls by default for local-only mode. |
| Offline | Local-first mode should support browsing indexed assets without internet. |
| Portability | Asset metadata exportable as JSON/YAML/Markdown. |
| Observability | All major actions emit structured events. |
| Accessibility | Keyboard navigable, visible focus states, accessible labels, alt text for previews where available. |
| Security | Agent access mediated through policy-aware API/MCP tools. |

## 12. Backend architecture

### 12.1 Recommended stack

**MVP stack:**

- Frontend: Next.js + React + TypeScript.
- Desktop/local optional: Tauri wrapper for file access and tray watcher.
- Backend API: FastAPI or Node/NestJS. Recommended: FastAPI for Python file processing and agent/MCP integration.
- Database: PostgreSQL + pgvector for server mode; SQLite + sqlite-vec for local-first MVP option.
- Object storage: local filesystem in MVP; S3/MinIO later.
- Queue/workers: Redis + RQ/Celery or Temporal for durable workflows.
- Search: Postgres full-text + pgvector; optional OpenSearch later.
- Preview/indexing: Python workers using Pillow, PyMuPDF, ffmpeg, markdown parsers, tree-sitter for code.
- Auth: local token for MVP; OAuth/OIDC for v1 enterprise.
- Agent interface: MCP server + REST API + CLI.

### 12.2 Service architecture

```text
Artifact Atlas Web App
  React/Next.js UI
  Drag/drop, gallery, BOM, context pack builder

Artifact Atlas API
  Project service
  Asset registry service
  BOM/template service
  Context pack service
  Search service
  Policy service
  Integration service
  Telemetry service

Worker layer
  File watcher
  Thumbnail generator
  Metadata extractor
  OCR/text extraction
  Embedding generator
  Classification suggester
  Sync jobs

Agent access layer
  MCP server
  CLI
  REST/GraphQL API
  Context pack exporter

Storage
  PostgreSQL/SQLite metadata
  Local/object storage files
  Vector index
  Audit event store

External integrations
  MeatyWiki
  IntentTree
  SkillMeat/SAM
  CCDash
  Control Plane
  GitHub
  Google Drive/SharePoint
  Figma
  Local folders
  Eagle/TagSpaces/Immich/Nextcloud
```

### 12.3 Data ownership boundaries

| Data | System of record |
|---|---|
| Asset metadata | Artifact Atlas |
| Original files | Source system or configured storage |
| Project rationale | MeatyWiki |
| Task hierarchy | IntentTree |
| Reusable skill/template definitions | SkillMeat/SAM and Artifact Atlas templates, cross-linked |
| Execution telemetry | CCDash |
| Routing decisions | Agentic Control Plane |
| Intent/I-BOM snapshots | Intent/I-BOM layer, with references to Artifact Atlas assets |

## 13. Data model

### 13.1 Core entities

```yaml
workspace:
  id: string
  name: string
  owner_user_id: string
  created_at: datetime
  settings: object

project:
  id: string
  workspace_id: string
  name: string
  slug: string
  description: string
  status: active|paused|archived
  meatywiki_page_ref: string|null
  intent_id: string|null
  root_intenttree_node_id: string|null
  created_at: datetime
  updated_at: datetime

asset:
  id: string
  workspace_id: string
  project_id: string|null
  title: string
  description: string|null
  artifact_type_id: string|null
  source_id: string|null
  source_kind: vault|local|chatgpt|claude|figma|canva|drive|sharepoint|github|notion|url|eagle|tagspaces|immich|nextcloud|manual
  uri: string
  original_uri: string|null
  storage_uri: string|null
  mime_type: string|null
  size_bytes: integer|null
  hash_sha256: string|null
  thumbnail_uri: string|null
  preview_text_uri: string|null
  status: inbox|raw|candidate|in_review|in_progress|selected|canonical|archived
  sensitivity: public|personal|work_sensitive|client_sensitive|restricted
  agent_access: none|metadata_only|preview_allowed|read_allowed|context_pack_allowed
  created_by: string|null
  generated_by: human|chatgpt|claude|agent|figma|other|null
  captured_at: datetime
  source_created_at: datetime|null
  source_updated_at: datetime|null
  last_indexed_at: datetime|null
  metadata: object

asset_relationship:
  id: string
  source_asset_id: string
  target_asset_id: string
  relationship_type: variant_of|derived_from|references|duplicates|supersedes|superseded_by|evidence_for|input_to|output_of
  confidence: float|null
  created_at: datetime

asset_link:
  id: string
  asset_id: string
  target_type: project|topic|feature|intenttree_node|meatywiki_page|bom_slot|context_pack|skillbom|execution_event
  target_id: string
  relationship: reference|input|output|evidence|candidate|canonical|required_context|satisfies_slot
  created_at: datetime
```

### 13.2 Artifact BOM entities

```yaml
artifact_template:
  id: string
  workspace_id: string
  name: string
  slug: string
  description: string
  template_type: product|architecture|gtm|research|design_system|client_proposal|platform_capability|custom
  status: core|recommended|optional|experimental|deprecated
  version: string
  created_by: string
  created_at: datetime
  updated_at: datetime
  metadata: object

artifact_template_domain:
  id: string
  template_id: string
  name: string
  slug: string
  description: string|null
  display_order: integer

artifact_type:
  id: string
  workspace_id: string
  name: string
  slug: string
  description: string
  default_domain: string|null
  default_phase: string|null
  accepted_mime_types: [string]
  accepted_extensions: [string]
  default_required: boolean
  naming_convention: string|null
  guidance: string|null
  auto_label_rules: object

artifact_template_slot:
  id: string
  template_id: string
  domain_id: string
  artifact_type_id: string
  phase: discovery|design|build|launch|operate|review|custom
  required: boolean
  min_assets: integer
  max_assets: integer|null
  staleness_days: integer|null
  linked_intenttree_node_pattern: string|null
  display_order: integer
  rule_config: object

project_bom:
  id: string
  project_id: string
  name: string
  status: active|archived
  source_templates: [string]
  merge_strategy: new_section|merge_existing|phase_only|node_subtree
  coverage_score: float
  created_at: datetime
  updated_at: datetime

bom_slot:
  id: string
  bom_id: string
  artifact_type_id: string
  domain: string
  phase: string|null
  required: boolean
  status: missing|partial|in_progress|complete|stale|blocked|not_applicable
  linked_intenttree_node_id: string|null
  min_assets: integer
  max_assets: integer|null
  staleness_days: integer|null
  guidance: string|null

bom_slot_assignment:
  id: string
  slot_id: string
  asset_id: string
  assignment_status: suggested|accepted|rejected|canonical
  confidence: float|null
  assigned_by: user|agent|system
  assigned_at: datetime
  notes: string|null
```

### 13.3 Context pack entities

```yaml
context_pack:
  id: string
  workspace_id: string
  project_id: string
  title: string
  description: string|null
  target_type: project|intenttree_node|bom_slot|custom
  target_id: string|null
  status: draft|ready|published|archived
  audience: human|agent|engineering_agent|research_agent|writing_agent|custom
  sensitivity: public|personal|work_sensitive|client_sensitive|restricted
  token_estimate: integer|null
  expires_at: datetime|null
  created_by: string
  created_at: datetime
  updated_at: datetime
  policy: object
  instructions: string|null

context_pack_item:
  id: string
  context_pack_id: string
  item_type: asset|meatywiki_page|intenttree_node|bom_slot|skillbom|external_url|note
  item_id: string
  include_mode: full|summary|metadata|preview|link_only
  display_order: integer
  required: boolean
  token_estimate: integer|null
```

### 13.4 Event model

```yaml
atlas_event:
  id: string
  timestamp: datetime
  workspace_id: string
  project_id: string|null
  actor_type: user|agent|system
  actor_id: string
  event_type: asset_added|asset_classified|asset_linked|asset_promoted|bom_template_applied|bom_slot_filled|context_pack_created|context_pack_published|agent_query|policy_denied|sync_completed
  target_type: asset|bom|slot|template|context_pack|node|project
  target_id: string
  payload: object
  ccdash_event_id: string|null
```

## 14. API design

### 14.1 REST API surface

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId

GET    /api/projects/:projectId/assets
POST   /api/projects/:projectId/assets
GET    /api/assets/:assetId
PATCH  /api/assets/:assetId
DELETE /api/assets/:assetId
POST   /api/assets/:assetId/link
POST   /api/assets/:assetId/promote
POST   /api/assets/:assetId/summarize
POST   /api/assets/:assetId/assign-slot

GET    /api/projects/:projectId/inbox
POST   /api/projects/:projectId/inbox/import
POST   /api/projects/:projectId/inbox/classify
POST   /api/projects/:projectId/inbox/apply-classification

GET    /api/templates
POST   /api/templates
GET    /api/templates/:templateId
PATCH  /api/templates/:templateId
POST   /api/templates/:templateId/duplicate
GET    /api/templates/:templateId/preview

GET    /api/projects/:projectId/bom
POST   /api/projects/:projectId/bom/apply-template
PATCH  /api/bom/:bomId
GET    /api/bom/:bomId/coverage
GET    /api/bom/:bomId/gaps
POST   /api/bom/slots/:slotId/assign
POST   /api/bom/slots/:slotId/mark-not-applicable
POST   /api/bom/slots/:slotId/request-asset

GET    /api/projects/:projectId/context-packs
POST   /api/projects/:projectId/context-packs
GET    /api/context-packs/:packId
PATCH  /api/context-packs/:packId
POST   /api/context-packs/:packId/preview
POST   /api/context-packs/:packId/publish
POST   /api/context-packs/from-node/:nodeId

GET    /api/search
POST   /api/search/semantic
POST   /api/search/similar-assets

GET    /api/integrations
POST   /api/integrations/:integrationId/sync
GET    /api/integrations/:integrationId/status

GET    /api/audit/events
GET    /api/agents/access-log
POST   /api/policies/evaluate
```

### 14.2 Search request shape

```json
{
  "query": "agent shell dashboard",
  "project_id": "proj_agentic_os",
  "filters": {
    "source_kind": ["chatgpt", "figma", "vault"],
    "status": ["candidate", "selected", "canonical"],
    "artifact_type": ["ui_mockup", "architecture_diagram"],
    "intenttree_node_id": ["IT-128"],
    "bom_slot_id": ["slot_ui_mockups"],
    "sensitivity": ["personal", "work_sensitive"]
  },
  "include": ["thumbnail", "links", "bom_status"],
  "limit": 50
}
```

### 14.3 Context pack manifest

```yaml
context_pack_manifest:
  id: pack_aos_agent_shell_review_v1
  title: AOS Agent Shell Review
  project_id: proj_agentic_os
  target_node_id: IT-128
  created_at: 2026-06-17T15:00:00-04:00
  sensitivity: personal
  policy:
    allow_external_data: false
    allow_code_execution: false
    network_access: restricted
    agent_access: trusted_agents_only
  instructions: >
    Use the included assets and MeatyWiki pages to evaluate the current agent shell design.
    Preserve existing architecture constraints and identify gaps before proposing changes.
  items:
    - type: intenttree_node
      id: IT-128
      include_mode: summary
    - type: meatywiki_page
      id: page_agent_interface_overview
      include_mode: full
    - type: asset
      id: asset_agent_shell_dashboard_fig
      include_mode: preview
    - type: asset
      id: asset_state_model_diagram
      include_mode: full
    - type: bom_slot
      id: slot_ui_mockups
      include_mode: metadata
```

## 15. Agentic integration points

### 15.1 MCP server

Artifact Atlas should expose a local or hosted **Model Context Protocol** server for agents. The MCP server should be read-first, policy-aware, and auditable.

#### MCP tools

```yaml
asset.search:
  description: Search project assets by metadata, semantic query, project, node, or BOM slot.
  inputs:
    query: string|null
    project_id: string|null
    intenttree_node_id: string|null
    bom_slot_id: string|null
    artifact_types: [string]
    statuses: [string]
    max_results: integer
  returns:
    assets: [asset_summary]

asset.get:
  description: Retrieve metadata, preview, or content for an allowed asset.
  inputs:
    asset_id: string
    include: metadata|preview|content|all
  returns:
    asset: object
    access_policy: object

asset.assign_to_bom_slot:
  description: Suggest or assign an asset to a BOM slot when policy allows.
  inputs:
    asset_id: string
    slot_id: string
    mode: suggest|assign
    rationale: string
  returns:
    assignment: object

bom.get:
  description: Get the Artifact BOM for a project.
  inputs:
    project_id: string
  returns:
    bom: object

bom.coverage:
  description: Get coverage and gap information for a project BOM.
  inputs:
    project_id: string
    group_by: domain|phase|template
  returns:
    coverage: object
    gaps: [gap]

context_pack.create:
  description: Create a draft context pack from assets, node, or BOM slots.
  inputs:
    project_id: string
    target_type: project|node|slot|custom
    target_id: string|null
    asset_ids: [string]
    instructions: string|null
  returns:
    context_pack: object

context_pack.publish:
  description: Publish a context pack to an agent or export format.
  inputs:
    context_pack_id: string
    destination: cli|file|agent|control_plane
  returns:
    published_context_pack: object

intent_node.context:
  description: Retrieve all relevant context for an IntentTree node.
  inputs:
    node_id: string
    include_assets: boolean
    include_bom_slots: boolean
    include_meatywiki_pages: boolean
  returns:
    node_context: object

project.snapshot:
  description: Generate a project context snapshot for I-BOM or agent routing.
  inputs:
    project_id: string
    include_assets: boolean
    include_coverage: boolean
    include_recent_activity: boolean
  returns:
    snapshot: object

atlas.record_event:
  description: Record agent usage, output, or review evidence.
  inputs:
    event_type: string
    target_type: string
    target_id: string
    payload: object
  returns:
    event_id: string
```

#### MCP policy rules

- Default `asset.get(content)` is denied unless `agent_access` permits it.
- Sensitive assets can return metadata only.
- Client-sensitive/restricted assets require explicit context pack inclusion.
- Tool calls must be logged.
- Write operations default to suggestions unless the agent identity is trusted.
- Canonical promotion requires human approval unless policy explicitly allows automation.

### 15.2 CLI

The CLI supports local-first workflows, scripting, and agent handoffs.

```bash
atlas init
atlas watch add ~/AI-Outputs/ChatGPT --source chatgpt
atlas import /path/to/file.png --project agentic-os --source chatgpt
atlas index --project agentic-os
atlas inbox list --project agentic-os
atlas asset classify asset_123 --project agentic-os --topic architecture --node IT-117
atlas asset link asset_123 --node IT-117
atlas bom apply-template agentic-os architecture-initiative
atlas bom status agentic-os
atlas bom gaps agentic-os --critical
atlas bom assign asset_123 slot_architecture_diagram
atlas template create "Architecture Initiative"
atlas pack build --node IT-128 --include canonical --out context_pack.yaml
atlas pack publish context_pack.yaml --to mcp
atlas mcp serve --project agentic-os --port 8765
atlas sync meatywiki
atlas sync ccdash
```

### 15.3 Webhooks and events

```yaml
webhook_events:
  - asset.created
  - asset.classified
  - asset.linked
  - asset.promoted
  - bom.template_applied
  - bom.slot_filled
  - bom.coverage_changed
  - context_pack.created
  - context_pack.published
  - agent.asset_queried
  - policy.denied
  - sync.completed
```

## 16. Integrations

### 16.1 MeatyWiki

MeatyWiki remains the memory and rationale layer. Artifact Atlas should integrate with it through:

- Project page references.
- MeatyWiki pages as first-class context items.
- Markdown/YAML asset cards for local-first MVP.
- Decision record writeback when templates are applied, assets are promoted, or context packs are published.
- Bidirectional links between pages and assets.
- Context pack export to MeatyWiki.

#### MeatyWiki asset card example

```yaml
---
type: artifact_asset
asset_id: asset_aos_architecture_v3
project: agentic-operating-system
title: AOS Architecture v3
artifact_type: system_architecture_diagram
source_kind: chatgpt
uri: file:///Users/nick/AI-Outputs/ChatGPT/aos_architecture_v3.png
status: candidate
sensitivity: personal
intenttree_nodes:
  - IT-102
  - IT-117
bom_slots:
  - slot_architecture_diagram
agent_access: preview_allowed
---

# AOS Architecture v3

Generated candidate architecture diagram for the Agentic Operating System.
```

### 16.2 IntentTree

IntentTree integration should support:

- Node lookup and display.
- Linking assets to nodes.
- Required context and expected artifact fields.
- Creating tasks from BOM gaps.
- Showing node-level context view.
- Generating context packs from a node/subtree.

Node fields relevant to Artifact Atlas:

```yaml
intenttree_node_extensions:
  expected_artifacts: [artifact_type_id]
  required_context: [asset_id|page_id|slot_id]
  evidence_of_completion: [asset_id]
  reusable_output_candidates: [asset_id]
  bom_slots: [slot_id]
  context_packs: [context_pack_id]
```

### 16.3 Intent and I-BOM

Artifact Atlas contributes to I-BOM by providing:

- Relevant assets.
- Context snapshots.
- Available artifacts.
- Source files.
- Open gaps and assumptions.
- Decision history references.

I-BOM snapshots should reference asset IDs and context pack IDs rather than embedding all file content.

### 16.4 SkillMeat / SAM

Artifact Atlas should integrate with SkillMeat/SAM through:

- Reusable templates.
- Context pack promotion.
- Golden Context Pack candidates.
- SkillBOM references.
- Evaluation criteria and examples.
- Prompt/tool/output schema assets.

Mapping:

| Artifact Atlas concept | SkillMeat/SAM concept |
|---|---|
| Artifact template | Template / reusable output structure |
| Context pack | Context Pack / Golden Context Pack candidate |
| BOM template | Reusable project/workflow artifact structure |
| Asset assignments | SkillBOM inputs/examples/evidence |
| Coverage/gaps | Missing components in SkillBOM/project stack |

### 16.5 CCDash

Artifact Atlas should emit events to CCDash so usage can be evaluated.

Events:

- Asset used in context pack.
- Context pack published to agent.
- Agent queried asset.
- Output asset created.
- Asset promoted to canonical.
- BOM slot filled.
- Gap resolved.
- Rework or stale asset detected.

Metrics:

- Context pack reuse count.
- Asset reuse count.
- Time from capture to classification.
- Orphan asset count.
- BOM coverage over time.
- Context pack success score.
- Human approval/rework rate.
- Drift between expected artifact and output.

### 16.6 Agentic Control Plane

The Control Plane uses Artifact Atlas for:

- Required assets.
- Context pack selection.
- BOM gaps as routing signals.
- Asset access policy.
- Next-best-action recommendations.
- Evidence writebacks.

Example routing input:

```yaml
artifact_context_signal:
  project_id: proj_agentic_os
  active_node_id: IT-128
  bom_coverage:
    frontend_design: 0.75
    architecture: 0.67
    marketing: 0.60
  critical_gaps:
    - slot_security_architecture
    - slot_accessibility_audit
  available_context_packs:
    - pack_aos_shell_navigation
  canonical_assets:
    - asset_aos_architecture_v3
    - asset_agent_shell_spec_v1_2
```

### 16.7 External tools

| Tool/source | MVP approach | Later approach |
|---|---|---|
| Local folders | File watcher and import | Bidirectional sync and move detection |
| Obsidian/MeatyWiki vault | Markdown/YAML scan | Native plugin or sync adapter |
| ChatGPT outputs | Watched folder + manual provenance | Browser/export integration if available |
| Claude outputs | Watched folder/import | Export parser |
| Figma | URL/manual import | API sync for files/thumbnails/comments |
| GitHub | Repo path and raw file links | GitHub App, PR/commit events |
| Google Drive/SharePoint | Manual URL/import | OAuth sync, file metadata, previews |
| Notion/Confluence | URL/manual import | API sync for pages/databases |
| Eagle | Manual library path | Local API adapter |
| TagSpaces | Local paths/tags | Tag metadata sync |
| Immich | Image library links | API/media sync |
| Nextcloud | WebDAV paths | WebDAV sync and sharing links |

## 17. Frontend implementation architecture

### 17.1 Recommended stack

```yaml
frontend:
  framework: Next.js
  language: TypeScript
  ui_components: Radix UI / shadcn-style primitives
  styling: Tailwind CSS or design tokens + CSS modules
  state:
    server_state: TanStack Query
    local_ui_state: Zustand or React Context
  drag_drop: dnd-kit
  tables: TanStack Table
  virtualization: TanStack Virtual / react-virtual
  diagrams: React Flow for graph/node views
  charts: Recharts or Visx
  forms: React Hook Form + Zod
  preview:
    images: native/img with zoom/pan
    pdf: PDF.js
    markdown: MDX/remark
    code: Monaco or Prism/Shiki
    video_audio: native players
  realtime: WebSocket or Server-Sent Events
```

### 17.2 App shell components

```text
<AppShell>
  <SidebarNav />
  <TopBar>
    <GlobalSearch />
    <FilterButton />
    <TypeDropdown />
    <Help />
    <Notifications />
    <UserMenu />
  </TopBar>
  <MainContent />
  <RightDrawer />
  <CommandPalette />
</AppShell>
```

### 17.3 Feature modules

```text
features/projects
features/assets
features/inbox
features/intenttree
features/bom
features/templates
features/context-packs
features/coverage
features/integrations
features/agents
features/policies
features/search
features/activity
```

### 17.4 State management

- Server state fetched via TanStack Query.
- Optimistic updates for drag/drop assignment.
- Local selection state shared by asset grid, inbox, and mapping views.
- URL state for filters, search, and view mode.
- WebSocket/SSE subscriptions for sync/indexing job progress.

### 17.5 Accessibility

- All cards selectable with keyboard.
- Drag/drop must have keyboard equivalent: “Move selected to slot.”
- All icon-only buttons require labels.
- Asset previews require alt text or generated description.
- Status color must never be the only signal.
- Coverage matrix must be screen-reader navigable.
- Focus trap in drawers/modals.

## 18. Backend implementation architecture

### 18.1 API service

Recommended FastAPI modules:

```text
app/
  main.py
  api/
    projects.py
    assets.py
    inbox.py
    bom.py
    templates.py
    context_packs.py
    search.py
    integrations.py
    agents.py
    policies.py
    audit.py
  models/
    project.py
    asset.py
    bom.py
    template.py
    context_pack.py
    event.py
  services/
    asset_registry.py
    file_indexer.py
    thumbnailer.py
    classifier.py
    bom_service.py
    coverage_service.py
    context_pack_service.py
    policy_service.py
    search_service.py
    meatywiki_sync.py
    intenttree_sync.py
    ccdash_client.py
    skillmeat_client.py
  workers/
    index_asset.py
    extract_text.py
    generate_thumbnail.py
    generate_embedding.py
    classify_asset.py
    sync_external_source.py
  mcp/
    server.py
    tools.py
  cli/
    atlas.py
```

### 18.2 Processing pipeline

```text
File/source event
  -> create asset shell record
  -> compute hash
  -> detect duplicate
  -> extract metadata
  -> generate thumbnail
  -> extract preview text
  -> generate embedding if enabled
  -> run classification suggestions if enabled
  -> create inbox item or auto-assign
  -> emit atlas_event
```

### 18.3 Coverage calculation

```text
For each BOM slot:
  required? yes/no
  assigned assets count
  assigned assets status
  canonical asset exists?
  staleness threshold exceeded?
  confidence threshold met?
  human review required?

Slot status rules:
  if not_applicable: N/A
  elif no assigned assets and required: missing
  elif assigned assets stale: stale
  elif assignment suggested only: partial
  elif assigned asset status in raw/candidate: in_progress
  elif assigned asset status selected/canonical and review satisfied: complete

Coverage score:
  required_complete / required_total weighted by priority
  optional coverage tracked separately
  stale assets subtract confidence points
```

### 18.4 AI-assisted classification

Classification model inputs:

- Filename.
- File extension / MIME type.
- Source kind.
- Parent folder.
- OCR/text extract.
- Image caption/preview summary.
- Existing project topics/features/nodes.
- Active BOM slots and artifact type guidance.
- User prior classification patterns.

Outputs:

```yaml
classification_suggestion:
  asset_id: string
  project_id: string
  topic_id: string|null
  feature_id: string|null
  intenttree_node_id: string|null
  artifact_type_id: string|null
  bom_slot_id: string|null
  status: raw|candidate|in_progress
  sensitivity: public|personal|work_sensitive|client_sensitive|restricted
  confidence: float
  rationale: string
  conflicts: [string]
```

MVP can use local heuristics first:

- Folder name and project alias.
- File type and naming convention.
- Source app.
- Template artifact type accepted file types.
- Existing tags.

AI classification can be opt-in.

## 19. Security, governance, and trust

### 19.1 Sensitivity labels

| Label | Meaning | Agent access default |
|---|---|---|
| Public | Safe to share externally | preview/read allowed |
| Personal | Personal but low risk | preview allowed |
| Work Sensitive | Work-related sensitive information | metadata/preview only |
| Client Sensitive | Client or customer material | metadata only unless approved |
| Restricted | Highly sensitive | no agent access by default |

### 19.2 Agent access policy

```yaml
agent_access_policy:
  asset_id: asset_123
  classification: work_sensitive
  allowed_agent_groups:
    - trusted_local_agents
  allow_metadata: true
  allow_preview: true
  allow_full_content: false
  allow_context_pack_inclusion: true
  require_human_approval_for_context_pack: true
  allow_training: false
  auto_redact: true
  retention_days: 365
```

### 19.3 Audit requirements

Audit events required for:

- Asset add/import.
- Asset delete/archive.
- Sensitivity changes.
- Agent access requests.
- Context pack publish.
- BOM template apply.
- Canonical promotion.
- External sync.
- Policy denial.

### 19.4 Human-in-the-loop rules

Human review required for:

- Canonical promotion.
- Publishing context pack with sensitive assets.
- Agent full-content access to work/client-sensitive assets.
- Applying templates that create many tasks or modify canonical BOM structure.
- Deleting assets or severing links to canonical artifacts.

## 20. MVP scope

### 20.1 MVP definition

The MVP proves:

1. A project can show all relevant assets across vault and external/local sources.
2. Assets can be classified into project/topic/node/artifact type.
3. A template can define expected artifact types.
4. A project BOM can show filled/missing slots.
5. Inbox assets can be assigned to BOM slots.
6. A context pack can be created for an IntentTree node.
7. Agents can retrieve context through a controlled CLI/MCP interface.

### 20.2 MVP feature set

| Feature | Included in MVP? |
|---|---|
| Project home | Yes |
| Asset library | Yes |
| Asset detail | Yes |
| Inbox triage | Yes |
| Basic IntentTree links | Yes |
| Artifact BOM overview | Yes |
| Apply template wizard | Yes, basic |
| BOM Builder | Light version |
| Inbox to BOM mapping | Yes |
| Coverage & Gaps | Basic |
| Context pack builder | Yes |
| CLI | Yes |
| MCP server | Yes, read + limited write suggestions |
| MeatyWiki sync | Yes, markdown/YAML |
| CCDash events | Basic event export |
| SkillMeat integration | Template/context-pack references only |
| Figma/Drive/GitHub APIs | Manual or basic link import |
| Enterprise RBAC/SSO | No |
| Browser extension | No |

### 20.3 MVP success criteria

- User can ingest 25 real ChatGPT image outputs and classify them in under 15 minutes.
- User can apply a template to an existing project and see missing artifacts.
- User can assign assets to slots via drag/drop or classification form.
- User can create a context pack from an IntentTree node in under 3 minutes.
- An agent can query assets for a node through MCP without filesystem-wide access.
- MeatyWiki can reference created asset cards or receive writeback notes.
- CCDash receives at least basic events for context pack creation and asset usage.

## 21. Implementation roadmap

### Phase 0 — Local schema and markdown registry

Duration: 1-2 weeks.

Deliverables:

- Asset YAML schema.
- Template/BOM YAML schema.
- MeatyWiki folder convention.
- CLI prototype for import/index/classify.
- Manual context pack manifest.
- Sample templates for Agentic OS, Architecture Initiative, GTM, Research.

### Phase 1 — Web app MVP

Duration: 4-6 weeks.

Deliverables:

- Next.js app shell.
- Project home.
- Asset gallery.
- Asset detail drawer/page.
- Inbox triage.
- File watcher worker.
- Thumbnail generation.
- Basic metadata search/filter.
- MeatyWiki sync.

### Phase 2 — Artifact BOM and templates

Duration: 4-6 weeks.

Deliverables:

- Template library.
- Apply templates wizard.
- Artifact BOM overview.
- BOM slot model.
- Inbox to BOM mapping.
- Basic coverage/gaps.
- Template Builder v0.

### Phase 3 — Context packs and agent interface

Duration: 3-5 weeks.

Deliverables:

- Context Pack Builder.
- Token/payload estimator.
- Policy envelope.
- CLI export.
- MCP server.
- Agent-safe asset retrieval.
- Control Plane integration stubs.

### Phase 4 — Intelligence and telemetry

Duration: 4-8 weeks.

Deliverables:

- AI-assisted classification.
- Semantic search.
- Duplicate/variant detection.
- CCDash event integration.
- Context pack performance feedback.
- Staleness and gap recommendations.

### Phase 5 — Enterprise hardening

Duration: later.

Deliverables:

- RBAC/ABAC.
- SSO/OIDC.
- External connectors.
- Audit reporting.
- Approval workflows.
- Hosted deployment.
- Multi-workspace administration.

## 22. Engineering backlog

### 22.1 Epics

| Epic | Description |
|---|---|
| E1: Asset Registry | Core asset model, ingest, metadata, links, thumbnails. |
| E2: Project Shell | App shell, project home, navigation, search, filters. |
| E3: Inbox & Triage | Capture workflow, classification forms, bulk actions. |
| E4: IntentTree Linkage | Node search, node context view, asset-node relationships. |
| E5: Artifact BOM | Template apply, BOM slots, coverage, drag/drop assignment. |
| E6: Template Builder | Reusable project templates and artifact type library. |
| E7: Context Packs | Pack builder, manifests, policy, publish/export. |
| E8: Agent Gateway | MCP tools, CLI, policy-aware retrieval. |
| E9: Integrations | MeatyWiki, local vault, GitHub/Drive/Figma stubs. |
| E10: Governance & Audit | Sensitivity, access policy, audit events. |
| E11: Telemetry | CCDash event export and usage metrics. |
| E12: Search & Intelligence | Full-text search, semantic search, classification suggestions. |

### 22.2 First sprint backlog

1. Create database schema for projects, assets, links, templates, BOM slots.
2. Implement local file import endpoint.
3. Implement thumbnail generation for images and PDFs.
4. Implement project asset gallery.
5. Implement asset detail drawer.
6. Implement watched-folder CLI proof of concept.
7. Implement basic Artifact BOM schema and seed template.
8. Implement slot assignment via API.
9. Implement MeatyWiki asset card export.
10. Implement `atlas bom status` CLI command.

## 23. Deployment models

### 23.1 Local-first personal mode

```text
Tauri/desktop or localhost web app
SQLite metadata
Local filesystem storage
Watched local folders
Markdown/YAML sync to MeatyWiki
Local MCP server
No external model calls by default
```

Best for the initial personal Agentic OS workflow.

### 23.2 Homelab/server mode

```text
Docker Compose
Postgres + pgvector
MinIO or local object storage
FastAPI API
Next.js app
Redis worker queue
Local network MCP server
Optional external connectors
```

Best for multi-device personal use and more reliable indexing.

### 23.3 Enterprise mode

```text
Kubernetes/OpenShift
Postgres/pgvector
S3-compatible object storage
OIDC/SSO
RBAC/ABAC
Audit logs
Connector workers
Policy service
Hosted MCP gateway
CCDash/SAM/Control Plane integrations
```

Best for team or customer deployment.

## 24. Observability and metrics

### 24.1 Product metrics

- Assets captured per week.
- Assets classified per week.
- Orphan asset count.
- Average time from capture to classification.
- BOM coverage score.
- Missing critical slots.
- Stale assets.
- Context packs created.
- Context packs reused.
- Agent queries served.
- Policy denials.

### 24.2 Quality metrics

- Classification acceptance rate.
- Auto-label precision/recall.
- Context pack usefulness score.
- Agent output rework after using pack.
- Canonical asset reuse count.
- Duplicate detection accuracy.
- Time-to-find asset.

### 24.3 CCDash event mapping

```yaml
ccdash_events:
  - event_type: context_pack_published
    metrics:
      token_estimate: integer
      asset_count: integer
      sensitive_asset_count: integer
      target_node_id: string
  - event_type: agent_used_asset
    metrics:
      asset_id: string
      task_node_id: string
      output_artifact_id: string|null
  - event_type: bom_gap_resolved
    metrics:
      slot_id: string
      time_open_days: number
      asset_status: string
```

## 25. Governance and policy model

### 25.1 Policy scopes

- Workspace policy.
- Project policy.
- Source/integration policy.
- Asset policy.
- Context pack policy.
- Agent/client policy.
- BOM/template policy.

### 25.2 Policy checks

Before agent retrieval:

1. Is the agent authenticated?
2. Is the agent allowed for this workspace/project?
3. Is the asset allowed for this agent group?
4. Is the requested include mode allowed?
5. Is the asset sensitive or restricted?
6. Is the asset included in an approved context pack?
7. Should metadata-only be returned instead?
8. Should an audit event be emitted?

### 25.3 Canonical promotion rules

To promote an asset to Canonical:

- Asset must have a project.
- Asset must have artifact type.
- Asset must have sensitivity classification.
- Asset must have source/provenance.
- Asset should be linked to at least one topic, node, or BOM slot.
- Human review should be recorded.
- Optional: previous canonical asset should be superseded, not deleted.

## 26. Data portability and file conventions

### 26.1 Local folder convention

```text
/ArtifactAtlas
  /config
    workspace.yaml
    integrations.yaml
  /assets
    /thumbnails
    /previews
  /exports
    /context-packs
    /reports
  /registry
    assets.jsonl
    projects.jsonl
    templates.jsonl
    bom.jsonl

/AI-Outputs
  /ChatGPT
  /Claude
  /Screenshots
  /Figma-Exports

/meatywiki
  /projects
  /assets
  /decisions
  /patterns
  /context-packs
```

### 26.2 Export formats

- Markdown asset cards.
- YAML context pack manifests.
- JSONL registry export.
- CSV coverage report.
- HTML static report.
- PDF report later.

## 27. Sample artifact templates

### 27.1 New Product / App

```yaml
template:
  id: tmpl_new_product_app_v1
  name: New Product / App
  domains:
    - name: Strategy
      slots:
        - artifact_type: Product Vision
          required: true
        - artifact_type: Positioning Statement
          required: true
        - artifact_type: Success Metrics
          required: true
    - name: Product
      slots:
        - artifact_type: PRD
          required: true
        - artifact_type: User Stories
          required: true
        - artifact_type: Acceptance Criteria
          required: true
    - name: Architecture
      slots:
        - artifact_type: System Architecture Diagram
          required: true
        - artifact_type: API Specification
          required: true
        - artifact_type: Data Model
          required: true
        - artifact_type: ADR Log
          required: false
    - name: Frontend Design
      slots:
        - artifact_type: User Flows
          required: true
        - artifact_type: Wireframes
          required: true
        - artifact_type: UI Mockups
          required: true
        - artifact_type: Design System
          required: false
    - name: GTM
      slots:
        - artifact_type: GTM Messaging Deck
          required: true
        - artifact_type: Launch Brief
          required: true
        - artifact_type: Sales One-Pager
          required: false
```

### 27.2 Architecture Initiative

```yaml
template:
  id: tmpl_architecture_initiative_v1
  name: Architecture Initiative
  domains:
    - name: Architecture
      slots:
        - artifact_type: Current State Architecture
          required: true
        - artifact_type: Target State Architecture
          required: true
        - artifact_type: Technology Stack
          required: true
        - artifact_type: Integration Diagram
          required: true
        - artifact_type: Security Architecture
          required: true
        - artifact_type: Deployment Topology
          required: false
        - artifact_type: ADR Log
          required: true
    - name: Governance
      slots:
        - artifact_type: Decision Log
          required: true
        - artifact_type: Risk Register
          required: true
        - artifact_type: Review Checklist
          required: false
```

### 27.3 Thought Leadership / GTM

```yaml
template:
  id: tmpl_gtm_thought_leadership_v1
  name: Thought Leadership / GTM
  domains:
    - name: Strategy
      slots:
        - artifact_type: Core Thesis
          required: true
        - artifact_type: Audience Definition
          required: true
    - name: Content
      slots:
        - artifact_type: Blog Outline
          required: true
        - artifact_type: LinkedIn Post Series
          required: true
        - artifact_type: Visual Concept
          required: true
    - name: Marketing
      slots:
        - artifact_type: Messaging Deck
          required: true
        - artifact_type: Landing Page Copy
          required: false
        - artifact_type: Sales One-Pager
          required: false
```

## 28. Open questions

1. Should Artifact Atlas be the public product name or an internal working name?
2. Should the MVP be pure web/local server, Tauri desktop, or both?
3. Should MeatyWiki asset cards be the canonical metadata store for personal mode, or should SQLite/Postgres always be canonical with Markdown export?
4. How much AI classification should happen locally vs through external models?
5. Should project templates live in Artifact Atlas, SkillMeat/SAM, or both?
6. What is the correct boundary between Artifact BOM and I-BOM?
7. Should BOM slots become IntentTree tasks automatically or only through explicit action?
8. What artifact status vocabulary should be canonical across MeatyWiki, SkillMeat, and CCDash?
9. How should files be handled when they move or external links break?
10. What is the minimum safe policy model for personal-agent access?

## 29. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Becomes another tool to maintain | User avoids using it | Inbox-first flow, auto-suggestions, low-friction capture, bulk edits |
| Schema over-complexity | Slows implementation | Start with asset/project/node/slot/status only; expand later |
| Too much manual tagging | Low adoption | Use drag/drop, watched folders, naming conventions, and AI suggestions |
| Agent access leaks sensitive context | Trust failure | Policy gate MCP/CLI, metadata-only defaults, audit logs |
| External tool integrations consume too much effort | MVP stalls | Start with file paths/URLs and local indexing; API connectors later |
| Visual UX becomes too dense | Hard to use | Multiple views, progressive disclosure, right drawers, saved filters |
| Templates feel rigid | Users avoid BOM | Allow optional slots, N/A, phase/domain scoping, multiple templates |
| AI classification is wrong | Misfiled assets | Confidence/rationale, review flow, undo, human approval |
| Duplicate sources of truth | Confusion | Clearly define MeatyWiki = why, Artifact Atlas = asset metadata/workflow, IntentTree = task hierarchy |

## 30. Acceptance criteria by release

### MVP acceptance

- Can create project and import assets.
- Can browse assets in gallery/table.
- Can open asset detail and edit metadata.
- Can link asset to IntentTree node manually.
- Can apply at least one template to create BOM slots.
- Can assign asset to BOM slot manually.
- Can view BOM coverage and missing slots.
- Can create context pack from node or selected assets.
- Can export asset cards/context pack to Markdown/YAML.
- Can serve at least read-only MCP tools for asset search and node context.

### v1 acceptance

- Can run AI-assisted classification.
- Can auto-suggest inbox-to-BOM mapping.
- Can use semantic search.
- Can version templates and context packs.
- Can emit CCDash events.
- Can sync with at least two external tools beyond local/MeatyWiki.
- Can enforce sensitivity labels and agent access policies.

## 31. Mockup inventory

The following mockups were generated as design references and should be used as visual direction, not literal final UI requirements.

| Mockup | File |
|---|---|
| Project Command Center | `artifact_atlas_command_center_interface.png` |
| Project Dashboard Variation | `modern_project_dashboard_overview.png` |
| Asset Library / Gallery | `asset_library_dashboard_interface_snapshot.png` |
| IntentTree Node Context | `artifact_atlas_dashboard_overview.png` |
| Feature Board | `feature_board_management_dashboard_design.png` |
| Asset Detail / Review | `artifact_atlas_dashboard_with_system_architecture.png` |
| Inbox / Capture & Triage | `modern_saas_dashboard_interface_design.png` |
| Context Pack Builder | `create_context_pack_dashboard_interface.png` |
| Artifact BOM Overview | `artifact_bom_project_dashboard_interface.png` |
| Apply Templates Wizard | `modern_saas_template_application_dashboard.png` |
| BOM Builder | `artifact_atlas_project_template_interface.png` |
| Inbox to BOM Mapping | `saas_ui_dashboard_with_inbox_mapping.png` |
| Coverage & Gaps | `coverage_and_gaps_dashboard_overview.png` |
| Template Library | `template_library_overview_dashboard.png` |

## 32. Suggested MeatyWiki updates

Create or update:

```text
/meatywiki/projects/artifact-atlas.md
/meatywiki/decisions/2026-06-17-artifact-atlas-as-meatywiki-companion.md
/meatywiki/patterns/artifact-bom-template-pattern.md
/meatywiki/patterns/agent-safe-asset-retrieval-pattern.md
/meatywiki/assets/artifact-atlas-mockups.md
/meatywiki/context-packs/artifact-atlas-builder-context-pack.yaml
```

## 33. Suggested next actions

1. Promote this document to a candidate MeatyWiki project artifact.
2. Create an ADR: “Artifact Atlas as MeatyWiki Companion Front End.”
3. Define the MVP schemas in JSON Schema or Pydantic.
4. Create a seed template pack for Agentic OS projects.
5. Implement local CLI import + asset registry first.
6. Build the Asset Library and Artifact BOM screens before advanced integrations.
7. Add MCP read-only asset search and node context tools.
8. Run a pilot on 25 real generated ChatGPT image outputs.

