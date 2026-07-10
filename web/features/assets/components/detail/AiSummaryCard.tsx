"use client";

/**
 * AiSummaryCard — AI-Generated Summary (per mockup). Renders
 * metadata.ai_summary when present; "Regenerate summary" calls the existing
 * POST /assets/{id}/summarize endpoint (202 queued; workers are still stubbed
 * server-side, which we surface honestly). The summary text is also
 * hand-editable and persists to metadata.ai_summary.
 */

import * as React from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Asset } from "@/lib/types";
import {
  readDetailMeta,
  useMergeAssetMetadata,
  useSummarizeAsset,
} from "../../detailApi";
import { DetailCard, detailInputClass } from "./shared";

export interface AiSummaryCardProps {
  asset: Asset;
  notify: (text: string, tone?: "info" | "success" | "error") => void;
  className?: string;
}

export function AiSummaryCard({ asset, notify, className }: AiSummaryCardProps) {
  const meta = readDetailMeta(asset);
  const summarize = useSummarizeAsset(asset.id);
  const { merge, isPending } = useMergeAssetMetadata(asset);

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  function regenerate() {
    summarize.mutate(undefined, {
      onSuccess: (res) => {
        notify(
          res.note
            ? `Summary request queued — ${res.note}`
            : "Summary request queued.",
        );
      },
      onError: (err) =>
        notify((err as Error).message ?? "Failed to queue summary.", "error"),
    });
  }

  function startEdit() {
    setDraft(meta.aiSummary ?? "");
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    merge(
      { ai_summary: draft.trim() },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <DetailCard
      title="AI-Generated Summary"
      icon={Sparkles}
      className={className}
      titleSuffix={
        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 text-[9px] font-bold uppercase tracking-wide">
          AI
        </span>
      }
      action={
        !editing ? (
          <Button size="xs" variant="ghost" onClick={startEdit}>
            {meta.aiSummary ? "Edit" : "Write"}
          </Button>
        ) : undefined
      }
    >
      {editing ? (
        <form onSubmit={save} className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            aria-label="AI summary text"
            placeholder="Summary of this asset…"
            className={`${detailInputClass} resize-y`}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" loading={isPending}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : meta.aiSummary ? (
        <p className="text-xs text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
          {meta.aiSummary}
        </p>
      ) : (
        <p className="text-xs italic text-[var(--ink-faint)]">
          No summary yet. Generate one, or write it by hand.
        </p>
      )}

      {!editing && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          loading={summarize.isPending}
          onClick={regenerate}
          iconLeft={<RefreshCw aria-hidden className="w-3.5 h-3.5" />}
        >
          {meta.aiSummary ? "Regenerate summary" : "Generate summary"}
        </Button>
      )}
    </DetailCard>
  );
}
