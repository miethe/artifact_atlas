import * as React from "react";
import { clsx } from "clsx";
import { Inbox } from "lucide-react";

// ============================================================
// EmptyState — standardized empty/zero-state with optional CTA
// ============================================================

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const iconSizeClass = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }[size];

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center",
        size === "sm" && "gap-2 py-6 px-4",
        size === "md" && "gap-3 py-10 px-6",
        size === "lg" && "gap-4 py-16 px-8",
        className,
      )}
    >
      <div
        aria-hidden
        className={clsx(
          "text-[var(--ink-faint)]",
          iconSizeClass,
        )}
      >
        {icon ?? <Inbox className="w-full h-full" />}
      </div>
      <div className="flex flex-col gap-1">
        <p
          className={clsx(
            "font-medium text-[var(--ink-muted)]",
            size === "sm" ? "text-sm" : "text-base",
          )}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs text-[var(--ink-faint)] max-w-xs">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
