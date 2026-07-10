"use client";

/**
 * ApplyTemplateDialog — pick a template and apply it to the project BOM
 * (WS-5). Uses the existing apply-template endpoint via useApplyTemplate.
 */

import * as React from "react";
import { clsx } from "clsx";
import { LayoutTemplate } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useTemplates, useApplyTemplate } from "@/features/templates/hooks";

export interface ApplyTemplateDialogProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export function ApplyTemplateDialog({
  projectId,
  open,
  onClose,
}: ApplyTemplateDialogProps) {
  const { data: templates, isLoading } = useTemplates();
  const apply = useApplyTemplate(projectId);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setSelectedId(null);
      setResult(null);
    }
  }, [open]);

  const handleApply = () => {
    if (!selectedId) return;
    apply.mutate(
      { template_id: selectedId, merge_mode: "skip_existing" },
      {
        onSuccess: (res) => {
          setResult(
            `Applied — ${res.slots_created ?? 0} slots created, ${res.slots_skipped ?? 0} skipped.`,
          );
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Apply Template"
      description="Add expected artifact slots from a template. Existing slots are kept."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {result ? "Done" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedId || !!result}
            loading={apply.isPending}
            onClick={handleApply}
          >
            Apply
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1" role="listbox" aria-label="Templates">
        {isLoading ? (
          <p className="text-xs text-[var(--ink-muted)]">Loading templates…</p>
        ) : (
          (templates ?? []).map((t) => {
            const selected = selectedId === t.id;
            const slotCount = t.domains.reduce(
              (acc, d) => acc + d.slots.length,
              0,
            );
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setSelectedId(selected ? null : t.id)}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors",
                  selected
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40"
                    : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                )}
              >
                <span className="flex items-center justify-center w-7 h-7 rounded bg-[var(--surface-sunken)] text-[var(--ink-muted)] shrink-0">
                  <LayoutTemplate className="w-3.5 h-3.5" aria-hidden />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-[var(--ink)] truncate">
                    {t.name}
                  </span>
                  <span className="block text-[10px] text-[var(--ink-faint)]">
                    {t.domains.length} domains · {slotCount} slots
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      {result && (
        <p role="status" className="mt-3 text-xs text-emerald-600">
          {result}
        </p>
      )}
      {apply.isError && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {apply.error instanceof Error
            ? apply.error.message
            : "Apply failed. Please try again."}
        </p>
      )}
    </Dialog>
  );
}
