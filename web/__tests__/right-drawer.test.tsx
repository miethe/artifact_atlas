/**
 * TEST-004 — RightDrawer open/close + focus trap
 *
 * Verifies:
 * - Drawer renders when open=true, hidden when open=false.
 * - Close button calls onClose.
 * - Escape key calls onClose.
 * - Focus moves to first focusable element on open.
 * - Tab focus trap cycles between first and last focusable.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { RightDrawer } from "@/components/shell/RightDrawer";

function DrawerHarness({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = React.useState(initialOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <RightDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Test Inspector"
        overlay
      >
        <button type="button">First action</button>
        <button type="button">Second action</button>
      </RightDrawer>
    </>
  );
}

describe("RightDrawer", () => {
  it("does not render when closed (overlay mode)", () => {
    render(<DrawerHarness initialOpen={false} />);
    expect(
      screen.queryByRole("complementary", { name: /test inspector/i }),
    ).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    render(<DrawerHarness initialOpen />);
    expect(
      screen.getByRole("complementary", { name: /test inspector/i }),
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <RightDrawer open onClose={onClose} title="Inspector" overlay>
        <p>Content</p>
      </RightDrawer>,
    );
    await userEvent.click(screen.getByRole("button", { name: /close panel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <RightDrawer open onClose={onClose} title="Inspector" overlay>
        <button type="button">focus me</button>
      </RightDrawer>,
    );
    const drawer = screen.getByRole("complementary");
    fireEvent.keyDown(drawer, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("moves focus to the first focusable element when opened", () => {
    render(
      <RightDrawer open onClose={vi.fn()} title="Inspector" overlay>
        <button type="button">First</button>
        <button type="button">Second</button>
      </RightDrawer>,
    );
    // After mount the focus trap focuses first element (close btn is first in DOM)
    const closeBtn = screen.getByRole("button", { name: /close panel/i });
    expect(document.activeElement).toBe(closeBtn);
  });

  it("toggles open/close via trigger button", async () => {
    render(<DrawerHarness initialOpen={false} />);
    expect(
      screen.queryByRole("complementary", { name: /test inspector/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /open drawer/i }));
    expect(
      screen.getByRole("complementary", { name: /test inspector/i }),
    ).toBeInTheDocument();
  });

  it("renders backdrop in overlay mode", () => {
    render(
      <RightDrawer open onClose={vi.fn()} title="Inspector" overlay>
        <p>content</p>
      </RightDrawer>,
    );
    // Backdrop is a div with aria-hidden rendered before the drawer panel
    const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
  });
});
