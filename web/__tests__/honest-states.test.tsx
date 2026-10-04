/**
 * Estate-coherence M0 — Atlas honest states.
 *
 * Two-sided: an unverified / failed / 404 live query renders as loading or
 * error with no fixture values, AND a successful query still renders its
 * verified live value. Fixtures appear only when the build opts into demo
 * data (NEXT_PUBLIC_ATLAS_DEMO_DATA=1), and then with a visible label.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, screen, waitFor } from "@testing-library/react";
import { renderWithQuery, Wrapper } from "./test-utils";
import { FIXTURE_BOM, FIXTURE_PROJECTS, FIXTURE_AUDIT_EVENTS } from "@/lib/fixtures";
import { FIXTURE_INTENT_NODES } from "@/features/dashboard/intentNodes";
import { liveOrDemo, isDemoDataEnabled } from "@/lib/demoData";
import { useBom } from "@/lib/hooks/useBom";
import { useProjects } from "@/lib/hooks/useProjects";
import { ProjectsIndexView } from "@/features/projects/ProjectsIndexView";
import { AgentActivityPanel } from "@/features/dashboard/components/AgentActivityPanel";
import { ActiveNodesPanel } from "@/features/dashboard/components/ActiveNodesPanel";
import { KPIRow } from "@/features/dashboard/components/KPIRow";
import { CanonicalArtifactsPanel } from "@/features/dashboard/components/CanonicalArtifactsPanel";
import { DemoDataBanner } from "@/components/shell/DemoDataBanner";
import { AssetBrowseView, browseCountLabel } from "@/features/assets/AssetBrowseView";
import { relativeTime } from "@/lib/relativeTime";
import type { AuditEvent, DashboardStats, SearchResult } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/projects/proj_live",
  useSearchParams: () => new URLSearchParams(),
}));

// ============================================================
// fetch helpers
// ============================================================

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, code = "unavailable"): Response {
  return jsonResponse({ error: { code, message: "boom" } }, status);
}

/** Route stubbed fetch calls by URL pathname. Unknown paths → 503. */
function stubFetch(routes: Record<string, () => Response>) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname;
    const handler = routes[path];
    return Promise.resolve(handler ? handler() : errorResponse(503));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const LIVE_PROJECT = {
  id: "proj_live",
  name: "Live Registry Project",
  slug: "live",
  description: null,
  status: "active",
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

// ============================================================
// Demo gate
// ============================================================

describe("demo-data gate", () => {
  it("rethrows live failures when demo data is not enabled", async () => {
    expect(isDemoDataEnabled()).toBe(false);
    await expect(
      liveOrDemo(() => Promise.reject(new Error("offline")), () => "fixture"),
    ).rejects.toThrow("offline");
  });

  it("returns the fixture only when the build opts in", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATLAS_DEMO_DATA", "1");
    await expect(
      liveOrDemo(() => Promise.reject(new Error("offline")), () => "fixture"),
    ).resolves.toBe("fixture");
  });

  it("prefers the live value even in demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATLAS_DEMO_DATA", "1");
    await expect(liveOrDemo(() => Promise.resolve("live"), () => "fixture")).resolves.toBe("live");
  });

  it("labels demo builds and renders nothing in live builds", () => {
    const { unmount } = renderWithQuery(<DemoDataBanner />);
    expect(screen.queryByTestId("demo-data-banner")).not.toBeInTheDocument();
    unmount();
    vi.stubEnv("NEXT_PUBLIC_ATLAS_DEMO_DATA", "1");
    renderWithQuery(<DemoDataBanner />);
    expect(screen.getByTestId("demo-data-banner")).toHaveTextContent("DEMO DATA");
  });
});

// ============================================================
// Hooks: first paint, failure, 404
// ============================================================

