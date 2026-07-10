/**
 * WS-5 regression guard — BOM fullscreen mode vs dialogs stacking.
 *
 * Defect: FullscreenPane portals the BOM content to document.body with
 * `fixed inset-0 z-50`. If the AssetPickerDialog (and other overlays) are
 * rendered as SIBLINGS of FullscreenPane, the portal node (appended to <body>
 * after the app root) always paints on top of them — the picker opens but is
 * invisible/unreachable in fullscreen mode.
 *
 * Fix contract: the dialogs are rendered INSIDE the content passed to
 * FullscreenPane, so in fullscreen mode the dialog DOM node is a DESCENDANT
 * of the fullscreen portal node (and therefore paints within/above its
 * stacking context). These tests assert that contract in both modes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BomOverview } from "@/features/bom/BomOverview";

// ============================================================
// Mocks
// ============================================================

// next/navigation — used by EntityModal's useEntityModalUrl.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/projects/proj_test/bom",
}));

// EntityModal — its @miethe/ui/primitives barrel import does not resolve under
// vitest's ESM resolution (known 0.6.0 gotcha: subpath imports only). The
// EntityModal flow is not under test here; stub the module surface BomOverview
// consumes.
vi.mock("@/features/ui/components/EntityModal", () => ({
  EntityModal: () => null,
  useEntityModalUrl: () => ({
    isOpen: false,
    itemId: null,
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

// next/link — used by BomRightRail quick actions.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.PropsWithChildren<{ href: string } & Record<string, unknown>>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Offline API: every fetch rejects so all hooks fall back to fixtures
// (FIXTURE_BOM includes missing slots: "Test Plan", "Deployment Runbook").
const fetchMock = vi.fn(() => Promise.reject(new Error("offline (test)")));

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
});

function makeQC() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const [qc] = React.useState(() => makeQC());
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function renderBom() {
  return render(
    <Wrapper>
      <BomOverview projectId="proj_test" />
    </Wrapper>,
  );
}

// ============================================================
// Tests
// ============================================================

describe("BomOverview fullscreen dialog stacking (WS-5)", () => {
  it("normal mode: clicking a missing slot opens the asset picker", async () => {
    const user = userEvent.setup();
    renderBom();

    const missing = await screen.findAllByRole("button", {
      name: /^Missing slot:/,
    });
    expect(missing.length).toBeGreaterThan(0);

    await user.click(missing[0]);

    const picker = await screen.findByRole("dialog", { name: /^Fill slot:/ });
    expect(picker).toBeTruthy();
  });

  it("fullscreen mode: the asset picker renders INSIDE the fullscreen portal node", async () => {
    const user = userEvent.setup();
    renderBom();

    // Enter fullscreen.
    const expand = await screen.findByRole("button", {
      name: /expand to fullscreen/i,
    });
    await user.click(expand);

    const fullscreenNode = await screen.findByRole("dialog", {
      name: /fullscreen$/i,
    });
    expect(fullscreenNode.parentElement).toBe(document.body);

    // Click a missing slot INSIDE the fullscreen portal.
    const missing = within(fullscreenNode).getAllByRole("button", {
      name: /^Missing slot:/,
    });
    await user.click(missing[0]);

    // The picker dialog must be a DESCENDANT of the fullscreen portal node —
    // otherwise the z-50 fullscreen overlay paints on top of it and the
    // dialog is unreachable.
    const picker = await screen.findByRole("dialog", { name: /^Fill slot:/ });
    expect(fullscreenNode.contains(picker)).toBe(true);
  });

  it("fullscreen mode: the Apply Template dialog also travels with the portal", async () => {
    const user = userEvent.setup();
    renderBom();

    const expand = await screen.findByRole("button", {
      name: /expand to fullscreen/i,
    });
    await user.click(expand);

    const fullscreenNode = await screen.findByRole("dialog", {
      name: /fullscreen$/i,
    });

    await user.click(
      within(fullscreenNode).getByRole("button", { name: /^Apply Template$/ }),
    );

    const applyDialog = await screen.findByRole("dialog", {
      name: /^Apply Template$/,
    });
    expect(fullscreenNode.contains(applyDialog)).toBe(true);
  });

  it("exiting fullscreen keeps the picker flow working inline", async () => {
    const user = userEvent.setup();
    renderBom();

    // Enter and immediately exit fullscreen.
    await user.click(
      await screen.findByRole("button", { name: /expand to fullscreen/i }),
    );
    const fullscreenNode = await screen.findByRole("dialog", {
      name: /fullscreen$/i,
    });
    await user.click(
      within(fullscreenNode).getByRole("button", { name: /exit fullscreen/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /fullscreen$/i }),
      ).toBeNull(),
    );

    // Picker still opens inline after the portal unmount/remount cycle.
    const missing = await screen.findAllByRole("button", {
      name: /^Missing slot:/,
    });
    await user.click(missing[0]);
    expect(
      await screen.findByRole("dialog", { name: /^Fill slot:/ }),
    ).toBeTruthy();
  });
});
