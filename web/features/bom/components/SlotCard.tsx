"use client";

/**
 * SlotCard — renders a single BOM slot in all UI states.
 *
 * States: empty/missing (dotted), partial, in_progress, complete, stale, blocked, not_applicable, optional.
 * Interactions: click-to-open drawer, assign, unassign, mark N/A, request asset, view assignments.
 * Keyboard: Enter/Space opens menu; all actions accessible without mouse.
 * Audit-sensitive actions (unassign, N/A) require confirm Dialog.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  Plus,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  MinusCircle,
  MoreHorizontal,
  Unlink,
  MessageSquarePlus,
  ListChecks,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { BomSlot, BomSlotStatus } from "@/lib/types";
import { SlotStatusBadge, SLOT_STATUS_CONFIG } from "./SlotStatusBadge";
import { useSlotAssign, useSlotUnassign, useSlotMarkNA, useSlotRequestAsset } from "../hooks/useBomSlot";

// ============================================================
// Status icon mapping
// ============================================================

const STATUS_ICONS: Record<BomSlotStatus, React.ReactNode> = {
  missing: <Plus className="w-4 h-4" aria-hidden />,
  partial: <AlertTriangle className="w-4 h-4" aria-hidden />,
  in_progress: <Clock className="w-4 h-4" aria-hidden />,
  complete: <CheckCircle2 className="w-4 h-4" aria-hidden />,
  stale: <AlertTriangle className="w-4 h-4" aria-hidden />,
  blocked: <Ban className="w-4 h-4" aria-hidden />,
  not_applicable: <MinusCircle className="w-4 h-4" aria-hidden />,
};

// ============================================================
// Card border/bg by status
// ============================================================

function getCardStyle(status: BomSlotStatus, required: boolean): string {
  if (status === "not_applicable") {
    return "border border-[var(--border)] bg-gray-50 opacity-60";
  }
  if (status === "missing" && required) {
    return "border-2 border-dashed border-red-300 bg-red-50/30 hover:border-red-400 hover:bg-red-50/50";
  }
  if (status === "missing" && !required) {
    return "border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] hover:border-blue-300 hover:bg-blue-50/20";
  }
  if (status === "partial") {
    return "border border-amber-200 bg-amber-50/20 hover:border-amber-300";
  }
  if (status === "in_progress") {
    return "border border-sky-200 bg-sky-50/20 hover:border-sky-300";
  }
  if (status === "complete") {
    return "border border-emerald-200 bg-emerald-50/20 hover:border-emerald-300";
  }
  if (status === "stale") {
    return "border border-orange-200 bg-orange-50/20 hover:border-orange-300";
  }
  if (status === "blocked") {
    return "border border-red-200 bg-red-50/20 hover:border-red-300";
  }
  return "border border-[var(--border)] bg-white hover:border-blue-300";
}

// ============================================================
// Context menu
// ============================================================

interface SlotMenuProps {
  slot: BomSlot;
  onAssign: () => void;
  onUnassign: () => void;
  onMarkNA: () => void;
  onRequestAsset: () => void;
  onViewAssignments: () => void;
  onClose: () => void;
}

function SlotMenu({
  slot,
  onAssign,
  onUnassign,
  onMarkNA,
  onRequestAsset,
  onViewAssignments,
  onClose,
}: SlotMenuProps) {
  const canAssign =
    slot.status !== "complete" && slot.status !== "not_applicable";
  const canUnassign = slot.assignment_count > 0;
  const canMarkNA = slot.status !== "not_applicable";
  const hasAssignments = slot.assignment_count > 0;

  return (
    <div
      role="menu"
      aria-label={`Actions for ${slot.name}`}
      className={clsx(
        "absolute right-0 top-full mt-1 z-30 min-w-[176px]",
        "bg-white border border-[var(--border)] rounded-lg shadow-lg py-1",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {canAssign && (
        <button
          role="menuitem"
          onClick={() => { onAssign(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--ink)] hover:bg-gray-50 text-left"
        >
          <Paperclip className="w-3.5 h-3.5 text-blue-500" aria-hidden />
          Assign asset
        </button>
      )}
      {hasAssignments && (
        <button
          role="menuitem"
          onClick={() => { onViewAssignments(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--ink)] hover:bg-gray-50 text-left"
        >
          <ListChecks className="w-3.5 h-3.5 text-[var(--ink-muted)]" aria-hidden />
          View assignments ({slot.assignment_count})
        </button>
      )}
      {canUnassign && (
        <button
          role="menuitem"
          onClick={() => { onUnassign(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 text-left"
        >
          <Unlink className="w-3.5 h-3.5" aria-hidden />
          Unassign
        </button>
      )}
      <button
        role="menuitem"
        onClick={() => { onRequestAsset(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--ink)] hover:bg-gray-50 text-left"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 text-purple-500" aria-hidden />
        Request asset
      </button>
      {canMarkNA && (
        <>
          <div className="my-1 border-t border-[var(--border)]" role="separator" />
          <button
            role="menuitem"
            onClick={() => { onMarkNA(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 text-left"
          >
            <MinusCircle className="w-3.5 h-3.5" aria-hidden />
            Mark N/A
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================
// Assign dialog (simple: enter asset ID or search)
// ============================================================

interface AssignDialogProps {
  open: boolean;
  slot: BomSlot;
  onClose: () => void;
}

function AssignDialog({ open, slot, onClose }: AssignDialogProps) {
  const assign = useSlotAssign(slot.id);
  const [assetId, setAssetId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetId.trim()) return;
    assign.mutate(
      { asset_id: assetId.trim(), notes: notes.trim() || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Assign asset to: ${slot.name}`}
      description="Enter the asset ID to assign, or search by title."
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={assign.isPending}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
          >
            Assign
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="assign-asset-id"
            className="text-xs font-medium text-[var(--ink)]"
          >
            Asset ID <span aria-hidden className="text-red-500">*</span>
          </label>
          <input
            id="assign-asset-id"
            type="text"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="asset_..."
            required
            className={clsx(
              "h-8 px-2.5 text-xs rounded border border-[var(--border)]",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "placeholder:text-[var(--ink-faint)]",
            )}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="assign-notes"
            className="text-xs font-medium text-[var(--ink)]"
          >
            Notes (optional)
          </label>
          <textarea
            id="assign-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Context for this assignment..."
            className={clsx(
              "px-2.5 py-1.5 text-xs rounded border border-[var(--border)] resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "placeholder:text-[var(--ink-faint)]",
            )}
          />
        </div>
        {assign.isError && (
          <p role="alert" className="text-xs text-red-600">
            {assign.error instanceof Error
              ? assign.error.message
              : "Assignment failed. Please try again."}
          </p>
        )}
      </form>
    </Dialog>
  );
}

// ============================================================
// Confirm unassign dialog
// ============================================================

interface ConfirmUnassignDialogProps {
  open: boolean;
  slot: BomSlot;
  onClose: () => void;
}

function ConfirmUnassignDialog({ open, slot, onClose }: ConfirmUnassignDialogProps) {
  const unassign = useSlotUnassign(slot.id);

  function handleConfirm() {
    // We don't have assignment IDs from the slot card; unassign all
    unassign.mutate("all", { onSuccess: onClose });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Unassign asset"
      description={`Remove all asset assignments from "${slot.name}"? This will be recorded in the audit log.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={unassign.isPending}
            onClick={handleConfirm}
          >
            Unassign
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--ink-muted)]">
        This action will be recorded in the audit log. The slot will return to a{" "}
        <span className="font-medium text-[var(--ink)]">missing</span> state.
      </p>
    </Dialog>
  );
}

// ============================================================
// Confirm mark N/A dialog
// ============================================================

interface ConfirmNADialogProps {
  open: boolean;
  slot: BomSlot;
  onClose: () => void;
}

function ConfirmNADialog({ open, slot, onClose }: ConfirmNADialogProps) {
  const markNA = useSlotMarkNA(slot.id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Mark slot as Not Applicable"
      description={`"${slot.name}" will be excluded from coverage scoring. This is recorded in the audit log.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={markNA.isPending}
            onClick={() => markNA.mutate(undefined, { onSuccess: onClose })}
          >
            Mark N/A
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--ink-muted)]">
        Not-applicable slots are excluded from the required denominator and do not count
        as gaps. Coverage scores will be recalculated.
      </p>
    </Dialog>
  );
}

// ============================================================
// Request asset dialog
// ============================================================

interface RequestAssetDialogProps {
  open: boolean;
  slot: BomSlot;
  onClose: () => void;
}

function RequestAssetDialog({ open, slot, onClose }: RequestAssetDialogProps) {
  const request = useSlotRequestAsset(slot.id);
  const [notes, setNotes] = React.useState("");
  const [urgency, setUrgency] = React.useState<"low" | "medium" | "high">("medium");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Request asset for: ${slot.name}`}
      description="This creates a draft suggestion. No IntentTree task is created without your explicit approval."
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={request.isPending}
            onClick={() =>
              request.mutate(
                { notes: notes.trim() || undefined, urgency },
                { onSuccess: onClose },
              )
            }
          >
            Submit request
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="req-urgency" className="text-xs font-medium text-[var(--ink)]">
            Urgency
          </label>
          <select
            id="req-urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as "low" | "medium" | "high")}
            className={clsx(
              "h-8 px-2.5 text-xs rounded border border-[var(--border)]",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            )}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="req-notes" className="text-xs font-medium text-[var(--ink)]">
            Notes (optional)
          </label>
          <textarea
            id="req-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Context about what's needed and why..."
            className={clsx(
              "px-2.5 py-1.5 text-xs rounded border border-[var(--border)] resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "placeholder:text-[var(--ink-faint)]",
            )}
          />
        </div>
        <p className="text-[11px] text-[var(--ink-muted)] bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
          Asset requests create draft suggestions only. IntentTree task creation requires
          explicit confirmation in a separate step.
        </p>
      </div>
    </Dialog>
  );
}

// ============================================================
// View assignments drawer panel (inline list)
// ============================================================

interface AssignmentsPanelProps {
  open: boolean;
  slot: BomSlot;
  onClose: () => void;
}

function AssignmentsPanel({ open, slot, onClose }: AssignmentsPanelProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Assignments: ${slot.name}`}
      description={`${slot.assignment_count} asset(s) assigned to this slot.`}
      size="md"
      footer={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {slot.assignment_count === 0 ? (
        <p className="text-sm text-[var(--ink-muted)]">No assets assigned yet.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--ink-muted)]">
            Assignments are managed through the API. To view full details, use the asset
            library or the CLI.
          </p>
          <div className="rounded border border-[var(--border)] px-3 py-2 bg-[var(--surface-sunken)]">
            <p className="text-xs font-mono text-[var(--ink-muted)]">
              {slot.assignment_count} assignment{slot.assignment_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ============================================================
// SlotCard
// ============================================================

export interface SlotCardProps {
  slot: BomSlot;
  /** Called when user clicks the card body (open detail) */
  onOpen?: (slot: BomSlot) => void;
}

