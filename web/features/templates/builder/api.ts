/**
 * BOM Builder — feature-local API helpers (WS-5).
 *
 * Per the shared-file rule, these live here instead of extending
 * web/lib/api.ts. Same base-URL convention as the global client.
 */

import type {
  TemplateDetailResponse,
  TemplateDomainPayload,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...rest.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body?.error?.message ?? body?.detail ?? message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface TemplateSavePayload {
  name: string;
  slug?: string;
  description?: string | null;
  template_type?: string;
  status?: string;
  version?: string;
  domains: TemplateDomainPayload[];
}

export const builderApi = {
  getDetail(templateId: string) {
    return request<TemplateDetailResponse>(`/api/templates/${templateId}`);
  },

  create(payload: TemplateSavePayload) {
    return request<TemplateDetailResponse>("/api/templates", {
      method: "POST",
      json: payload,
    });
  },

  update(templateId: string, payload: Partial<TemplateSavePayload>) {
    return request<TemplateDetailResponse>(`/api/templates/${templateId}`, {
      method: "PATCH",
      json: payload,
    });
  },

  duplicate(templateId: string, name?: string) {
    return request<TemplateDetailResponse>(
      `/api/templates/${templateId}/duplicate`,
      { method: "POST", json: name ? { name } : {} },
    );
  },

  preview(templateId: string) {
    return request<{
      template_id: string;
      total_slots?: number;
      required_slots?: number;
      domains: Array<{ name: string; slots?: unknown[] | null }>;
    }>(`/api/templates/${templateId}/preview`);
  },

  applyToProject(projectId: string, templateId: string) {
    return request<{
      slots_created?: number;
      slots_skipped?: number;
    }>(`/api/projects/${projectId}/bom/apply-template`, {
      method: "POST",
      json: { template_id: templateId, merge_mode: "skip_existing" },
    });
  },
};
