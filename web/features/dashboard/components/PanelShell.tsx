"use client";

/**
 * PanelShell — reusable wrapper for dashboard panels.
 * Dense operational SaaS; card radius ≤8px; no decorative blobs.
 *
 * WS-4: now delegates to the ExpandablePane primitive so every command-center
 * panel gets a fullscreen expand affordance. Pass `expandedContent` with the
 * FULL (uncapped) list to control what the fullscreen overlay shows;
 * it falls back to `children`.
 */

import * as React from "react";
import { ExpandablePane } from "@/components/ui/ExpandablePane";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** aria-label override for the panel region */
  ariaLabel?: string;
  /** When set renders a "View all" link in the header */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Full (uncapped) content for the fullscreen overlay; defaults to children */
  expandedContent?: React.ReactNode;
  /** Optional footer strip pinned to the bottom of the pane */
  footer?: React.ReactNode;
}

export function PanelShell({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  ariaLabel,
  viewAllHref,
  viewAllLabel = "View all",
  expandedContent,
  footer,
}: PanelShellProps) {
  return (
    <ExpandablePane
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={actions}
      className={className}
      ariaLabel={ariaLabel}
      viewAllHref={viewAllHref}
      viewAllLabel={viewAllLabel}
      expandedContent={expandedContent}
      footer={footer}
    >
      {children}
    </ExpandablePane>
  );
}
