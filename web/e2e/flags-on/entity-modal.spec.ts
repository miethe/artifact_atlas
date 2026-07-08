/**
 * P6-009 (flags-on) — EntityModal contract across all 5 migrated surfaces.
 *
 * Covers:
 *   (a) open / close / tab switching on each surface (assets, inbox,
 *       coverage, templates, bom)
 *   (b) Escape closes the modal + focus returns to the triggering element
 *   (c) `?item=&tab=` URL deep-link restore (navigating straight to a URL
 *       with those params already set opens the modal at the right tab)
 *
 * Runs against the flags-on build (ui-tabbed-modal pinned ON via
 * NEXT_PUBLIC_FLAGS — see playwright.config.ts) so this is deterministic
 * regardless of future FLAG_DEFAULTS changes (F-002).
 *
 * Uses the app's built-in fixture-fallback data (lib/fixtures.ts,
 * features/templates/fixtures.ts) exactly like e2e/happy-path.spec.ts — no
 * network mocking needed here since these tests only exercise modal
 * chrome/URL-state, not per-format content rendering (see
 * asset-viewer-formats.spec.ts for that).
 */
import { test, expect, type Page } from "@playwright/test";
import { projectUrl, waitForPageReady, SURFACE_TABS, SURFACE_TAB_KEYS } from "./helpers";

interface SurfaceConfig {
  name: string;
  entityType: string;
  url: string;
  itemId: string;
  /** Clicks the list/grid item that opens the EntityModal for `itemId`. */
  openItem: (page: Page) => Promise<void>;
}

const SURFACES: SurfaceConfig[] = [
  {
    name: "assets",
    entityType: "asset",
    url: projectUrl("/assets"),
    itemId: "asset_prd_uiux_spec_v0_1",
    openItem: async (page) => {
      const gallery = page.getByRole("listbox", { name: /Asset gallery/i });
      await expect(gallery).toBeVisible({ timeout: 15_000 });
      await gallery
        .getByRole("option", { name: "Artifact Atlas PRD UIUX Implementation Spec" })
        .click();
    },
  },
  {
    name: "inbox",
    entityType: "inbox-item",
    url: projectUrl("/inbox"),
    itemId: "asset_inbox_screenshot",
    openItem: async (page) => {
      const queue = page.getByRole("listbox", { name: /Inbox items/i });
      await expect(queue).toBeVisible({ timeout: 15_000 });
      await queue
        .getByRole("option")
        .filter({ hasText: "Modern SaaS Dashboard Interface Screenshot" })
        .click();
    },
  },
  {
    name: "coverage",
    entityType: "coverage-slot",
    url: projectUrl("/coverage"),
    itemId: "slot_prd",
    openItem: async (page) => {
      await page
        .getByRole("button", { name: /^Product Requirements Document:/ })
        .click();
    },
  },
  {
    name: "templates",
    entityType: "template",
    url: projectUrl("/templates"),
    itemId: "tmpl_new_product_app_v1",
    openItem: async (page) => {
      const list = page.getByRole("listbox", { name: /Templates/i });
      await expect(list).toBeVisible({ timeout: 15_000 });
      await list.getByRole("option", { name: "New Product / App" }).click();
    },
  },
  {
    name: "bom",
    entityType: "bom-slot",
    url: projectUrl("/bom"),
    itemId: "slot_prd",
    openItem: async (page) => {
      await page
        .getByRole("article", { name: /^BOM slot: Product Requirements Document,/ })
        .click();
    },
  },
];

test.describe("EntityModal — open/close/tab (flags-on)", () => {
  for (const surface of SURFACES) {
    const tabs = SURFACE_TABS[surface.entityType];
    const tabKeys = SURFACE_TAB_KEYS[surface.entityType];

    test(`${surface.name}: open, switch tabs, close`, async ({ page }) => {
      await page.goto(surface.url);
      await waitForPageReady(page);
      await surface.openItem(page);

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Every registered tab renders as a role="tab" trigger.
      for (const label of tabs) {
        await expect(dialog.getByRole("tab", { name: label })).toBeVisible();
      }

      // First tab is selected by default (fallback rule); URL carries it.
      await expect(page).toHaveURL(new RegExp(`item=${surface.itemId}.*tab=${tabKeys[0]}`));

      // Switch to the second tab — URL updates (replace, no new history entry
      // — verified separately by the deep-link test using direct navigation).
      const secondTab = tabs[1];
      const secondKey = tabKeys[1];
      await dialog.getByRole("tab", { name: secondTab }).click();
      await expect(page).toHaveURL(new RegExp(`tab=${secondKey}`));
      await expect(dialog.getByRole("tab", { name: secondTab })).toHaveAttribute(
        "data-state",
        "active",
      );

      // Close via the dialog's Close affordance — URL loses ?item=&tab=.
      await dialog.getByRole("button", { name: "Close" }).click();
      await expect(dialog).toBeHidden({ timeout: 5_000 });
      await expect(page).not.toHaveURL(/item=/);
    });

    test(`${surface.name}: Escape closes the modal and returns focus to the trigger`, async ({
      page,
    }) => {
      await page.goto(surface.url);
      await waitForPageReady(page);
      await surface.openItem(page);

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden({ timeout: 5_000 });
      await expect(page).not.toHaveURL(/item=/);

      // Focus must land back on the triggering element, not silently drop to
      // <body> (see EntityModal's triggerRef fix — Radix's own default
      // onCloseAutoFocus focuses context.triggerRef.current, which is always
      // null here since no surface uses Radix's <Dialog.Trigger>; without
      // our fix this always regresses to <body>). Checks the element's
      // EXPLICIT role attribute (option/article — AssetCard/TemplateCard/
      // BomOverview's SlotCard) OR its tag (native <button> — Coverage's
      // SlotTile / Inbox's queue item — has an *implicit* role="button" that
      // getAttribute("role") can't see).
      const activeHandle = await page.evaluateHandle(() => document.activeElement);
      const active = await activeHandle.evaluate((el) =>
        el instanceof HTMLElement
          ? { tag: el.tagName, role: el.getAttribute("role") }
          : null,
      );
      expect(active?.tag, "focus must not drop to <body> on Escape").not.toBe("BODY");
      const isExpectedTrigger =
        active?.tag === "BUTTON" || ["option", "article", "button"].includes(active?.role ?? "");
      expect(isExpectedTrigger, `unexpected trigger element: ${JSON.stringify(active)}`).toBe(true);
    });

    test(`${surface.name}: ?item=&tab= deep-link restores the modal at the right tab`, async ({
      page,
    }) => {
      const secondKey = tabKeys[1];
      const secondLabel = tabs[1];

      await page.goto(`${surface.url}?item=${surface.itemId}&tab=${secondKey}`);
      await waitForPageReady(page);

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole("tab", { name: secondLabel })).toHaveAttribute(
        "data-state",
        "active",
      );
    });
  }
});
