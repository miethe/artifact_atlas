"use client";

/**
 * PolicyBadge — compact badge + expandable panel for asset agent access policy.
 * Color always paired with text label (WCAG).
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  EyeOff,
  Eye,
  FileSearch,
  BookOpen,
  Package,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import type { AgentAccess } from "@/lib/types";

// ============================================================
// Config
// ============================================================

const ACCESS_CONFIG: Record<
  AgentAccess,
  {
    label: string;
    description: string;
    bg: string;
    text: string;
    border: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  none: {
    label: "No Access",
    description: "Agents cannot access this asset.",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    Icon: EyeOff,
  },
  metadata_only: {
    label: "Metadata Only",
    description: "Agents can see title, type, and status but not content.",
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    Icon: FileSearch,
  },
  preview_allowed: {
    label: "Preview",
    description: "Agents can access a preview (thumbnail, snippet) of the content.",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    Icon: Eye,
  },
  read_allowed: {
    label: "Read",
    description: "Agents can read the full content of this asset.",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    Icon: BookOpen,
  },
  context_pack_allowed: {
    label: "Context Pack",
    description: "Agents may include this asset in context packs for delegation.",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    Icon: Package,
  },
};

// ============================================================
// PolicyBadge — compact chip
// ============================================================

export interface PolicyBadgeProps {
  agentAccess: AgentAccess;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function PolicyBadge({ agentAccess, size = "sm", className }: PolicyBadgeProps) {
  const config = ACCESS_CONFIG[agentAccess];
  const { Icon } = config;

  const iconSize = size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";

  return (
    <span
      aria-label={`Agent access: ${config.label}`}
      title={config.description}
      className={clsx(
        "inline-flex items-center gap-1 rounded font-medium",
        config.bg,
        config.text,
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <Icon aria-hidden className={clsx(iconSize, "shrink-0")} />
      {config.label}
    </span>
  );
}

// ============================================================
// PolicyPanel — expandable detail panel for asset detail page
// ============================================================

export interface PolicyPanelProps {
  agentAccess: AgentAccess;
  /** Whether canonical promotion is gated */
  canonicalGated?: boolean;
  onChangeAccess?: (access: AgentAccess) => void;
  className?: string;
}

export function PolicyPanel({
  agentAccess,
  canonicalGated = false,
  onChangeAccess,
  className,
}: PolicyPanelProps) {
  const [expanded, setExpanded] = React.useState(false);
  const config = ACCESS_CONFIG[agentAccess];
  const { Icon } = config;

  return (
    <div
      className={clsx(
        "rounded border",
        config.border,
        "bg-white overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label="Toggle policy panel"
        className={clsx(
          "w-full flex items-center gap-2 px-3 py-2.5 text-left",
          "hover:bg-gray-50 transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
        )}
      >
        <Icon aria-hidden className={clsx("w-4 h-4 shrink-0", config.text)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--ink)]">Agent Access Policy</p>
          <p className={clsx("text-[11px]", config.text)}>{config.label}</p>
        </div>
        {expanded ? (
          <ChevronUp aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
        ) : (
          <ChevronDown aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-[var(--border)] pt-3 space-y-3">
          <p className="text-xs text-[var(--ink-muted)]">{config.description}</p>

          {canonicalGated && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded bg-amber-50 border border-amber-200">
              <Info aria-hidden className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                Canonical promotion requires explicit human review and confirmation.
              </p>
            </div>
          )}

          {onChangeAccess && (
            <div>
              <p className="text-[10px] font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
                Change access
              </p>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(ACCESS_CONFIG) as AgentAccess[]).map((access) => {
                  const ac = ACCESS_CONFIG[access];
                  const AcIcon = ac.Icon;
                  return (
                    <button
                      key={access}
                      type="button"
                      onClick={() => onChangeAccess(access)}
                      aria-pressed={agentAccess === access}
                      className={clsx(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium",
                        "border transition-colors duration-[100ms]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        agentAccess === access
                          ? clsx(ac.bg, ac.text, ac.border)
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
                      )}
                    >
                      <AcIcon aria-hidden className="w-2.5 h-2.5" />
                      {ac.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
