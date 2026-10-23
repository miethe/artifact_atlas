import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecentAssetsPanel } from "@/features/dashboard/components/RecentAssetsPanel";
import { FIXTURE_ASSETS } from "@/lib/fixtures";

describe("RecentAssetsPanel", () => {
  it("shows the project population instead of the page length", () => {
    render(
      <RecentAssetsPanel
        projectId="project-1"
        assets={FIXTURE_ASSETS.slice(0, 2)}
        totalAssets={125}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Showing 2 of 125")).toBeInTheDocument();
  });
});
