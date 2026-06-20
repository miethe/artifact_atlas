/**
 * Demo fixtures for IntentTree node context — no backend required.
 * Shapes are intentionally minimal; expand when backend provides real nodes.
 */

export interface IntentNode {
  id: string;
  title: string;
  description?: string | null;
  status: "active" | "blocked" | "complete" | "draft";
  node_type: "intent" | "task" | "milestone" | "decision";
  project_id: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface NodeLinkedEntity {
  id: string;
  kind: "asset" | "context_pack" | "meatywiki_page" | "bom_slot";
  label: string;
  status?: string;
  href?: string;
}

export interface NodeAgentAction {
  id: string;
  label: string;
  description: string;
  icon_hint: "search" | "document" | "agent" | "export";
  disabled?: boolean;
}

export const DEMO_NODES: IntentNode[] = [
  {
    id: "node_phase2_web_shell",
    title: "Phase 2: Web Shell & Asset Workflows",
    description:
      "Turn the static shell into the primary usable web app: command center, asset library, inbox, board, and node context scaffold.",
    status: "active",
    node_type: "task",
    project_id: "proj_artifact_atlas",
    parent_id: "node_artifact_atlas_root",
    created_at: "2026-06-18T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
    metadata: { stage: "2C", agents: ["ui-engineer-enhanced", "frontend-developer"] },
  },
  {
    id: "node_artifact_atlas_root",
    title: "Artifact Atlas — Root Intent",
    description:
      "Build the asset graph, Artifact BOM, and context-pack builder described in the spec package.",
    status: "active",
    node_type: "intent",
    project_id: "proj_artifact_atlas",
    parent_id: null,
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
    metadata: {},
  },
  {
    id: "node_aos_api_gateway",
    title: "AOS MCP API Gateway",
    description:
      "Expose read-first MCP tools plus CLI commands for agent access to Artifact Atlas.",
    status: "draft",
    node_type: "milestone",
    project_id: "proj_agentic_os",
    parent_id: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-06-10T00:00:00Z",
    metadata: {},
  },
];

export const DEMO_NODE_LINKED_ENTITIES: Record<string, NodeLinkedEntity[]> = {
  node_phase2_web_shell: [
    {
      id: "asset_phase2_impl_plan",
      kind: "asset",
      label: "Phase 2 Implementation Plan",
      status: "canonical",
    },
    {
      id: "asset_prd_uiux_spec_v0_1",
      kind: "asset",
      label: "Artifact Atlas PRD UIUX Spec",
      status: "candidate",
    },
    {
      id: "cp_atlas_mvp",
      kind: "context_pack",
      label: "Artifact Atlas MVP Context Pack",
      status: "draft",
    },
  ],
  node_artifact_atlas_root: [
    {
      id: "asset_openapi_yaml",
      kind: "asset",
      label: "OpenAPI Contract (Phase 0)",
      status: "canonical",
    },
    {
      id: "cp_atlas_mvp",
      kind: "context_pack",
      label: "Artifact Atlas MVP Context Pack",
      status: "draft",
    },
  ],
  node_aos_api_gateway: [
    {
      id: "asset_aos_arch_diagram",
      kind: "asset",
      label: "AOS Architecture Diagram v3",
      status: "canonical",
    },
  ],
};

export const DEMO_NODE_AGENT_ACTIONS: NodeAgentAction[] = [
  {
    id: "action_build_context_pack",
    label: "Build Context Pack",
    description: "Assemble a context pack from linked assets for agent handoff.",
    icon_hint: "export",
  },
  {
    id: "action_find_missing_context",
    label: "Find Missing Context",
    description: "Run an agent scan to identify gaps in linked assets and documentation.",
    icon_hint: "search",
  },
  {
    id: "action_generate_summary",
    label: "Generate Summary",
    description: "Ask an agent to summarize linked assets and current node status.",
    icon_hint: "agent",
  },
  {
    id: "action_export_bom",
    label: "Export BOM Slot List",
    description: "Export BOM slot requirements for this node as a markdown checklist.",
    icon_hint: "document",
    disabled: true,
  },
];

export function getDemoNode(nodeId: string): IntentNode | undefined {
  return DEMO_NODES.find((n) => n.id === nodeId) ?? DEMO_NODES[0];
}

export function getDemoLinkedEntities(nodeId: string): NodeLinkedEntity[] {
  return DEMO_NODE_LINKED_ENTITIES[nodeId] ?? DEMO_NODE_LINKED_ENTITIES["node_phase2_web_shell"] ?? [];
}
