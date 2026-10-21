import { afterEach, describe, expect, it, vi } from "vitest";
import { searchApi } from "../lib/api";

describe("searchApi.search", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends GET /api/search with supported query parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [], total: 0 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await searchApi.search({ q: "design system", project_id: "project-123", limit: 8 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit?.method).toBe("GET");
    expect(new URL(String(requestUrl)).pathname).toBe("/api/search");
    expect(new URL(String(requestUrl)).searchParams.get("q")).toBe("design system");
    expect(new URL(String(requestUrl)).searchParams.get("project_id")).toBe("project-123");
    expect(new URL(String(requestUrl)).searchParams.get("limit")).toBe("8");
    expect(requestInit?.body).toBeUndefined();
  });
});
