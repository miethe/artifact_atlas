"use client";

/**
 * AppShell — root layout shell.
 * Regions: sidebar | (topbar / content / right-rail) | footer
 * Stable grid dimensions — no layout shift.
 * Sidebar collapse: stored in local state (future: localStorage/cookie).
 *
 * Proportions match mockup at 1672x941 / 1440x900 / 1280x800:
 *   Sidebar: 208px (collapsed: 48px)
 *   TopBar: 44px height
 *   Footer: 24px height
 *   Content: fills remainder
 */

import * as React from "react";
import { clsx } from "clsx";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";
import { CollaborationFooter } from "./CollaborationFooter";
import { CommandPalette } from "./CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
  projectId?: string;
  /** Optionally render a right-rail panel (persistent, non-overlay) */
  rightRail?: React.ReactNode;
  rightRailOpen?: boolean;
}

export function AppShell({
  children,
  projectId,
  rightRail,
  rightRailOpen = false,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    /*
     * Outer shell: full-viewport flex row.
     * We use CSS grid on the inner region to maintain stable column tracks.
     */
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg)]">
      {/* Sidebar */}
      <SidebarNav
        projectId={projectId}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main column: topbar + content + footer */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TopBar */}
        <TopBar projectId={projectId} />

        {/* Content row: workspace + optional right rail */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Page content */}
          <main
            id="main-content"
            className={clsx(
              "flex-1 min-w-0 overflow-y-auto",
              "focus-visible:outline-none",
            )}
            tabIndex={-1}
          >
            {children}
          </main>

          {/* Right rail (persistent, non-overlay) */}
          {rightRail && rightRailOpen && (
            <aside
              className={clsx(
                "w-80 shrink-0 border-l border-[var(--border)] bg-[var(--surface)]",
                "overflow-y-auto animate-slide-in-right",
              )}
              aria-label="Inspector panel"
            >
              {rightRail}
            </aside>
          )}
        </div>

        {/* Footer */}
        <CollaborationFooter />
      </div>

      {/* Command palette — mounted globally, listens for open events */}
      <CommandPalette projectId={projectId} />
    </div>
  );
}
