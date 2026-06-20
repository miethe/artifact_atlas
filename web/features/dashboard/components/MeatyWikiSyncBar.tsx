"use client";

/**
 * MeatyWikiSyncBar — integration status row with sync/export actions.
 * Action buttons are enabled/disabled based on live integration status.
 * Status-changing actions are placeholders (no live mutation yet — Stage 2A scope).
 */

import * as React from "react";
import { ExternalLink, RefreshCw, Download, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui";
import type { IntegrationStatus } from "@/lib/types";

// ============================================================
// Helper — relative time
// ============================================================

function relativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "never";
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================
// Component
// ============================================================

interface MeatyWikiSyncBarProps {
  integration: IntegrationStatus | null;
  isLoading?: boolean;
}

export function MeatyWikiSyncBar({
  integration,
  isLoading = false,
}: MeatyWikiSyncBarProps) {
  const isConnected = integration?.status === "connected";
  const isSyncing = integration?.status === "syncing";

  return (
    <div
      role="region"
      aria-label="MeatyWiki integration status"
      className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-[var(--border)] rounded-lg"
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2 min-w-0">
        {isLoading ? (
          <span aria-hidden className="w-3.5 h-3.5 rounded-full bg-gray-200 animate-pulse" />
        ) : isConnected ? (
          <Wifi aria-hidden className="w-3.5 h-3.5 text-green-600 shrink-0" />
        ) : (
          <WifiOff aria-hidden className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        )}

        <div className="min-w-0">
          <span className="text-xs font-semibold text-[var(--ink)]">
            MeatyWiki
          </span>
          <span className="ml-2 text-[10px] text-[var(--ink-faint)]">
            {isLoading
              ? "Checking..."
              : isConnected
                ? `Synced ${relativeTime(integration?.last_sync_at)}`
                : integration?.status === "error"
                  ? `Error${integration?.error_message ? `: ${integration.error_message}` : ""}`
                  : "Disconnected"}
          </span>
        </div>

        {/* Connection status chip — color always paired with text */}
        <span
          role="status"
          aria-label={`MeatyWiki status: ${integration?.status ?? "unknown"}`}
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
            isConnected
              ? "bg-green-100 text-green-700"
              : integration?.status === "error"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-500"
          }`}
        >
          {isConnected
            ? "Connected"
            : integration?.status === "error"
              ? "Error"
              : "Disconnected"}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="xs"
          variant="ghost"
          disabled={!isConnected || isSyncing || isLoading}
          iconLeft={<RefreshCw aria-hidden className="w-3 h-3" />}
          aria-label={
            isConnected ? "Sync with MeatyWiki" : "MeatyWiki not connected"
          }
          onClick={() => {
            // Placeholder — mutation will be wired in Stage 2B
          }}
        >
          {isSyncing ? "Syncing…" : "Sync"}
        </Button>

        <Button
          size="xs"
          variant="ghost"
          disabled={!isConnected || isLoading}
          iconLeft={<ExternalLink aria-hidden className="w-3 h-3" />}
          aria-label={
            isConnected
              ? "Open project in MeatyWiki"
              : "MeatyWiki not connected"
          }
          onClick={() => {
            // Placeholder — deep link will be derived from meatywiki_page_ref
          }}
        >
          Open in MeatyWiki
        </Button>

        <Button
          size="xs"
          variant="ghost"
          disabled={!isConnected || isLoading}
          iconLeft={<Download aria-hidden className="w-3 h-3" />}
          aria-label={
            isConnected ? "Export context pack" : "MeatyWiki not connected"
          }
          onClick={() => {
            // Placeholder — export flow in Stage 2B
          }}
        >
          Export
        </Button>
      </div>
    </div>
  );
}
