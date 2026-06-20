"use client";

/**
 * BomBuilder — BOM-UI-007 Light Template Builder
 * Three-panel layout:
 *   Left: artifact type library (drag source / click to add)
 *   Center: structure canvas (domains + slots)
 *   Right: properties inspector
 *
 * States: draft vs published. Save draft requires name. Publish requires explicit action.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  Save,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useSaveBuilderTemplate } from "./hooks";
import type { SaveBuilderTemplateResult } from "./hooks";
import type {
  BuilderTemplate,
  BuilderDomain,
  BuilderSlot,
  BuilderSelection,
} from "./types";
import type { TemplateType } from "@/lib/types";

// ============================================================
// Helpers
// ============================================================

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const ARTIFACT_TYPE_LIBRARY = [
  { category: "Strategy", types: ["Product Vision", "Positioning Statement", "Success Metrics", "OKRs"] },
  { category: "Product", types: ["PRD", "User Stories", "Acceptance Criteria", "Feature Brief", "Roadmap"] },
  { category: "Architecture", types: ["System Architecture Diagram", "API Specification", "Data Model", "ADR Log", "Security Architecture", "Deployment Topology"] },
  { category: "Design", types: ["User Flows", "Wireframes", "UI Mockups", "Design System", "Prototype"] },
  { category: "Engineering", types: ["Test Plan", "CI/CD Pipeline Spec", "Runbook", "SLO Definition"] },
  { category: "Research", types: ["Research Brief", "Interview Guide", "Research Report", "Key Findings"] },
  { category: "GTM", types: ["GTM Messaging Deck", "Launch Brief", "Sales One-Pager", "Press Release"] },
  { category: "Governance", types: ["Decision Log", "Risk Register", "Review Checklist", "Compliance Checklist"] },
];

const TEMPLATE_TYPES: Array<{ value: TemplateType; label: string }> = [
  { value: "product", label: "Product" },
  { value: "architecture", label: "Architecture" },
  { value: "research", label: "Research" },
  { value: "gtm", label: "GTM" },
  { value: "design_system", label: "Design System" },
  { value: "platform_capability", label: "Platform Capability" },
  { value: "client_proposal", label: "Client Proposal" },
  { value: "custom", label: "Custom" },
];

// ============================================================
// Default empty template
// ============================================================

function emptyTemplate(): BuilderTemplate {
  return {
    id: null,
    name: "",
    description: "",
    template_type: "custom",
    publish_status: "draft",
    domains: [],
  };
}

// ============================================================
// Props
// ============================================================

export interface BomBuilderProps {
  projectId: string;
  initialTemplate?: BuilderTemplate;
  onSaved?: (id: string) => void;
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BomBuilder({
  projectId: _projectId,
  initialTemplate,
  onSaved,
  className,
}: BomBuilderProps) {
  const [template, setTemplate] = React.useState<BuilderTemplate>(
    initialTemplate ?? emptyTemplate(),
  );
  const [selection, setSelection] = React.useState<BuilderSelection>(null);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(["Strategy", "Product"]),
  );
  const [saveState, setSaveState] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [validationMsg, setValidationMsg] = React.useState<string | null>(null);

  const saveMutation = useSaveBuilderTemplate();

  // ============================================================
  // Template mutations
  // ============================================================

  const addDomain = () => {
    const domain: BuilderDomain = {
      id: uid(),
      name: "New Domain",
      slots: [],
    };
    setTemplate((t) => ({ ...t, domains: [...t.domains, domain] }));
    setSelection({ kind: "domain", domainId: domain.id });
  };

  const removeDomain = (domainId: string) => {
    setTemplate((t) => ({
      ...t,
      domains: t.domains.filter((d) => d.id !== domainId),
    }));
    if (
      selection?.kind === "domain" && selection.domainId === domainId
    )
      setSelection(null);
  };

  const updateDomain = (domainId: string, patch: Partial<BuilderDomain>) => {
    setTemplate((t) => ({
      ...t,
      domains: t.domains.map((d) =>
        d.id === domainId ? { ...d, ...patch } : d,
      ),
    }));
  };

  const addSlot = (domainId: string, artifactType: string) => {
    const slot: BuilderSlot = {
      id: uid(),
      artifact_type: artifactType,
      required: true,
      guidance: "",
      staleness_days: null,
      min_count: null,
    };
    setTemplate((t) => ({
      ...t,
      domains: t.domains.map((d) =>
        d.id === domainId ? { ...d, slots: [...d.slots, slot] } : d,
      ),
    }));
    setSelection({ kind: "slot", domainId, slotId: slot.id });
  };

  const removeSlot = (domainId: string, slotId: string) => {
    setTemplate((t) => ({
      ...t,
      domains: t.domains.map((d) =>
        d.id === domainId
          ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
          : d,
      ),
    }));
    if (
      selection?.kind === "slot" &&
      selection.domainId === domainId &&
      selection.slotId === slotId
    )
      setSelection(null);
  };

  const updateSlot = (domainId: string, slotId: string, patch: Partial<BuilderSlot>) => {
    setTemplate((t) => ({
      ...t,
      domains: t.domains.map((d) =>
        d.id === domainId
          ? {
              ...d,
              slots: d.slots.map((s) =>
                s.id === slotId ? { ...s, ...patch } : s,
              ),
            }
          : d,
      ),
    }));
  };

  // ============================================================
  // Save / publish
  // ============================================================

  const validate = (publishStatus: "draft" | "published"): string | null => {
    if (!template.name.trim()) return "Template name is required.";
    if (publishStatus === "published" && template.domains.length === 0)
      return "Published templates must have at least one domain.";
    return null;
  };

  const handleSave = async (publishStatus: "draft" | "published") => {
    const msg = validate(publishStatus);
    if (msg) {
      setValidationMsg(msg);
      return;
    }
    setValidationMsg(null);
    setSaveState("saving");
    setSaveError(null);
    try {
      const result: SaveBuilderTemplateResult = await saveMutation.mutateAsync({
        id: template.id,
        name: template.name,
        description: template.description,
        template_type: template.template_type,
        publish_status: publishStatus,
        domains: template.domains.map((d) => ({
          name: d.name,
          slots: d.slots.map((s) => ({
            artifact_type: s.artifact_type,
            required: s.required,
            guidance: s.guidance,
            staleness_days: s.staleness_days,
            min_count: s.min_count,
          })),
        })),
      });
      setTemplate((t) => ({
        ...t,
        publish_status: publishStatus,
        id: result.id ?? t.id,
      }));
      setSaveState("saved");
      onSaved?.(result.id ?? template.id ?? "");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    }
  };

  // ============================================================
  // Derived
  // ============================================================

  const selectedDomain =
    selection?.kind === "domain"
      ? template.domains.find((d) => d.id === selection.domainId)
      : null;

  const selectedSlot =
    selection?.kind === "slot"
      ? template.domains
          .find((d) => d.id === selection.domainId)
          ?.slots.find((s) => s.id === selection.slotId)
      : null;

  const totalSlots = template.domains.flatMap((d) => d.slots).length;
  const requiredSlots = template.domains
    .flatMap((d) => d.slots)
    .filter((s) => s.required).length;

  return (
    <div
      className={clsx(
        "flex flex-col h-full bg-[var(--surface)]",
        className,
      )}
      aria-label="BOM template builder"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
        {/* Name + meta */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input
            type="text"
            placeholder="Template name…"
            value={template.name}
            onChange={(e) =>
              setTemplate((t) => ({ ...t, name: e.target.value }))
            }
            className={clsx(
              "h-7 px-2.5 text-sm font-semibold rounded border",
              "bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--ink-faint)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)]",
              validationMsg && !template.name.trim()
                ? "border-red-400"
                : "border-[var(--border)]",
            )}
            aria-label="Template name"
          />
          <select
            value={template.template_type}
            onChange={(e) =>
              setTemplate((t) => ({
                ...t,
                template_type: e.target.value as TemplateType,
              }))
            }
            className="h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
            aria-label="Template type"
          >
            {TEMPLATE_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Draft badge */}
          <span
            className={clsx(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
              template.publish_status === "published"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700",
            )}
          >
            {template.publish_status === "published" ? "Published" : "Draft"}
          </span>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-3 text-xs text-[var(--ink-muted)]">
          <span>{template.domains.length} domains</span>
          <span>{totalSlots} slots</span>
          <span>{requiredSlots} required</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
              Saved
            </span>
          )}
          {saveState === "error" && saveError && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden />
              {saveError}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Save className="w-3.5 h-3.5" aria-hidden />}
            loading={saveState === "saving"}
            onClick={() => handleSave("draft")}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Upload className="w-3.5 h-3.5" aria-hidden />}
            loading={saveState === "saving"}
            onClick={() => handleSave("published")}
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Validation message */}
      {validationMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 py-2 border-b border-red-200 bg-red-50 text-xs text-red-700"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {validationMsg}
          <button
            type="button"
            onClick={() => setValidationMsg(null)}
            className="ml-auto"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" aria-hidden />
          </button>
        </div>
      )}

      {/* Three-panel body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Artifact type library */}
        <aside
          className="w-[200px] shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface-sunken)] overflow-y-auto"
          aria-label="Artifact type library"
        >
          <div className="px-3 py-2 text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider border-b border-[var(--border)]">
            Artifact Types
          </div>
          {ARTIFACT_TYPE_LIBRARY.map((cat) => {
            const open = expandedCategories.has(cat.category);
            return (
              <div key={cat.category}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(cat.category)) next.delete(cat.category);
                      else next.add(cat.category);
                      return next;
                    })
                  }
                  className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-[var(--border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)]"
                  aria-expanded={open}
                >
                  {open ? (
                    <ChevronDown className="w-3 h-3 text-[var(--ink-faint)]" aria-hidden />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-[var(--ink-faint)]" aria-hidden />
                  )}
                  <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                    {cat.category}
                  </span>
                </button>
                {open && (
                  <ul className="pb-1" role="list">
                    {cat.types.map((type) => (
                      <li key={type}>
                        <button
                          type="button"
                          className={clsx(
                            "w-full flex items-center gap-2 pl-7 pr-3 py-1.5 text-left text-xs",
                            "text-[var(--ink)] hover:bg-blue-50 hover:text-blue-700 transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)]",
                          )}
                          onClick={() => {
                            // Add to selected domain or first domain
                            const targetId =
                              selection?.kind === "domain"
                                ? selection.domainId
                                : selection?.kind === "slot"
                                  ? selection.domainId
                                  : template.domains[0]?.id;
                            if (targetId) addSlot(targetId, type);
                          }}
                          aria-label={`Add ${type} to canvas`}
                          title={`Click to add to ${selection?.kind === "domain" ? "selected domain" : "first domain"}`}
                        >
                          <FileText className="w-3 h-3 shrink-0 text-[var(--ink-faint)]" aria-hidden />
                          <span className="truncate">{type}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </aside>

        {/* Center: Canvas */}
        <main
          className="flex-1 overflow-y-auto p-4 space-y-3"
          aria-label="Template canvas"
        >
          {template.domains.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-sunken)] border border-dashed border-[var(--border-strong)] flex items-center justify-center mb-4">
                <Plus className="w-5 h-5 text-[var(--ink-faint)]" aria-hidden />
              </div>
              <p className="text-sm font-medium text-[var(--ink-muted)]">
                No domains yet
              </p>
              <p className="text-xs text-[var(--ink-faint)] mt-1 mb-4">
                Add a domain to group artifact slots.
              </p>
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Plus className="w-3.5 h-3.5" aria-hidden />}
                onClick={addDomain}
              >
                Add Domain
              </Button>
            </div>
          ) : (
            <>
              {template.domains.map((domain) => (
                <DomainBlock
                  key={domain.id}
                  domain={domain}
                  selection={selection}
                  onSelectDomain={() =>
                    setSelection({ kind: "domain", domainId: domain.id })
                  }
                  onSelectSlot={(slotId) =>
                    setSelection({ kind: "slot", domainId: domain.id, slotId })
                  }
                  onRemoveDomain={() => removeDomain(domain.id)}
                  onAddSlot={(type) => addSlot(domain.id, type)}
                  onRemoveSlot={(slotId) => removeSlot(domain.id, slotId)}
                />
              ))}
              <button
                type="button"
                onClick={addDomain}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-[var(--border-strong)]",
                  "text-xs text-[var(--ink-faint)] hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]",
                )}
                aria-label="Add domain"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden />
                Add Domain
              </button>
            </>
          )}
        </main>

        {/* Right: Properties inspector */}
        <aside
          className="w-[240px] shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--surface)] overflow-y-auto"
          aria-label="Properties inspector"
        >
          {selection === null ? (
            <TemplateMetaPanel template={template} onChange={setTemplate} />
          ) : selectedDomain ? (
            <DomainInspector
              domain={selectedDomain}
              onChange={(patch) => updateDomain(selectedDomain.id, patch)}
              onAddSlot={(type) => addSlot(selectedDomain.id, type)}
            />
          ) : selectedSlot && selection?.kind === "slot" ? (
            <SlotInspector
              slot={selectedSlot}
              onChange={(patch) =>
                updateSlot(selection.domainId, selectedSlot.id, patch)
              }
              onRemove={() =>
                removeSlot(selection.domainId, selectedSlot.id)
              }
            />
          ) : (
            <TemplateMetaPanel template={template} onChange={setTemplate} />
          )}
        </aside>
      </div>
    </div>
  );
}

