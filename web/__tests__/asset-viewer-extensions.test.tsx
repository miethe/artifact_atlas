/**
 * Smoke tests for the CSV/TSV, Audio, and Video AssetViewer renderers.
 *
 * Covers:
 * - CsvRenderer: parses quoted CSV (commas/newlines inside quoted fields),
 *   renders a table, and shows a truncation notice past MAX_RENDERED_ROWS.
 * - AudioRenderer: renders a native <audio> element in full mode, a compact
 *   icon+filename tile in thumbnail mode, and falls back to ErrorTile on
 *   playback error.
 * - VideoRenderer: renders a native <video> element in full mode, a static
 *   icon tile in thumbnail mode (no <video> mounted), and falls back to
 *   ErrorTile on playback error.
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import { CsvRenderer } from "@/features/assets/components/AssetViewer/CsvRenderer";
import { AudioRenderer } from "@/features/assets/components/AssetViewer/AudioRenderer";
import { VideoRenderer } from "@/features/assets/components/AssetViewer/VideoRenderer";

// ---------------------------------------------------------------------------
// CsvRenderer test helper — CsvRenderer now fetches via arrayBuffer() (a
// bounded Range request, MAJOR fix) instead of text(), so every mocked
// Response needs an arrayBuffer() implementation and a headers.get() stub
// for the Content-Range lookup on 206 responses.
// ---------------------------------------------------------------------------
function mockCsvResponse(
  text: string,
  opts: { status?: number; contentRangeTotal?: number } = {},
): Response {
  const status = opts.status ?? 200;
  const bytes = new TextEncoder().encode(text);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-range" && opts.contentRangeTotal !== undefined
          ? `bytes 0-${Math.max(bytes.byteLength - 1, 0)}/${opts.contentRangeTotal}`
          : null,
    },
    text: async () => text,
    arrayBuffer: async () => bytes.buffer,
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// CsvRenderer
// ---------------------------------------------------------------------------
describe("CsvRenderer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses quoted CSV fields (embedded commas/newlines) and renders a table", async () => {
    const csvText =
      'name,bio,age\n' +
      '"Doe, Jane","Likes ""quotes""\nand newlines",30\n' +
      'Smith,Plain,40\n';

    global.fetch = vi.fn().mockResolvedValue(mockCsvResponse(csvText));

    render(<CsvRenderer src="/api/preview/asset_1/content" mode="full" />);

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: "name" })).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: "bio" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "age" })).toBeInTheDocument();
    expect(screen.getByText("Doe, Jane")).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.textContent === 'Likes "quotes"\nand newlines'),
    ).toBeInTheDocument();
    expect(screen.getByText("Smith")).toBeInTheDocument();
  });

  it("caps rendered rows and shows a truncation notice for large files", async () => {
    const header = "id,value\n";
    const rows = Array.from({ length: 1200 }, (_, i) => `${i},v${i}`).join("\n");
    const csvText = header + rows + "\n";

    global.fetch = vi.fn().mockResolvedValue(mockCsvResponse(csvText));

    render(<CsvRenderer src="/api/preview/asset_2/content" mode="full" />);

    await waitFor(() => {
      expect(screen.getByText(/showing first/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/1,000/)).toBeInTheDocument();
    expect(screen.getByText(/1,200/)).toBeInTheDocument();
  });

  it("shows an error tile when the fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockCsvResponse("", { status: 500 }));

    render(
      <CsvRenderer
        src="/api/preview/asset_3/content"
        mode="full"
        originalUrl="https://example.com/original.csv"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("status", { name: /table failed to load/i })).toBeInTheDocument();
    });
  });

  it("parses TSV content when isTsv is set", async () => {
    const tsvText = "name\tvalue\nfoo\t1\nbar\t2\n";

    global.fetch = vi.fn().mockResolvedValue(mockCsvResponse(tsvText));

    render(<CsvRenderer src="/api/preview/asset_4/content" isTsv mode="full" />);

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: "name" })).toBeInTheDocument();
    });
    expect(screen.getByText("foo")).toBeInTheDocument();
    expect(screen.getByText("bar")).toBeInTheDocument();
  });

  it("requests a bounded byte range instead of downloading the whole file", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockCsvResponse("a,b\n1,2\n"));

    render(<CsvRenderer src="/api/preview/asset_range/content" mode="full" />);

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: "a" })).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/preview/asset_range/content",
      { headers: { Range: "bytes=0-2097151" } },
    );
  });

  it("drops the trailing partial line and shows a byte-cap notice when the server truncates via 206", async () => {
    // Simulate a Range-honoring 206 response whose slice cuts off mid-row
    // (last "record" has no trailing newline) and whose Content-Range total
    // is far larger than what was returned — i.e. a genuinely truncated file.
    const csvText = "id,value\n0,aaa\n1,bb";
    global.fetch = vi.fn().mockResolvedValue(
      mockCsvResponse(csvText, { status: 206, contentRangeTotal: 50_000_000 }),
    );

    render(<CsvRenderer src="/api/preview/asset_big/content" mode="full" />);

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: "id" })).toBeInTheDocument();
    });

    // The dangling "1,bb" partial row was dropped — only the complete row survives.
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("aaa")).toBeInTheDocument();
    expect(screen.queryByText("bb")).not.toBeInTheDocument();

    // Byte-cap truncation notice is shown even though the row count itself
    // never approached MAX_RENDERED_ROWS.
    expect(screen.getByText(/exceeds the 2 MB preview limit/i)).toBeInTheDocument();
  });

  it("does not drop a final quoted-empty-field row at EOF (MINOR parser fix)", async () => {
    // A trailing record consisting solely of an empty quoted field, with no
    // final delimiter/newline after it, used to be silently dropped by the
    // EOF flush.
    const csvText = 'header\n""';
    global.fetch = vi.fn().mockResolvedValue(mockCsvResponse(csvText));

    render(<CsvRenderer src="/api/preview/asset_empty_quoted/content" mode="full" />);

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: "header" })).toBeInTheDocument();
    });

    // One header <tr> + one data <tr> — the empty-quoted-field row survived.
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// AudioRenderer
// ---------------------------------------------------------------------------
describe("AudioRenderer", () => {
  it("renders a native audio element with the given src in full mode", () => {
    render(
      <AudioRenderer
        src="/api/preview/asset_audio/content"
        filename="track.mp3"
        mode="full"
      />,
    );

    const audio = screen.getByLabelText(/audio player for track\.mp3/i) as HTMLAudioElement;
    expect(audio).toBeInTheDocument();
    expect(audio.tagName).toBe("AUDIO");
    expect(audio).toHaveAttribute("src", "/api/preview/asset_audio/content");
    expect(screen.getByText("track.mp3")).toBeInTheDocument();
  });

  it("renders a compact icon+filename tile in thumbnail mode without an audio element", () => {
    render(
      <AudioRenderer
        src="/api/preview/asset_audio/content"
        filename="track.mp3"
        mode="thumbnail"
      />,
    );

    expect(screen.queryByLabelText(/audio player/i)).not.toBeInTheDocument();
    expect(screen.getByText("track.mp3")).toBeInTheDocument();
  });

  it("falls back to an error tile on playback error", () => {
    render(
      <AudioRenderer
        src="/api/preview/asset_audio/content"
        filename="track.mp3"
        mode="full"
        originalUrl="https://example.com/track.mp3"
      />,
    );

    const audio = screen.getByLabelText(/audio player for track\.mp3/i);
    fireEvent.error(audio);

    expect(
      screen.getByRole("status", { name: /audio format not supported/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VideoRenderer
// ---------------------------------------------------------------------------
describe("VideoRenderer", () => {
  it("renders a native video element with the given src in full mode", () => {
    render(
      <VideoRenderer
        src="/api/preview/asset_video/content"
        filename="clip.mp4"
        mode="full"
      />,
    );

    const video = screen.getByLabelText(/video preview of clip\.mp4/i) as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("src", "/api/preview/asset_video/content");
  });

  it("renders a static icon tile in thumbnail mode without mounting a video element", () => {
    render(
      <VideoRenderer
        src="/api/preview/asset_video/content"
        filename="clip.mp4"
        mode="thumbnail"
      />,
    );

    expect(screen.queryByLabelText(/video preview/i)).not.toBeInTheDocument();
  });

  it("falls back to an error tile on playback error", () => {
    render(
      <VideoRenderer
        src="/api/preview/asset_video/content"
        filename="clip.mp4"
        mode="full"
        originalUrl="https://example.com/clip.mp4"
      />,
    );

    const video = screen.getByLabelText(/video preview of clip\.mp4/i);
    fireEvent.error(video);

    expect(
      screen.getByRole("status", { name: /video format not supported/i }),
    ).toBeInTheDocument();
  });
});
