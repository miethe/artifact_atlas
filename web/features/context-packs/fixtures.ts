/**
 * Context pack feature fixtures — used when API is unreachable.
 */

import type { ContextPack } from "@/lib/types";

export const FIXTURE_CONTEXT_PACKS: ContextPack[] = [
  {
    id: "cp-001",
    project_id: "artifact-atlas",
    name: "Builder Agent Context",
    description: "Context pack for the Artifact Atlas builder workflow.",
    status: "published",
    audience: "engineering_agent",
    target_type: "project",
    target_id: "artifact-atlas",
    item_count: 7,
    created_at: new Date(Date.now() - 86400_000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400_000).toISOString(),
  },
  {
    id: "cp-002",
    project_id: "artifact-atlas",
    name: "Research Snapshot — Phase 3",
    description: "Coverage gaps, BOM slots, and template refs for research phase.",
    status: "draft",
    audience: "research_agent",
    target_type: "project",
    target_id: "artifact-atlas",
    item_count: 3,
    created_at: new Date(Date.now() - 86400_000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "cp-003",
    project_id: "artifact-atlas",
    name: "Operating System Context",
    description: "AOS node context, linked assets, and MeatyWiki refs.",
    status: "ready",
    audience: "agent",
    target_type: "intenttree_node",
    target_id: "node-agentic-os",
    item_count: 12,
    created_at: new Date(Date.now() - 86400_000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400_000 * 2).toISOString(),
  },
];
