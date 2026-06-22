"use client";

/**
 * useAssetModal — page-level helper for opening the canonical asset detail
 * EntityModal from anywhere an asset is listed (board cards, dashboard panels,
 * linked-entity rows, …).
 *
 * The modal is URL-driven (`?item=<id>&tab=<key>`) via `useEntityModalUrl`, so
 * a page mounts the modal exactly once and threads `openAsset` down to its
 * child surfaces. Mirrors the pattern AssetLibrary established inline; this
 * hook packages it so every surface stays consistent.
 *
 * Usage:
 *   const { openAsset, assetModal } = useAssetModal(projectId, {
 *     title: (id) => assets.find((a) => a.id === id)?.title,
 *   });
 *   // …wire child onClick → openAsset(asset.id)…
 *   return <>{children}{assetModal}</>;
 */

import * as React from "react";
import {
  EntityModal,
  useEntityModalUrl,
} from "@/features/ui/components/EntityModal";
import { ASSET_TAB_REGISTRY } from "../components/EntityModal/AssetTabRegistry";

export interface UseAssetModalOptions {
  /** Resolve a human title for the open asset (falls back to humanized id). */
  title?: (itemId: string | null) => string | undefined;
}

export interface UseAssetModalResult {
  /** Open the asset detail modal for `assetId` (toggles closed if already open). */
  openAsset: (assetId: string) => void;
  /** Close the modal. */
  closeAsset: () => void;
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** The currently open asset id, or null. */
  itemId: string | null;
  /** Mount this node once per page — renders the modal when open, else null. */
  assetModal: React.ReactNode;
}

export function useAssetModal(
  projectId: string,
  options?: UseAssetModalOptions,
): UseAssetModalResult {
  const { isOpen, itemId, open, close } = useEntityModalUrl(ASSET_TAB_REGISTRY);

  const openAsset = React.useCallback(
    (assetId: string) => {
      // Toggle: clicking the open asset again closes the modal.
      if (isOpen && itemId === assetId) {
        close();
      } else {
        open(assetId);
      }
    },
    [isOpen, itemId, open, close],
  );

  const assetModal = isOpen ? (
    <EntityModal
      entityType="asset"
      entityId={itemId ?? undefined}
      projectId={projectId}
      tabRegistry={ASSET_TAB_REGISTRY}
      onClose={close}
      title={options?.title?.(itemId)}
    />
  ) : null;

  return { openAsset, closeAsset: close, isOpen, itemId, assetModal };
}
