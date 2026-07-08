/**
 * Shared constants + helpers for the flags-on Playwright project (P6-009 / F-002).
 *
 * This project runs against a build with NEXT_PUBLIC_FLAGS pinned explicitly
 * (see playwright.config.ts) so ui-tabbed-modal / miethe-ui-ds / dark-mode /
 * pptx-server-conversion stay ON regardless of future default changes.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import type { BrowserContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export const PROJECT_ID = "proj_artifact_atlas";

export function projectUrl(rest = ""): string {
  return `/projects/${PROJECT_ID}${rest}`;
}

/** Absolute backend origin the app targets by default (see lib/api.ts). */
export const API_BASE = "http://localhost:8000";

export const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

export function readFixture(name: string): Buffer {
  return fs.readFileSync(path.join(FIXTURES_DIR, name));
}

/** Registered tabs per EntityModal surface (TabRegistry insertion order). */
export const SURFACE_TABS: Record<string, string[]> = {
  asset: ["Preview", "Details", "Links", "Policy"],
  "inbox-item": ["Preview", "Classify", "Links"],
  "coverage-slot": ["Slot Detail", "Coverage Rules"],
  template: ["Preview", "Domains", "Apply"],
  "bom-slot": ["Details", "Assignments", "Links"],
};

/** Tab URL keys (?tab=) parallel to SURFACE_TABS, same insertion order. */
export const SURFACE_TAB_KEYS: Record<string, string[]> = {
  asset: ["preview", "details", "links", "policy"],
  "inbox-item": ["preview", "classify", "links"],
  "coverage-slot": ["slot-detail", "coverage-rules"],
  template: ["preview", "domains", "apply"],
  "bom-slot": ["details", "assignments", "links"],
};

/**
 * Wait for the main app shell nav to be visible — confirms hydration
 * complete (matches the convention in e2e/happy-path.spec.ts).
 */
export async function waitForPageReady(page: Page, timeout = 20_000) {
  await page.locator("nav").first().waitFor({ state: "visible", timeout });
}

// ---------------------------------------------------------------------------
// Asset-content mocking for the AssetViewer per-format sweep
// ---------------------------------------------------------------------------

export interface FormatFixtureAsset {
  id: string;
  title: string;
  mime_type: string;
  agent_access: string;
  /** Fixture file basename under e2e/fixtures/, or null for no-content formats. */
  file: string | null;
  contentType: string | null;
}

/**
 * Synthetic assets covering the 9 tracked AssetViewer formats + the
 * agent_access restricted gate. Deliberately NOT added to lib/fixtures.ts
 * (that file is shipped, real fallback content for the live app) — these are
 * injected purely at the network layer via context.route() below, so
 * production fallback data is untouched.
 */
export const FORMAT_ASSETS: FormatFixtureAsset[] = [
  {
    id: "e2e_fmt_image",
    title: "E2E Format — Image (PNG)",
    mime_type: "image/png",
    agent_access: "read_allowed",
    file: "sample.png",
    contentType: "image/png",
  },
  {
    id: "e2e_fmt_pdf",
    title: "E2E Format — PDF",
    mime_type: "application/pdf",
    agent_access: "read_allowed",
    file: "sample.pdf",
    contentType: "application/pdf",
  },
  {
    id: "e2e_fmt_content_md",
    title: "E2E Format — Markdown / Code",
    mime_type: "text/markdown",
    agent_access: "read_allowed",
    file: "sample.md",
    contentType: "text/markdown",
  },
  {
    id: "e2e_fmt_docx",
    title: "E2E Format — DOCX",
    mime_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    agent_access: "read_allowed",
    file: "sample.docx",
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "e2e_fmt_pptx",
    title: "E2E Format — PPTX",
    mime_type:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    agent_access: "read_allowed",
    // PPTX bytes never leave the server (see PptxRenderer.tsx) — no content file needed.
    file: null,
    contentType: null,
  },
  {
    id: "e2e_fmt_csv",
    title: "E2E Format — CSV",
    mime_type: "text/csv",
    agent_access: "read_allowed",
    file: "sample.csv",
    contentType: "text/csv",
  },
  {
    id: "e2e_fmt_tsv",
    title: "E2E Format — TSV",
    mime_type: "text/tab-separated-values",
    agent_access: "read_allowed",
    file: "sample.tsv",
    contentType: "text/tab-separated-values",
  },
  {
    id: "e2e_fmt_audio",
    title: "E2E Format — Audio (MP3)",
    mime_type: "audio/mpeg",
    agent_access: "read_allowed",
    file: "sample.mp3",
    contentType: "audio/mpeg",
  },
  {
    id: "e2e_fmt_video",
    title: "E2E Format — Video (WebM)",
    mime_type: "video/webm",
    agent_access: "read_allowed",
    file: "sample.webm",
    contentType: "video/webm",
  },
  {
    id: "e2e_fmt_restricted",
    title: "E2E Format — Restricted (metadata_only)",
    mime_type: "application/pdf",
    agent_access: "metadata_only",
    file: null,
    contentType: null,
  },
];

