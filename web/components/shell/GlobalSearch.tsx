"use client";

/**
 * GlobalSearch — search input in TopBar.
 * '/' keyboard shortcut focuses it from anywhere.
 * Posts to /api/search; shows dropdown with results.
 * Keyboard: ArrowUp/Down navigate results, Enter selects, Escape closes.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { clsx } from "clsx";
import { searchApi } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface GlobalSearchProps {
  projectId?: string;
  className?: string;
}

export function GlobalSearch({ projectId, className }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // '/' shortcut focuses search
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.search({
          q: query,
          project_id: projectId,
          limit: 8,
        });
        setResults(res.results);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, projectId]);

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function selectResult(result: SearchResult) {
    router.push(`/projects/${projectId ?? "proj_artifact_atlas"}/assets/${result.asset_id}`);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectResult(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={clsx("relative", className)}>
      <div className="relative flex items-center">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Search assets"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="global-search-results"
          aria-activedescendant={
            activeIdx >= 0 ? `gsr-${activeIdx}` : undefined
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search assets… /"
          className={clsx(
            "h-7 w-64 rounded pl-7 pr-6 text-sm bg-[var(--bg-subtle)] border border-[var(--border)]",
            "placeholder:text-gray-400 text-[var(--ink)]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white",
            "transition-colors duration-[100ms]",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" aria-hidden />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && (
        <ul
          id="global-search-results"
          role="listbox"
          aria-label="Search results"
          className={clsx(
            "absolute top-full mt-1 left-0 w-80 z-50",
            "bg-white border border-[var(--border)] rounded shadow-modal",
            "max-h-72 overflow-y-auto",
            "animate-fade-in",
          )}
        >
          {loading && (
            <li className="px-3 py-2 text-xs text-gray-400">Searching…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-400">No results</li>
          )}
          {!loading &&
            results.map((r, i) => (
              <li
                key={r.asset_id}
                id={`gsr-${i}`}
                role="option"
                aria-selected={i === activeIdx}
                className={clsx(
                  "flex items-start gap-2 px-3 py-2 cursor-pointer",
                  "text-sm border-b border-[var(--border)] last:border-0",
                  i === activeIdx
                    ? "bg-blue-50"
                    : "hover:bg-gray-50",
                )}
                onMouseDown={() => selectResult(r)}
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate font-medium text-[var(--ink)]">
                    {r.title}
                  </span>
                  {r.snippet && (
                    <span className="block truncate text-xs text-[var(--ink-muted)]">
                      {r.snippet}
                    </span>
                  )}
                </span>
                <StatusBadge status={r.status} size="xs" />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
