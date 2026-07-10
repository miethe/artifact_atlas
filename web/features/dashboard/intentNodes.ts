/**
 * IntentTree node fixtures shared by the command center KPI row and the
 * Active IntentTree Nodes panel (single source so counts always agree).
 *
 * Phase 1 does not expose an IntentTree node-list endpoint; when one lands,
 * replace this module with a query hook and keep the exported shape.
 */

export interface IntentNode {
  id: string;
  /** Short display code, e.g. "IT-102" */
  code: string;
  title: string;
  subtitle?: string;
  status: "active" | "blocked" | "pending" | "review" | "planned" | "completed";
  depth: number;
  task_count: number;
}

export const FIXTURE_INTENT_NODES: IntentNode[] = [
  {
    id: "node_phase2_ui",
    code: "IT-102",
    title: "Phase 2: Web Shell & Asset Workflows",
    subtitle: "Build the core shell, asset library, and workflows",
    status: "active",
    depth: 1,
    task_count: 4,
  },
  {
    id: "node_stage2a",
    code: "IT-117",
    title: "Stage 2A — Project Command Center",
    subtitle: "Dashboard panels, KPI row, MeatyWiki sync",
    status: "review",
    depth: 2,
    task_count: 2,
  },
  {
    id: "node_api_contract",
    code: "IT-128",
    title: "API Contract (Phase 0)",
    subtitle: "OpenAPI parity and route stubs",
    status: "completed",
    depth: 1,
    task_count: 1,
  },
  {
    id: "node_projects_surface",
    code: "IT-143",
    title: "Projects Surface & BOM",
    subtitle: "Projects index, command center polish, BOM builder",
    status: "active",
    depth: 1,
    task_count: 3,
  },
  {
    id: "node_governance",
    code: "IT-156",
    title: "Governance & Safety",
    subtitle: "Policies, guardrails, and auditability",
    status: "planned",
    depth: 1,
    task_count: 1,
  },
];

/** Nodes shown as "active" in the panel (everything not completed). */
export function activeIntentNodes(): IntentNode[] {
  return FIXTURE_INTENT_NODES.filter((n) => n.status !== "completed");
}

/** Total linked nodes for the KPI card. */
export function linkedIntentNodeCount(): number {
  return FIXTURE_INTENT_NODES.length;
}
