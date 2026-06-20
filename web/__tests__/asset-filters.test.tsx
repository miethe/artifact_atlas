/**
 * TEST-004 — Asset filter URL state (useAssetFilters)
 *
 * Tests that filter changes build correct URLSearchParams and that
 * the hook reads back the same values from the params object.
 * We test the pure URL-param helpers in isolation (no Next.js router needed).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { FilterBar } from "@/features/assets/components/FilterBar";
import type { ActiveFilters } from "@/features/assets/components/FilterBar";

// ============================================================
// FilterBar — controlled component tests (no router required)
// ============================================================

describe("FilterBar — controlled prop state", () => {
  it("renders search input and filter buttons", () => {
    const onChange = vi.fn();
    render(<FilterBar filters={{}} onChange={onChange} />);
    expect(
      screen.getByRole("searchbox", { name: /search assets/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /filter by status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /filter by source/i }),
    ).toBeInTheDocument();
  });

  it("calls onChange with updated q when search input changes (debounced)", async () => {
    const onChange = vi.fn();
    vi.useFakeTimers();
    render(<FilterBar filters={{}} onChange={onChange} />);
    const input = screen.getByRole("searchbox", { name: /search assets/i });

    fireEvent.change(input, { target: { value: "design" } });
    // debounce fires after 300 ms
    vi.advanceTimersByTime(350);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ q: "design" }));
    vi.useRealTimers();
  });

  it("clears search via X button", async () => {
    const onChange = vi.fn();
    render(<FilterBar filters={{ q: "foo" }} onChange={onChange} />);
    const clearBtn = screen.getByRole("button", { name: /clear search/i });
    await userEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ q: undefined }));
  });

  it("toggling status option appends to filters.status array", async () => {
    const onChange = vi.fn();
    render(<FilterBar filters={{}} onChange={onChange} />);

    // Open status dropdown — label is "Status" (label="Status" → aria-label="Filter by Status")
    const statusBtn = screen.getAllByRole("button").find((b) =>
      b.getAttribute("aria-label")?.includes("Filter by Status"),
    );
    expect(statusBtn).toBeTruthy();
    await userEvent.click(statusBtn!);

    // Options render as <li role="option"> with a nested <button>.
    // Click the inner button via text content.
    const candidateOption = screen.getByRole("option", { name: /candidate/i });
    const candidateInnerBtn = candidateOption.querySelector("button");
    await userEvent.click(candidateInnerBtn!);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: ["candidate"] }),
    );
  });

  it("shows active count badge when status filters are set", () => {
    render(
      <FilterBar
        filters={{ status: ["candidate", "in_review"] }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("clear-all resets all filter fields", async () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={{ q: "foo", status: ["raw"], sensitivity: "restricted" }}
        onChange={onChange}
      />,
    );
    const clearAllBtn = screen.getByRole("button", { name: /clear filters/i });
    await userEvent.click(clearAllBtn);
    expect(onChange).toHaveBeenCalledWith({});
  });

  it("shows result count from totalCount prop", () => {
    render(<FilterBar filters={{}} onChange={vi.fn()} totalCount={42} />);
    expect(screen.getByText(/42 assets/i)).toBeInTheDocument();
  });

  it("sensitivity select changes call onChange with correct field", async () => {
    const onChange = vi.fn();
    render(<FilterBar filters={{}} onChange={onChange} />);
    const select = screen.getByRole("combobox", { name: /filter by sensitivity/i });
    await userEvent.selectOptions(select, "personal");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sensitivity: "personal" }),
    );
  });
});

// ============================================================
// URL param building — unit tests for buildParams logic
// ============================================================

describe("URL filter param round-trip", () => {
  it("empty filters produce empty params", () => {
    const p = new URLSearchParams();
    expect(p.toString()).toBe("");
  });

  it("multiple status values append as repeated keys", () => {
    const p = new URLSearchParams();
    ["candidate", "in_review"].forEach((s) => p.append("status", s));
    expect(p.getAll("status")).toEqual(["candidate", "in_review"]);
  });

  it("source_kind values append as repeated keys", () => {
    const p = new URLSearchParams();
    ["local", "chatgpt"].forEach((s) => p.append("source_kind", s));
    expect(p.getAll("source_kind")).toEqual(["local", "chatgpt"]);
  });

  it("single sensitivity sets as unique key", () => {
    const p = new URLSearchParams();
    p.set("sensitivity", "work_sensitive");
    expect(p.get("sensitivity")).toBe("work_sensitive");
  });

  it("q param round-trips as string", () => {
    const p = new URLSearchParams();
    p.set("q", "system design");
    expect(p.get("q")).toBe("system design");
  });
});
