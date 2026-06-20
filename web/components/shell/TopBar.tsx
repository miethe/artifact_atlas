"use client";

/**
 * TopBar — fixed-height header row.
 * Contains: GlobalSearch, Cmd+K hint, notification placeholder, user avatar.
 * '/' shortcut is wired inside GlobalSearch.
 * Cmd/Ctrl+K shortcut opens CommandPalette (emitted via custom event).
 */

import * as React from "react";
import { Bell, Settings } from "lucide-react";
import { clsx } from "clsx";
import { GlobalSearch } from "./GlobalSearch";
import { IconButton } from "@/components/ui/IconButton";

interface TopBarProps {
  projectId?: string;
  className?: string;
}

export function TopBar({ projectId, className }: TopBarProps) {
  // Emit a custom event that CommandPalette listens for
  function openCommandPalette() {
    document.dispatchEvent(new CustomEvent("artifact-atlas:open-palette"));
  }

  // Cmd/Ctrl+K → open command palette
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandPalette();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header
      role="banner"
      className={clsx(
        "h-11 flex items-center gap-3 px-4 shrink-0",
        "border-b border-[var(--border)] bg-[var(--surface)]",
        className,
      )}
    >
      {/* Search */}
      <GlobalSearch projectId={projectId} className="flex-1 max-w-sm" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command palette hint */}
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Open command palette (Cmd K)"
        title="Open command palette"
        className={clsx(
          "hidden sm:flex items-center gap-1 px-2 py-1 rounded text-xs",
          "text-gray-400 border border-[var(--border)] bg-[var(--bg-subtle)]",
          "hover:bg-gray-100 hover:text-gray-600 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        )}
      >
        <kbd className="font-mono">⌘</kbd>
        <kbd className="font-mono">K</kbd>
      </button>

      {/* Notification bell */}
      <IconButton aria-label="Notifications" size="sm" variant="ghost">
        <Bell className="w-4 h-4" aria-hidden />
      </IconButton>

      {/* Settings */}
      <IconButton aria-label="Settings" size="sm" variant="ghost">
        <Settings className="w-4 h-4" aria-hidden />
      </IconButton>

      {/* User avatar */}
      <button
        type="button"
        aria-label="User menu"
        title="User menu"
        className={clsx(
          "w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-medium",
          "flex items-center justify-center shrink-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
          "hover:bg-blue-700 transition-colors",
        )}
      >
        N
      </button>
    </header>
  );
}
