"use client";

/**
 * AnnotationsCard — reviewer annotations (per mockup: avatar, timestamp,
 * note, "Add annotation"). Persists in metadata.annotations via PATCH.
 */

import * as React from "react";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Asset } from "@/lib/types";
import {
  readDetailMeta,
  useMergeAssetMetadata,
  type AnnotationMeta,
} from "../../detailApi";
import {
  Avatar,
  DetailCard,
  detailInputClass,
  formatDateTime,
  NotSet,
} from "./shared";

export interface AnnotationsCardProps {
  asset: Asset;
  className?: string;
}

export function AnnotationsCard({ asset, className }: AnnotationsCardProps) {
  const meta = readDetailMeta(asset);
  const { merge, isPending } = useMergeAssetMetadata(asset);

  const [adding, setAdding] = React.useState(false);
  const [text, setText] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const note = text.trim();
    if (!note) return;
    const annotation: AnnotationMeta = {
      author: asset.created_by ?? "you",
      at: new Date().toISOString(),
      text: note,
    };
    merge(
      { annotations: [...meta.annotations, annotation] },
      {
        onSuccess: () => {
          setText("");
          setAdding(false);
        },
      },
    );
  }

  return (
    <DetailCard
      title={`Annotations${meta.annotations.length > 0 ? ` (${meta.annotations.length})` : ""}`}
      icon={MessageSquare}
      className={className}
      action={
        !adding ? (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setAdding(true)}
            iconLeft={<Plus aria-hidden className="w-3 h-3" />}
          >
            Add annotation
          </Button>
        ) : undefined
      }
    >
      {meta.annotations.length === 0 && !adding ? (
        <NotSet onAdd={() => setAdding(true)} label="No annotations yet" />
      ) : (
        <ul className="space-y-3">
          {meta.annotations.map((a, i) => (
            <li key={`${a.at ?? i}-${i}`} className="flex items-start gap-2">
              <Avatar name={a.author ?? "?"} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-[var(--ink-muted)] leading-tight">
                  <span className="font-semibold text-[var(--ink)]">
                    {a.author ?? "Unknown"}
                  </span>
                  {a.at && <span className="ml-1.5">{formatDateTime(a.at)}</span>}
                </p>
                <p className="text-xs text-[var(--ink)] mt-0.5 leading-relaxed whitespace-pre-wrap">
                  {a.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            aria-label="New annotation"
            placeholder="Add a note about this asset…"
            className={`${detailInputClass} resize-y`}
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isPending}
              disabled={!text.trim()}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </DetailCard>
  );
}
