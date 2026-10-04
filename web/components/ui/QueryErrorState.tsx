"use client";

/**
 * QueryErrorState — honest failure state for a live reader query.
 * Says the source could not be read, that no fallback values are shown,
 * and offers a retry. Follows the /overview error pattern.
 */

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { ApiRequestError } from "@/lib/api";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

export interface QueryErrorStateProps {
  title: string;
  error?: unknown;
  onRetry?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Short, non-sensitive description of a query failure. */
export function describeQueryError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const code = error.code ? ` (${error.code})` : "";
    return `API returned ${error.status}${code}.`;
  }
  return "The API is unavailable.";
}

export function QueryErrorState({
  title,
  error,
  onRetry,
  size = "sm",
  className,
}: QueryErrorStateProps) {
  return (
    <div role="alert" className={className}>
      <EmptyState
        size={size}
        icon={<AlertTriangle className="w-full h-full text-red-500" />}
        title={title}
        description={`${describeQueryError(error)} No fallback data is being shown.`}
        action={
          onRetry ? (
            <Button variant="secondary" size="sm" onClick={() => onRetry()}>
              Retry
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
