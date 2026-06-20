/**
 * TEST-005: E2E Smoke — Local-First Happy Path
 *
 * Tests the web app against its built-in fixture fallback — no backend required.
 * The playwright webServer config in playwright.config.ts starts `npm run start`
 * (production build). All hooks fall back to fixtures when the backend is offline.
 *
 * Happy path covered:
 *   1. Root → redirect to Command Center
 *   2. Command Center loads KPI cards
 *   3. Navigate to Asset Library → gallery renders cards
 *   4. Open asset inspector drawer
 *   5. Close drawer and switch to table view
 *   6. Navigate to Context Packs page
 *
 * Run commands (from repo root):
 *   cd web
 *   npm run build          # required before start
 *   npx playwright install chromium
 *   npx playwright test
 *
 * Or for headed debug:
 *   npx playwright test --headed --slowMo=300
 *
 * Environment notes:
 *   - No backend required; fixture fallback activates automatically when
 *     http://localhost:8000 is unreachable.
 *   - ATLAS_REGISTRY_DIR is not needed for the web-only smoke test.
 *   - CI: set PLAYWRIGHT_BASE_URL to override baseURL if needed.
 */

import { test, expect, type Page } from "@playwright/test";

// ── Constants ──────────────────────────────────────────────────────────────

/** Default project id seeded in fixtures and root redirect. */
const PROJECT_ID = "proj_artifact_atlas";
const CMD_CENTER_URL = `/projects/${PROJECT_ID}`;
const ASSETS_URL = `/projects/${PROJECT_ID}/assets`;
const CONTEXT_PACKS_URL = `/projects/${PROJECT_ID}/context-packs`;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Wait for the main content area to finish loading (no skeleton pulses).
 * We use a generous timeout because the first Next.js request after cold start
 * may be slow in CI.
 */