function assetJson(a: FormatFixtureAsset) {
  return {
    id: a.id,
    workspace_id: "ws_artifact_atlas_local",
    project_id: PROJECT_ID,
    title: a.title,
    description: `Fixture asset for the AssetViewer ${a.mime_type} format smoke (P6-009).`,
    artifact_type_id: "artifact_type_reference",
    source_kind: "local",
    uri: `file:///e2e-fixtures/${a.file ?? `${a.id}.bin`}`,
    mime_type: a.mime_type,
    size_bytes: 1024,
    status: "candidate",
    sensitivity: "public",
    agent_access: a.agent_access,
    generated_by: "human",
    captured_at: "2026-07-08T00:00:00Z",
    metadata: {},
  };
}

/**
 * Intercepts the asset-list + single-asset + content-proxy calls so the
 * gallery renders FORMAT_ASSETS instead of (or alongside) the shipped
 * lib/fixtures.ts demo assets, and so AssetViewer's `fetch(contentUrl)` /
 * `<img src>` / `<audio src>` / `<video src>` calls resolve against real,
 * small, format-valid fixture bytes checked into e2e/fixtures/ instead of an
 * unreachable backend.
 */
export async function mockFormatAssets(context: BrowserContext): Promise<void> {
  const byId = new Map(FORMAT_ASSETS.map((a) => [a.id, a]));

  // GET /api/projects/{projectId}/assets — list
  await context.route(`${API_BASE}/api/projects/${PROJECT_ID}/assets**`, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: FORMAT_ASSETS.map(assetJson),
        has_more: false,
        next_cursor: null,
        total: FORMAT_ASSETS.length,
      }),
    });
  });

  // GET /api/assets/{id} — single asset
  await context.route(`${API_BASE}/api/assets/*`, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const url = new URL(route.request().url());
    const id = url.pathname.split("/").pop() ?? "";
    const asset = byId.get(id);
    if (!asset) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(assetJson(asset)),
    });
  });

  // GET /api/preview/asset/{id}/content — content proxy
  await context.route(`${API_BASE}/api/preview/asset/*/content`, async (route) => {
    const url = new URL(route.request().url());
    // /api/preview/asset/{id}/content -> ["", "api", "preview", "asset", "{id}", "content"]
    const id = url.pathname.split("/")[4] ?? "";
    const asset = byId.get(id);
    if (!asset || !asset.file) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: asset.contentType ?? "application/octet-stream",
      body: readFixture(asset.file),
    });
  });
}

// ---------------------------------------------------------------------------
// axe-core severity gate (P6-003 / F-005)
// ---------------------------------------------------------------------------

export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type AxeResults = Awaited<ReturnType<InstanceType<typeof AxeBuilder>["analyze"]>>;
type AxeViolation = AxeResults["violations"][number];

