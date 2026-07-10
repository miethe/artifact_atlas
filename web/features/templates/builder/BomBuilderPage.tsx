"use client";

/**
 * BomBuilderPage — three-panel BOM Builder (WS-5, mockup:
 * artifact_atlas_project_template_interface.png).
 *
 * Panels: (1) Artifact Library palette (dnd-kit drag source),
 * (2) BOM Structure Canvas (domain sections × phase columns, drop targets),
 * (3) Artifact Properties for the selected slot.
 *
 * Header actions: Duplicate from Template, Create Section, Preview BOM,
 * Save Template (POST/PATCH /api/templates), Apply to Project.
 * Accepts ?templateId= to edit an existing template.
 */

import * as React from "react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
  Copy,
  Plus,
  Eye,
  Save,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { templateKeys } from "../hooks";
import { builderApi } from "./api";
import { ARTIFACT_TYPE_CATALOG } from "./catalog";
import type { ArtifactTypeEntry, ArtifactTypeGroup } from "./catalog";
import { ArtifactLibraryPanel } from "./ArtifactLibraryPanel";
import type { PaletteDragData } from "./ArtifactLibraryPanel";
import { StructureCanvas } from "./StructureCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import {
  DuplicateFromTemplateDialog,
  PreviewBomDialog,
  ApplyToProjectDialog,
} from "./BuilderDialogs";
import type {
  CanvasSelection,
  CanvasSlot,
  CanvasTemplate,
} from "./types";
import {
  canvasKey,
  canvasToDomainsPayload,
  detailToCanvas,
  emptyCanvasTemplate,
  slugifyTypeId,
} from "./types";

// ============================================================
// Footer drop strip ("add to selected phase")
// ============================================================

function FooterDropStrip() {
  const { setNodeRef, isOver } = useDroppable({
    id: "footer-drop",
    data: { footer: true },
  });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-xs transition-colors",
        isOver
          ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          : "border-[var(--border-strong)] text-[var(--ink-faint)]",
      )}
    >
      <Plus className="w-3.5 h-3.5" aria-hidden />
      Drop artifact type here to add to selected phase
    </div>
  );
}

// ============================================================
// BomBuilderPage
// ============================================================

export interface BomBuilderPageProps {
  projectId: string;
  templateId: string | null;
}

