"use client";

import * as React from "react";
import { clsx } from "clsx";
import {
  Upload,
  Link2,
  FolderOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Keyboard,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { inboxApi } from "@/lib/api";
import { inboxKeys } from "@/lib/hooks/useInbox";
import type { InboxImportRequest, Sensitivity } from "@/lib/types";

// ============================================================
// InboxCaptureBar
// Handles: URL import, file picker, drag-and-drop zone
// Keyboard alternative: Enter/Space on each button
// ============================================================

export interface InboxCaptureBarProps {
  /** Project ID to scope inbox uploads/imports against. */
  projectId: string;
  onImport: (req: InboxImportRequest) => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  /** Called when the capture area enters drag-over state */
  onDragActive?: (active: boolean) => void;
}

const DEFAULT_SENSITIVITY: Sensitivity = "personal";

export function InboxCaptureBar({
  projectId,
  onImport,
  isLoading = false,
  isSuccess = false,
  isError = false,
  onDragActive,
}: InboxCaptureBarProps) {
  const qc = useQueryClient();
  const [urlInput, setUrlInput] = React.useState("");
  const [urlMode, setUrlMode] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploadState, setUploadState] = React.useState<{
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
  }>({ isLoading: false, isSuccess: false, isError: false });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const urlInputRef = React.useRef<HTMLInputElement>(null);

  const uploadFiles = React.useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploadState({ isLoading: true, isSuccess: false, isError: false });
      try {
        await inboxApi.upload(projectId, files, {
          sensitivity: DEFAULT_SENSITIVITY,
        });
        // Mirror useImportToInbox.onSuccess: refresh inbox + assets queries.
        qc.invalidateQueries({ queryKey: inboxKeys.all });
        qc.invalidateQueries({ queryKey: ["assets"] });
        setUploadState({ isLoading: false, isSuccess: true, isError: false });
      } catch {
        setUploadState({ isLoading: false, isSuccess: false, isError: true });
      }
    },
    [projectId, qc],
  );

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onImport({
      source_kind: "url",
      uris: [trimmed],
      sensitivity: DEFAULT_SENSITIVITY,
    });
    setUrlInput("");
    setUrlMode(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    void uploadFiles(Array.from(files));
    // Reset file input
    e.target.value = "";
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
    onDragActive?.(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
    onDragActive?.(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onDragActive?.(false);

    const files = Array.from(e.dataTransfer.files);
    const urls: string[] = [];

    // Try to get URLs from drag data
    const urlData = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (urlData) {
      urlData.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) urls.push(trimmed);
      });
    }

    if (files.length > 0) {
      void uploadFiles(files);
    } else if (urls.length > 0) {
      onImport({
        source_kind: "url",
        uris: urls,
        sensitivity: DEFAULT_SENSITIVITY,
      });
    }
  };

  // Keyboard alternative for drag/drop area: focus + Enter opens file picker
  const handleDropZoneKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  React.useEffect(() => {
    if (urlMode) {
      urlInputRef.current?.focus();
    }
  }, [urlMode]);

  // Merge local upload state with parent-driven URL import state for the
  // status indicator. Local upload wins when active.
  const combinedLoading = uploadState.isLoading || isLoading;
  const combinedSuccess = uploadState.isSuccess || isSuccess;
  const combinedError = uploadState.isError || isError;

  return (
    <div className="flex flex-col gap-2">
      {/* Drag-and-drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop files here or press Enter to pick files"
        aria-describedby="capture-keyboard-hint"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleDropZoneKey}
        className={clsx(
          "rounded border-2 border-dashed px-4 py-5 text-center cursor-pointer",
          "transition-colors duration-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-[var(--border)] hover:border-blue-300 hover:bg-gray-50/50",
        )}
      >
        {combinedLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 aria-hidden className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-xs text-[var(--ink-muted)]">Importing…</p>
          </div>
        ) : combinedSuccess ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 aria-hidden className="w-6 h-6 text-green-500" />
            <p className="text-xs text-green-700">Import queued</p>
          </div>
        ) : combinedError ? (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle aria-hidden className="w-6 h-6 text-red-500" />
            <p className="text-xs text-red-700">Import failed — try again</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Upload aria-hidden className="w-5 h-5 text-[var(--ink-faint)]" />
            <p className="text-xs text-[var(--ink-muted)]">
              Drag files or URLs here
            </p>
            <p id="capture-keyboard-hint" className="flex items-center gap-1 text-[10px] text-[var(--ink-faint)]">
              <Keyboard aria-hidden className="w-3 h-3" />
              Press Enter to open file picker
            </p>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="Select files to import"
          onChange={handleFileChange}
          tabIndex={-1}
        />

        <Tooltip content="Pick files from disk">
          <Button
            variant="secondary"
            size="xs"
            iconLeft={<FolderOpen aria-hidden className="w-3.5 h-3.5" />}
            onClick={() => fileInputRef.current?.click()}
            disabled={combinedLoading}
          >
            Pick files
          </Button>
        </Tooltip>

        <Tooltip content="Import from URL or clipboard">
          <Button
            variant="secondary"
            size="xs"
            iconLeft={<Link2 aria-hidden className="w-3.5 h-3.5" />}
            onClick={() => setUrlMode((v) => !v)}
            disabled={combinedLoading}
            aria-expanded={urlMode}
          >
            URL import
          </Button>
        </Tooltip>
      </div>

      {/* URL input */}
      {urlMode && (
        <form
          onSubmit={handleUrlSubmit}
          className="flex gap-2 animate-fade-in"
          aria-label="Import from URL"
        >
          <input
            ref={urlInputRef}
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://…"
            aria-label="URL to import"
            required
            className={clsx(
              "flex-1 rounded border border-[var(--border)] bg-[var(--surface)]",
              "px-2.5 py-1 text-xs text-[var(--ink)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              "placeholder:text-[var(--ink-faint)]",
            )}
            onKeyDown={(e) => {
              if (e.key === "Escape") setUrlMode(false);
            }}
          />
          <Button
            type="submit"
            variant="primary"
            size="xs"
            disabled={combinedLoading || !urlInput.trim()}
          >
            Import
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setUrlMode(false)}
            aria-label="Cancel URL import"
          >
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}
