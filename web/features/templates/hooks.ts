"use client";

/**
 * Template feature-local hooks.
 * Calls web/lib/api.ts (templatesApi) — do NOT import from web/lib/hooks/.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesApi } from "@/lib/api";
import { FIXTURE_TEMPLATES, getTemplatePreview } from "./fixtures";
import type { ArtifactTemplate, TemplatePreview } from "./types";

// ============================================================
// Normalization
// ============================================================

/**
 * Guarantee `domains` (and each domain's `slots`) is always an array.
 *
 * The API list endpoint historically returned header-only templates (no
 * `domains`), and the detail endpoint can return `domains: null` when a
 * template has no YAML structure. The UI type declares `domains` as a required
 * array, so normalizing here at the data boundary keeps every downstream
 * consumer (cards, filters, preview/apply tabs) crash-safe without scattering
 * `?? []` guards across the feature.
 */
function normalizeTemplate(t: ArtifactTemplate): ArtifactTemplate {
  return {
    ...t,
    domains: (t.domains ?? []).map((d) => ({ ...d, slots: d.slots ?? [] })),
  };
}

// ============================================================
// Query keys
// ============================================================

export const templateKeys = {
  all: ["templates"] as const,
  list: () => [...templateKeys.all, "list"] as const,
  detail: (id: string) => [...templateKeys.all, "detail", id] as const,
  preview: (id: string) => [...templateKeys.all, "preview", id] as const,
  projectApplied: (projectId: string) =>
    [...templateKeys.all, "project", projectId] as const,
};

// ============================================================
// useTemplates — list all templates
// ============================================================

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: async (): Promise<ArtifactTemplate[]> => {
      try {
        const data = await templatesApi.list();
        return (data as ArtifactTemplate[]).map(normalizeTemplate);
      } catch {
        return FIXTURE_TEMPLATES.map(normalizeTemplate);
      }
    },
    staleTime: 60_000,
    placeholderData: FIXTURE_TEMPLATES,
  });
}

// ============================================================
// useTemplate — single template detail
// ============================================================

export function useTemplate(templateId: string | null | undefined) {
  return useQuery({
    queryKey: templateKeys.detail(templateId ?? ""),
    queryFn: async (): Promise<ArtifactTemplate | null> => {
      if (!templateId) return null;
      try {
        const data = await templatesApi.get(templateId);
        return normalizeTemplate(data as ArtifactTemplate);
      } catch {
        const fixture = FIXTURE_TEMPLATES.find((t) => t.id === templateId);
        return fixture ? normalizeTemplate(fixture) : null;
      }
    },
    enabled: !!templateId,
    staleTime: 60_000,
  });
}

// ============================================================
// useTemplatePreview — lightweight preview before apply
// ============================================================

export function useTemplatePreview(templateId: string | null | undefined) {
  return useQuery({
    queryKey: templateKeys.preview(templateId ?? ""),
    queryFn: async (): Promise<TemplatePreview | null> => {
      if (!templateId) return null;
      try {
        const data = await templatesApi.preview(templateId);
        return data as TemplatePreview;
      } catch {
        const t = FIXTURE_TEMPLATES.find((t) => t.id === templateId);
        return t ? getTemplatePreview(t) : null;
      }
    },
    enabled: !!templateId,
    staleTime: 30_000,
  });
}

// ============================================================
// useApplyTemplate — mutation to apply a template to a project
// ============================================================

export interface ApplyTemplateRequest {
  template_id: string;
  merge_mode: "skip_existing" | "overwrite_existing" | "rename_conflict";
}

export interface ApplyTemplateResult {
  bom_id: string;
  slots_created: number;
  slots_skipped: number;
  conflicts: Array<{
    existing_slot_name: string;
    existing_slot_id: string;
    incoming_artifact_type: string;
    domain: string;
  }>;
}

export function useApplyTemplate(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ApplyTemplateRequest): Promise<ApplyTemplateResult> =>
      templatesApi.apply(
        projectId,
        req.template_id,
        req.merge_mode,
      ) as Promise<ApplyTemplateResult>,
    onSuccess: () => {
      // Invalidate BOM and coverage after applying a template
      qc.invalidateQueries({ queryKey: ["bom"] });
      qc.invalidateQueries({ queryKey: templateKeys.projectApplied(projectId) });
    },
  });
}

// ============================================================
// useSaveBuilderTemplate — mutation to save a custom template draft
// ============================================================

export interface SaveBuilderTemplateRequest {
  id: string | null;
  name: string;
  description: string;
  template_type: string;
  publish_status: "draft" | "published";
  domains: Array<{
    name: string;
    slots: Array<{
      artifact_type: string;
      required: boolean;
      guidance: string;
      staleness_days: number | null;
      min_count: number | null;
    }>;
  }>;
}

export interface SaveBuilderTemplateResult {
  id: string;
}

export function useSaveBuilderTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SaveBuilderTemplateRequest): Promise<SaveBuilderTemplateResult> =>
      templatesApi.save(req) as Promise<SaveBuilderTemplateResult>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.list() });
    },
  });
}
