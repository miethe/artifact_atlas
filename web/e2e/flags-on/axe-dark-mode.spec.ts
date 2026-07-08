/**
 * DM-5 (flags-on) — dark-mode axe-core pass.
 *
 * The "dark-mode" flag (default OFF, see lib/flags.ts) is pinned ON for this
 * project's build (playwright.config.ts FLAGS_ON) so the ThemeToggle mounts
 * and the no-FOUC script exists — but dark styling itself keys purely off
 * `[data-theme="dark"]` on <html> (app/globals.css), not the flag. We force
 * that attribute (+ the matching localStorage preference the no-FOUC script
 * reads) via addInitScript so the sweep is deterministic regardless of the
 * OS/browser color-scheme the test runs under.
 *
 * Same severity gate + known-violations allowlist as axe-sweep.spec.ts (see
 * helpers.ts KNOWN_VIOLATION_IDS / ui-polish-pass-findings.md F-005). Dark
 * mode additionally surfaces many more color-contrast nodes than light mode
 * (expected — DEFER-1 "dark-mode-aa" in docs/mvp-backlog.md is the
 * already-tracked backlog item for a full dark-token contrast pass; this
 * sweep's job is to confirm the flag doesn't crash/regress anything else,
 * not to close DEFER-1).
 */
import { test, expect } from "@playwright/test";
import { projectUrl, waitForPageReady, runAxe, expectNoNewSeriousViolations } from "./helpers";

test.describe("axe-core — dark mode (flags-on, DM-5)", () => {
  test.beforeEach(async ({ page }) => {
    // Runs before any app script — wins the race against the no-FOUC script
    // and forces the resolved theme regardless of prefers-color-scheme.
    await page.addInitScript(() => {
      window.localStorage.setItem("aa-theme", "dark");
      document.documentElement.dataset.theme = "dark";
    });
  });

  test("Command Center dashboard — dark", async ({ page }) => {
    await page.goto(projectUrl(""));
    await waitForPageReady(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("heading", { name: /Command Center/i })).toBeVisible();
    expectNoNewSeriousViolations(await runAxe(page), "Command Center (dark)");
  });

  test("Asset library — gallery, dark", async ({ page }) => {
    await page.goto(projectUrl("/assets"));
    await waitForPageReady(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("listbox", { name: /Asset gallery/i })).toBeVisible({
      timeout: 15_000,
    });
    expectNoNewSeriousViolations(await runAxe(page), "Asset library gallery (dark)");
  });
});
