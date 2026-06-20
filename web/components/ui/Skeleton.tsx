import * as React from "react";
import { clsx } from "clsx";

// ============================================================
// Skeleton — loading placeholder for stable layout
// ============================================================

interface SkeletonProps {
  className?: string;
  /** Circular variant for avatars/icons */
  circle?: boolean;
}

export function Skeleton({ className, circle }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={clsx(
        "animate-pulse bg-gray-200",
        circle ? "rounded-full" : "rounded",
        className,
      )}
    />
  );
}

// ============================================================
// SkeletonCard — preset for asset/metric card skeletons
// ============================================================

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "bg-white border border-[var(--border)] rounded-lg p-4 flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5" circle />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-16" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================
// SkeletonRow — preset for table/list row skeletons
// ============================================================

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 border-b border-[var(--border)] last:border-0",
        className,
      )}
    >
      <Skeleton className="w-8 h-8 rounded shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-2.5 w-32" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}
