"use client";

/**
 * CommandPalette — Cmd/Ctrl+K opens; fully keyboard operable.
 *
 * Shortcuts documented here:
 *   Cmd/Ctrl+K      — open palette
 *   Escape          — close
 *   ArrowUp/Down    — navigate items
 *   Enter           — activate selected item
 *   /               — focus global search (handled in GlobalSearch)
 *
 * Navigation actions registered:
 *   go to overview, assets, inbox, board, bom, templates, context-packs
 * Quick actions:
 *   add asset, import from URL
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  LayoutDashboard,
  FolderOpen,
  Inbox,
  Kanban,
  Package,
  FileText,
  Layers,
  Plus,
  Link,
  GitBranch,
  Search,
} from "lucide-react";
import { clsx } from "clsx";
import { DEFAULT_PROJECT_ID } from "./SidebarNav";

interface PaletteItem {
  id: string;
  label: string;
  group: "navigate" | "action";
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  projectId?: string;
}

export function CommandPalette({
  projectId = DEFAULT_PROJECT_ID,
}: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const navItems: PaletteItem[] = [
    {
      id: "nav-overview",
      label: "Go to Overview",
      group: "navigate",
      icon: LayoutDashboard,
      action: () => router.push(`/projects/${projectId}`),
    },
    {
      id: "nav-assets",
      label: "Go to Assets",
      group: "navigate",
      icon: FolderOpen,
      action: () => router.push(`/projects/${projectId}/assets`),
    },
    {
      id: "nav-inbox",
      label: "Go to Inbox",
      group: "navigate",
      icon: Inbox,
      action: () => router.push(`/projects/${projectId}/inbox`),
    },
    {
      id: "nav-intent-nodes",
      label: "Go to Intent Nodes",
      group: "navigate",
      icon: GitBranch,
      action: () => router.push(`/projects/${projectId}/intent-nodes`),
    },
    {
      id: "nav-board",
      label: "Go to Board",
      group: "navigate",
      icon: Kanban,
      action: () => router.push(`/projects/${projectId}/board`),
    },
    {
      id: "nav-bom",
      label: "Go to Artifact BOM",
      group: "navigate",
      icon: Package,
      action: () => router.push(`/projects/${projectId}/bom`),
    },
    {
      id: "nav-templates",
      label: "Go to Templates",
      group: "navigate",
      icon: FileText,
      action: () => router.push(`/projects/${projectId}/templates`),
    },
    {
      id: "nav-context-packs",
      label: "Go to Context Packs",
      group: "navigate",
      icon: Layers,
      action: () => router.push(`/projects/${projectId}/context-packs`),
    },
    {
      id: "action-add-asset",
      label: "Add Asset",
      group: "action",
      icon: Plus,
      action: () => {
        router.push(`/projects/${projectId}/assets`);
        // Feature stage will wire this to open the Add Asset dialog
      },
    },
    {
      id: "action-import-url",
      label: "Import from URL",
      group: "action",
      icon: Link,
      action: () => {
        router.push(`/projects/${projectId}/inbox`);
      },
    },
    {
      id: "action-search",
      label: "Search Assets",
      group: "action",
      icon: Search,
      shortcut: "/",
      action: () => {
        document.dispatchEvent(new CustomEvent("artifact-atlas:focus-search"));
      },
    },
  ];

  const filtered = React.useMemo(() => {
    if (!query.trim()) return navItems;
    const q = query.toLowerCase();
    return navItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, navItems]);

  // Group filtered items
  const groups = React.useMemo(() => {
    const nav = filtered.filter((i) => i.group === "navigate");
    const actions = filtered.filter((i) => i.group === "action");
    return [
      ...(nav.length ? [{ label: "Navigate", items: nav }] : []),
      ...(actions.length ? [{ label: "Actions", items: actions }] : []),
    ];
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatItems = React.useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  // Listen for open event from TopBar/keyboard
  React.useEffect(() => {
    function onOpen() {
      setOpen(true);
      setQuery("");
      setActiveIdx(0);
    }
    document.addEventListener("artifact-atlas:open-palette", onOpen);
    return () =>
      document.removeEventListener("artifact-atlas:open-palette", onOpen);
  }, []);

  // Cmd/Ctrl+K — also handled in TopBar but keep here as fallback
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        if (!open) {
          setQuery("");
          setActiveIdx(0);
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Focus input on open
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function activate(item: PaletteItem) {
    item.action();
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIdx];
      if (item) activate(item);
    }
  }

  // Scroll active item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-palette-idx="${activeIdx}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  let flatIdx = 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-black/20"
        aria-hidden
        onClick={close}
      />

      {/* Panel */}
      <div
        className={clsx(
          "relative z-10 w-full max-w-xl bg-white rounded border border-[var(--border)]",
          "shadow-modal overflow-hidden",
          "animate-fade-in",
        )}
        onKeyDown={onKeyDown}
      >
        {/* Input */}
        <div className="flex items-center gap-2 px-3 border-b border-[var(--border)]">
          <Command
            className="w-4 h-4 text-gray-400 shrink-0"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Command palette search"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={`palette-item-${activeIdx}`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="Type a command or navigate…"
            className={clsx(
              "flex-1 h-11 text-sm bg-transparent text-[var(--ink)]",
              "placeholder:text-gray-400",
              "focus:outline-none",
            )}
          />
          <kbd
            className="text-xs text-gray-400 border border-[var(--border)] px-1 py-0.5 rounded font-mono"
            aria-label="Press Escape to close"
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <ul
          id="palette-list"
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          className="max-h-72 overflow-y-auto py-1"
        >
          {groups.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-400">
              No matching commands
            </li>
          )}
          {groups.map((group) => (
            <li key={group.label} role="presentation">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </div>
              <ul role="group" aria-label={group.label}>
                {group.items.map((item) => {
                  const idx = flatIdx++;
                  const active = idx === activeIdx;
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.id}
                      id={`palette-item-${idx}`}
                      data-palette-idx={idx}
                      role="option"
                      aria-selected={active}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2 cursor-pointer text-sm",
                        "transition-colors duration-[100ms]",
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-[var(--ink)] hover:bg-gray-50",
                      )}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        activate(item);
                      }}
                    >
                      <Icon
                        className={clsx(
                          "w-4 h-4 shrink-0",
                          active ? "text-blue-600" : "text-gray-400",
                        )}
                        aria-hidden
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="text-xs text-gray-400 font-mono border border-[var(--border)] px-1 rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
