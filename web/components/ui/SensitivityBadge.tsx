import * as React from "react";
import { clsx } from "clsx";
import { ShieldCheck, Shield, ShieldAlert, ShieldX } from "lucide-react";
import type { Sensitivity } from "@/lib/types";

// ============================================================
// SensitivityBadge — color ALWAYS paired with icon + text (WCAG)
// ============================================================

const SENSITIVITY_CONFIG: Record<
  Sensitivity,
  {
    label: string;
    bg: string;
    text: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  public: {
    label: "Public",
    bg: "bg-green-100",
    text: "text-green-700",
    Icon: ShieldCheck,
  },
  personal: {
    label: "Personal",
    bg: "bg-blue-100",
    text: "text-blue-700",
    Icon: Shield,
  },
  work_sensitive: {
    label: "Work Sensitive",
    bg: "bg-amber-100",
    text: "text-amber-700",
    Icon: ShieldAlert,
  },
  client_sensitive: {
    label: "Client Sensitive",
    bg: "bg-red-100",
    text: "text-red-700",
    Icon: ShieldX,
  },
  restricted: {
    label: "Restricted",
    bg: "bg-red-100",
    text: "text-red-800",
    Icon: ShieldX,
  },
};

export interface SensitivityBadgeProps {
  sensitivity: Sensitivity;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function SensitivityBadge({
  sensitivity,
  size = "sm",
  showIcon = true,
  className,
}: SensitivityBadgeProps) {
  const config = SENSITIVITY_CONFIG[sensitivity];
  const { Icon } = config;

  const iconSize = size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";

  return (
    <span
      aria-label={`Sensitivity: ${config.label}`}
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
      {showIcon && (
        <Icon aria-hidden className={clsx(iconSize, "shrink-0")} />
      )}
      {config.label}
    </span>
  );
}
