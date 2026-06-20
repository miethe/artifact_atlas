"use client";

/**
 * TemplatePreviewPanel — right-side inspector showing template domains, slot counts,
 * and required/optional breakdown. Used in both library and apply wizard.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  Layers,
  FileText,
  Star,
  Info,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui";
import { TemplateStatusBadge } from "./TemplateStatusBadge";
import type { ArtifactTemplate } from "../types";

interface TemplatePreviewPanelProps {
  template: ArtifactTemplate | null;
  onApply?: () => void;
  showApplyButton?: boolean;
  className?: string;
}

export function TemplatePreviewPanel({
  template,
  onApply,
  showApplyButton = true,
  className,
}: TemplatePreviewPanelProps) {
  const [expandedDomains, setExpandedDomains] = React.useState<Set<string>>(
    new Set(),
  );

  const toggleDomain = React.useCallback((name: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  if (!template) {
    return (
      <aside
        className={clsx(
          "flex flex-col items-center justify-center h-full text-center p-8",
          "border-l border-[var(--border)] bg-[var(--surface-sunken)]",
          className,
        )}
        aria-label="Template preview"
      >
        <Layers className="w-8 h-8 text-[var(--ink-faint)] mb-3" aria-hidden />
        <p className="text-sm font-medium text-[var(--ink-muted)]">
          Select a template to preview
        </p>
        <p className="text-xs text-[var(--ink-faint)] mt-1">
          Domains, slot counts, and readiness impact
        </p>
      </aside>
    );
  }

  const totalSlots = template.domains.flatMap((d) => d.slots).length;
  const requiredSlots = template.domains
    .flatMap((d) => d.slots)
    .filter((s) => s.required).length;
  const optionalSlots = totalSlots - requiredSlots;

  return (
    <aside
      className={clsx(
        "flex flex-col h-full border-l border-[var(--border)] bg-[var(--surface)]",
        className,
      )}
      aria-label={`Template preview: ${template.name}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-sunken)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider mb-0.5">
              Template Preview
            </p>
            <h2 className="text-sm font-semibold text-[var(--ink)] leading-snug">
              {template.name}
            </h2>
          </div>
          <TemplateStatusBadge status={template.status} size="xs" />
        </div>
        {template.description && (
          <p className="text-xs text-[var(--ink-muted)] mt-1.5 leading-relaxed">
            {template.description}
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-b border-[var(--border)]">
        <Stat
          label="Domains"
          value={template.domains.length}
          icon={<Layers className="w-3 h-3" />}
        />
        <Stat
          label="Required"
          value={requiredSlots}
          icon={<Star className="w-3 h-3" />}
          accent="blue"
        />
        <Stat
          label="Optional"
          value={optionalSlots}
          icon={<Info className="w-3 h-3" />}
          accent="gray"
        />
      </div>

      {/* Domain list */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-2 text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider"
          aria-hidden
        >
          Domains &amp; Slots
        </div>
        <ul className="divide-y divide-[var(--border)] text-sm" role="list">
          {template.domains.map((domain) => {
            const isOpen = expandedDomains.has(domain.name);
            const req = domain.slots.filter((s) => s.required).length;
            const opt = domain.slots.filter((s) => !s.required).length;

            return (
              <li key={domain.name}>
                <button
                  type="button"
                  className={clsx(
                    "w-full flex items-center gap-2 px-4 py-2.5 text-left",
                    "hover:bg-[var(--surface-sunken)] transition-colors duration-75",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)]",
                    isOpen && "bg-[var(--surface-sunken)]",
                  )}
                  onClick={() => toggleDomain(domain.name)}
                  aria-expanded={isOpen}
                  aria-controls={`domain-slots-${domain.name}`}
                >
                  <ChevronRight
                    className={clsx(
                      "w-3.5 h-3.5 text-[var(--ink-faint)] transition-transform duration-150 shrink-0",
                      isOpen && "rotate-90",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1 text-xs font-medium text-[var(--ink)] truncate">
                    {domain.name}
                  </span>
                  <span className="text-[10px] text-[var(--ink-faint)] shrink-0">
                    {req}R / {opt}O
                  </span>
                </button>

                {isOpen && (
                  <ul
                    id={`domain-slots-${domain.name}`}
                    className="pb-1"
                    role="list"
                    aria-label={`Slots in ${domain.name}`}
                  >
                    {domain.slots.map((slot) => (
                      <li
                        key={slot.artifact_type}
                        className="flex items-center gap-2 pl-10 pr-4 py-1.5"
                      >
                        {slot.required ? (
                          <CheckCircle2
                            className="w-3 h-3 text-blue-500 shrink-0"
                            aria-label="Required"
                          />
                        ) : (
                          <Circle
                            className="w-3 h-3 text-[var(--ink-faint)] shrink-0"
                            aria-label="Optional"
                          />
                        )}
                        <span className="text-xs text-[var(--ink)] truncate">
                          {slot.artifact_type}
                        </span>
                        {!slot.required && (
                          <span className="ml-auto text-[10px] text-[var(--ink-faint)] shrink-0">
                            opt
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Apply action */}
      {showApplyButton && onApply && (
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            iconLeft={<FileText className="w-3.5 h-3.5" aria-hidden />}
            onClick={onApply}
          >
            Apply to Project
          </Button>
          <p className="text-[10px] text-[var(--ink-faint)] text-center mt-1.5">
            Creates {requiredSlots} required + {optionalSlots} optional slots
          </p>
        </div>
      )}
    </aside>
  );
}

// ============================================================
// Stat cell
// ============================================================

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "blue" | "gray";
}) {
  return (
    <div className="flex flex-col items-center py-2.5 px-3 gap-0.5">
      <span
        className={clsx(
          "text-base font-bold tabular-nums leading-none",
          accent === "blue"
            ? "text-blue-600"
            : accent === "gray"
              ? "text-[var(--ink-muted)]"
              : "text-[var(--ink)]",
        )}
      >
        {value}
      </span>
      <span className="flex items-center gap-1 text-[9px] font-medium text-[var(--ink-faint)] uppercase tracking-wide">
        <span aria-hidden>{icon}</span>
        {label}
      </span>
    </div>
  );
}