export function SlotCard({ slot, onOpen }: SlotCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [unassignOpen, setUnassignOpen] = React.useState(false);
  const [naOpen, setNaOpen] = React.useState(false);
  const [requestOpen, setRequestOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  // Close menu on Escape
  React.useEffect(() => {
    if (!menuOpen) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [menuOpen]);

  const cfg = SLOT_STATUS_CONFIG[slot.status];

  return (
    <>
      <div
        className={clsx(
          "relative rounded-lg p-3 group transition-all duration-[150ms] cursor-pointer",
          getCardStyle(slot.status, slot.required),
          slot.status === "not_applicable" && "cursor-default",
        )}
        onClick={() => slot.status !== "not_applicable" && onOpen?.(slot)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && slot.status !== "not_applicable") {
            e.preventDefault();
            onOpen?.(slot);
          }
        }}
        role="article"
        aria-label={`BOM slot: ${slot.name}, status: ${cfg.label}`}
        tabIndex={slot.status === "not_applicable" ? -1 : 0}
      >
        {/* Top row: icon + status + optional badge + actions */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              aria-hidden
              className={clsx(
                "shrink-0 mt-0.5",
                slot.status === "missing" && slot.required && "text-red-500",
                slot.status === "missing" && !slot.required && "text-[var(--ink-faint)]",
                slot.status === "partial" && "text-amber-600",
                slot.status === "in_progress" && "text-sky-600",
                slot.status === "complete" && "text-emerald-600",
                slot.status === "stale" && "text-orange-600",
                slot.status === "blocked" && "text-red-700",
                slot.status === "not_applicable" && "text-gray-400",
              )}
            >
              {STATUS_ICONS[slot.status]}
            </span>
            <SlotStatusBadge status={slot.status} size="xs" />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!slot.required && (
              <span className="text-[10px] text-[var(--ink-faint)] font-medium uppercase tracking-wide">
                opt
              </span>
            )}
            {/* More actions button */}
            <div className="relative" ref={menuRef}>
              <Tooltip content="Slot actions">
                <button
                  ref={triggerRef}
                  type="button"
                  aria-label={`Open actions for ${slot.name}`}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                  className={clsx(
                    "rounded p-0.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                    "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white/70",
                    "transition-opacity duration-[100ms]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  )}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" aria-hidden />
                </button>
              </Tooltip>
              {menuOpen && (
                <SlotMenu
                  slot={slot}
                  onAssign={() => setAssignOpen(true)}
                  onUnassign={() => setUnassignOpen(true)}
                  onMarkNA={() => setNaOpen(true)}
                  onRequestAsset={() => setRequestOpen(true)}
                  onViewAssignments={() => setViewOpen(true)}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Slot name */}
        <p
          className={clsx(
            "mt-2 text-xs font-semibold leading-tight truncate",
            slot.status === "not_applicable"
              ? "text-gray-400"
              : "text-[var(--ink)]",
          )}
        >
          {slot.name}
        </p>

        {/* Phase + domain metadata */}
        <div className="mt-1.5 flex items-center gap-1 flex-wrap">
          {slot.phase && (
            <span className="text-[10px] text-[var(--ink-faint)] bg-gray-100 rounded px-1.5 py-0.5 capitalize">
              {slot.phase}
            </span>
          )}
          {slot.domain && (
            <span className="text-[10px] text-[var(--ink-faint)] bg-gray-100 rounded px-1.5 py-0.5">
              {slot.domain}
            </span>
          )}
        </div>

        {/* Assignment count pill */}
        {slot.assignment_count > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <Paperclip className="w-3 h-3 text-[var(--ink-faint)]" aria-hidden />
            <span className="text-[10px] text-[var(--ink-muted)]">
              {slot.assignment_count} asset{slot.assignment_count !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Missing required — CTA strip */}
        {slot.status === "missing" && slot.required && (
          <button
            type="button"
            aria-label={`Assign asset to ${slot.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setAssignOpen(true);
            }}
            className={clsx(
              "mt-2.5 w-full flex items-center justify-center gap-1.5",
              "py-1 rounded text-[11px] font-medium",
              "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200",
              "transition-colors duration-[100ms]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            )}
          >
            <Plus className="w-3 h-3" aria-hidden />
            Assign
          </button>
        )}

        {/* Complete checkmark overlay */}
        {slot.status === "complete" && (
          <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-0 transition-opacity duration-[100ms]">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden />
          </div>
        )}
      </div>

      {/* Dialogs — rendered outside the card to avoid z-index issues */}
      <AssignDialog
        open={assignOpen}
        slot={slot}
        onClose={() => setAssignOpen(false)}
      />
      <ConfirmUnassignDialog
        open={unassignOpen}
        slot={slot}
        onClose={() => setUnassignOpen(false)}
      />
      <ConfirmNADialog
        open={naOpen}
        slot={slot}
        onClose={() => setNaOpen(false)}
      />
      <RequestAssetDialog
        open={requestOpen}
        slot={slot}
        onClose={() => setRequestOpen(false)}
      />
      <AssignmentsPanel
        open={viewOpen}
        slot={slot}
        onClose={() => setViewOpen(false)}
      />
    </>
  );
}

// ============================================================
// SlotCardSkeleton
// ============================================================

export function SlotCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-gray-200" />
        <div className="w-14 h-4 rounded-full bg-gray-200" />
      </div>
      <div className="mt-2 w-3/4 h-3 rounded bg-gray-200" />
      <div className="mt-1.5 flex gap-1">
        <div className="w-12 h-3.5 rounded bg-gray-100" />
        <div className="w-16 h-3.5 rounded bg-gray-100" />
      </div>
    </div>
  );
}
