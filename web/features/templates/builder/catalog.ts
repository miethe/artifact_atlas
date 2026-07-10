/**
 * BOM Builder — artifact type catalog for the Artifact Library palette (WS-5).
 *
 * Grouped per the BOM Builder mockup (Strategy & Discovery / Architecture &
 * Design / Implementation / Research & Validation). IDs are slug-style
 * artifact_type_id values matching the seed templates' YAML vocabulary.
 * Types discovered from loaded templates are merged in at runtime
 * (see useArtifactTypeCatalog).
 */

export interface ArtifactTypeEntry {
  id: string;
  label: string;
}

export interface ArtifactTypeGroup {
  group: string;
  types: ArtifactTypeEntry[];
}

export const ARTIFACT_TYPE_CATALOG: ArtifactTypeGroup[] = [
  {
    group: "Strategy & Discovery",
    types: [
      { id: "prd", label: "Product Requirements Doc (PRD)" },
      { id: "competitive_analysis", label: "Competitive Analysis" },
      { id: "messaging_matrix", label: "Messaging Matrix" },
      { id: "launch_brief", label: "Launch Brief" },
      { id: "success_metrics", label: "Success Metrics" },
    ],
  },
  {
    group: "Architecture & Design",
    types: [
      { id: "architecture_diagram", label: "Architecture Diagram" },
      { id: "api_specification", label: "API Specification" },
      { id: "data_model", label: "Data Model" },
      { id: "wireframes", label: "Wireframes" },
      { id: "ui_mockups", label: "UI Mockups" },
      { id: "component_library", label: "Component Library" },
      { id: "design_system", label: "Design System" },
    ],
  },
  {
    group: "Implementation",
    types: [
      { id: "technical_specification", label: "Technical Specification" },
      { id: "integration_plan", label: "Integration Plan" },
      { id: "test_plan", label: "Test Plan" },
      { id: "runbook", label: "Runbook" },
      { id: "deployment_topology", label: "Deployment Topology" },
    ],
  },
  {
    group: "Research & Validation",
    types: [
      { id: "user_research_report", label: "User Research Report" },
      { id: "usability_findings", label: "Usability Findings" },
      { id: "usability_test_report", label: "Usability Test Report" },
    ],
  },
];