export function BomBuilderPage({ projectId, templateId }: BomBuilderPageProps) {
  const router = useRouter();
  const qc = useQueryClient();

  const [canvas, setCanvas] = React.useState<CanvasTemplate>(emptyCanvasTemplate);
  const [selection, setSelection] = React.useState<CanvasSelection>(null);
  const [groupBy, setGroupBy] = React.useState<"domain" | "phase">("domain");
  const [dirty, setDirty] = React.useState(false);
  const [loadedId, setLoadedId] = React.useState<string | null>(null);
  const [validationMsg, setValidationMsg] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [activeDrag, setActiveDrag] = React.useState<PaletteDragData | null>(null);
  const [dupOpen, setDupOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [applyOpen, setApplyOpen] = React.useState(false);
  const [applyResult, setApplyResult] = React.useState<string | null>(null);

  // ---- Load existing template (?templateId=) ----
  const { data: detail, isLoading: detailLoading, error: detailError } = useQuery({
    queryKey: ["builder", "detail", templateId ?? ""],
    queryFn: () => builderApi.getDetail(templateId!),
    enabled: !!templateId,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (detail && detail.id !== loadedId) {
      setCanvas(detailToCanvas(detail));
      setLoadedId(detail.id);
      setDirty(false);
      setSelection(null);
    }
  }, [detail, loadedId]);

  // ---- Palette catalog: static groups + types discovered on the canvas ----
  const catalog = React.useMemo((): ArtifactTypeGroup[] => {
    const known = new Set(
      ARTIFACT_TYPE_CATALOG.flatMap((g) => g.types.map((t) => t.id)),
    );
    const extra: ArtifactTypeEntry[] = [];
    for (const d of canvas.domains) {
      for (const s of d.slots) {
        if (!known.has(s.artifactTypeId) && !extra.some((e) => e.id === s.artifactTypeId)) {
          extra.push({ id: s.artifactTypeId, label: s.label });
        }
      }
    }
    if (extra.length === 0) return ARTIFACT_TYPE_CATALOG;
    return [...ARTIFACT_TYPE_CATALOG, { group: "In this template", types: extra }];
  }, [canvas.domains]);

  // ============================================================
  // Canvas mutations
  // ============================================================

  const patchCanvas = (patch: Partial<CanvasTemplate>) => {
    setCanvas((c) => ({ ...c, ...patch }));
    setDirty(true);
  };

  const addDomain = () => {
    const key = canvasKey();
    setCanvas((c) => ({
      ...c,
      domains: [...c.domains, { key, name: `Section ${c.domains.length + 1}`, slots: [] }],
    }));
    setSelection({ kind: "domain", domainKey: key });
    setDirty(true);
  };

  const removeDomain = (domainKey: string) => {
    setCanvas((c) => ({
      ...c,
      domains: c.domains.filter((d) => d.key !== domainKey),
    }));
    setSelection((sel) =>
      sel && "domainKey" in sel && sel.domainKey === domainKey ? null : sel,
    );
    setDirty(true);
  };

  const renameDomain = (domainKey: string, name: string) => {
    setCanvas((c) => ({
      ...c,
      domains: c.domains.map((d) => (d.key === domainKey ? { ...d, name } : d)),
    }));
    setDirty(true);
  };

  const addSlot = React.useCallback(
    (
      typeId: string,
      label: string,
      targetDomainKey?: string,
      phase: CanvasSlot["phase"] = "discovery",
    ) => {
      setCanvas((c) => {
        let domains = c.domains;
        let domainKey = targetDomainKey;
        // No sections yet → create one implicitly.
        if (domains.length === 0) {
          domainKey = canvasKey();
          domains = [{ key: domainKey, name: "Section 1", slots: [] }];
        }
        if (!domainKey || !domains.some((d) => d.key === domainKey)) {
          domainKey = domains[0].key;
        }
        const slot: CanvasSlot = {
          key: canvasKey(),
          artifactTypeId: typeId,
          label,
          phase,
          required: true,
          acceptedFileTypes: [],
          maxFileSizeMb: null,
          namingConvention: "",
          guidance: "",
          stalenessDays: null,
        };
        setSelection({ kind: "slot", domainKey: domainKey!, slotKey: slot.key });
        return {
          ...c,
          domains: domains.map((d) =>
            d.key === domainKey ? { ...d, slots: [...d.slots, slot] } : d,
          ),
        };
      });
      setDirty(true);
    },
    [],
  );

  const removeSlot = (domainKey: string, slotKey: string) => {
    setCanvas((c) => ({
      ...c,
      domains: c.domains.map((d) =>
        d.key === domainKey
          ? { ...d, slots: d.slots.filter((s) => s.key !== slotKey) }
          : d,
      ),
    }));
    setSelection((sel) =>
      sel?.kind === "slot" && sel.slotKey === slotKey ? null : sel,
    );
    setDirty(true);
  };

  const updateSelectedSlot = (patch: Partial<CanvasSlot>) => {
    if (selection?.kind !== "slot") return;
    setCanvas((c) => ({
      ...c,
      domains: c.domains.map((d) =>
        d.key === selection.domainKey
          ? {
              ...d,
              slots: d.slots.map((s) => {
                if (s.key !== selection.slotKey) return s;
                const next = { ...s, ...patch };
                // Keep the slug ID in sync when the label is edited.
                if (patch.label !== undefined) {
                  next.artifactTypeId = slugifyTypeId(patch.label) || s.artifactTypeId;
                }
                return next;
              }),
            }
          : d,
      ),
    }));
    setDirty(true);
  };

  const moveSelectedSlotToDomain = (targetDomainKey: string) => {
    if (selection?.kind !== "slot" || selection.domainKey === targetDomainKey) return;
    setCanvas((c) => {
      const source = c.domains.find((d) => d.key === selection.domainKey);
      const slot = source?.slots.find((s) => s.key === selection.slotKey);
      if (!slot) return c;
      return {
        ...c,
        domains: c.domains.map((d) => {
          if (d.key === selection.domainKey) {
            return { ...d, slots: d.slots.filter((s) => s.key !== selection.slotKey) };
          }
          if (d.key === targetDomainKey) {
            return { ...d, slots: [...d.slots, slot] };
          }
          return d;
        }),
      };
    });
    setSelection({ kind: "slot", domainKey: targetDomainKey, slotKey: selection.slotKey });
    setDirty(true);
  };

  // ============================================================
  // Drag & drop
  // ============================================================

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as PaletteDragData | undefined;
    if (data?.source === "palette") setActiveDrag(data);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const data = e.active.data.current as PaletteDragData | undefined;
    setActiveDrag(null);
    if (!data || data.source !== "palette" || !e.over) return;

    const overData = e.over.data.current as
      | { domainKey?: string; phase?: string; footer?: boolean }
      | undefined;

    if (overData?.footer) {
      const targetDomain =
        selection && "domainKey" in (selection ?? {})
          ? (selection as { domainKey: string }).domainKey
          : undefined;
      const targetPhase =
        selection?.kind === "slot"
          ? (canvas.domains
              .find((d) => d.key === selection.domainKey)
              ?.slots.find((s) => s.key === selection.slotKey)?.phase ?? "discovery")
          : "discovery";
      addSlot(data.typeId, data.label, targetDomain, targetPhase);
      return;
    }

    if (overData?.domainKey) {
      const phase =
        overData.phase && overData.phase !== "unphased"
          ? (overData.phase as CanvasSlot["phase"])
          : null;
      addSlot(data.typeId, data.label, overData.domainKey, phase);
    }
  };

  // ============================================================
  // Persistence
  // ============================================================

  const saveTemplate = React.useCallback(async (): Promise<string | null> => {
    if (!canvas.name.trim()) {
      setValidationMsg("Template name is required before saving.");
      return null;
    }
    setValidationMsg(null);
    setSaveState("saving");
    setSaveError(null);
    try {
      const domains = canvasToDomainsPayload(canvas);
      let id = canvas.id;
      if (id) {
        await builderApi.update(id, {
          name: canvas.name,
          description: canvas.description || null,
          status: canvas.status,
          domains,
        });
      } else {
        const created = await builderApi.create({
          name: canvas.name,
          slug: `${slugifyTypeId(canvas.name).replace(/_/g, "-")}-${Math.random().toString(36).slice(2, 6)}`,
          description: canvas.description || null,
          template_type: canvas.templateType,
          domains,
        });
        id = created.id;
        // Creation always lands as draft/experimental; sync a non-draft status.
        if (canvas.status !== "experimental") {
          await builderApi.update(id, { status: canvas.status });
        }
        setCanvas((c) => ({ ...c, id }));
        router.replace(
          `/projects/${projectId}/templates/builder?templateId=${id}`,
          { scroll: false },
        );
      }
      setDirty(false);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
      qc.invalidateQueries({ queryKey: templateKeys.all });
      return id;
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Save failed.");
      return null;
    }
  }, [canvas, projectId, qc, router]);

  // Duplicate-from-template
  const duplicateMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const dup = await builderApi.duplicate(sourceId);
      return builderApi.getDetail(dup.id);
    },
    onSuccess: (dupDetail) => {
      setCanvas(detailToCanvas(dupDetail));
      setLoadedId(dupDetail.id);
      setSelection(null);
      setDirty(false);
      setDupOpen(false);
      qc.invalidateQueries({ queryKey: templateKeys.all });
      router.replace(
        `/projects/${projectId}/templates/builder?templateId=${dupDetail.id}`,
        { scroll: false },
      );
    },
  });

  // Apply-to-project
  const applyMutation = useMutation({
    mutationFn: async () => {
      let id = canvas.id;
      if (!id || dirty) {
        id = await saveTemplate();
      }
      if (!id) throw new Error("Save the template before applying.");
      return builderApi.applyToProject(projectId, id);
    },
    onSuccess: (res) => {
      setApplyResult(
        `Applied — ${res.slots_created ?? 0} slots created, ${res.slots_skipped ?? 0} skipped.`,
      );
      qc.invalidateQueries({ queryKey: ["bom"] });
    },
  });

  // ============================================================
  // Derived
  // ============================================================

  const selectedSlotDomain =
    selection?.kind === "slot"
      ? canvas.domains.find((d) => d.key === selection.domainKey) ?? null
      : null;
  const selectedSlot =
    selection?.kind === "slot"
      ? selectedSlotDomain?.slots.find((s) => s.key === selection.slotKey) ?? null
      : null;

  const totalSlots = canvas.domains.reduce((acc, d) => acc + d.slots.length, 0);

  // ============================================================
  // Render
  // ============================================================

  if (templateId && detailLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[var(--ink-muted)]">
        Loading template…
      </div>
    );
  }

  if (templateId && detailError && !detail) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-600">Failed to load template “{templateId}”.</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/templates/builder`)}
        >
          Start a new template instead
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]" aria-label="BOM Builder">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0 flex-wrap">
        <input
          type="text"
          placeholder="Template name…"
          value={canvas.name}
          onChange={(e) => patchCanvas({ name: e.target.value })}
          aria-label="Template name"
          className={clsx(
            "h-7 px-2.5 text-sm font-semibold rounded border w-52",
            "bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--ink-faint)]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            validationMsg && !canvas.name.trim() ? "border-red-400" : "border-[var(--border)]",
          )}
        />
        <span className="hidden md:inline text-[11px] text-[var(--ink-muted)]">
          {canvas.domains.length} sections · {totalSlots} slots
        </span>
        <span className="hidden md:flex items-center gap-1 text-[11px]">
          {saveState === "saved" ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3 h-3" aria-hidden /> Saved
            </span>
          ) : dirty ? (
            <span className="text-amber-600">Unsaved changes</span>
          ) : null}
        </span>

        <span className="flex-1" />

        <label className="flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
          Group by:
        </label>
        <SegmentedControl
          value={groupBy}
          onChange={(v) => setGroupBy(v)}
          size="xs"
          label="Group canvas by"
          options={[
            { value: "domain", label: "Domain" },
            { value: "phase", label: "Phase" },
          ]}
        />

        <Button
          variant="secondary"
          size="sm"
          iconLeft={<Copy className="w-3.5 h-3.5" aria-hidden />}
          onClick={() => setDupOpen(true)}
        >
          Duplicate from Template
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<Plus className="w-3.5 h-3.5" aria-hidden />}
          onClick={addDomain}
        >
          Create Section
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<Eye className="w-3.5 h-3.5" aria-hidden />}
          onClick={() => setPreviewOpen(true)}
        >
          Preview BOM
        </Button>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Save className="w-3.5 h-3.5" aria-hidden />}
          loading={saveState === "saving"}
          onClick={() => void saveTemplate()}
        >
          Save Template
        </Button>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<ArrowRight className="w-3.5 h-3.5" aria-hidden />}
          onClick={() => {
            setApplyResult(null);
            applyMutation.reset();
            setApplyOpen(true);
          }}
        >
          Apply to Project
        </Button>
      </div>

      {/* Validation / save error */}
      {(validationMsg || saveError) && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 py-2 border-b border-red-200 bg-red-50 text-xs text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {validationMsg ?? saveError}
        </div>
      )}

      {/* Three-panel body */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ArtifactLibraryPanel
            groups={catalog}
            onAdd={(entry) =>
              addSlot(
                entry.id,
                entry.label,
                selection && "domainKey" in (selection ?? {})
                  ? (selection as { domainKey: string }).domainKey
                  : undefined,
              )
            }
            className="w-[220px] shrink-0"
          />

          {/* Canvas */}
          <main
            className="flex-1 min-w-0 overflow-auto p-4 space-y-4 bg-[var(--surface-sunken)]/40"
            aria-label="BOM structure canvas"
          >
            <div className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                2
              </span>
              <p className="text-xs font-semibold text-[var(--ink)]">
                BOM Structure Canvas
              </p>
            </div>
            <StructureCanvas
              domains={canvas.domains}
              groupBy={groupBy}
              selection={selection}
              onSelectSlot={(domainKey, slotKey) =>
                setSelection({ kind: "slot", domainKey, slotKey })
              }
              onSelectDomain={(domainKey) => setSelection({ kind: "domain", domainKey })}
              onRemoveSlot={removeSlot}
              onRemoveDomain={removeDomain}
              onRenameDomain={renameDomain}
              onAddDomain={addDomain}
            />
            {canvas.domains.length > 0 && <FooterDropStrip />}
          </main>

          <PropertiesPanel
            template={canvas}
            selectedSlot={selectedSlot}
            selectedSlotDomain={selectedSlotDomain}
            onTemplateChange={patchCanvas}
            onSlotChange={updateSelectedSlot}
            onSlotMoveToDomain={moveSelectedSlotToDomain}
            onSlotRemove={() =>
              selection?.kind === "slot" &&
              removeSlot(selection.domainKey, selection.slotKey)
            }
            className="w-[280px] shrink-0"
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-blue-400 bg-[var(--surface)] shadow-lg">
              <GripVertical className="w-3 h-3 text-[var(--ink-faint)]" aria-hidden />
              <FileText className="w-3 h-3 text-[var(--ink-faint)]" aria-hidden />
              <span className="text-[11px] font-medium text-[var(--ink)]">
                {activeDrag.label}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Footer meta */}
      <div className="flex items-center justify-between gap-3 px-4 py-1.5 border-t border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
        <p className="text-[10px] text-[var(--ink-faint)]">
          Template version {canvas.version}
          {canvas.id && (
            <>
              {" "}· <span className="font-mono">{canvas.id}</span>
            </>
          )}
        </p>
        <p className="text-[10px] text-[var(--ink-faint)]">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </p>
      </div>

      {/* Dialogs */}
      <DuplicateFromTemplateDialog
        open={dupOpen}
        onClose={() => setDupOpen(false)}
        onDuplicate={(id) => duplicateMutation.mutate(id)}
        isPending={duplicateMutation.isPending}
        error={
          duplicateMutation.error instanceof Error
            ? duplicateMutation.error.message
            : null
        }
      />
      <PreviewBomDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        template={canvas}
      />
      <ApplyToProjectDialog
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        projectId={projectId}
        templateName={canvas.name}
        needsSave={dirty || !canvas.id}
        onApply={() => applyMutation.mutate()}
        isPending={applyMutation.isPending}
        result={applyResult}
        error={
          applyMutation.error instanceof Error ? applyMutation.error.message : null
        }
      />
    </div>
  );
}
