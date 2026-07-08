import { defineConfig, devices } from '@playwright/test'

/**
 * Explicit flags for the "flags-on" project (P6 / F-002).
 *
 * ADR-8 flipped miethe-ui-ds + ui-tabbed-modal to default-ON, so the legacy
 * "chromium" project already exercises the new UI today — but that relies on
 * FLAG_DEFAULTS in lib/flags.ts staying as-is. This project pins the flags
 * explicitly via NEXT_PUBLIC_FLAGS (baked in at build time) so flags-ON
 * verification stays deterministic even if a future change flips a default.
 *
 * "dark-mode" mounts the ThemeToggle + no-FOUC script (DM-4/DM-5). The
 * dark-mode axe sweep still explicitly sets data-theme="dark" itself (the CSS
 * only keys off the attribute) — this just keeps the surrounding chrome
 * (ThemeToggle) present for realism.
 *
 * "pptx-server-conversion" is deliberately NOT included: AssetViewer's "full"
 * display mode (where PptxRenderer's conversion call would fire) has no live
 * mounting point anywhere in the app today (see asset-viewer-formats.spec.ts
 * docstring) — the flag would be dead weight in this build.
 */
const FLAGS_ON = 'miethe-ui-ds,ui-tabbed-modal,dark-mode'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testDir: './e2e',
      testIgnore: '**/flags-on/**',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'flags-on',
      testDir: './e2e/flags-on',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3100' },
    },
  ],
  webServer: [
    {
      // Legacy project — default build (flags already default-on per ADR-8,
      // but not pinned; see FLAGS_ON note above for why "flags-on" exists).
      command: 'npm run start',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      // Flags-on project — separate build output (NEXT_DIST_DIR) + port so it
      // can run alongside the legacy build without clobbering `.next`.
      command: `bash -c "export NEXT_PUBLIC_FLAGS='${FLAGS_ON}' NEXT_DIST_DIR='.next-flags-on' PORT=3100; npm run build && npm run start"`,
      url: 'http://localhost:3100',
      reuseExistingServer: true,
      timeout: 300 * 1000,
    },
  ],
})
