/**
 * Typed fetch client for the Artifact Atlas API.
 * Base URL from NEXT_PUBLIC_API_BASE_URL (default: http://localhost:8000).
 * All responses use the error envelope from the OpenAPI contract.
 */

import type {
  Asset,
  AssetCreate,
  AssetFilters,
  AssetLink,
  AssetLinkCreate,
  AssetPromoteRequest,
  AssetUpdate,
  AuditEvent,
  Bom,
  BomAssignment,
  BomSlot,
  ContextPack,
  ContextPackCreate,
  CoverageSummary,
  CursorPage,
  DashboardStats,
  InboxImportRequest,
  InboxItem,
  IntegrationStatus,
  Project,
  ProjectCreate,
  ProjectUpdate,
  SearchRequest,
  SearchResult,
  SlotAssignRequest,
} from "./types";

// ============================================================
// Base configuration
// ============================================================

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ============================================================
// Error types
// ============================================================

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string | null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// ============================================================
// Core fetch helper
// ============================================================

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | string[] | number | boolean | undefined | null>;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, params, ...rest } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, String(v));
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(rest.headers ?? {}),
  };

  const response = await fetch(url.toString(), {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let code = "unknown_error";
    let message = `HTTP ${response.status}`;
    let requestId: string | null = null;

    try {
      const errJson = (await response.json()) as {
        error?: { code?: string; message?: string; request_id?: string | null };
      };
      code = errJson.error?.code ?? code;
      message = errJson.error?.message ?? message;
      requestId = errJson.error?.request_id ?? null;
    } catch {
      // ignore parse failure
    }

    throw new ApiRequestError(response.status, code, message, requestId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ============================================================
// Projects API
// ============================================================

export const projectsApi = {
  list(params?: { status?: string; cursor?: string; limit?: number }) {
    return apiFetch<CursorPage<Project>>("/api/projects", { params });
  },

  get(projectId: string) {
    return apiFetch<Project>(`/api/projects/${projectId}`);
  },

  create(data: ProjectCreate) {
    return apiFetch<Project>("/api/projects", { method: "POST", body: data });
  },

  update(projectId: string, data: ProjectUpdate) {
    return apiFetch<Project>(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: data,
    });
  },
};

// ============================================================
// Assets API
// ============================================================

export const assetsApi = {
  list(projectId: string, filters?: AssetFilters) {
    const { status, source_kind, ...rest } = filters ?? {};
    return apiFetch<CursorPage<Asset>>(
      `/api/projects/${projectId}/assets`,
      {
        params: {
          ...(rest as Record<string, string | number | boolean | undefined | null>),
          ...(status ? { status } : {}),
          ...(source_kind ? { source_kind } : {}),
        },
      },
    );
  },

  get(assetId: string) {
    return apiFetch<Asset>(`/api/assets/${assetId}`);
  },

  create(projectId: string, data: AssetCreate) {
    return apiFetch<Asset>(`/api/projects/${projectId}/assets`, {
      method: "POST",
      body: data,
    });
  },

  update(assetId: string, data: AssetUpdate) {
    return apiFetch<Asset>(`/api/assets/${assetId}`, {
      method: "PATCH",
      body: data,
    });
  },

  delete(assetId: string, confirmCanonical = false) {
    return apiFetch<void>(`/api/assets/${assetId}`, {
      method: "DELETE",
      params: { confirm_canonical: confirmCanonical },
    });
  },

  promote(assetId: string, data: AssetPromoteRequest) {
    return apiFetch<Asset>(`/api/assets/${assetId}/promote`, {
      method: "POST",
      body: data,
    });
  },

  link(assetId: string, data: AssetLinkCreate) {
    return apiFetch<AssetLink>(`/api/assets/${assetId}/link`, {
      method: "POST",
      body: data,
    });
  },

  assignSlot(assetId: string, data: SlotAssignRequest) {
    return apiFetch<BomAssignment>(`/api/assets/${assetId}/assign-slot`, {
      method: "POST",
      body: data,
    });
  },

  summarize(assetId: string) {
    return apiFetch<{ task_id: string; asset_id: string }>(
      `/api/assets/${assetId}/summarize`,
      { method: "POST" },
    );
  },
};

// ============================================================
// Inbox API
// ============================================================

export const inboxApi = {
  list(
    projectId: string,
    params?: { cursor?: string; limit?: number; source_kind?: string[] },
  ) {
    return apiFetch<CursorPage<InboxItem>>(
      `/api/projects/${projectId}/inbox`,
      { params },
    );
  },

  import(projectId: string, data: InboxImportRequest) {
    return apiFetch<{ imported_count: number; asset_ids: string[] }>(
      `/api/projects/${projectId}/inbox/import`,
      { method: "POST", body: data },
    );
  },
};

// ============================================================
// BOM API
// ============================================================

export const bomApi = {
  get(projectId: string) {
    return apiFetch<Bom>(`/api/projects/${projectId}/bom`);
  },

  getCoverage(bomId: string, groupBy?: "domain" | "phase" | "template") {
    return apiFetch<CoverageSummary>(`/api/bom/${bomId}/coverage`, {
      params: groupBy ? { group_by: groupBy } : undefined,
    });
  },

  getGaps(
    bomId: string,
    params?: { critical_only?: boolean; status?: string[] },
  ) {
    return apiFetch<{ gaps: BomSlot[] }>(`/api/bom/${bomId}/gaps`, { params });
  },

  assignSlot(slotId: string, data: SlotAssignRequest) {
    return apiFetch<BomAssignment>(`/api/bom/slots/${slotId}/assign`, {
      method: "POST",
      body: data,
    });
  },
};

// ============================================================
// Context Packs API
// ============================================================

export const contextPacksApi = {
  list(
    projectId: string,
    params?: {
      cursor?: string;
      limit?: number;
      status?: string;
      audience?: string;
    },
  ) {
    return apiFetch<CursorPage<ContextPack>>(
      `/api/projects/${projectId}/context-packs`,
      { params },
    );
  },

  create(projectId: string, data: ContextPackCreate) {
    return apiFetch<ContextPack>(`/api/projects/${projectId}/context-packs`, {
      method: "POST",
      body: data,
    });
  },

  get(packId: string) {
    return apiFetch<ContextPack>(`/api/context-packs/${packId}`);
  },
};

// ============================================================
// Search API
// ============================================================

export const searchApi = {
  search(data: SearchRequest) {
    return apiFetch<{ results: SearchResult[]; total: number }>(
      "/api/search",
      { method: "POST", body: data },
    );
  },
};

// ============================================================
// Audit API
// ============================================================

export const auditApi = {
  list(params?: {
    project_id?: string;
    event_type?: string[];
    cursor?: string;
    limit?: number;
    from?: string;
    to?: string;
  }) {
    return apiFetch<CursorPage<AuditEvent>>("/api/audit/events", { params });
  },
};

// ============================================================
// Integrations API
// ============================================================

export const integrationsApi = {
  list() {
    return apiFetch<{ integrations: IntegrationStatus[] }>(
      "/api/integrations",
    );
  },

  sync(integrationId: string) {
    return apiFetch<{ task_id: string; integration_id: string }>(
      `/api/integrations/${integrationId}/sync`,
      { method: "POST" },
    );
  },
};

// ============================================================
// Dashboard helper (aggregated from multiple API calls)
// ============================================================

export async function fetchDashboard(projectId: string): Promise<DashboardStats> {
  const [assetsPage, inboxPage, contextPacksPage] = await Promise.all([
    assetsApi.list(projectId, { limit: 1 }),
    inboxApi.list(projectId, { limit: 200 }),
    contextPacksApi.list(projectId, { limit: 1 }),
  ]);

  const inboxItems = inboxPage.items;
  const inboxCount = inboxItems.filter(
    (i) => i.status === "inbox" || i.status === "raw",
  ).length;

  // We don't have a direct dashboard endpoint; build from available data
  const stats: DashboardStats = {
    total_assets: assetsPage.total ?? 0,
    assets_by_status: {},
    bom_coverage_pct: 0,
    inbox_count: inboxCount,
    canonical_count: 0,
    context_pack_count: contextPacksPage.total ?? 0,
  };

  return stats;
}
