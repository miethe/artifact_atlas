import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithQuery } from "./test-utils";
import { OverviewView, ageBand } from "@/features/overview/OverviewView";

const NOW = Date.parse("2026-09-09T12:00:00Z");

function project(
  id: string,
  generatedAt: string | null,
  treeId: string | null = `tree_${id}`,
) {
  return {
    id,
    slug: id,
    name: `${id} project`,
    project_href: id === "fresh" ? `/projects/${id}` : null,
    authored: {
      summary: `Current status for ${id}`,
      next_action: `Ship ${id}`,
      as_of: "2026-08-02T17:44:12Z",
      provenance: "reviewed-status.yaml",
    },
    derived: {
      tree_id: treeId,
      metrics: {
        nodes_open: {
          value: 3,
          measured_by: "IntentTree snapshot",
          provenance: "registry/intenttree.jsonl",
        },
      },
    },
    latest_report: generatedAt ? {
      asset_id: `asset_${id}`,
      title: `${id} dossier`,
      route: id === "fresh" ? "program" : "dossier",
      generated_at: generatedAt,
      href: `/api/preview/asset/asset_${id}/html`,
    } : null,
  };
}

const OVERVIEW = {
  generated_at: "2026-09-01T11:30:00Z",
  schema_version: 1,
  source: {
    name: "aos-atlas",
    collector_version: "2.0.0",
    snapshot_id: "snapshot_0909",
  },
  projects: [
    project("fresh", "2026-09-09T06:00:00Z"),
    project("warning", "2026-09-07T12:00:00Z"),
    project("stale", "2026-09-01T11:00:00Z"),
    project("unbound", null, null),
    ...Array.from({ length: 10 }, (_, index) => project(`fleet-${index + 1}`, null)),
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("AOS overview surface", () => {
  it("renders every API project, provenance, links, missing states, and age bands", async () => {
    const dateNow = vi.spyOn(Date, "now").mockReturnValue(NOW);
    const fetchMock = vi.fn((_input: string | URL | Request) =>
      Promise.resolve(jsonResponse(OVERVIEW)),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<OverviewView />);

    expect(await screen.findByText("fresh project")).toBeInTheDocument();
    expect(screen.getByText("warning project")).toBeInTheDocument();
    expect(screen.getByText("stale project")).toBeInTheDocument();
    expect(screen.getByText("unbound project")).toBeInTheDocument();
    expect(screen.getByText(/Source: aos-atlas \/ 2.0.0 \/ snapshot_0909/)).toBeInTheDocument();
    expect(screen.getByText(/stale snapshot · schema 1/i)).toBeInTheDocument();
    expect(screen.getAllByText("As of 8/2/2026")).toHaveLength(14);
    expect(screen.getAllByText("reviewed-status.yaml")).toHaveLength(14);
    expect(screen.getByText(/fresh · Updated 6h ago/i)).toBeInTheDocument();
    expect(screen.getByText(/warning · Updated 2d ago/i)).toBeInTheDocument();
    expect(screen.getByText(/stale · Updated 8d ago/i)).toBeInTheDocument();
    expect(screen.getByText("No tree bound")).toBeInTheDocument();
    expect(screen.getAllByText("No status report")).toHaveLength(11);
    expect(screen.getAllByRole("article")).toHaveLength(14);
    expect(screen.getAllByText(/IntentTree snapshot/).length).toBe(14);
    expect(screen.getByRole("link", { name: /fresh project/i })).toHaveAttribute("href", "/projects/fresh");
    expect(screen.queryByRole("link", { name: /unbound project/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open latest program report: fresh dossier" })).toHaveAttribute(
      "href",
      "http://localhost:8000/api/preview/asset/asset_fresh/html",
    );
    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe("/api/overview");
    dateNow.mockRestore();
  });

  it("classifies the exact freshness thresholds", () => {
    expect(ageBand("2026-09-08T12:00:00Z", NOW)).toBe("fresh");
    expect(ageBand("2026-09-08T11:59:59Z", NOW)).toBe("warning");
    expect(ageBand("2026-09-02T12:00:00Z", NOW)).toBe("warning");
    expect(ageBand("2026-09-02T11:59:59Z", NOW)).toBe("stale");
  });

  it("shows an honest API error with no fixture fallback", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(
      jsonResponse({ error: { code: "offline", message: "Unavailable" } }, 503),
    )));
    renderWithQuery(<OverviewView />);
    expect(await screen.findByText("Couldn’t load AOS overview")).toBeInTheDocument();
    expect(screen.getByText(/No fallback data is being shown/i)).toBeInTheDocument();
    expect(screen.queryByText("fresh project")).not.toBeInTheDocument();
  });
});
