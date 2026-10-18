import type { Asset } from "@/lib/types";

const CANDIDATE_STATUSES = new Set([
  "candidate",
  "selected",
  "in_review",
  "in_progress",
]);

export function candidateAssets(assets: Asset[] | undefined): Asset[] {
  return (assets ?? []).filter((asset) => CANDIDATE_STATUSES.has(asset.status));
}
