"use client";

import * as React from "react";
import { clsx } from "clsx";

// ============================================================
// IconButton — icon-only button with required aria-label/tooltip
// WCAG 2.1 AA: all icon-only buttons must have aria-label
// ============================================================

type IconButtonVariant = "ghost" | "secondary" | "danger" | "primary";
type IconButtonSize = "xs" | "sm" | "md" | "lg";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required for accessibility — describes the action */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Show tooltip (defaults to aria-label text) */
  tooltip?: string;
  loading?: boolean;
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    "text-gray-500 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200",
  secondary:
    "text-gray-600 bg-white border border-[var(--border)] hover:bg-gray-50 active:bg-gray-100",
  danger:
    "text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100",
  primary:
    "text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
};

const sizeClasses: Record<IconButtonSize, string> = {
  xs: "w-5 h-5 rounded text-[10px]",
  sm: "w-6 h-6 rounded text-xs",
  md: "w-7 h-7 rounded text-sm",
  lg: "w-8 h-8 rounded text-base",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      "aria-label": ariaLabel,
      variant = "ghost",
      size = "md",
      tooltip,
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const tooltipText = tooltip ?? ariaLabel;

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        title={tooltipText}
        disabled={isDisabled}
        aria-busy={loading}
        className={clsx(
          "inline-flex items-center justify-center shrink-0",
          "transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-40",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          children
        )}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