describe("live reader hooks", () => {
  it("useProjects has no fixture first paint and surfaces errors", async () => {
    stubFetch({ "/api/projects": () => errorResponse(503) });
    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    // First paint: loading, not fixture projects.
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("useBom treats a 404 as an error, never FIXTURE_BOM", async () => {
    stubFetch({ "/api/projects/proj_live/bom": () => errorResponse(404, "not_found") });
    const { result } = renderHook(() => useBom("proj_live"), { wrapper: Wrapper });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect((result.current.error as { status?: number }).status).toBe(404);
  });

  it("useBom returns the live BOM on success", async () => {
    const liveBom = { ...FIXTURE_BOM, id: "bom_live", name: "Live BOM", project_id: "proj_live" };
    stubFetch({ "/api/projects/proj_live/bom": () => jsonResponse(liveBom) });
    const { result } = renderHook(() => useBom("proj_live"), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("bom_live");
  });
});

// ============================================================
// Views: error vs live value
// ============================================================

describe("projects index", () => {
  it("shows an error with retry and no fixture projects when the API fails", async () => {
    stubFetch({ "/api/projects": () => errorResponse(503) });
    renderWithQuery(<ProjectsIndexView />);
    expect(await screen.findByText("Couldn't load projects")).toBeInTheDocument();
    expect(screen.getByText(/No fallback data is being shown/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    for (const p of FIXTURE_PROJECTS) {
      expect(screen.queryByText(p.name)).not.toBeInTheDocument();
    }
  });

  it("renders verified live projects on success", async () => {
    stubFetch({
      "/api/projects": () =>
        jsonResponse({ items: [LIVE_PROJECT], next_cursor: null, total: 1 }),
    });
    renderWithQuery(<ProjectsIndexView />);
    expect(await screen.findByText("Live Registry Project")).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load projects")).not.toBeInTheDocument();
  });
});

describe("agent activity panel", () => {
  it("shows an error, not fixture audit events, when the audit API fails", async () => {
    stubFetch({ "/api/audit/events": () => errorResponse(500) });
    renderWithQuery(<AgentActivityPanel projectId="proj_live" />);
    expect(await screen.findByText("Couldn't load agent activity")).toBeInTheDocument();
    const fixtureActor = FIXTURE_AUDIT_EVENTS.find((e) => e.actor_id)?.actor_id;
    if (fixtureActor) {
      expect(screen.queryByText(new RegExp(fixtureActor))).not.toBeInTheDocument();
    }
  });
});

describe("IntentTree nodes (no live source)", () => {
  it("says not connected instead of listing fixture nodes", () => {
    renderWithQuery(<ActiveNodesPanel projectId="proj_live" />);
    expect(screen.getByText("IntentTree not connected")).toBeInTheDocument();
    expect(screen.getByText("IntentTree: not connected")).toBeInTheDocument();
    for (const n of FIXTURE_INTENT_NODES) {
      expect(screen.queryByText(n.title)).not.toBeInTheDocument();
    }
  });

  it("lists labelled demo nodes only in a demo build", () => {
    vi.stubEnv("NEXT_PUBLIC_ATLAS_DEMO_DATA", "1");
    renderWithQuery(<ActiveNodesPanel projectId="proj_live" />);
    expect(screen.getByText(FIXTURE_INTENT_NODES[0].title)).toBeInTheDocument();
    expect(screen.getByText(/\(demo\)/)).toBeInTheDocument();
  });
});

describe("KPI row", () => {
  const STATS: DashboardStats = {
    project_id: "proj_live",
    total_assets: 2559,
    assets_by_status: { candidate: 3 },
    canonical_count: 11,
    bom_coverage_pct: 0,
    missing_required_slots: 0,
    context_pack_count: 0,
    recent_activity: [],
  } as unknown as DashboardStats;

  it("renders unknown (—) values, not zeros, when stats failed", () => {
    renderWithQuery(
      <KPIRow stats={undefined} isLoading={false} isError projectId="proj_live" openTaskCount={null} />,
    );
    const region = screen.getByRole("region", { name: "Key metrics" });
    expect(region).not.toHaveTextContent(/\b0\b/);
    expect(screen.getAllByText("—").length).toBe(5);
    expect(screen.getAllByText("unavailable").length).toBe(3);
    expect(screen.getByText("IntentTree not connected")).toBeInTheDocument();
    expect(screen.getByText("BOM unavailable")).toBeInTheDocument();
  });

  it("renders verified live values on success (KPI)", () => {
    renderWithQuery(
      <KPIRow stats={STATS} isLoading={false} projectId="proj_live" openTaskCount={4} />,
    );
    expect(screen.getByText("2559")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.queryByText("unavailable")).not.toBeInTheDocument();
  });
});

describe("dashboard panel counts", () => {
  it("does not print a zero count when the asset query failed", () => {
    renderWithQuery(
      <CanonicalArtifactsPanel projectId="proj_live" assets={undefined} isLoading={false} isError />,
    );
    expect(screen.queryByText("0 promoted")).not.toBeInTheDocument();
    expect(screen.getByText("count unavailable")).toBeInTheDocument();
  });

  it("prints the verified count when assets loaded", () => {
    renderWithQuery(
      <CanonicalArtifactsPanel projectId="proj_live" assets={[]} isLoading={false} />,
    );
    expect(screen.getByText("0 promoted")).toBeInTheDocument();
  });
});

// ============================================================
// T2 — Browse Assets: page vs population
// ============================================================

function searchRow(i: number, projectId = "proj_live"): SearchResult {
  return {
    asset_id: `asset_${i}`,
    title: `Browse Asset ${i}`,
    score: 1,
    status: "candidate",
    source_kind: "local",
    project_id: projectId,
    tags: [],
  } as SearchResult;
}

describe("browse assets count", () => {
  const PAGE = [searchRow(1), searchRow(2, "proj_other")];

  it("says N of TOTAL when the page is a subset, and tracks the API total", async () => {
    let apiTotal = 2559;
    stubFetch({
      "/api/search": () => jsonResponse({ results: PAGE, total: apiTotal }),
      "/api/projects": () => jsonResponse({ items: [], next_cursor: null, total: 0 }),
    });
    const { unmount } = renderWithQuery(<AssetBrowseView />);
    expect(await screen.findByText("Showing 2 of 2,559 assets")).toBeInTheDocument();
    // No project count is inferred from a partial page.
    expect(screen.queryByText(/across/)).not.toBeInTheDocument();
    unmount();

    // Same page, different population → the displayed total changes.
    apiTotal = 312;
    renderWithQuery(<AssetBrowseView />);
    expect(await screen.findByText("Showing 2 of 312 assets")).toBeInTheDocument();
  });

  it("states the whole population when the page holds all of it", () => {
    expect(browseCountLabel(PAGE, 2)).toBe("2 assets across 2 projects");
    expect(browseCountLabel(PAGE, 7)).toBe("Showing 2 of 7 assets");
  });

  it("renders an empty filtered result as empty, not an unknown catalog count", async () => {
    stubFetch({
      "/api/search": () => jsonResponse({ results: [], total: 0 }),
      "/api/projects": () => jsonResponse({ items: [], next_cursor: null, total: 0 }),
    });
    renderWithQuery(<AssetBrowseView />);
    expect(await screen.findByText("No assets found")).toBeInTheDocument();
    expect(screen.getByText("0 assets across 0 projects")).toBeInTheDocument();
  });
});

// ============================================================
// T3 — no NaN dates
// ============================================================

describe("shared relativeTime", () => {
  const NOW = Date.parse("2026-09-30T12:00:00Z");

  it("never returns NaN for missing or invalid dates", () => {
    for (const bad of [undefined, null, "", "not-a-date", "2026-13-45T99:99:99Z"]) {
      const label = relativeTime(bad as string | null | undefined, { now: NOW });
      expect(label).not.toMatch(/NaN/);
      expect(label).toBe("—");
    }
    expect(relativeTime("garbage", { fallback: "" })).toBe("");
  });

  it("still labels valid timestamps", () => {
    expect(relativeTime("2026-09-30T11:55:00Z", { now: NOW })).toBe("5m ago");
    expect(relativeTime("2026-09-30T09:00:00Z", { now: NOW })).toBe("3h ago");
    expect(relativeTime("2026-09-27T12:00:00Z", { now: NOW })).toBe("3d ago");
    expect(relativeTime("2026-10-01T00:00:00Z", { now: NOW })).toBe("just now");
  });
});

describe("agent activity dates", () => {
  const baseEvent = {
    id: "evt_live",
    event_type: "asset_added",
    actor_type: "agent",
    actor_id: "live-agent",
    project_id: "proj_live",
    target_type: "asset",
    target_id: "asset_1",
  };

  it("reads the API `timestamp` field and renders a relative label", async () => {
    const ts = new Date(Date.now() - 5 * 60_000).toISOString();
    const evt: AuditEvent = { ...baseEvent, timestamp: ts } as AuditEvent;
    stubFetch({
      "/api/audit/events": () => jsonResponse({ items: [evt], next_cursor: null, total: 1 }),
    });
    renderWithQuery(<AgentActivityPanel projectId="proj_live" />);
    expect(await screen.findByText("5m ago")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/NaN/);
  });

  it("shows — (not NaN) when an event carries no usable time", async () => {
    // Legacy shape: `created_at` only — the field the panel used to read.
    const evt = { ...baseEvent, created_at: "2026-09-30T00:00:00Z" };
    stubFetch({
      "/api/audit/events": () => jsonResponse({ items: [evt], next_cursor: null, total: 1 }),
    });
    renderWithQuery(<AgentActivityPanel projectId="proj_live" />);
    expect(await screen.findByText("live-agent", { exact: false })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/NaN/);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