// ============================================================
// DomainBlock
// ============================================================

function DomainBlock({
  domain,
  selection,
  onSelectDomain,
  onSelectSlot,
  onRemoveDomain,
  onAddSlot,
  onRemoveSlot,
}: {
  domain: BuilderDomain;
  selection: BuilderSelection;
  onSelectDomain: () => void;
  onSelectSlot: (slotId: string) => void;
  onRemoveDomain: () => void;
  onAddSlot: (type: string) => void;
  onRemoveSlot: (slotId: string) => void;
}) {
  const isDomainSelected = selection?.kind === "domain" && selection.domainId === domain.id;
  const [editingName, setEditingName] = React.useState(false);
  const [nameVal, setNameVal] = React.useState(domain.name);

  return (
    <div
      className={clsx(
        "rounded-lg border transition-colors",
        isDomainSelected
          ? "border-blue-400 bg-blue-50/40"
          : "border-[var(--border)] bg-[var(--surface)]",
      )}
    >
      {/* Domain header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] cursor-pointer"
        onClick={onSelectDomain}
        role="button"
        tabIndex={0}
        aria-label={`Select domain: ${domain.name}`}
        onKeyDown={(e) => e.key === "Enter" && onSelectDomain()}
      >
        <GripVertical
          className="w-3.5 h-3.5 text-[var(--ink-faint)] cursor-grab shrink-0"
          aria-hidden
        />
        {editingName ? (
          <input
            autoFocus
            type="text"
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={() => {
              setEditingName(false);
              if (nameVal.trim()) {
                // propagate via domain inspector
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditingName(false);
              if (e.key === "Escape") {
                setNameVal(domain.name);
                setEditingName(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-xs font-semibold bg-transparent border-b border-blue-400 outline-none text-[var(--ink)]"
            aria-label="Domain name"
          />
        ) : (
          <span className="flex-1 text-xs font-semibold text-[var(--ink)] truncate">
            {domain.name}
          </span>
        )}
        <span className="text-[10px] text-[var(--ink-faint)] shrink-0">
          {domain.slots.length} slots
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditingName(true);
          }}
          aria-label={`Rename domain: ${domain.name}`}
          className="p-0.5 rounded hover:bg-[var(--border)] text-[var(--ink-faint)] hover:text-[var(--ink)]"
        >
          <Edit2 className="w-3 h-3" aria-hidden />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemoveDomain(); }}
          aria-label={`Remove domain: ${domain.name}`}
          className="p-0.5 rounded hover:bg-red-100 text-[var(--ink-faint)] hover:text-red-600"
        >
          <Trash2 className="w-3 h-3" aria-hidden />
        </button>
      </div>

      {/* Slots */}
      <div className="p-2 space-y-1">
        {domain.slots.length === 0 && (
          <p className="text-[10px] text-[var(--ink-faint)] text-center py-2">
            No slots — add from library or type name below
          </p>
        )}
        {domain.slots.map((slot) => {
          const isSlotSelected =
            selection?.kind === "slot" &&
            selection.domainId === domain.id &&
            selection.slotId === slot.id;

          return (
            <div
              key={slot.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSlot(slot.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelectSlot(slot.id)}
              aria-label={`Slot: ${slot.artifact_type}`}
              aria-pressed={isSlotSelected}
              className={clsx(
                "flex items-center gap-2 px-2.5 py-1.5 rounded border cursor-pointer transition-colors",
                isSlotSelected
                  ? "border-blue-400 bg-blue-50"
                  : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)]",
              )}
            >
              <GripVertical
                className="w-3 h-3 text-[var(--ink-faint)] cursor-grab shrink-0"
                aria-hidden
              />
              <FileText
                className="w-3 h-3 text-[var(--ink-faint)] shrink-0"
                aria-hidden
              />
              <span className="flex-1 text-xs text-[var(--ink)] truncate">
                {slot.artifact_type}
              </span>
              {slot.required ? (
                <span className="text-[9px] font-semibold text-blue-600 shrink-0">
                  REQ
                </span>
              ) : (
                <span className="text-[9px] text-[var(--ink-faint)] shrink-0">
                  OPT
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSlot(slot.id);
                }}
                aria-label={`Remove slot: ${slot.artifact_type}`}
                className="p-0.5 rounded hover:bg-red-100 text-[var(--ink-faint)] hover:text-red-600"
              >
                <X className="w-3 h-3" aria-hidden />
              </button>
            </div>
          );
        })}

        {/* Quick add slot */}
        <QuickAddSlot
          onAdd={(type) => onAddSlot(type)}
          placeholder="Add slot type…"
        />
      </div>
    </div>
  );
}

