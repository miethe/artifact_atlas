"use client";

/**
 * AssetLink — a clickable reference to an asset that opens its detail modal.
 *
 * Wherever an asset is listed by name (linked-entity rows, inline mentions,
 * dashboard lists), wrap the label in <AssetLink> so it becomes a keyboard-
 * accessible control that opens the canonical EntityModal. The page owns the
 * modal mount + `onOpen` handler (see `useAssetModal`); this component is the
 * presentational trigger only.
 *
 * Renders a <button> (it opens an in-page overlay, not a navigation), so it
 * MUST NOT wrap other interactive elements (nested buttons/anchors are invalid
 * HTML). For rows with their own actions, keep those siblings outside the link.
 */

import * as React from "react";
import { clsx } from "clsx";

export interface AssetLinkProps {
  /** The asset id to open. */
  assetId: string;
  /** Opens the asset modal — typically `useAssetModal().openAsset`. */
  onOpen: (assetId: string) => void;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  title?: string;
}

export function AssetLink({
  assetId,
  onOpen,
  children,
  className,
  "aria-label": ariaLabel,
  title,
}: AssetLinkProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(assetId);
      }}
      aria-label={ariaLabel}
      title={title}
      className={clsx(
        "text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        className,
      )}
    >
      {children}
    </button>
  );
}
