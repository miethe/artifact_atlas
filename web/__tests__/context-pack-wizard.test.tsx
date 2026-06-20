/**
 * TEST-004 — Context Pack wizard step transitions + unsafe-publish block
 *
 * Verifies:
 * - Wizard renders at step 1 (node selection).
 * - "Next" is disabled when title is empty.
 * - Entering a title enables "Next".
 * - Clicking "Next" advances to step 2.
 * - computePublishGate blocks publish for client_sensitive / restricted packs.
 * - computePublishGate allows publish for public / personal packs.
 * - Clicking "Back" returns to previous step.
 * - Step indicator shows correct current step.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContextPackBuilder } from "@/features/context-packs/ContextPackBuilder";
import { computePublishGate } from "@/features/context-packs/hooks";
import type { BuilderDraft } from "@/features/context-packs/types";

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

// Mock Next.js navigation hooks used inside hooks.ts → useAssets etc.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/projects/test/context-packs",
}));

function renderBuilder() {
  return render(
    <Wrapper>
      <ContextPackBuilder projectId="proj_test" onClose={vi.fn()} />
    </Wrapper>,
  );
}

// ============================================================
// computePublishGate — unit tests (pure function)
// ============================================================

const BASE_DRAFT: BuilderDraft = {
  title: "My Pack",
  description: "",
  target_type: "project",
  target_id: "proj_test",
  audience: "agent",
  sensitivity: "public",
  instructions: "",
  expires_at: null,
  items: [],
  policy: {
    allow_external_data: false,
    allow_code_execution: false,
    network_access: "none",
    agent_access: null,
  },
};

describe("computePublishGate — unit", () => {
  it("allows publish for public sensitivity with no sensitive items", () => {
    const gate = computePublishGate({ ...BASE_DRAFT, sensitivity: "public" });
    expect(gate.canPublish).toBe(true);
    expect(gate.blockReason).toBeNull();
  });

  it("allows publish for personal sensitivity", () => {
    const gate = computePublishGate({ ...BASE_DRAFT, sensitivity: "personal" });
    expect(gate.canPublish).toBe(true);
  });

  it("blocks publish for client_sensitive pack-level sensitivity", () => {
    const gate = computePublishGate({ ...BASE_DRAFT, sensitivity: "client_sensitive" });
    expect(gate.canPublish).toBe(false);
    expect(gate.blockReason).toMatch(/client-sensitive or restricted/i);
  });

  it("blocks publish for restricted pack-level sensitivity", () => {
    const gate = computePublishGate({ ...BASE_DRAFT, sensitivity: "restricted" });
    expect(gate.canPublish).toBe(false);
  });

  it("blocks publish when items contain restricted sensitivity", () => {
    const draft: BuilderDraft = {
      ...BASE_DRAFT,
      sensitivity: "public",
      items: [
        {
          key: "item_001",
          item_type: "asset",
          item_id: "asset_001",
          label: "Secret Doc",
          include_mode: "metadata",
          required: false,
          sensitivity: "restricted",
          display_order: 0,
        },
      ],
    };
    const gate = computePublishGate(draft);
    expect(gate.canPublish).toBe(false);
    expect(gate.sensitiveItems).toHaveLength(1);
    expect(gate.blockReason).toMatch(/require review/i);
  });

  it("blocks publish when items contain client_sensitive sensitivity", () => {
    const draft: BuilderDraft = {
      ...BASE_DRAFT,
      items: [
        {
          key: "item_002",
          item_type: "asset",
          item_id: "asset_002",
          label: "Client Doc",
          include_mode: "summary",
          required: true,
          sensitivity: "client_sensitive",
          display_order: 0,
        },
      ],
    };
    const gate = computePublishGate(draft);
    expect(gate.canPublish).toBe(false);
    expect(gate.sensitiveItems).toHaveLength(1);
  });

  it("allows publish when items only have public/personal/work_sensitive", () => {
    const draft: BuilderDraft = {
      ...BASE_DRAFT,
      items: [
        {
          key: "item_003",
          item_type: "asset",
          item_id: "asset_003",
          label: "Work Doc",
          include_mode: "summary",
          required: false,
          sensitivity: "work_sensitive",
          display_order: 0,
        },
      ],
    };
    const gate = computePublishGate(draft);
    expect(gate.canPublish).toBe(true);
  });
});

// ============================================================
// ContextPackBuilder — integration step transitions
// ============================================================

describe("ContextPackBuilder — step transitions", () => {
  it("renders at step 1 (node) by default", () => {
    renderBuilder();
    // Step indicator should show Node as current
    const nodeStep = screen.getByRole("button", {
      name: /step 1: select node.*current/i,
    });
    expect(nodeStep).toBeInTheDocument();
  });

  it("Next button is disabled when title is empty", () => {
    renderBuilder();
    const nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).toBeDisabled();
  });

  it("Next button becomes enabled after entering a title", async () => {
    renderBuilder();
    // WizardStepNode renders a title input
    const titleInput = screen.getByRole("textbox", { name: /pack title/i });
    await userEvent.type(titleInput, "My Context Pack");
    const nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
  });

  it("clicking Next advances to step 2 (assets)", async () => {
    renderBuilder();
    const titleInput = screen.getByRole("textbox", { name: /pack title/i });
    await userEvent.type(titleInput, "My Context Pack");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    // Step indicator should show step 2 as current
    await waitFor(() => {
      const assetsStep = screen.getByRole("button", {
        name: /step 2: choose assets.*current/i,
      });
      expect(assetsStep).toBeInTheDocument();
    });
  });

  it("Back button is disabled on first step", () => {
    renderBuilder();
    const backBtn = screen.getByRole("button", { name: /back/i });
    expect(backBtn).toBeDisabled();
  });

  it("Back button on step 2 returns to step 1", async () => {
    renderBuilder();
    const titleInput = screen.getByRole("textbox", { name: /pack title/i });
    await userEvent.type(titleInput, "Pack");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /step 2: choose assets.*current/i }),
      ).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /step 1: select node.*current/i }),
      ).toBeInTheDocument();
    });
  });

  it("step counter shows N of 5", () => {
    renderBuilder();
    expect(screen.getByText("1 of 5")).toBeInTheDocument();
  });

  it("previously-completed steps are clickable in step indicator", async () => {
    renderBuilder();
    const titleInput = screen.getByRole("textbox", { name: /pack title/i });
    await userEvent.type(titleInput, "Pack");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /step 1: select node.*completed/i }),
      ).toBeInTheDocument();
    });
    // Click back to step 1 via indicator
    await userEvent.click(
      screen.getByRole("button", { name: /step 1: select node.*completed/i }),
    );
    expect(
      screen.getByRole("button", { name: /step 1: select node.*current/i }),
    ).toBeInTheDocument();
  });
});
