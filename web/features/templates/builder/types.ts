/**
 * BOM Builder (WS-5) — canvas types for the three-panel template editor.
 * Mirrors the backend TemplateDomainInput/TemplateSlotInput payloads.
 */

import type { SlotPhase, TemplateStatus, TemplateType } from "@/lib/types";

/** Phases shown as canvas columns (subset of SlotPhase per mockup). */
export const CANVAS_PHASES = ["discovery", "design", "build", "launch"] as const;
export type CanvasPhase = (typeof CANVAS_PHASES)[number];

export interface CanvasSlot {
  /** Local canvas key (not persisted). */
  key: string;
  /** Slug-style artifact type ID (persisted as artifact_type_id). */
  artifactTypeId: string;
  /** Human label. */
  label: string;
  phase: SlotPhase | null;
  required: boolean;
  acceptedFileTypes: string[];
  maxFileSizeMb: number | null;
  namingConvention: string;
  guidance: string;
  stalenessDays: number | null;
}

export interface CanvasDomain {
  /** Local canvas key (not persisted). */
  key: string;
  name: string;
  slots: CanvasSlot[];
}

export interface CanvasTemplate {
  id: string | null; // null = unsaved
  name: string;
  description: string;
  templateType: TemplateType;
  status: TemplateStatus;
  version: string;
  domains: CanvasDomain[];
}

export type CanvasSelection =
  | { kind: "slot"; domainKey: string; slotKey: string }
  | { kind: "domain"; domainKey: string }
  | null;

// ============================================================
// Backend payload shapes (feature-local; mirror shared/openapi.yaml)
// ============================================================

export interface TemplateSlotPayload {
  artifact_type_id: string;
  phase?: string | null;
  required: boolean;
  display_order: number;
  accepted_file_types?: string[] | null;
  max_file_size_mb?: number | null;
  naming_convention?: string | null;
  guidance?: string | null;
  staleness_days?: number | null;
}

export interface TemplateDomainPayload {
  name: string;
  display_order: number;
  slots: TemplateSlotPayload[];
}

export interface TemplateDetailResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  template_type: TemplateType;
  status: TemplateStatus;
  version: string;
  domains?: Array<{
    id: string;
    name: string;
    slug?: string;
    display_order?: number;
    slots?: Array<{
      id: string;
      artifact_type_id: string;
      phase?: string | null;
      required: boolean;
      display_order?: number;
      accepted_file_types?: string[] | null;
      max_file_size_mb?: number | null;
      naming_convention?: string | null;
      guidance?: string | null;
      staleness_days?: number | null;
    }> | null;
  }> | null;
}

// ============================================================
// Helpers
// ============================================================

let counter = 0;
export function canvasKey(): string {
  counter += 1;
  return `k${counter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function slugifyTypeId(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function humanizeTypeId(typeId: string): string {
  return typeId.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map a backend TemplateDetail into canvas state. */
export function detailToCanvas(detail: TemplateDetailResponse): CanvasTemplate {
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description ?? "",
    templateType: detail.template_type ?? "custom",
    status: detail.status ?? "experimental",
    version: detail.version ?? "1.0.0",
    domains: (detail.domains ?? []).map((d) => ({
      key: canvasKey(),
      name: d.name,
      slots: (d.slots ?? []).map((s) => ({
        key: canvasKey(),
        artifactTypeId: s.artifact_type_id,
        label: humanizeTypeId(s.artifact_type_id),
        phase: (s.phase as CanvasSlot["phase"]) ?? null,
        required: s.required,
        acceptedFileTypes: s.accepted_file_types ?? [],
        maxFileSizeMb: s.max_file_size_mb ?? null,
        namingConvention: s.naming_convention ?? "",
        guidance: s.guidance ?? "",
        stalenessDays: s.staleness_days ?? null,
      })),
    })),
  };
}

/** Map canvas state into the domains payload for POST/PATCH /api/templates. */
export function canvasToDomainsPayload(
  template: CanvasTemplate,
): TemplateDomainPayload[] {
  return template.domains.map((d, dIdx) => ({
    name: d.name,
    display_order: dIdx,
    slots: d.slots.map((s, sIdx) => ({
      artifact_type_id: s.artifactTypeId,
      phase: s.phase,
      required: s.required,
      display_order: sIdx,
      accepted_file_types:
        s.acceptedFileTypes.length > 0 ? s.acceptedFileTypes : null,
      max_file_size_mb: s.maxFileSizeMb,
      naming_convention: s.namingConvention || null,
      guidance: s.guidance || null,
      staleness_days: s.stalenessDays,
    })),
  }));
}

export function emptyCanvasTemplate(): CanvasTemplate {
  return {
    id: null,
    name: "",
    description: "",
    templateType: "custom",
    status: "experimental",
    version: "1.0.0",
    domains: [],
  };
}
