"use client";

/**
 * VersionHistoryCard — version rows per the mockup (version chip, lifecycle
 * chip, author, timestamp, Current marker).
 *
 * Built from real supersedes / superseded_by relationships when they exist;
 * the current asset's metadata.version labels its own row. Tasteful empty
 * state when no version chain is recorded.
 */

import * as React from "react";
import { clsx } from "clsx";
import { History } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Asset } from "@/lib/types";
import {
  readDetailMeta,
  type AssetRelationship,
} from "../../detailApi";
import { Avatar, DetailCard, formatDateTime, NotSet } from "./shared";

interface VersionRow {
  assetId: string;
  title: string;
  versionLabel: string;
  status: Asset["status"] | null;
  author: string | null;
  at: string | null;
  isCurrent: boolean;
}

export interface VersionHistoryCardProps {
  asset: Asset;
  projectId: string;
  relationships: AssetRelationship[];
  relatedAssets: Asset[];
  className?: string;
}

export function VersionHistoryCard({
  asset,
  projectId,
  relationships,
  relatedAssets,
  className,
}: VersionHistoryCardProps) {
  const meta = readDetailMeta(asset);
  const byId = new Map(relatedAssets.map((a) => [a.id, a]));

  // Assets this one supersedes (older), and any that supersede it (newer).
  const older: Asset[] = [];
  const newer: Asset[] = [];
  for (const rel of relationships) {
    if (rel.relationship_type !== "supersedes" && rel.relationship_type !== "superseded_by") {
      continue;
    }
    const isSource = rel.source_asset_id === asset.id;
    const counterpartId = isSource ? rel.target_asset_id : rel.source_asset_id;
    const counterpart = byId.get(counterpartId);
    if (!counterpart) continue;
    // A supersedes B ⇒ A newer than B. superseded_by is the inverse.
    const counterpartIsOlder =
      (rel.relationship_type === "supersedes" && isSource) ||
      (rel.relationship_type === "superseded_by" && !isSource);
    (counterpartIsOlder ? older : newer).push(counterpart);
  }

  const sortByCaptured = (a: Asset, b: Asset) =>
    (b.captured_at ?? "").localeCompare(a.captured_at ?? "");
  newer.sort(sortByCaptured);
  older.sort(sortByCaptured);

  const chain = [...newer, asset, ...older];
  const hasHistory = chain.length > 1;

  const rows: VersionRow[] = chain.map((a, i) => {
    const version =
      a.id === asset.id
        ? meta.version
        : (readDetailMeta(a).version ?? null);
    return {
      assetId: a.id,
      title: a.title,
      versionLabel: version ?? `v${chain.length - i}`,
      status: a.status,
      author: a.created_by ?? null,
      at: a.captured_at ?? null,
      isCurrent: a.id === asset.id,
    };
  });

  return (
    <DetailCard title="Version History" icon={History} className={className}>
      {!hasHistory ? (
        <div className="py-1">
          <NotSet label="No version history yet" />
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Version rows appear when supersedes relationships link this asset
            to earlier or later revisions.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {rows.map((row) => {
            const inner = (
              <div
                className={clsx(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md min-w-0",
                  row.isCurrent
                    ? "bg-blue-600/5 border border-blue-500/20"
                    : "hover:bg-[var(--surface-sunken)] transition-colors duration-[100ms]",
                )}
              >
                <span
                  className={clsx(
                    "shrink-0 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold",
                    row.isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--surface-sunken)] text-[var(--ink-muted)] border border-[var(--border)]",
                  )}
                >
                  {row.versionLabel}
                </span>
                {row.status && <StatusBadge status={row.status} size="xs" />}
                {row.author && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-muted)] truncate">
                    <Avatar name={row.author} size="xs" />
                    {row.author}
                  </span>
                )}
                <span className="flex-1" />
                <span className="text-[10px] text-[var(--ink-faint)] shrink-0">
                  {formatDateTime(row.at) ?? "—"}
                </span>
                {row.isCurrent && (
                  <span className="shrink-0 text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                    Current
                  </span>
                )}
              </div>
            );
            return (
              <li key={row.assetId}>
                {row.isCurrent ? (
                  inner
                ) : (
                  <Link
                    href={`/projects/${projectId}/assets/${row.assetId}`}
                    className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    title={row.title}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DetailCard>
  );
}
