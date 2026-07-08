/**
 * P6-003 (flags-on, light mode) — live axe-core sweep.
 *
 * Mirrors the severity gate already established by the vitest suite
 * (__tests__/a11y.test.tsx): fail only on "serious"/"critical" impact
 * violations against WCAG 2.0/2.1 A/AA, scanned via @axe-core/playwright
 * against the real, hydrated, flags-ON DOM (ui-tabbed-modal pinned on).
 *
 * This sweep found 6 distinct pre-existing serious/critical rule violations
 * across these surfaces — documented in ui-polish-pass-findings.md F-005 and
 * encoded in helpers.ts's KNOWN_VIOLATION_IDS so the gate here still catches
 * REGRESSIONS (any new/different violation fails the run) without either
 * silently hiding the known ones or blocking on issues that need a real
 * design/upstream fix rather than a sprint-scoped patch. Two other bugs this
 * sweep surfaced (EntityModal focus-restore, ZoneCard's click-to-open guard)
 * were unambiguous, narrow a11y/interaction fixes and were applied directly
 * — see features/ui/components/EntityModal/index.tsx and
 * features/ui/components/Card/ZoneCard.tsx.
 *
 * Surfaces swept:
 *   - Command Center dashboard
 *   - Asset library — gallery view
 *   - Asset library — table view
 *   - One EntityModal per surface (assets, inbox, coverage, templates, bom)
 *   - AssetViewer format sweep (reuses the mocked format assets)
 */
import { test, expect } from "@playwright/test";
import {
  projectUrl,
  waitForPageReady,
  mockFormatAssets,
  runAxe,
  expectNoNewSeriousViolations,
} from "./helpers";

test.describe("axe-core — light mode (flags-on)", () => {
  test("Command Center dashboard", async ({ page }) => {
    await page.goto(projectUrl(""));
    await waitForPageReady(page);
    await expect(page.getByRole("heading", { name: /Command Center/i })).toBeVisible();
    expectNoNewSeriousViolations(await runAxe(page), "Command Center");
  });

  test("Asset library — gallery view", async ({ page }) => {
    await page.goto(projectUrl("/assets"));
    await waitForPageReady(page);
    await expect(page.getByRole("listbox", { name: /Asset gallery/i })).toBeVisible({
      timeout: 15_000,
    });
    expectNoNewSeriousViolations(await runAxe(page), "Asset library (gallery)");
  });

  test("Asset library — table view", async ({ page }) => {
    await page.goto(projectUrl("/assets"));
    await waitForPageReady(page);
    await page.getByRole("radio", { name: "Table", exact: true }).click();
    await expect(page.locator("table, [role='grid'], [role='table']").first()).toBeVisible({
      timeout: 10_000,
    });
    expectNoNewSeriousViolations(await runAxe(page), "Asset library (table)");
  });

  test("EntityModal — asset surface", async ({ page }) => {
    await page.goto(projectUrl("/assets"));
    await waitForPageReady(page);
    const gallery = page.getByRole("listbox", { name: /Asset gallery/i });
    await expect(gallery).toBeVisible({ timeout: 15_000 });
    await gallery
      .getByRole("option", { name: "Artifact Atlas PRD UIUX Implementation Spec" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    expectNoNewSeriousViolations(await runAxe(page), "EntityModal (asset)");
  });

  test("EntityModal — inbox surface", async ({ page }) => {
    await page.goto(projectUrl("/inbox"));
    await waitForPageReady(page);
    const queue = page.getByRole("listbox", { name: /Inbox items/i });
    await expect(queue).toBeVisible({ timeout: 15_000 });
    await queue
      .getByRole("option")
      .filter({ hasText: "Modern SaaS Dashboard Interface Screenshot" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    expectNoNewSeriousViolations(await runAxe(page), "EntityModal (inbox)");
  });

  test("EntityModal — coverage surface", async ({ page }) => {
    await page.goto(projectUrl("/coverage"));
    await waitForPageReady(page);
    await page.getByRole("button", { name: /^Product Requirements Document:/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    expectNoNewSeriousViolations(await runAxe(page), "EntityModal (coverage)");
  });

  test("EntityModal — templates surface", async ({ page }) => {
    await page.goto(projectUrl("/templates"));
    await waitForPageReady(page);
    const list = page.getByRole("listbox", { name: /Templates/i });
    await expect(list).toBeVisible({ timeout: 15_000 });
    await list.getByRole("option", { name: "New Product / App" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    expectNoNewSeriousViolations(await runAxe(page), "EntityModal (templates)");
  });

  test("EntityModal — bom surface", async ({ page }) => {
    await page.goto(projectUrl("/bom"));
    await waitForPageReady(page);
    await page
      .getByRole("article", { name: /^BOM slot: Product Requirements Document,/ })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    expectNoNewSeriousViolations(await runAxe(page), "EntityModal (bom)");
  });

  test("AssetViewer format sweep — gallery with all 9 formats + restricted gate", async ({
    page,
    context,
  }) => {
    await mockFormatAssets(context);
    await page.goto(projectUrl("/assets"));
    await waitForPageReady(page);
    await expect(page.getByRole("listbox", { name: /Asset gallery/i })).toBeVisible({
      timeout: 15_000,
    });
    // Let the fetch-driven renderers (image/pdf/csv/tsv/content) settle.
    await page.waitForTimeout(1_000);
    expectNoNewSeriousViolations(await runAxe(page), "AssetViewer format sweep");
  });
});
