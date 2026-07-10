"use client";

/**
 * MissingSlotCard — dashed "drop asset here" card for an unfilled BOM slot
 * (WS-5, mockup fidelity). Clicking opens the asset picker to fill the slot.
 */

import * as React from "react";
import { clsx } from "clsx";
import { FilePlus2 } from "lucide-react";
import type { BomSlot } from "@/lib/types";
import { slotDisplayName } from "./domainMeta";

export interface MissingSlotCardProps {
  slot: BomSlot;
  onFill: (slot: BomSlot) => void;
  className?: string;
}

export function MissingSlotCard({ slot, onFill, className }: MissingSlotCardProps) {
  const name = slotDisplayName(slot);

  return (
    <button
      type="button"
      onClick={() => onFill(slot)}
      aria-label={`Missing slot: ${name}. Click to assign an asset.`}
      className={clsx(
        "group flex flex-col items-center justify-center gap-1.5 text-center",
        "min-h-[150px] rounded-lg border-2 border-dashed px-3 py-4",
        "border-purple-300 bg-purple-50/40 dark:border-purple-800 dark:bg-purple-950/20",
        "hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40",
        "transition-colors duration-[150ms]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-100 text-purple-500 dark:bg-purple-900/50 dark:text-purple-300 group-hover:scale-105 transition-transform"
      >
        <FilePlus2 className="w-4.5 h-4.5 w-[18px] h-[18px]" />
      </span>
      <span className="text-xs font-semibold text-[var(--ink)] leading-tight line-clamp-2">
        {name}
      </span>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
        Missing
      </span>
      <span className="text-[10px] text-[var(--ink-faint)]">
        Drop asset here
      </span>
    </button>
  );
}
