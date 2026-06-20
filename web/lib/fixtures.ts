/**
 * Demo fixtures derived from registry/*.jsonl shapes.
 * Used as fallback when the backend is unreachable.
 * These reflect the real data in the registry files.
 */

import type {
  Asset,
  AuditEvent,
  Bom,
  BomSlot,
  ContextPack,
  CursorPage,
  DashboardStats,
  InboxItem,
  IntegrationStatus,
  Project,
} from "./types";

// ============================================================
// Projects
// ============================================================

export const FIXTURE_PROJECTS: Project[] = [
  {
    id: "proj_artifact_atlas",
    workspace_id: "ws_artifact_atlas_local",
    name: "Artifact Atlas",
    slug: "artifact-atlas",
    status: "active",
    description: "Asset graph, Artifact BOM, and context-pack builder for the Agentic OS.",
    meatywiki_page_ref: "meatywiki/projects/artifact-atlas.md",
    intent_id: null,
    root_intenttree_node_id: null,
    created_at: "2026-06-17T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
  {
    id: "proj_agentic_os",
    workspace_id: "ws_artifact_atlas_local",
    name: "Agentic OS",
    slug: "agentic-os",
    status: "active",
    description: "Persistent AI agent operating system with CLI, APIs, and orchestration.",
    meatywiki_page_ref: "meatywiki/projects/agentic-os.md",
    intent_id: null,
    root_intenttree_node_id: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-06-18T00:00:00Z",
  },
  {
    id: "proj_skillmeat",
    workspace_id: "ws_artifact_atlas_local",
    name: "SkillMeat",
    slug: "skillmeat",
    status: "active",
    description: "Reusable skill library and Golden Context Pack system.",
    meatywiki_page_ref: null,
    intent_id: null,
    root_intenttree_node_id: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
];

export function fixtureProjectsPage(): CursorPage<Project> {
  return {
    items: FIXTURE_PROJECTS,
    has_more: false,
    next_cursor: null,
    total: FIXTURE_PROJECTS.length,
  };
}

// ============================================================
// Assets
// ============================================================

export const FIXTURE_ASSETS: Asset[] = [
  {
    id: "asset_prd_uiux_spec_v0_1",
    workspace_id: "ws_artifact_atlas_local",
    project_id: "proj_artifact_atlas",
    title: "Artifact Atlas PRD UIUX Implementation Spec",
    description: "Full product requirements and implementation spec for the Artifact Atlas web app.",
    artifact_type_id: "artifact_type_prd",
    source_kind: "local",
    uri: "file:///Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md",
    mime_type: "text/markdown",
    size_bytes: 182000,
    status: "candidate",
    sensitivity: "personal",
    agent_access: "read_allowed",
    generated_by: "human",
    captured_at: "2026-06-17T10:00:00Z",
    metadata: { system_of_record: "MeatyWiki", created_at: "2026-06-17" },
  },
  {
    id: "asset_phase2_impl_plan",
    workspace_id: "ws_artifact_atlas_local",
    project_id: "proj_artifact_atlas",
    title: "Phase 2: Web Shell & Asset Workflows Implementation Plan",
    description: "Detailed task breakdown for Phase 2 frontend implementation.",
    artifact_type_id: "artifact_type_plan",
    source_kind: "local",
    uri: "file:///docs/project_plans/implementation_plans/features/artifact-atlas-app-completion-v1/phase-2-web-shell-asset-workflows.md",
    mime_type: "text/markdown",
    size_bytes: 8500,
    status: "canonical",
    sensitivity: "personal",
    agent_access: "read_allowed",
    generated_by: "agent",
    captured_at: "2026-06-18T09:00:00Z",
    metadata: {},
  },
  {
    id: "asset_openapi_yaml",
    workspace_id: "ws_artifact_atlas_local",
    project_id: "proj_artifact_atlas",
    title: "Artifact Atlas OpenAPI Contract (Phase 0)",
    description: "Frozen API contract: 39 paths, 70 schemas.",
    artifact_type_id: "artifact_type_api_spec",
    source_kind: "local",
    uri: "file:///shared/openapi.yaml",
    mime_type: "text/yaml",
    size_bytes: 65000,
    status: "canonical",
    sensitivity: "personal",
    agent_access: "context_pack_allowed",
    generated_by: "agent",
    captured_at: "2026-06-15T00:00:00Z",
    metadata: { version: "0.2.0" },
  },
  {
    id: "asset_cmd_center_mockup",
    workspace_id: "ws_artifact_atlas_local",
    project_id: "proj_artifact_atlas",
    title: "Command Center Interface Mockup",
    description: "PNG mockup of the project command center dashboard.",
    artifact_type_id: "artifact_type_mockup",
    source_kind: "local",
    uri: "file:///assets/artifact_atlas_command_center_interface.png",
    mime_type: "image/png",
    status: "selected",
    sensitivity: "personal",
    agent_access: "preview_allowed",
    generated_by: "agent",
    captured_at: "2026-06-16T00:00:00Z",
    metadata: {},
  },
  {
    id: "asset_aos_arch_diagram",
    workspace_id: "ws_artifact_atlas_local",
    project_id: "proj_agentic_os",
    title: "AOS Architecture Diagram v3",
    description: "System architecture overview for the Agentic OS stack.",
    artifact_type_id: "artifact_type_architecture",
    source_kind: "claude",
    uri: "file:///AI-Outputs/ChatGPT/aos_architecture_v3.png",
    mime_type: "image/png",
    status: "canonical",
    sensitivity: "work_sensitive",
    agent_access: "preview_allowed",
    generated_by: "agent",
    captured_at: "2026-05-20T00:00:00Z",
    metadata: {},
  },
  {
    id: "asset_inbox_screenshot",
    workspace_id: "ws_artifact_atlas_local",
    project_id: "proj_artifact_atlas",
    title: "Modern SaaS Dashboard Interface Screenshot",
    description: "Reference screenshot for inbox/triage UI patterns.",
    artifact_type_id: "artifact_type_reference",
    source_kind: "url",
    uri: "https://example.com/saas-dashboard.png",
    mime_type: "image/png",
    status: "inbox",
    sensitivity: "public",
    agent_access: "read_allowed",
    generated_by: null,
    captured_at: "2026-06-20T08:30:00Z",
    metadata: {},
  },
  {
    id: "asset_context_pack_template",
    workspace_id: "ws_artifact_atlas_local",
    project_id: "proj_artifact_atlas",
    title: "Agent Context Pack — Artifact Atlas MVP",
    description: "Context pack bundling key docs for agent handoff.",
    artifact_type_id: "artifact_type_context_pack",
    source_kind: "local",
    uri: "file:///exports/context_pack_artifact_atlas_mvp.yaml",
    mime_type: "text/yaml",
    status: "raw",
    sensitivity: "personal",
    agent_access: "context_pack_allowed",
    generated_by: "agent",
    captured_at: "2026-06-19T15:00:00Z",
    metadata: {},
  },
];

export function fixtureAssetsPage(projectId?: string): CursorPage<Asset> {
  const items = projectId
    ? FIXTURE_ASSETS.filter((a) => a.project_id === projectId)
    : FIXTURE_ASSETS;
  return {
    items,
    has_more: false,
    next_cursor: null,
    total: items.length,
  };
}

// ============================================================
// Inbox Items
// ============================================================

export const FIXTURE_INBOX_ITEMS: InboxItem[] = [
  {
    id: "asset_inbox_screenshot",
    title: "Modern SaaS Dashboard Interface Screenshot",
    source_kind: "url",
    uri: "https://example.com/saas-dashboard.png",
    status: "inbox",
    sensitivity: "public",
    agent_access: "read_allowed",
    mime_type: "image/png",
    captured_at: "2026-06-20T08:30:00Z",
    suggested_artifact_type_id: "artifact_type_reference",
    suggested_intenttree_node_id: null,
  },
  {
    id: "inbox_draft_notes_001",
    title: "Phase 3 Planning Notes — Draft",
    source_kind: "manual",
    uri: "file:///tmp/phase3-notes.md",
    status: "raw",
    sensitivity: "personal",
    agent_access: "metadata_only",
    mime_type: "text/markdown",
    captured_at: "2026-06-20T07:15:00Z",
    suggested_artifact_type_id: "artifact_type_plan",
    suggested_intenttree_node_id: null,
  },
];

export function fixtureInboxPage(projectId?: string): CursorPage<InboxItem> {
  void projectId;
  return {
    items: FIXTURE_INBOX_ITEMS,
    has_more: false,
    next_cursor: null,
    total: FIXTURE_INBOX_ITEMS.length,
  };
}

// ============================================================
// BOM
// ============================================================

export const FIXTURE_BOM_SLOTS: BomSlot[] = [
  {
    id: "slot_prd",
    bom_id: "bom_artifact_atlas_mvp",
    name: "Product Requirements Document",
    artifact_type_id: "artifact_type_prd",
    phase: "discovery",
    required: true,
    status: "complete",
    assignment_count: 1,
    domain: "product",
  },
  {
    id: "slot_openapi",
    bom_id: "bom_artifact_atlas_mvp",
    name: "API Contract",
    artifact_type_id: "artifact_type_api_spec",
    phase: "design",
    required: true,
    status: "complete",
    assignment_count: 1,
    domain: "engineering",
  },
  {
    id: "slot_architecture",
    bom_id: "bom_artifact_atlas_mvp",
    name: "Architecture Diagram",
    artifact_type_id: "artifact_type_architecture",
    phase: "design",
    required: true,
    status: "partial",
    assignment_count: 0,
    domain: "engineering",
  },
  {
    id: "slot_test_plan",
    bom_id: "bom_artifact_atlas_mvp",
    name: "Test Plan",
    artifact_type_id: "artifact_type_test_plan",
    phase: "build",
    required: true,
    status: "missing",
    assignment_count: 0,
    domain: "qa",
  },
  {
    id: "slot_deploy_runbook",
    bom_id: "bom_artifact_atlas_mvp",
    name: "Deployment Runbook",
    artifact_type_id: "artifact_type_runbook",
    phase: "launch",
    required: false,
    status: "missing",
    assignment_count: 0,
    domain: "operations",
  },
];

export const FIXTURE_BOM: Bom = {
  id: "bom_artifact_atlas_mvp",
  project_id: "proj_artifact_atlas",
  name: "Artifact Atlas MVP BOM",
  status: "active",
  source_templates: ["tmpl_new_product_app_v1", "tmpl_architecture_initiative_v1"],
  coverage_score: 0.4,
  slots: FIXTURE_BOM_SLOTS,
};

// ============================================================
// Context Packs
// ============================================================

export const FIXTURE_CONTEXT_PACKS: ContextPack[] = [
  {
    id: "pack_artifact_atlas_mvp_v1",
    project_id: "proj_artifact_atlas",
    name: "Artifact Atlas MVP Context Pack",
    description: "Key docs for agent handoff on the MVP implementation.",
    status: "draft",
    audience: "agent",
    target_type: "project",
    target_id: "proj_artifact_atlas",
    item_count: 3,
    created_at: "2026-06-19T15:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
];

export function fixtureContextPacksPage(projectId?: string): CursorPage<ContextPack> {
  const items = projectId
    ? FIXTURE_CONTEXT_PACKS.filter((p) => p.project_id === projectId)
    : FIXTURE_CONTEXT_PACKS;
  return {
    items,
    has_more: false,
    next_cursor: null,
    total: items.length,
  };
}

// ============================================================
// Dashboard
// ============================================================

export const FIXTURE_DASHBOARD: DashboardStats = {
  total_assets: FIXTURE_ASSETS.length,
  assets_by_status: {
    inbox: 1,
    raw: 1,
    candidate: 1,
    selected: 1,
    canonical: 3,
  },
  bom_coverage_pct: 40,
  inbox_count: 2,
  canonical_count: 3,
  context_pack_count: 1,
  recent_activity: [],
};

// ============================================================
// Integrations
// ============================================================

export const FIXTURE_INTEGRATIONS: IntegrationStatus[] = [
  {
    id: "meatywiki",
    name: "MeatyWiki",
    enabled: true,
    last_sync_at: "2026-06-20T06:00:00Z",
    status: "connected",
  },
  {
    id: "ccdash",
    name: "CCDash",
    enabled: true,
    last_sync_at: "2026-06-20T05:45:00Z",
    status: "connected",
  },
  {
    id: "intenttree",
    name: "IntentTree",
    enabled: false,
    last_sync_at: null,
    status: "disconnected",
  },
];

// ============================================================
// Audit Events
// ============================================================

export const FIXTURE_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "evt_001",
    event_type: "asset_added",
    actor_type: "user",
    actor_id: "miethe",
    project_id: "proj_artifact_atlas",
    target_type: "asset",
    target_id: "asset_prd_uiux_spec_v0_1",
    detail: { title: "Artifact Atlas PRD UIUX Implementation Spec" },
    created_at: "2026-06-17T10:00:00Z",
  },
  {
    id: "evt_002",
    event_type: "asset_promoted",
    actor_type: "user",
    actor_id: "miethe",
    project_id: "proj_artifact_atlas",
    target_type: "asset",
    target_id: "asset_openapi_yaml",
    detail: { from: "selected", to: "canonical" },
    created_at: "2026-06-15T12:30:00Z",
  },
  {
    id: "evt_003",
    event_type: "context_pack_created",
    actor_type: "agent",
    actor_id: "ui-engineer-enhanced",
    project_id: "proj_artifact_atlas",
    target_type: "context_pack",
    target_id: "pack_artifact_atlas_mvp_v1",
    detail: {},
    created_at: "2026-06-19T15:00:00Z",
  },
];
