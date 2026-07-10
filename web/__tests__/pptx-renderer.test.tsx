/**
 * PptxRenderer tests — thumbnail-mode conversion flow (UI Wave 3 / WS-1).
 *
 * Thumbnail mode now attempts the same server-side PPTX→PDF conversion as
 * full mode (superseding AC P4C-D's icon-only rule), with a shorter poll
 * budget, per-assetId request dedupe/memoization across mounted cards, and a
 * graceful static-icon fallback on any error / 403 policy_denied / timeout.
 *
 * PdfRenderer is mocked (react-pdf worker doesn't run under jsdom); the stub
 * records the resolved src + mode so routing is still fully asserted.
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

const flagState = vi.hoisted(() => ({ pptxConversionEnabled: true }));

vi.mock("@/lib/flags", () => ({
  isFlagEnabled: (name: string) =>
    name === "pptx-server-conversion" ? flagState.pptxConversionEnabled : false,
}));

vi.mock("@/features/assets/components/AssetViewer/PdfRenderer", () => ({
  PdfRenderer: ({ src, mode }: { src: string; mode: string }) => (
    <div data-testid="pdf-renderer" data-src={src} data-mode={mode} />
  ),
}));

import {
  PptxRenderer,
  __resetPptxConversionCachesForTests,
} from "@/features/assets/components/AssetViewer/PptxRenderer";

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function readyResponse(pdfUrl = "/api/preview/cache/asset_x"): Response {
  return {
    status: 200,
    json: async () => ({ status: "ready", pdfUrl, cached: true, pageCount: 3 }),
  } as unknown as Response;
}

function pendingResponse(): Response {
  return { status: 202, json: async () => ({ status: "pending" }) } as unknown as Response;
}

function errorResponse(status: number): Response {
  return { status, json: async () => ({ code: "policy_denied" }) } as unknown as Response;
}

describe("PptxRenderer", () => {
  beforeEach(() => {
    __resetPptxConversionCachesForTests();
    flagState.pptxConversionEnabled = true;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Thumbnail mode: conversion flow ───────────────────────────────────────
  it("thumbnail mode converts and renders the cached PDF scaled for the card", async () => {
    const fetchMock = vi.fn().mockResolvedValue(readyResponse("/api/preview/cache/asset_t1"));
    global.fetch = fetchMock;

    render(<PptxRenderer assetId="asset_t1" mode="thumbnail" />);

    const pdf = await screen.findByTestId("pdf-renderer");
    expect(pdf).toHaveAttribute("data-mode", "thumbnail");
    // pdfUrl is API-relative; it must be resolved against the API origin.
    expect(pdf.getAttribute("data-src")).toMatch(/^https?:\/\/.+\/api\/preview\/cache\/asset_t1$/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/preview\/convert\/pptx$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ assetId: "asset_t1" });
  });

  it("shows the loading skeleton while conversion is pending (thumbnail)", async () => {
    global.fetch = vi.fn().mockResolvedValue(pendingResponse());

    render(<PptxRenderer assetId="asset_t2" mode="thumbnail" />);

    await waitFor(() => {
      expect(
        screen.getByRole("status", { name: /converting presentation/i }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId("pdf-renderer")).not.toBeInTheDocument();
  });

  it("polls after 202 and renders the PDF once conversion completes", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(pendingResponse())
      .mockResolvedValueOnce(readyResponse("/api/preview/cache/asset_t3"));
    global.fetch = fetchMock;

    render(<PptxRenderer assetId="asset_t3" mode="thumbnail" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("status", { name: /converting presentation/i })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByTestId("pdf-renderer")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the static icon (not an ErrorTile) after the shorter thumbnail poll budget", async () => {
    vi.useFakeTimers();
    // Server never finishes: every poll returns 202.
    global.fetch = vi.fn().mockResolvedValue(pendingResponse());

    render(<PptxRenderer assetId="asset_t4" mode="thumbnail" />);

    // Thumbnail budget is ~8 s (vs ~30 s in full mode) — well before the full
    // budget elapses the card must have settled on the icon fallback.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByLabelText("PowerPoint presentation")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /failed/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("pdf-renderer")).not.toBeInTheDocument();
  });

  it("falls back to the static icon on 403 policy_denied (thumbnail)", async () => {
    global.fetch = vi.fn().mockResolvedValue(errorResponse(403));

    render(<PptxRenderer assetId="asset_t5" mode="thumbnail" />);

    await waitFor(() => {
      expect(screen.getByLabelText("PowerPoint presentation")).toBeInTheDocument();
    });
    // Card fallback is the format icon, never the failure ErrorTile.
    expect(screen.queryByRole("status", { name: /conversion failed/i })).not.toBeInTheDocument();
  });

  it("renders the static icon without any network call when the flag is off (thumbnail)", () => {
    flagState.pptxConversionEnabled = false;
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(<PptxRenderer assetId="asset_t6" mode="thumbnail" />);

    expect(screen.getByLabelText("PowerPoint presentation")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ── Gallery behavior: dedupe + memoize per assetId ───────────────────────
  it("dedupes concurrent convert POSTs for the same assetId across mounted cards", async () => {
    const fetchMock = vi.fn().mockResolvedValue(readyResponse("/api/preview/cache/asset_g1"));
    global.fetch = fetchMock;

    render(
      <>
        <PptxRenderer assetId="asset_g1" mode="thumbnail" />
        <PptxRenderer assetId="asset_g1" mode="thumbnail" />
        <PptxRenderer assetId="asset_g1" mode="thumbnail" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("pdf-renderer")).toHaveLength(3);
    });
    // Three cards, one in-flight POST.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("memoizes a ready result so remounted cards skip the network entirely", async () => {
    const fetchMock = vi.fn().mockResolvedValue(readyResponse("/api/preview/cache/asset_g2"));
    global.fetch = fetchMock;

    const first = render(<PptxRenderer assetId="asset_g2" mode="thumbnail" />);
    await first.findByTestId("pdf-renderer");
    first.unmount();

    render(<PptxRenderer assetId="asset_g2" mode="thumbnail" />);
    await screen.findByTestId("pdf-renderer");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // ── Full mode: behavior unchanged ─────────────────────────────────────────
  it("full mode renders the converted PDF via PdfRenderer", async () => {
    global.fetch = vi.fn().mockResolvedValue(readyResponse("/api/preview/cache/asset_f1"));

    render(<PptxRenderer assetId="asset_f1" mode="full" />);

    const pdf = await screen.findByTestId("pdf-renderer");
    expect(pdf).toHaveAttribute("data-mode", "full");
  });

  it("full mode shows the download ErrorTile on conversion failure", async () => {
    global.fetch = vi.fn().mockResolvedValue(errorResponse(500));

    render(
      <PptxRenderer
        assetId="asset_f2"
        mode="full"
        originalUrl="https://example.com/deck.pptx"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("status", { name: /pptx conversion failed/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /download original/i })).toHaveAttribute(
      "href",
      "https://example.com/deck.pptx",
    );
  });

  it("full mode with the flag off shows the ErrorTile fallback without a network call", () => {
    flagState.pptxConversionEnabled = false;
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(<PptxRenderer assetId="asset_f3" mode="full" />);

    expect(
      screen.getByRole("status", { name: /requires server conversion/i }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
