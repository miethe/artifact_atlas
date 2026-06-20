import * as React from "react";
import { clsx } from "clsx";
import { X } from "lucide-react";

// ============================================================
// TagChip — compact inline tag with optional remove
// ============================================================

export interface TagChipProps {
  label: string;
  onRemove?: () => void;
  color?: "default" | "blue" | "purple" | "green" | "amber";
  size?: "xs" | "sm";
  className?: string;
}

const colorClasses: Record<NonNullable<TagChipProps["color"]>, string> = {
  default: "bg-gray-100 text-gray-600 hover:bg-gray-200",
  blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  green: "bg-green-100 text-green-700 hover:bg-green-200",
  amber: "bg-amber-100 text-amber-700 hover:bg-amber-200",
};

export function TagChip({
  label,
  onRemove,
  color = "default",
  size = "sm",
  className,
}: TagChipProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 rounded font-medium transition-colors",
        colorClasses[color],
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove tag ${label}`}
          className="ml-0.5 rounded opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
        >
          <X aria-hidden className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        </button>
      )}
    </span>
  );
}
