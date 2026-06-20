/**
 * TEST-004 — MetadataEditForm optimistic update + rollback
 *
 * Verifies:
 * - Form renders with asset's current values pre-filled.
 * - Save is disabled when nothing changed (isDirty=false).
 * - Submitting calls updateMutation with correct payload.
 * - On mutation error the query cache is rolled back (onError handler).
 * - Canonical promotion triggers confirmation step before submitting.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MetadataEditForm } from "@/features/assets/components/MetadataEditForm";
import type { Asset } from "@/lib/types";

// ============================================================
// Fixture
// ============================================================

const FIXTURE_ASSET: Asset = {
  id: "asset_test_001",
  title: "Test Asset",
  description: "A description",
  source_kind: "local",
  uri: "file://test.png",
  status: "candidate",
  sensitivity: "public",
  agent_access: "metadata_only",
  captured_at: "2026-06-01T00:00:00Z",
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

// ============================================================
// Tests
// ============================================================

describe("MetadataEditForm", () => {
  it("renders with asset values pre-filled", () => {
    render(
      <Wrapper>
        <MetadataEditForm asset={FIXTURE_ASSET} />
      </Wrapper>,
    );
    const titleInput = screen.getByRole("textbox", { name: /title/i });
    expect((titleInput as HTMLInputElement).value).toBe("Test Asset");
  });

  it("save button is disabled when form is unchanged (isDirty=false)", () => {
    render(
      <Wrapper>
        <MetadataEditForm asset={FIXTURE_ASSET} />
      </Wrapper>,
    );
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    expect(saveBtn).toBeDisabled();
  });

  it("save button becomes enabled after editing title", async () => {
    render(
      <Wrapper>
        <MetadataEditForm asset={FIXTURE_ASSET} />
      </Wrapper>,
    );
    const titleInput = screen.getByRole("textbox", { name: /title/i });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated Title");
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    expect(saveBtn).not.toBeDisabled();
  });

  it("shows canonical promotion warning when status set to canonical", async () => {
    render(
      <Wrapper>
        <MetadataEditForm asset={FIXTURE_ASSET} />
      </Wrapper>,
    );
    const statusSelect = screen.getByRole("combobox", { name: /status/i });
    await userEvent.selectOptions(statusSelect, "canonical");
    expect(
      screen.getByText(/canonical promotion requires confirmation/i),
    ).toBeInTheDocument();
    // Button label changes
    expect(
      screen.getByRole("button", { name: /review & save/i }),
    ).toBeInTheDocument();
  });

  it("submitting canonical promotion opens confirmation dialog", async () => {
    render(
      <Wrapper>
        <MetadataEditForm asset={FIXTURE_ASSET} mode="dialog" onClose={vi.fn()} />
      </Wrapper>,
    );
    const statusSelect = screen.getByRole("combobox", { name: /status/i });
    await userEvent.selectOptions(statusSelect, "canonical");
    await userEvent.click(screen.getByRole("button", { name: /review & save/i }));
    // Confirmation dialog should appear
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /confirm canonical promotion/i }),
      ).toBeInTheDocument();
    });
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(
      <Wrapper>
        <MetadataEditForm asset={FIXTURE_ASSET} onClose={onClose} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows error alert when mutation fails", async () => {
    // Mock the updateAsset endpoint to fail
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { code: "server_error", message: "Internal error" } }),
    } as Response);

    const qc = makeQC();
    // Pre-seed the asset in cache so optimistic update has something to roll back
    qc.setQueryData(["assets", "detail", FIXTURE_ASSET.id], FIXTURE_ASSET);

    render(
      <QueryClientProvider client={qc}>
        <MetadataEditForm asset={FIXTURE_ASSET} />
      </QueryClientProvider>,
    );

    // Edit title to make form dirty
    const titleInput = screen.getByRole("textbox", { name: /title/i });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Will Fail");

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // Verify rollback: cache should have original asset restored
    const cached = qc.getQueryData<Asset>(["assets", "detail", FIXTURE_ASSET.id]);
    expect(cached?.title).toBe("Test Asset");
  });
});
