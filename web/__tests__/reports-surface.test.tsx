import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQuery } from "./test-utils";
import { ProjectReportsView } from "@/features/reports/ProjectReportsView";
import { ReportsHub } from "@/features/reports/ReportsHub";
import { parseDeliveryReportMetadata } from "@/features/reports/types";

vi.mock("@/features/assets/hooks/useAssetModal", () => ({
  useAssetModal: () => ({ openAsset: vi.fn(), assetModal: null }),
}));

const TRACKER_LINK = {
  id: "link_tracker",
  asset_id: "asset_report_1",
  target_type: "intenttree_node",
  target_id: "node_01REPORT",
  relationship: "reports_on",
  created_at: "2026-09-08T12:00:00Z",
};

const REPORT = {
  id: "asset_report_1",
  workspace_id: "ws_test",
  project_id: "proj_alpha",
  title: "Alpha delivery",
  artifact_type_id: "delivery_report",
  source_kind: "local",
  uri: "file:///reports/sprint.html",
  mime_type: "text/html",
  status: "candidate",
  sensitivity: "personal",
  agent_access: "preview_allowed",
  captured_at: "2026-09-08T12:00:00Z",
  tags: [],
  metadata: {
    route: "feature",
    revision: 7,
    truth_status: "verified_with_caveats",
    generated_from: { repo: "artifact_atlas", ref: "main", commit: "abcdef1234567890" },
  },
  links: [TRACKER_LINK],
};

const UNATTRIBUTED = {
  ...REPORT,
  id: "asset_report_2",
  project_id: null,
  title: "Unattributed delivery",
  metadata: { ...REPORT.metadata, route: "program" },
  links: [],
};

const FACETS = {
  project: [
    { value: "proj_alpha", count: 1 },
    { value: "__unattributed__", count: 1 },
  ],
  route: [
    { value: "feature", count: 1 },
    { value: "program", count: 1 },
  ],
  truth_status: [{ value: "verified_with_caveats", count: 2 }],
  date_bucket: [{ value: "2026-09-08", count: 2 }],
  tracker_node: [
    { value: "node_01REPORT", count: 1 },
    { value: "__unlinked__", count: 1 },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function reportsPage(
  items: Array<Record<string, unknown>> = [],
  facets = FACETS,
  nextCursor: string | null = null,
  total = items.length,
) {
  return { items, has_more: nextCursor !== null, next_cursor: nextCursor, total, facets };
}

function installFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn((_input: string | URL | Request) =>
    Promise.resolve(jsonResponse(body, status)),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("per-project reports surface", () => {
  it("uses the reports API and renders metadata, hosted HTML, and actual tracker links", async () => {
    const fetchMock = installFetch(reportsPage([REPORT]));
    renderWithQuery(<ProjectReportsView projectId="proj_alpha" />);

    expect(await screen.findByText("Alpha delivery")).toBeInTheDocument();
    expect(screen.getByText("feature")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("verified_with_caveats")).toBeInTheDocument();
    expect(screen.getByText("abcdef12")).toBeInTheDocument();
    expect(screen.getByText("node_01REPORT")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open full report: Alpha delivery" })).toHaveAttribute(
      "href",
      "http://localhost:8000/api/preview/asset/asset_report_1/html",
    );
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestUrl.pathname).toBe("/api/reports");
    expect(requestUrl.searchParams.get("project_id")).toBe("proj_alpha");
    expect(requestUrl.searchParams.get("limit")).toBe("200");
  });

  it("shows honest error and API-owned unattributed empty states", async () => {
    installFetch({ error: { message: "offline" } }, 503);
    renderWithQuery(<ProjectReportsView projectId="proj_alpha-error" />);
    expect(await screen.findByText("Couldn’t load reports")).toBeInTheDocument();
  });

  it("distinguishes unattributed reports without claiming a false zero", async () => {
    installFetch(reportsPage([], { ...FACETS, project: [{ value: "__unattributed__", count: 1 }] }));
    renderWithQuery(<ProjectReportsView projectId="proj_empty" />);
    expect(await screen.findByText("This project has no reports yet")).toBeInTheDocument();
    expect(screen.getByText("1 delivery report exists but is not attributed to any project.")).toBeInTheDocument();
  });

  it("narrows malformed metadata without throwing", () => {
    expect(parseDeliveryReportMetadata(null)).toEqual({});
    expect(parseDeliveryReportMetadata({ route: [], revision: {}, truth_status: "novel", generated_from: "bad" }))
      .toEqual({ route: undefined, revision: undefined, truth_status: "novel", generated_from: undefined, generated_at: undefined });
  });
});

describe("workspace reports hub", () => {
  it("groups a bounded API page, pins unattributed last, and sends facet filters to the API", async () => {
    const fetchMock = installFetch(reportsPage([REPORT, UNATTRIBUTED]));
    renderWithQuery(<ReportsHub />);

    expect(await screen.findByText("Alpha delivery")).toBeInTheDocument();
    expect(screen.getByText("Unattributed delivery")).toBeInTheDocument();
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.at(-1)).toHaveTextContent("Unattributed");
    expect(screen.getByText("2 total reports")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Filter by project"), "proj_alpha");
    await userEvent.selectOptions(screen.getByLabelText("Filter by report route"), "feature");
    await userEvent.selectOptions(screen.getByLabelText("Filter by truth status"), "verified_with_caveats");
    await userEvent.selectOptions(screen.getByLabelText("Filter by date"), "2026-09-08");
    await userEvent.selectOptions(screen.getByLabelText("Filter by tracker node"), "node_01REPORT");

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
    const urls = fetchMock.mock.calls.map((call) => new URL(String(call[0])));
    expect(urls.some((url) => url.searchParams.get("project_id") === "proj_alpha")).toBe(true);
    expect(urls.some((url) => url.searchParams.get("route") === "feature")).toBe(true);
    expect(urls.some((url) => url.searchParams.get("truth_status") === "verified_with_caveats")).toBe(true);
    expect(urls.some((url) => url.searchParams.get("captured_after")?.startsWith("2026-09-08"))).toBe(true);
    expect(urls.some((url) => url.searchParams.get("tracker_node_id") === "node_01REPORT")).toBe(true);
    expect(urls.every((url) => url.searchParams.get("limit") === "200" && !url.searchParams.has("cursor"))).toBe(true);
  });

  it("renders honest API error and empty workspace states", async () => {
    installFetch({ error: { message: "offline" } }, 503);
    renderWithQuery(<ReportsHub />);
    expect(await screen.findByText("Couldn’t load workspace reports")).toBeInTheDocument();
    expect(screen.getByText(/No fallback data is being shown/i)).toBeInTheDocument();
  });

  it("paginates through the reports API instead of truncating the workspace", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(reportsPage([REPORT], FACETS, "200", 2)))
      .mockResolvedValueOnce(jsonResponse(reportsPage([UNATTRIBUTED], FACETS, null, 2)));
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<ReportsHub />);

    await userEvent.click(await screen.findByRole("button", { name: /Load more reports/ }));
    expect(await screen.findByText("Unattributed delivery")).toBeInTheDocument();
    const secondUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(secondUrl.searchParams.get("cursor")).toBe("200");
  });

  it("renders the workspace empty state from an empty API page", async () => {
    installFetch(reportsPage([], {
      project: [], route: [], truth_status: [], date_bucket: [], tracker_node: [],
    }));
    renderWithQuery(<ReportsHub />);
    expect(await screen.findByText("No reports in this workspace")).toBeInTheDocument();
  });
});