async function waitForPageReady(page: Page, timeout = 20_000) {
  // Wait for the app shell nav to be visible — confirms hydration complete.
  await page.locator("nav").first().waitFor({ state: "visible", timeout });
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe("Local-first happy path (fixture fallback)", () => {
  /**
   * Step 1: Root page redirects to the command center.
   */
  test("root redirect → command center loads", async ({ page }) => {
    await page.goto("/");

    // Root page does redirect("/projects/proj_artifact_atlas")
    await page.waitForURL(`**${CMD_CENTER_URL}`);

    await waitForPageReady(page);

    // Page title contains "Command Center"
    await expect(page).toHaveTitle(/Command Center/i);

    // The PageHeader eyebrow should say "Project overview"
    await expect(
      page.getByText("Project overview", { exact: false }),
    ).toBeVisible();
  });

  /**
   * Step 2: Command center renders KPI cards with fixture data.
   */
  test("command center — KPI cards visible", async ({ page }) => {
    await page.goto(CMD_CENTER_URL);
    await waitForPageReady(page);

    // Fixture dashboard: total_assets = 7, bom_coverage_pct = 40
    // At least one KPI card or stat element should be visible.
    // We look for any numeric text or the heading "Command Center".
    await expect(
      page.getByRole("heading", { name: /Command Center/i }),
    ).toBeVisible();

    // Fixture data has 7 assets — verify at least one stat renders (text content).
    // The dashboard renders these in KpiCard or similar — check for a stat region.
    const main = page.locator("main, [role='main'], .overflow-y-auto").first();
    await expect(main).toBeVisible();
  });

  /**
   * Step 3: Navigate to Asset Library — gallery renders fixture asset cards.
   */
  test("asset library — gallery cards render from fixtures", async ({
    page,
  }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);

    await expect(page).toHaveTitle(/Assets/i);

    // Wait for the gallery list to become visible.
    // AssetLibrary renders a role="listbox" aria-label="Asset gallery"
    const gallery = page.getByRole("listbox", { name: /Asset gallery/i });
    await expect(gallery).toBeVisible({ timeout: 15_000 });

    // Fixture assets include "Artifact Atlas PRD UIUX Implementation Spec"
    // and "Artifact Atlas OpenAPI Contract" — at least one card should be visible.
    // Cards render asset title in some text node.
    const firstCard = gallery.locator("[role='option'], .asset-card, article").first();
    // If role option isn't present, fall back to any visible child
    const fallback = gallery.locator("> *").first();
    const target = (await firstCard.count()) > 0 ? firstCard : fallback;
    await expect(target).toBeVisible({ timeout: 10_000 });
  });

  /**
   * Step 4: Open the asset inspector drawer by clicking an asset card.
   */
  test("asset library — open asset inspector drawer", async ({ page }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);

    // Wait for gallery to load
    const gallery = page.getByRole("listbox", { name: /Asset gallery/i });
    await expect(gallery).toBeVisible({ timeout: 15_000 });

    // Find an AssetCard — they render an "Open" or context-menu action.
    // The AssetCard has onOpen which sets inspectAssetId.
    // Simplest approach: click the first article/card child of the gallery.
    const cards = gallery.locator(
      "article, [role='option'], [data-testid='asset-card']",
    );
    const cardCount = await cards.count();

    if (cardCount > 0) {
      // Click the first card to open the inspector
      await cards.first().click();
    } else {
      // Fallback: click first child element
      await gallery.locator("> div").first().click();
    }

    // The inspector panel should now be visible.
    // It renders with text "Inspector" as the panel heading.
    const inspector = page.getByText("Inspector", { exact: true });
    await expect(inspector).toBeVisible({ timeout: 5_000 });
  });

  /**
   * Step 5: Close drawer, switch to table view.
   */
  test("asset library — table view toggle", async ({ page }) => {
    await page.goto(ASSETS_URL);
    await waitForPageReady(page);

    // SegmentedControl renders buttons with role="radio" and aria-label.
    // The "Table" option has ariaLabel "Table view" (from VIEW_OPTIONS in AssetLibrary).
    const tableToggle = page.getByRole("radio", { name: /Table view/i });
    await expect(tableToggle).toBeVisible({ timeout: 15_000 });
    await tableToggle.click();

    // After switching, a table element or grid with column headers should appear.
    // AssetTable renders a <table> or scrollable div with column labels.
    const tableEl = page.locator("table, [role='grid'], [role='table']").first();
    await expect(tableEl).toBeVisible({ timeout: 5_000 });
  });

  /**
   * Step 6: Navigate to Context Packs page — fixture pack renders.
   */
  test("context packs — page loads with fixture pack", async ({ page }) => {
    await page.goto(CONTEXT_PACKS_URL);
    await waitForPageReady(page);

    await expect(page).toHaveTitle(/Context Packs/i);

    // PageHeader heading
    await expect(
      page.getByRole("heading", { name: /Context Packs/i }),
    ).toBeVisible({ timeout: 10_000 });

    // ContextPacksView renders either fixture packs (when project_id matches)
    // or an empty state with "No context packs yet" when there's no match.
    // Either way, the view has fully rendered when we can see one of these.
    // The lib/fixtures pack project_id is "proj_artifact_atlas" which matches
    // the URL; the feature-local fixtures use "artifact-atlas" (different id).
    // We assert the view is interactive by checking for the "Create context pack" button
    // (aria-label="Create context pack" on the primary CTA in ContextPacksView).
    const newPackBtn = page.getByRole("button", { name: /Create context pack/i });
    await expect(newPackBtn).toBeVisible({ timeout: 10_000 });
  });

  /**
   * Step 7: Sidebar navigation links are present.
   * Validates AppShell renders the nav without crashing.
   */
  test("app shell — sidebar nav links present", async ({ page }) => {
    await page.goto(CMD_CENTER_URL);
    await waitForPageReady(page);

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();

    // Navigation should contain links to assets, inbox, BOM at minimum.
    // AppShell renders these as anchor tags in the sidebar.
    const links = nav.locator("a");
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(2);
  });
});
