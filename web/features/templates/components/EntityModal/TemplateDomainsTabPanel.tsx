"use client";

/**
 * TemplateDomainsTabPanel — Domains tab for the TemplateTabRegistry (P2B-004).
 * Shows: expandable domain + slot list (migrated from TemplatePreviewPanel).
 */

import * as React from "react";
import { clsx } from "clsx";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { useTemplate } from "../../hooks";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function TemplateDomainsTabPanel({
  entityId,
  projectId: _projectId,
}: TabPanelProps) {
  const { data: template, isLoading } = useTemplate(entityId);
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

  if (isLoading) return <PanelSkeleton />;

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        Template not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="px-4 py-2 text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider border-b border-[var(--border)] bg-[var(--surface-sunken)]"
        aria-hidden
      >
        {template.domains.length} domain{template.domains.length !== 1 ? "s" : ""}
      </div>
      <ul className="divide-y divide-[var(--border)]" role="list">
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
                aria-controls={`modal-domain-${domain.name}`}
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
                  id={`modal-domain-${domain.name}`}
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
  );
}
