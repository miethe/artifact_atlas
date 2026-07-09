/**
 * Smoke tests for the CSV/TSV, Audio, and Video AssetViewer renderers, plus
 * dispatcher routing coverage for the new HtmlRenderer and end-to-end coverage
 * that AssetPreviewTabPanel + AssetDetail mount AssetViewer (not the legacy
 * icon-only AssetPreview placeholder).
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CsvRenderer } from "@/features/assets/components/AssetViewer/CsvRenderer";
import { AudioRenderer } from "@/features/assets/components/AssetViewer/AudioRenderer";
import { VideoRenderer } from "@/features/assets/components/AssetViewer/VideoRenderer";
import { AssetViewer } from "@/features/assets/components/AssetViewer";
import type { Asset } from "@/lib/types";

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

// ---------------------------------------------------------------------------
// AssetViewer HTML routing
// ---------------------------------------------------------------------------
function makeHtmlAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "asset_html_1",
    title: "Sample doc",
    source_kind: "local",
    uri: "https://example.com/sample.html",
    status: "canonical",
    sensitivity: "public",
    agent_access: "preview_allowed",
    mime_type: "text/html",
    captured_at: "2026-07-09T00:00:00Z",
    ...overrides,
  };
}

describe("AssetViewer HTML routing", () => {
  it("routes text/html mime to a sandboxed iframe (allow-scripts, open-in-new-tab)", () => {
    render(<AssetViewer asset={makeHtmlAsset()} mode="full" />);

    const iframe = screen.getByTitle(/html preview of sample doc/i) as HTMLIFrameElement;
    expect(iframe.tagName).toBe("IFRAME");
    // MUST NOT include allow-same-origin.
    expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");

    const openLink = screen.getByRole("link", { name: /open in new tab/i });
    expect(openLink).toHaveAttribute("target", "_blank");
    expect(openLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("routes .html extension when mime_type is absent", () => {
    render(
      <AssetViewer
        asset={makeHtmlAsset({ mime_type: null, uri: "file:///tmp/report.html" })}
        mode="full"
      />,
    );
    expect(screen.getByTitle(/html preview of/i)).toBeInTheDocument();
  });

  it("thumbnail mode: iframe is inert (sandbox=\"\", pointer-events-none, tabIndex=-1)", () => {
    const { container } = render(<AssetViewer asset={makeHtmlAsset()} mode="thumbnail" />);
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("sandbox")).toBe("");
    expect(iframe!.getAttribute("tabindex")).toBe("-1");
    expect(iframe!.className).toContain("pointer-events-none");
  });

  it("restricted access still short-circuits before the html renderer", () => {
    render(
      <AssetViewer
        asset={makeHtmlAsset({ agent_access: "metadata_only" })}
        mode="full"
      />,
    );
    expect(screen.getByRole("status", { name: /content access restricted/i })).toBeInTheDocument();
    expect(screen.queryByTitle(/html preview of/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AssetPreviewTabPanel + AssetDetail — verify they mount AssetViewer, not the
// legacy icon-only AssetPreview placeholder. An audio asset is the cleanest
// signal: AssetViewer → real <audio> element; AssetPreview → icon only.
// ---------------------------------------------------------------------------
const AUDIO_ASSET: Asset = {
  id: "asset_audio_mount_1",
  title: "track.mp3",
  source_kind: "local",
  uri: "file:///tmp/track.mp3",
  original_uri: "https://example.com/track.mp3",
  mime_type: "audio/mpeg",
  status: "canonical",
  sensitivity: "public",
  agent_access: "preview_allowed",
  captured_at: "2026-07-09T00:00:00Z",
};

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const [qc] = React.useState(() => makeQC());
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

vi.mock("@/lib/hooks/useAssets", () => ({
  useAsset: () => ({ data: AUDIO_ASSET, isLoading: false, isError: false }),
  usePromoteAsset: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateAsset: () => ({ mutate: vi.fn(), isPending: false }),
}));

// @miethe/ui's dist has broken subpath imports under vitest (missing ./dist/
// primitives/Badge, content-viewer/FileTree). Mock the subpath barrels so
// transitive dependencies resolve.
vi.mock("@miethe/ui/primitives", () => ({ Badge: () => null }));
vi.mock("@miethe/ui/content-viewer", () => ({
  ContentPane: ({ children }: { children?: React.ReactNode }) => <div data-testid="content-pane">{children}</div>,
}));

describe("AssetPreviewTabPanel mounts AssetViewer", () => {
  it("renders the AssetViewer dispatcher (native <audio>) for an audio asset", async () => {
    const { default: AssetPreviewTabPanel } = await import(
      "@/features/assets/components/EntityModal/AssetPreviewTabPanel"
    );
    render(
      <Wrapper>
        <AssetPreviewTabPanel entityType="asset" entityId={AUDIO_ASSET.id} projectId="proj_1" />
      </Wrapper>,
    );
    // AssetViewer → AudioRenderer → labelled <audio> element. AssetPreview
    // would have rendered a FileAudio icon and no <audio> node.
    expect(screen.getByLabelText(/audio player for track\.mp3/i).tagName).toBe("AUDIO");
  });
});

describe("AssetDetail mounts AssetViewer", () => {
  it("renders the AssetViewer dispatcher (native <audio>) for an audio asset", async () => {
    const { AssetDetail } = await import("@/features/assets/AssetDetail");
    render(
      <Wrapper>
        <AssetDetail assetId={AUDIO_ASSET.id} projectId="proj_1" />
      </Wrapper>,
    );
    expect(screen.getByLabelText(/audio player for track\.mp3/i).tagName).toBe("AUDIO");
  });
});
