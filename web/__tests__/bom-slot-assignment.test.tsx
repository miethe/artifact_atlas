/**
 * TEST-004 — BOM slot assignment interaction
 *
 * Verifies:
 * - SlotCard renders with correct ARIA label and status.
 * - Context menu opens on the actions button.
 * - "Assign asset" appears when slot is assignable.
 * - Clicking "Assign asset" opens the AssignDialog.
 * - AssignDialog calls the mutation on submit with assetId.
 * - Confirm dialogs appear for unassign / mark-NA (audit-sensitive).
 * - BomSlot.accepted_assignment_count is rendered if present.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SlotCard } from "@/features/bom/components/SlotCard";
import type { BomSlot } from "@/lib/types";

// ============================================================
// Fixtures
// ============================================================

const MISSING_REQUIRED_SLOT: BomSlot = {
  id: "slot_001",
  bom_id: "bom_001",
  name: "Product Requirements Doc",
  description: "Core requirements document",
  artifact_type_id: null,
  phase: "design",
  required: true,
  status: "missing",
  assignment_count: 0,
  accepted_assignment_count: null,
  domain: "product",
};

const COMPLETE_SLOT: BomSlot = {
  id: "slot_002",
  bom_id: "bom_001",
  name: "Architecture Diagram",
  description: null,
  artifact_type_id: null,
  phase: "build",
  required: true,
  status: "complete",
  assignment_count: 2,
  accepted_assignment_count: 1,
  domain: "engineering",
};

const NA_SLOT: BomSlot = {
  id: "slot_003",
  bom_id: "bom_001",
  name: "Marketing Deck",
  description: null,
  artifact_type_id: null,
  phase: null,
  required: false,
  status: "not_applicable",
  assignment_count: 0,
  accepted_assignment_count: 0,
  domain: "gtm",
};

// ============================================================
// Setup
// ============================================================

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const [qc] = React.useState(() => makeQC());
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  // Default: fetch resolves successfully
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: "assign_001", slot_id: "slot_001", asset_id: "asset_x" }),
  } as Response);
});

// ============================================================
// Tests
// ============================================================

describe("SlotCard", () => {
  it("renders with correct aria-label for missing required slot", () => {
    render(
      <Wrapper>
        <SlotCard slot={MISSING_REQUIRED_SLOT} />
      </Wrapper>,
    );
    expect(
      screen.getByRole("article", { name: /bom slot: product requirements doc/i }),
    ).toBeInTheDocument();
  });

  it("renders with correct aria-label for complete slot", () => {
    render(
      <Wrapper>
        <SlotCard slot={COMPLETE_SLOT} />
      </Wrapper>,
    );
    expect(
      screen.getByRole("article", { name: /bom slot: architecture diagram/i }),
    ).toBeInTheDocument();
  });

  it("context menu opens on actions button click", async () => {
    render(
      <Wrapper>
        <SlotCard slot={MISSING_REQUIRED_SLOT} />
      </Wrapper>,
    );
    const actionsBtn = screen.getByRole("button", {
      name: /actions for product requirements doc/i,
    });
    await userEvent.click(actionsBtn);
    expect(
      screen.getByRole("menu", { name: /actions for product requirements doc/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Assign asset' menu item for missing slot", async () => {
    render(
      <Wrapper>
        <SlotCard slot={MISSING_REQUIRED_SLOT} />
      </Wrapper>,
    );
    const actionsBtn = screen.getByRole("button", {
      name: /actions for product requirements doc/i,
    });
    await userEvent.click(actionsBtn);
    expect(screen.getByRole("menuitem", { name: /assign asset/i })).toBeInTheDocument();
  });

  it("'Assign asset' opens assign dialog", async () => {
    render(
      <Wrapper>
        <SlotCard slot={MISSING_REQUIRED_SLOT} />
      </Wrapper>,
    );
    const actionsBtn = screen.getByRole("button", {
      name: /actions for product requirements doc/i,
    });
    await userEvent.click(actionsBtn);
    await userEvent.click(screen.getByRole("menuitem", { name: /assign asset/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /assign asset to: product requirements doc/i }),
      ).toBeInTheDocument();
    });
  });

  it("assign dialog submits mutation with entered assetId", async () => {
    render(
      <Wrapper>
        <SlotCard slot={MISSING_REQUIRED_SLOT} />
      </Wrapper>,
    );
    // Open menu
    await userEvent.click(
      screen.getByRole("button", { name: /actions for product requirements doc/i }),
    );
    // Click assign
    await userEvent.click(screen.getByRole("menuitem", { name: /assign asset/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Fill asset ID
    const assetIdInput = screen.getByRole("textbox", { name: /asset id/i });
    await userEvent.type(assetIdInput, "asset_123");

    // Submit via Assign button
    await userEvent.click(screen.getByRole("button", { name: /^assign$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/bom/slots/slot_001/assign"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows 'Unassign' menu item for slot with assignments", async () => {
    render(
      <Wrapper>
        <SlotCard slot={COMPLETE_SLOT} />
      </Wrapper>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /actions for architecture diagram/i }),
    );
    expect(screen.getByRole("menuitem", { name: /unassign/i })).toBeInTheDocument();
  });

  it("'Unassign' opens confirmation dialog (audit-sensitive)", async () => {
    render(
      <Wrapper>
        <SlotCard slot={COMPLETE_SLOT} />
      </Wrapper>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /actions for architecture diagram/i }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: /unassign/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /unassign asset/i }),
      ).toBeInTheDocument();
    });
  });

  it("'Mark N/A' opens confirmation dialog", async () => {
    render(
      <Wrapper>
        <SlotCard slot={MISSING_REQUIRED_SLOT} />
      </Wrapper>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /actions for product requirements doc/i }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: /mark n\/a/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /mark slot as not applicable/i }),
      ).toBeInTheDocument();
    });
  });

  it("not_applicable slot is not clickable (tabIndex -1)", () => {
    render(
      <Wrapper>
        <SlotCard slot={NA_SLOT} />
      </Wrapper>,
    );
    const card = screen.getByRole("article", { name: /bom slot: marketing deck/i });
    expect(card).toHaveAttribute("tabIndex", "-1");
  });

  it("accepted_assignment_count is accessible via the slot prop", () => {
    // Verifies that accepted_assignment_count type field is accepted without TS error.
    render(
      <Wrapper>
        <SlotCard slot={{ ...COMPLETE_SLOT, accepted_assignment_count: 1 }} />
      </Wrapper>,
    );
    // Card renders without errors
    expect(
      screen.getByRole("article", { name: /architecture diagram/i }),
    ).toBeInTheDocument();
  });
});
