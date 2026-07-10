"use client";

/**
 * ActionRow — top-right actions for the asset detail header:
 *   Open Original · Link to Node · Add to Context Pack · Compare Variants
 *
 * Open Original    → original_uri / uri when http, else the content proxy.
 * Link to Node     → dialog → POST /api/assets/{id}/link (real).
 * Add to Pack      → dialog → GET pack detail + PATCH items (real).
 * Compare Variants → navigates attention to related variants when present,
 *                    otherwise a "not yet available" notice (no backend).
 */

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Link2,
  Package,
  Columns2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { assetContentUrl } from "@/lib/api";
import { useLinkAsset } from "@/lib/hooks/useAssets";
import type { Asset, AssetLinkRelationship } from "@/lib/types";
import {
  assetDetailKeys,
  useAddAssetToPack,
  usePackOptions,
} from "../../detailApi";
import { detailInputClass } from "./shared";

const LINK_RELATIONSHIPS: AssetLinkRelationship[] = [
  "reference",
  "input",
  "output",
  "evidence",
  "candidate",
  "canonical",
  "required_context",
];

export interface ActionRowProps {
  asset: Asset;
  projectId: string;
  /** Count of variant_of relationships (for Compare Variants). */
  variantCount: number;
  notify: (text: string, tone?: "info" | "success" | "error") => void;
  /** Controlled Link-to-Node dialog state (shared with IntentTree Links card). */
  linkOpen: boolean;
  setLinkOpen: (open: boolean) => void;
  className?: string;
}

export function ActionRow({
  asset,
  projectId,
  variantCount,
  notify,
  linkOpen,
  setLinkOpen,
  className,
}: ActionRowProps) {
  const [packOpen, setPackOpen] = React.useState(false);

  // ----- Open Original -----
  const originalHref =
    asset.original_uri?.startsWith("http")
      ? asset.original_uri
      : asset.uri.startsWith("http")
        ? asset.uri
        : assetContentUrl(asset.id);

  // ----- Link to Node -----
  const qc = useQueryClient();
  const linkMutation = useLinkAsset(asset.id);
  const [nodeId, setNodeId] = React.useState("");
  const [relationship, setRelationship] =
    React.useState<AssetLinkRelationship>("reference");

  function submitLink(e: React.FormEvent) {
    e.preventDefault();
    if (!nodeId.trim()) return;
    linkMutation.mutate(
      {
        target_type: "intenttree_node",
        target_id: nodeId.trim(),
        relationship,
      },
      {
        onSuccess: () => {
          setLinkOpen(false);
          setNodeId("");
          qc.invalidateQueries({ queryKey: assetDetailKeys.links(asset.id) });
          notify(`Linked to IntentTree node ${nodeId.trim()}.`, "success");
        },
        onError: (err) =>
          notify((err as Error).message ?? "Failed to create link.", "error"),
      },
    );
  }

  // ----- Add to Context Pack -----
  const packOptions = usePackOptions(packOpen ? projectId : null);
  const addToPack = useAddAssetToPack();
  const [selectedPack, setSelectedPack] = React.useState("");

  function submitPack(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPack) return;
    addToPack.mutate(
      { packId: selectedPack, assetId: asset.id },
      {
        onSuccess: (res) => {
          setPackOpen(false);
          notify(
            res.alreadyPresent
              ? "Asset is already in that context pack."
              : "Asset added to context pack.",
            res.alreadyPresent ? "info" : "success",
          );
        },
        onError: (err) =>
          notify((err as Error).message ?? "Failed to add to pack.", "error"),
      },
    );
  }

  // ----- Compare Variants -----
  function compareVariants() {
    if (variantCount > 0) {
      notify(
        `${variantCount} variant${variantCount === 1 ? "" : "s"} listed under Related Assets below.`,
      );
      document
        .getElementById("related-assets")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      notify("Variant comparison is not yet available — no variant relationships recorded.");
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <a href={originalHref} target="_blank" rel="noopener noreferrer">
          <Button
            variant="outline"
            size="sm"
            iconLeft={<ExternalLink aria-hidden className="w-3.5 h-3.5" />}
          >
            Open Original
          </Button>
        </a>
        <Button
          variant="outline"
          size="sm"
          iconLeft={<Link2 aria-hidden className="w-3.5 h-3.5" />}
          onClick={() => setLinkOpen(true)}
        >
          Link to Node
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconLeft={<Package aria-hidden className="w-3.5 h-3.5" />}
          onClick={() => setPackOpen(true)}
        >
          Add to Context Pack
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconLeft={<Columns2 aria-hidden className="w-3.5 h-3.5" />}
          onClick={compareVariants}
        >
          Compare Variants
        </Button>
      </div>

      {/* Link to Node dialog */}
      <Dialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Link to IntentTree node"
        description="Creates an asset link to an IntentTree node (e.g. IT-102)."
        size="sm"
      >
        <form onSubmit={submitLink} className="space-y-3">
          <div>
            <label
              htmlFor="link-node-id"
              className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
            >
              Node ID
            </label>
            <input
              id="link-node-id"
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="e.g. IT-102"
              className={detailInputClass}
              required
            />
          </div>
          <div>
            <label
              htmlFor="link-relationship"
              className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
            >
              Relationship
            </label>
            <select
              id="link-relationship"
              value={relationship}
              onChange={(e) =>
                setRelationship(e.target.value as AssetLinkRelationship)
              }
              className={detailInputClass}
            >
              {LINK_RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLinkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={linkMutation.isPending}
              disabled={!nodeId.trim()}
            >
              Create link
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add to Context Pack dialog */}
      <Dialog
        open={packOpen}
        onClose={() => setPackOpen(false)}
        title="Add to context pack"
        description="Appends this asset as a preview-mode item on an existing pack."
        size="sm"
      >
        <form onSubmit={submitPack} className="space-y-3">
          {packOptions.isLoading ? (
            <p className="text-xs text-[var(--ink-muted)]">Loading packs…</p>
          ) : (packOptions.data?.length ?? 0) === 0 ? (
            <p className="text-xs text-[var(--ink-muted)]">
              No context packs exist for this project yet. Create one from the
              Context Packs page first.
            </p>
          ) : (
            <div>
              <label
                htmlFor="pack-select"
                className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
              >
                Context pack
              </label>
              <select
                id="pack-select"
                value={selectedPack}
                onChange={(e) => setSelectedPack(e.target.value)}
                className={detailInputClass}
                required
              >
                <option value="" disabled>
                  Select a pack…
                </option>
                {packOptions.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.status})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPackOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={addToPack.isPending}
              disabled={!selectedPack}
            >
              Add asset
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