export async function runAxe(page: Page): Promise<AxeResults> {
  // Starve the "doc-has-title" race (see KNOWN_VIOLATION_IDS doc below) —
  // a client-side transition can momentarily leave <title> empty; give it
  // a beat to settle before scanning instead of catching that instant.
  await page
    .waitForFunction(() => document.title.length > 0, { timeout: 2_000 })
    .catch(() => {});
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
}

/**
 * Rule IDs with a documented serious/critical finding already on file
 * (ui-polish-pass-findings.md F-005) as of this live flags-on sweep. Listed
 * here so the gate below can tell a REGRESSION (any other new serious/
 * critical violation — fails the run) apart from a pre-existing, triaged
 * issue that needs a real fix (design-token or upstream @miethe/ui change)
 * rather than a quick patch inside this sprint. Do not add to this list
 * without also adding/updating the corresponding F-005 entry.
 *
 *  - aria-valid-attr-value: EntityModal tab triggers' `aria-controls` points
 *    at an id that never renders — BaseArtifactModal (@miethe/ui) splices
 *    panel children directly instead of wrapping them in Radix's
 *    <Tabs.Content id=...>. Upstream fix required (not in this repo).
 *  - aria-allowed-attr / aria-required-children: AssetTable's custom
 *    virtualized grid gives sortable column headers `role="button"` +
 *    `aria-sort` (only valid on role="columnheader") and the role="grid"
 *    container's children aren't row/rowgroup. Needs an ARIA-structure
 *    rework of AssetTable, out of scope for a test-verification sprint.
 *  - nested-interactive / no-focusable-content: AssetCard/TemplateCard are
 *    role="option" + tabIndex=0 (the whole card is "interactive") AND nest
 *    real <button> quick-actions (Select/Open/Copy/Add-to-pack) inside —
 *    an ARIA anti-pattern. Needs a redesign of how per-card quick-actions
 *    are exposed (e.g. move outside the option, or listbox+toolbar split).
 *  - color-contrast: several design-token contrast gaps (light: sidebar
 *    "Collapse" label ~2.53:1, --ink-faint on sunken bg ~4.35:1, a green
 *    trend indicator ~3.29:1 — all need 4.5:1). Dark mode has far more
 *    (DEFER-1 "dark-mode-aa" is already tracked backlog for exactly this).
 *  - doc-has-title: observed intermittently (a handful of runs out of many)
 *    immediately after a client-side route/URL-state transition (e.g. the
 *    EntityModal open click also does a router.push for ?item=). Manually
 *    confirmed via page.title() moments later that the title IS correctly
 *    set (Next's Metadata is not actually broken) — this reads as axe
 *    occasionally scanning mid-transition, not a persistent defect. runAxe()
 *    below waits for a non-empty document.title first specifically to
 *    starve this race; kept in the allowlist as a documented safety net in
 *    case that wait doesn't fully close it in every environment.
 */
export const KNOWN_VIOLATION_IDS = new Set([
  "aria-valid-attr-value",
  "aria-allowed-attr",
  "aria-required-children",
  "nested-interactive",
  "no-focusable-content",
  "color-contrast",
  "doc-has-title",
]);

export function seriousViolations(results: AxeResults): AxeViolation[] {
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
}

function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
    .join("\n");
}

/**
 * Fails the test on any NEW serious/critical violation (a regression) while
 * letting already-documented, triaged findings (KNOWN_VIOLATION_IDS, F-005)
 * through without silently hiding them — they're still logged so a human
 * skimming test output sees the known-debt count trending, not nothing.
 */
export function expectNoNewSeriousViolations(results: AxeResults, label: string): void {
  const serious = seriousViolations(results);
  const known = serious.filter((v) => KNOWN_VIOLATION_IDS.has(v.id));
  const unknown = serious.filter((v) => !KNOWN_VIOLATION_IDS.has(v.id));

  if (known.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[axe] ${label}: ${known.length} known/tracked violation(s) (F-005) — not gating:\n${formatViolations(known)}`,
    );
  }

  expect(
    unknown,
    `${label}: NEW axe serious/critical violations (not in KNOWN_VIOLATION_IDS):\n${formatViolations(unknown)}`,
  ).toEqual([]);
}
