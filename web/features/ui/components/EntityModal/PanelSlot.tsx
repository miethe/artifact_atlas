"use client";

/**
 * PanelSlot — code-split panel renderer shared by EntityModal and the
 * full-page detail route (AC P2A-C).
 *
 * Wraps a React.lazy panel in Suspense (skeleton fallback) + an error boundary
 * so a failed chunk import shows an error tile, never a blank surface.
 */

import * as React from "react";
import { AlertCircle } from "lucide-react";
import type { TabDefinition, TabPanelProps } from "./TabRegistry";

// ============================================================
// Skeleton fallback (Suspense)
// ============================================================

export function PanelSkeleton() {
  return (
    <div
      className="flex-1 space-y-3 p-1"
      role="status"
      aria-label="Loading panel…"
    >
      <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
      <div className="h-32 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}

// ============================================================
// Error tile (boundary fallback)
// ============================================================

function PanelErrorTile() {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-[var(--ink-muted)]"
    >
      <AlertCircle aria-hidden className="h-5 w-5 text-yellow-500" />
      <p className="font-medium text-[var(--ink)]">This panel failed to load.</p>
      <p>Check your connection and reopen the tab.</p>
    </div>
  );
}

// ============================================================
// Error boundary (class — required for componentDidCatch)
// ============================================================

interface PanelErrorBoundaryProps {
  /** Reset boundary when the active tab changes. */
  resetKey: string;
  children: React.ReactNode;
}

interface PanelErrorBoundaryState {
  hasError: boolean;
}

class PanelErrorBoundary extends React.Component<
  PanelErrorBoundaryProps,
  PanelErrorBoundaryState
> {
  state: PanelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PanelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prev: PanelErrorBoundaryProps) {
    // Clear the error when navigating to a different tab.
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return <PanelErrorTile />;
    return this.props.children;
  }
}

// ============================================================
// PanelSlot
// ============================================================

export interface PanelSlotProps {
  /** Active tab key — also used to reset the error boundary on tab change. */
  tabKey: string;
  /** Resolved tab definition (its lazy Panel is rendered). */
  tab: TabDefinition;
  /** Props forwarded to the panel component. */
  panelProps: TabPanelProps;
}

export function PanelSlot({ tabKey, tab, panelProps }: PanelSlotProps) {
  const { Panel } = tab;
  return (
    <PanelErrorBoundary resetKey={tabKey}>
      <React.Suspense fallback={<PanelSkeleton />}>
        <Panel {...panelProps} />
      </React.Suspense>
    </PanelErrorBoundary>
  );
}
