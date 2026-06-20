/**
 * Template feature-local types.
 * These extend the shared types in web/lib/types.ts for template UI logic.
 */

import type { TemplateStatus, TemplateType } from "@/lib/types";

// ============================================================
// Seed template slot (from YAML)
// ============================================================

export interface ArtifactTemplateSlot {
  artifact_type: string;
  required: boolean;
  guidance?: string | null;
  staleness_days?: number | null;
  min_count?: number | null;
}

// ============================================================
// Template domain (group of slots within a template)
// ============================================================

export interface ArtifactTemplateDomain {
  name: string;
  slots: ArtifactTemplateSlot[];
}

// ============================================================
// Artifact template (reusable definition)
// ============================================================

export interface ArtifactTemplate {
  id: string;
  name: string;
  description?: string | null;
  status: TemplateStatus;
  template_type?: TemplateType | null;
  domains: ArtifactTemplateDomain[];
  created_at?: string | null;
  updated_at?: string | null;
  /** Whether this template is user-built (draft/published) */
  is_custom?: boolean;
  /** Draft vs published for builder-created templates */
  publish_status?: "draft" | "published";
}

// ============================================================
// Template preview (lightweight, before apply)
// ============================================================

export interface TemplatePreview {
  template_id: string;
  domain_count: number;
  required_slot_count: number;
  optional_slot_count: number;
  total_slot_count: number;
  domains: Array<{
    name: string;
    required: number;
    optional: number;
  }>;
}

// ============================================================
// Apply wizard state machine
// ============================================================

export type WizardStep = "choose" | "configure" | "review" | "applying" | "done";

export interface MergeConflict {
  existing_slot_name: string;
  existing_slot_id: string;
  incoming_artifact_type: string;
  domain: string;
}

export interface ApplyWizardState {
  step: WizardStep;
  selectedTemplateId: string | null;
  mergeMode: "skip_existing" | "overwrite_existing" | "rename_conflict";
  conflicts: MergeConflict[];
  previewedTemplate: ArtifactTemplate | null;
  isApplying: boolean;
  error: string | null;
}

// ============================================================
// Builder canvas types
// ============================================================

export interface BuilderSlot {
  id: string; // local canvas id
  artifact_type: string;
  required: boolean;
  guidance: string;
  staleness_days: number | null;
  min_count: number | null;
}

export interface BuilderDomain {
  id: string; // local canvas id
  name: string;
  slots: BuilderSlot[];
}

export interface BuilderTemplate {
  id: string | null; // null = new unsaved
  name: string;
  description: string;
  template_type: TemplateType;
  publish_status: "draft" | "published";
  domains: BuilderDomain[];
}

export type BuilderSelection =
  | { kind: "domain"; domainId: string }
  | { kind: "slot"; domainId: string; slotId: string }
  | null;

// ============================================================
// Filter state for library
// ============================================================

export interface TemplateLibraryFilters {
  q: string;
  status: TemplateStatus | "all";
  type: TemplateType | "all";
  domainFilter: string;
}