// ============================================================
// QuickAddSlot
// ============================================================

function QuickAddSlot({
  onAdd,
  placeholder,
}: {
  onAdd: (type: string) => void;
  placeholder: string;
}) {
  const [val, setVal] = React.useState("");

  const submit = () => {
    if (val.trim()) {
      onAdd(val.trim());
      setVal("");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        className={clsx(
          "flex-1 h-6 px-2 text-xs rounded border border-dashed border-[var(--border)]",
          "bg-transparent text-[var(--ink)] placeholder-[var(--ink-faint)]",
          "focus:outline-none focus:border-[var(--border-focus)]",
        )}
        aria-label="New slot artifact type"
      />
      <button
        type="button"
        onClick={submit}
        aria-label="Add slot"
        className="p-1 rounded hover:bg-blue-50 text-[var(--ink-faint)] hover:text-blue-600"
      >
        <Plus className="w-3 h-3" aria-hidden />
      </button>
    </div>
  );
}

// ============================================================
// TemplateMetaPanel (no selection)
// ============================================================

function TemplateMetaPanel({
  template,
  onChange,
}: {
  template: BuilderTemplate;
  onChange: React.Dispatch<React.SetStateAction<BuilderTemplate>>;
}) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider">
        Template Properties
      </p>

      <Field label="Name">
        <input
          type="text"
          value={template.name}
          onChange={(e) => onChange((t) => ({ ...t, name: e.target.value }))}
          placeholder="Template name"
          className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          aria-label="Template name"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={template.description}
          onChange={(e) =>
            onChange((t) => ({ ...t, description: e.target.value }))
          }
          placeholder="What is this template for?"
          rows={3}
          className="w-full px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          aria-label="Template description"
        />
      </Field>

      <Field label="Type">
        <select
          value={template.template_type}
          onChange={(e) =>
            onChange((t) => ({
              ...t,
              template_type: e.target.value as TemplateType,
            }))
          }
          className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          aria-label="Template type"
        >
          {TEMPLATE_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="pt-2 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--ink-muted)]">
          Click a domain or slot to see its properties.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DomainInspector
// ============================================================

function DomainInspector({
  domain,
  onChange,
  onAddSlot,
}: {
  domain: BuilderDomain;
  onChange: (patch: Partial<BuilderDomain>) => void;
  onAddSlot: (type: string) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider">
        Domain Properties
      </p>

      <Field label="Domain name">
        <input
          type="text"
          value={domain.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          aria-label="Domain name"
        />
      </Field>

      <div className="pt-2 border-t border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-2">
          Quick Add Slot
        </p>
        <QuickAddSlot onAdd={onAddSlot} placeholder="Slot artifact type…" />
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--ink-faint)]">
          {domain.slots.length} slots ·{" "}
          {domain.slots.filter((s) => s.required).length} required
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SlotInspector
// ============================================================

function SlotInspector({
  slot,
  onChange,
  onRemove,
}: {
  slot: BuilderSlot;
  onChange: (patch: Partial<BuilderSlot>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider">
        Slot Properties
      </p>

      <Field label="Artifact type">
        <input
          type="text"
          value={slot.artifact_type}
          onChange={(e) => onChange({ artifact_type: e.target.value })}
          className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          aria-label="Artifact type"
        />
      </Field>

      <Field label="Required">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={slot.required}
            onChange={(e) => onChange({ required: e.target.checked })}
            className="accent-blue-600"
            aria-label="Required slot"
          />
          <span className="text-xs text-[var(--ink)]">
            {slot.required ? "Required" : "Optional"}
          </span>
        </label>
      </Field>

      <Field label="Guidance">
        <textarea
          value={slot.guidance}
          onChange={(e) => onChange({ guidance: e.target.value })}
          placeholder="Guidance for filling this slot…"
          rows={3}
          className="w-full px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          aria-label="Slot guidance"
        />
      </Field>

      <Field label="Staleness (days)">
        <input
          type="number"
          min={1}
          value={slot.staleness_days ?? ""}
          onChange={(e) =>
            onChange({
              staleness_days: e.target.value ? Number(e.target.value) : null,
            })
          }
          placeholder="e.g. 90"
          className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          aria-label="Staleness threshold in days"
        />
      </Field>

      <Field label="Min asset count">
        <input
          type="number"
          min={1}
          value={slot.min_count ?? ""}
          onChange={(e) =>
            onChange({
              min_count: e.target.value ? Number(e.target.value) : null,
            })
          }
          placeholder="e.g. 1"
          className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          aria-label="Minimum asset count"
        />
      </Field>

      <div className="pt-2 border-t border-[var(--border)]">
        <Button
          variant="danger"
          size="xs"
          iconLeft={<Trash2 className="w-3 h-3" aria-hidden />}
          onClick={onRemove}
          fullWidth
        >
          Remove slot
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Field wrapper
// ============================================================

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
