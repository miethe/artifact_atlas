"use client";

/**
 * RightDrawer — collapsible right-rail panel.
 * - Focus trapped when open (a11y).
 * - Escape key closes.
 * - Animated slide-in from right.
 * - Children slot receives any content (asset inspector, detail, etc.).
 */

import * as React from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { IconButton } from "@/components/ui/IconButton";

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: "sm" | "md" | "lg";
  children: React.ReactNode;
  /** If true the drawer overlays (modal-like). If false it shifts the layout. */
  overlay?: boolean;
  className?: string;
}

const widthClasses = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
};

export function RightDrawer({
  open,
  onClose,
  title,
  width = "md",
  children,
  overlay = true,
  className,
}: RightDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // Focus trap
  React.useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus first focusable element
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }

    drawer.addEventListener("keydown", onKeyDown);
    return () => drawer.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open && overlay) return null;

  return (
    <>
      {/* Backdrop (overlay mode only) */}
      {overlay && open && (
        <div
          className="fixed inset-0 z-30 bg-black/10"
          aria-hidden
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        role="complementary"
        aria-label={title ?? "Inspector"}
        aria-hidden={!open}
        className={clsx(
          "flex flex-col border-l border-[var(--border)] bg-[var(--surface)]",
          "transition-all duration-200",
          overlay
            ? "fixed top-0 right-0 h-full z-40 shadow-drawer"
            : "relative h-full",
          widthClasses[width],
          !open && !overlay && "w-0 overflow-hidden",
          open ? "animate-slide-in-right" : "",
          className,
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0 h-11">
          {title && (
            <span className="text-sm font-medium text-[var(--ink)] truncate">
              {title}
            </span>
          )}
          <div className="ml-auto">
            <IconButton
              aria-label="Close panel"
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="w-4 h-4" aria-hidden />
            </IconButton>
          </div>
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}
