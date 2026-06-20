/**
 * Template feature fixtures — used as fallback when API is unreachable.
 * Based on templates/new-product-app.yaml and templates/architecture-initiative.yaml
 */

import type { ArtifactTemplate } from "./types";

export const FIXTURE_TEMPLATES: ArtifactTemplate[] = [
  {
    id: "tmpl_new_product_app_v1",
    name: "New Product / App",
    description:
      "Full lifecycle template for product development: strategy, product, architecture, frontend design, and GTM.",
    status: "core",
    template_type: "product",
    is_custom: false,
    publish_status: "published",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    domains: [
      {
        name: "Strategy",
        slots: [
          { artifact_type: "Product Vision", required: true },
          { artifact_type: "Positioning Statement", required: true },
          { artifact_type: "Success Metrics", required: true },
        ],
      },
      {
        name: "Product",
        slots: [
          { artifact_type: "PRD", required: true },
          { artifact_type: "User Stories", required: true },
          { artifact_type: "Acceptance Criteria", required: true },
        ],
      },
      {
        name: "Architecture",
        slots: [
          { artifact_type: "System Architecture Diagram", required: true },
          { artifact_type: "API Specification", required: true },
          { artifact_type: "Data Model", required: true },
          { artifact_type: "ADR Log", required: false },
        ],
      },
      {
        name: "Frontend Design",
        slots: [
          { artifact_type: "User Flows", required: true },
          { artifact_type: "Wireframes", required: true },
          { artifact_type: "UI Mockups", required: true },
          { artifact_type: "Design System", required: false },
        ],
      },
      {
        name: "GTM",
        slots: [
          { artifact_type: "GTM Messaging Deck", required: true },
          { artifact_type: "Launch Brief", required: true },
          { artifact_type: "Sales One-Pager", required: false },
        ],
      },
    ],
  },
  {
    id: "tmpl_architecture_initiative_v1",
    name: "Architecture Initiative",
    description:
      "Structured template for architecture decisions, governance, and documentation.",
    status: "recommended",
    template_type: "architecture",
    is_custom: false,
    publish_status: "published",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-06-10T00:00:00Z",
    domains: [
      {
        name: "Architecture",
        slots: [
          { artifact_type: "Current State Architecture", required: true },
          { artifact_type: "Target State Architecture", required: true },
          { artifact_type: "Technology Stack", required: true },
          { artifact_type: "Integration Diagram", required: true },
          { artifact_type: "Security Architecture", required: true },
          { artifact_type: "Deployment Topology", required: false },
          { artifact_type: "ADR Log", required: true },
        ],
      },
      {
        name: "Governance",
        slots: [
          { artifact_type: "Decision Log", required: true },
          { artifact_type: "Risk Register", required: true },
          { artifact_type: "Review Checklist", required: false },
        ],
      },
    ],
  },
  {
    id: "tmpl_research_initiative_v1",
    name: "Research Initiative",
    description:
      "Research planning template covering discovery, synthesis, and reporting artifacts.",
    status: "optional",
    template_type: "research",
    is_custom: false,
    publish_status: "published",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
    domains: [
      {
        name: "Discovery",
        slots: [
          { artifact_type: "Research Brief", required: true },
          { artifact_type: "Interview Guide", required: true },
          { artifact_type: "Participant Screener", required: false },
        ],
      },
      {
        name: "Synthesis",
        slots: [
          { artifact_type: "Research Notes", required: true },
          { artifact_type: "Affinity Map", required: false },
          { artifact_type: "Key Findings", required: true },
        ],
      },
      {
        name: "Reporting",
        slots: [
          { artifact_type: "Research Report", required: true },
          { artifact_type: "Executive Summary", required: true },
          { artifact_type: "Recommendation Deck", required: false },
        ],
      },
    ],
  },
];

export function getTemplatePreview(t: ArtifactTemplate) {
  const required = t.domains.flatMap((d) => d.slots).filter((s) => s.required).length;
  const optional = t.domains.flatMap((d) => d.slots).filter((s) => !s.required).length;
  return {
    template_id: t.id,
    domain_count: t.domains.length,
    required_slot_count: required,
    optional_slot_count: optional,
    total_slot_count: required + optional,
    domains: t.domains.map((d) => ({
      name: d.name,
      required: d.slots.filter((s) => s.required).length,
      optional: d.slots.filter((s) => !s.required).length,
    })),
  };
}
