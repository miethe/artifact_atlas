"use client";

import * as React from "react";
import { clsx } from "clsx";

// ============================================================
// Tooltip — accessible hover/focus tooltip
// Uses native title as fallback; custom render for styled version
// ============================================================

export interface TooltipProps {
  content: string;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
}

export function Tooltip({
  content,
  children,
  side = "top",
  className,
  delay = 600,
}: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = React.useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const positionClasses: Record<TooltipProps["side"] & string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children, {
        "aria-describedby": visible ? "tooltip-content" : undefined,
      } as React.HTMLAttributes<HTMLElement>)}
      {visible && (
        <span
          id="tooltip-content"
          role="tooltip"
          className={clsx(
            "absolute z-50 px-2 py-1 text-[11px] font-medium",
            "bg-gray-900 text-white rounded shadow-md",
            "whitespace-nowrap pointer-events-none",
            "animate-fade-in",
            positionClasses[side],
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
