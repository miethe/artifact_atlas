import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MissingContextPanel } from "@/features/dashboard/components/MissingContextPanel";

vi.mock("@/features/dashboard/hooks/useBomGaps", () => ({
  useBomGaps: vi.fn(),
}));

import { useBomGaps } from "@/features/dashboard/hooks/useBomGaps";

const missingSlot = {
  id: "slot_security_review",
  bom_id: "bom_project",
  name: "",
  title: null,
  required: true,
  status: "missing" as const,
  assignment_count: 0,
};

describe("MissingContextPanel", () => {
  it("renders a slot title and falls back to the slot id when it is absent", () => {
    vi.mocked(useBomGaps).mockReturnValue({
      data: [
        { ...missingSlot, id: "slot_security_review_title", title: "Security Review" },
        missingSlot,
      ],
      isLoading: false,
    } as ReturnType<typeof useBomGaps>);

    render(<MissingContextPanel projectId="project-1" />);

    expect(screen.getByText("Security Review")).toBeInTheDocument();
    expect(screen.getByText("slot_security_review")).toBeInTheDocument();
  });
});
