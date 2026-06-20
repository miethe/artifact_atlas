"use client";

/**
 * CollaborationFooter — status bar at the bottom of the shell.
 * Displays: API connection status, last sync, agent activity indicator, keyboard shortcuts hint.
 * Always pairs color with text label (never color-only meaning).
 */

import * as React from "react";
import { clsx } from "clsx";
import { Wifi, WifiOff, Zap, Keyboard } from "lucide-react";

type ConnectionStatus = "connected" | "disconnected" | "checking";

interface CollaborationFooterProps {
  apiStatus?: ConnectionStatus;
  agentActivity?: string | null;
  lastSyncAt?: string | null;
  className?: string;
}

export function CollaborationFooter({
  apiStatus = "checking",
  agentActivity = null,
  lastSyncAt = null,
  className,
}: CollaborationFooterProps) {
  const statusConfig: Record<
    ConnectionStatus,
    { label: string; color: string; icon: React.ElementType }
  > = {
    connected: {
      label: "API connected",
      color: "text-green-600",
      icon: Wifi,
    },
    disconnected: {
      label: "API offline",
      color: "text-red-600",
      icon: WifiOff,
    },
    checking: {
      label: "Connecting…",
      color: "text-amber-600",
      icon: Wifi,
    },
  };

  const { label, color, icon: StatusIcon } = statusConfig[apiStatus];

  return (
    <footer
      role="contentinfo"
      aria-label="Status bar"
      className={clsx(
        "h-6 flex items-center gap-4 px-4 shrink-0",
        "border-t border-[var(--border)] bg-[var(--surface-sunken)]",
        "text-[11px] text-[var(--ink-faint)]",
        className,
      )}
    >
      {/* API status */}
      <span className={clsx("flex items-center gap-1", color)} title={label}>
        <StatusIcon className="w-3 h-3 shrink-0" aria-hidden />
        <span>{label}</span>
      </span>

      {/* Last sync */}
      {lastSyncAt && (
        <span className="hidden sm:inline" title={`Last synced: ${lastSyncAt}`}>
          Synced {lastSyncAt}
        </span>
      )}

      {/* Agent activity */}
      {agentActivity && (
        <span className="flex items-center gap-1 text-purple-600">
          <Zap className="w-3 h-3 shrink-0" aria-hidden />
          <span>{agentActivity}</span>
        </span>
      )}

      {/* Spacer */}
      <span className="flex-1" />

      {/* Keyboard shortcut hint */}
      <span
        className="hidden md:flex items-center gap-1"
        title="Press / to search, Cmd+K for command palette"
      >
        <Keyboard className="w-3 h-3" aria-hidden />
        <span>/ search · ⌘K palette</span>
      </span>
    </footer>
  );
}
