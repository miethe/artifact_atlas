import * as React from "react";
import { clsx } from "clsx";
import type { TemplateStatus } from "@/lib/types";

const TEMPLATE_STATUS_CONFIG: Record<
  TemplateStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  core: {
    label: "Core",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  recommended: {
    label: "Recommended",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  optional: {
    label: "Optional",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  experimental: {
    label: "Experimental",
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  deprecated: {
    label: "Deprecated",
    bg: "bg-red-100",
    text: "text-red-600",
    dot: "bg-red-400",
  },
};

interface TemplateStatusBadgeProps {
  status: TemplateStatus;
  size?: "xs" | "sm";
  className?: string;
}

export function TemplateStatusBadge({
  status,
  size = "sm",
  className,
}: TemplateStatusBadgeProps) {
  const cfg = TEMPLATE_STATUS_CONFIG[status];
  return (
    <span
      role="status"
      aria-label={`Template status: ${cfg.label}`}
      className={clsx(
        "inline-flex items-center gap-1 font-medium rounded-full",
        cfg.bg,
        cfg.text,
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "rounded-full shrink-0",
          cfg.dot,
          size === "xs" ? "w-1 h-1" : "w-1.5 h-1.5",
        )}
      />
      {cfg.label}
    </span>
  );
}
