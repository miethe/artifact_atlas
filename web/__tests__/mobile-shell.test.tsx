import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/projects/proj_artifact_atlas" }));
vi.mock("@/lib/hooks/useProjects", () => ({
  useProject: () => ({ data: { name: "Artifact Atlas" } }),
  useProjects: () => ({ data: { items: [] } }),
}));
vi.mock("@/features/ui/hooks/useGlobalShortcuts", () => ({ useGlobalShortcuts: () => {} }));
vi.mock("@/components/shell/TopBar", () => ({
  TopBar: ({ onMenuClick }: { onMenuClick?: () => void }) => (
    <header>
      <button type="button" aria-label="Open navigation" onClick={onMenuClick}>Menu</button>
    </header>
  ),
}));
vi.mock("@/components/shell/CollaborationFooter", () => ({ CollaborationFooter: () => null }));
vi.mock("@/components/shell/CommandPalette", () => ({ CommandPalette: () => null }));
vi.mock("@/components/shell/DemoDataBanner", () => ({ DemoDataBanner: () => null }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("mobile app shell", () => {
  it("keeps the 390px content column usable and puts navigation behind a toggle", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(
      <AppShell projectId="proj_artifact_atlas">
        <PageHeader title="Artifact Atlas project overview" />
        <section aria-label="Key metrics">
          <MetricCard label="All Assets" value={12} />
        </section>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    expect(main.className).toContain("min-w-0");
    expect(screen.getByRole("heading", { name: "Artifact Atlas project overview" }).className).toContain("truncate");
    expect(screen.getByRole("region", { name: "Key metrics" })).toBeInTheDocument();
    expect(screen.getByText("All Assets").className).toContain("truncate");

    const nav = screen.getByRole("navigation", { name: "Project navigation" });
    expect(nav.className).toContain("hidden md:flex");
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("navigation", { name: "Project navigation" }).className).toContain("fixed inset-y-0 left-0");
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();
  });
});
