import * as React from "react";
import { clsx } from "clsx";
import type { ContextPackStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ContextPackStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  ready: {
    label: "Ready",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  published: {
    label: "Published",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-600",
  },
  archived: {
    label: "Archived",
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-300",
  },
};

interface PackStatusBadgeProps {
  status: ContextPackStatus;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function PackStatusBadge({
  status,
  size = "sm",
  className,
}: PackStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      aria-label={`Status: ${config.label}`}
      className={clsx(
        "inline-flex items-center gap-1 font-medium rounded-full",
        config.bg,
        config.text,
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx("rounded-full shrink-0", config.dot, {
          "w-1.5 h-1.5": size !== "md",
          "w-2 h-2": size === "md",
        })}
      />
      {config.label}
    </span>
  );
}
