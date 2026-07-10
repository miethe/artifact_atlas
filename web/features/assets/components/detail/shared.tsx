"use client";

/**
 * Shared building blocks for the asset detail view:
 * DetailCard shell, FieldRow, NotSet empty value, Avatar, Snackbar,
 * and small formatting helpers.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Plus } from "lucide-react";

// ============================================================
// Formatting helpers
// ============================================================

export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes === null || bytes === undefined) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    const mins = Math.round(diffMs / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.round(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.round(months / 12)}y ago`;
  } catch {
    return null;
  }
}

// ============================================================
// DetailCard — card shell used across the three columns
// ============================================================

export interface DetailCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Small element rendered at the right edge of the header (Edit, Manage…). */
  action?: React.ReactNode;
  /** Chip rendered inline after the title (e.g. AI badge, counts). */
  titleSuffix?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function DetailCard({
  title,
  icon: Icon,
  action,
  titleSuffix,
  children,
  className,
  bodyClassName,
}: DetailCardProps) {
  return (
    <section
      aria-label={title}
      className={clsx(
        "rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        {Icon && (
          <Icon aria-hidden className="w-4 h-4 text-[var(--ink-muted)] shrink-0" />
        )}
        <h3 className="text-[13px] font-semibold text-[var(--ink)]">{title}</h3>
        {titleSuffix}
        <div className="flex-1" />
        {action}
      </div>
      <div className={clsx("px-4 pb-4", bodyClassName)}>{children}</div>
    </section>
  );
}

// ============================================================
// FieldRow — label/value row with tasteful empty state
// ============================================================

export interface FieldRowProps {
  label: string;
  value?: React.ReactNode;
  /** Called when the user clicks the "Add" affordance on an empty value. */
  onAdd?: () => void;
  monospace?: boolean;
}

export function FieldRow({ label, value, onAdd, monospace }: FieldRowProps) {
  const isEmpty =
    value === null || value === undefined || value === "" || value === false;
  return (
    <div className="flex items-start justify-between gap-3 py-1 min-w-0">
      <span className="text-xs text-[var(--ink-muted)] shrink-0 w-24">{label}</span>
      {isEmpty ? (
        <NotSet onAdd={onAdd} />
      ) : (
        <span
          className={clsx(
            "text-xs text-[var(--ink)] text-right min-w-0 break-words",
            monospace && "font-mono text-[11px]",
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

/** "Not set" placeholder with optional add action. */
export function NotSet({ onAdd, label = "Not set" }: { onAdd?: () => void; label?: string }) {
  if (!onAdd) {
    return <span className="text-xs italic text-[var(--ink-faint)]">{label}</span>;
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      className={clsx(
        "inline-flex items-center gap-0.5 text-xs italic text-[var(--ink-faint)]",
        "hover:text-blue-600 transition-colors duration-[100ms] rounded",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      )}
    >
      {label}
      <Plus aria-hidden className="w-3 h-3" />
    </button>
  );
}

// ============================================================
// Avatar — initials chip for authors/creators
// ============================================================

export function Avatar({ name, size = "sm" }: { name: string; size?: "xs" | "sm" }) {
  const initials = name
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join(" ")
    .replace(" ", "");
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-flex items-center justify-center rounded-full shrink-0",
        "bg-blue-600/10 text-blue-700 dark:text-blue-300 font-semibold",
        size === "xs" ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[9px]",
      )}
    >
      {initials || "?"}
    </span>
  );
}

// ============================================================
// Snackbar — transient notice for stub actions / feedback
// ============================================================

export interface SnackbarMessage {
  id: number;
  text: string;
  tone?: "info" | "success" | "error";
}

export function Snackbar({
  message,
  onDone,
}: {
  message: SnackbarMessage | null;
  onDone: () => void;
}) {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      role="status"
      className={clsx(
        "fixed bottom-5 right-5 z-[70] max-w-sm px-3.5 py-2.5 rounded-lg shadow-lg text-xs",
        "border animate-in fade-in slide-in-from-bottom-2",
        message.tone === "error"
          ? "bg-red-600 text-white border-red-700"
          : message.tone === "success"
            ? "bg-emerald-600 text-white border-emerald-700"
            : "bg-[var(--ink)] text-[var(--surface)] border-transparent",
      )}
    >
      {message.text}
    </div>
  );
}

/** Hook for a single transient snackbar message. */
export function useSnackbar() {
  const [message, setMessage] = React.useState<SnackbarMessage | null>(null);
  const notify = React.useCallback(
    (text: string, tone: SnackbarMessage["tone"] = "info") => {
      setMessage({ id: Date.now(), text, tone });
    },
    [],
  );
  const clear = React.useCallback(() => setMessage(null), []);
  return { message, notify, clear };
}

// ============================================================
// Small input style shared by inline-edit forms
// ============================================================

export const detailInputClass = clsx(
  "w-full px-2.5 py-1.5 rounded border border-[var(--border)] text-xs",
  "text-[var(--ink)] bg-[var(--surface)]",
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400",
  "placeholder:text-[var(--ink-faint)] transition-colors duration-[100ms]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);
