/**
 * IntentTree node fixtures shared by the command center KPI row and the
 * Active IntentTree Nodes panel (single source so counts always agree).
 *
 * Phase 1 does not expose an IntentTree node-list endpoint; when one lands,
 * replace this module with a query hook and keep the exported shape.
 * Fixtures are returned ONLY in demo builds (NEXT_PUBLIC_ATLAS_DEMO_DATA=1).
 */

import { demoOnly } from "@/lib/demoData";

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

/**
 * All linked nodes, or `null` when there is no live IntentTree source.
 * Atlas has no IntentTree node feed yet, so outside a demo build this is
 * always `null` and callers must render "not connected", never fixtures.
 */
export function linkedIntentNodes(): IntentNode[] | null {
  return demoOnly(() => FIXTURE_INTENT_NODES);
}

/** Nodes shown as "active" in the panel (everything not completed), or null. */
export function activeIntentNodes(): IntentNode[] | null {
  const nodes = linkedIntentNodes();
  return nodes ? nodes.filter((n) => n.status !== "completed") : null;
}

/** Total linked nodes for the KPI card, or null when not connected. */
export function linkedIntentNodeCount(): number | null {
  const nodes = linkedIntentNodes();
  return nodes ? nodes.length : null;
}
