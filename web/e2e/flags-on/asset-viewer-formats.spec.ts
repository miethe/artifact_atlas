/**
 * P6-009 (flags-on) — AssetViewer per-format smoke + agent_access gate.
 *
 * Scope note (read before extending this file):
 * AssetViewer is only ever mounted with `mode="thumbnail"` in the live app
 * today — the gallery's AssetCardThumbnail (features/assets/components/
 * AssetCard.tsx). Nothing in the current product wires `mode="full"` into a
 * live route: the EntityModal "Preview" tab (AssetPreviewTabPanel.tsx) uses
 * the separate, simpler `AssetPreview` component (icon/type badge only, not
 * AssetViewer), and no other panel imports AssetViewer at all. That's a
 * pre-existing gap surfaced while closing F-002, not something introduced or
 * fixed by this test sprint — see F-004 in ui-polish-pass-findings.md.
 *
 * Consequently:
 *   - image / pdf / csv / tsv / markdown-code formats genuinely fetch + parse
 *     real bytes in thumbnail mode too (only pixel dimensions differ from
 *     "full"), so this suite exercises their real renderer logic live.
 *   - docx / pptx / audio / video render icon-only tiles in thumbnail mode by
 *     design (perf: no per-card network/parse cost in a grid) — this suite
 *     can only smoke-test that the dispatcher resolves the right icon tile
 *     without crashing. Their "full" rendering logic (docx-preview DOM
 *     mutation, react-pdf via PptxRenderer's conversion seam, native
 *     <audio>/<video> playback) remains covered by
 *     __tests__/asset-viewer-extensions.test.tsx (vitest/jsdom) — that suite
 *     already passes per F-002's baseline (75/75).
 *
 * All content is served via context.route() mocks against fixture bytes in
 * e2e/fixtures/ (see helpers.ts) — no changes to lib/fixtures.ts (the
 * shipped, real fallback data for the live app when the backend is down).
 */
import { test, expect } from "@playwright/test";
import {
  FORMAT_ASSETS,
  API_BASE,
  mockFormatAssets,
  projectUrl,
  waitForPageReady,
} from "./helpers";

const ASSETS_URL = projectUrl("/assets");

test.describe("AssetViewer — per-format thumbnail smoke (flags-on)", () => {
  test.beforeEach(async ({ context }) => {
    await mockFormatAssets(context);
  });

  async function cardFor(page: import("@playwright/test").Page, title: string) {
    const gallery = page.getByRole("listbox", { name: /Asset gallery/i });
    await expect(gallery).toBeVisible({ timeout: 15_000 });
    const card = gallery.getByRole("option", { name: title });
    await expect(card).toBeVisible({ timeout: 10_000 });
    return card;
  }

  test("image (png) — renders a real <img> preview", async ({ page }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_image")!;
    const card = await cardFor(page, asset.title);
    await expect(card.getByAltText(`Preview of ${asset.title}`)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("pdf — react-pdf renders a real page (canvas) from fetched bytes", async ({
    page,
  }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_pdf")!;
    const card = await cardFor(page, asset.title);
    // react-pdf's <Page> renders a <canvas>; absence + "PDF failed to load"
    // text would indicate the fixture bytes didn't parse.
    await expect(card.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText(/PDF failed to load/i)).toHaveCount(0);
  });

  test("markdown/code — ContentRenderer fetches + previews real text", async ({
    page,
  }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_content_md")!;
    const card = await cardFor(page, asset.title);
    await expect(card.getByText(/Artifact Atlas fixture/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("csv — parses fetched bytes into a mini preview table", async ({ page }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_csv")!;
    const card = await cardFor(page, asset.title);
    await expect(card.locator("table")).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText("name", { exact: true })).toBeVisible();
  });

  test("tsv — parses tab-delimited bytes into a mini preview table", async ({
    page,
  }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_tsv")!;
    const card = await cardFor(page, asset.title);
    await expect(card.locator("table")).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText("name", { exact: true })).toBeVisible();
  });

  test("docx — resolves to the Word-document icon tile (no crash)", async ({
    page,
  }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_docx")!;
    const card = await cardFor(page, asset.title);
    await expect(card.locator('[aria-label="Word document"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test("pptx — resolves to the PowerPoint icon tile (no crash)", async ({ page }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_pptx")!;
    const card = await cardFor(page, asset.title);
    await expect(
      card.locator('[aria-label="PowerPoint presentation"]'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("audio — resolves to the compact icon+filename tile (no crash)", async ({
    page,
  }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_audio")!;
    const card = await cardFor(page, asset.title);
    // The title text appears twice in the card (AssetCard's own title
    // paragraph + AudioRenderer's thumbnail filename span) — .first() is
    // enough to confirm the tile rendered without picking one over the other.
    await expect(card.getByText(asset.title).first()).toBeVisible({ timeout: 10_000 });
    // Thumbnail mode never mounts a real <audio> element (AC: no N-way
    // network fetch per grid card) — confirm that invariant holds live.
    await expect(card.locator("audio")).toHaveCount(0);
  });

  test("video — resolves to the static icon tile, no <video> mounted", async ({
    page,
  }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_video")!;
    const card = await cardFor(page, asset.title);
    await expect(card).toBeVisible();
    await expect(card.locator("video")).toHaveCount(0);
    await expect(card.getByText(/failed to load|not supported/i)).toHaveCount(0);
  });

  test("agent_access gate — metadata_only asset shows the restricted placeholder and never fetches content", async ({
    page,
  }) => {
    const contentRequests: string[] = [];
    const restrictedContentUrl = `${API_BASE}/api/preview/asset/e2e_fmt_restricted/content`;
    page.on("request", (req) => {
      if (req.url() === restrictedContentUrl) {
        contentRequests.push(req.url());
      }
    });

    await page.goto(ASSETS_URL);
    await waitForPageReady(page);
    const asset = FORMAT_ASSETS.find((a) => a.id === "e2e_fmt_restricted")!;
    const card = await cardFor(page, asset.title);

    await expect(
      card.getByRole("status", { name: /Content access restricted/i }),
    ).toBeVisible({ timeout: 10_000 });
    expect(contentRequests).toHaveLength(0);
  });
});
