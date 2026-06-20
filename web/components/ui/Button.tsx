"use client";

import * as React from "react";
import { clsx } from "clsx";

// ============================================================
// Button — primary atom, operational SaaS density
// ============================================================

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";

type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500",
  secondary:
    "bg-white text-gray-700 border border-[var(--border)] hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-blue-500",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-blue-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500",
  outline:
    "bg-transparent text-blue-600 border border-blue-300 hover:bg-blue-50 active:bg-blue-100 focus-visible:ring-blue-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-[11px] gap-1 rounded",
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded",
  md: "h-8 px-3 text-sm gap-2 rounded",
  lg: "h-9 px-4 text-sm gap-2 rounded",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      loading = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={loading}
        className={clsx(
          // Base
          "inline-flex items-center justify-center font-medium",
          "transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          "select-none whitespace-nowrap",
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          // Width
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size={size} />
        ) : (
          iconLeft && (
            <span aria-hidden className="shrink-0">
              {iconLeft}
            </span>
          )
        )}
        {children && <span>{children}</span>}
        {iconRight && !loading && (
          <span aria-hidden className="shrink-0">
            {iconRight}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

// ============================================================
// Loading spinner (internal)
// ============================================================

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const dims = size === "xs" || size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <svg
      className={clsx(dims, "animate-spin shrink-0")}
      xmlns="http://www.w3.org/2000/svg"
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
  );
}
