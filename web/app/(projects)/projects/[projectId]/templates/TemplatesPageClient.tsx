"use client";

/**
 * TemplatesPageClient — client shell for the templates page.
 * Manages view mode: library | apply-wizard | builder.
 */

import * as React from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui";
import { TemplateLibrary } from "@/features/templates/TemplateLibrary";
import { ApplyWizard } from "@/features/templates/components/ApplyWizard";
import { BomBuilder } from "@/features/templates/BomBuilder";
import type { ArtifactTemplate } from "@/features/templates/types";
import { Wrench, Library } from "lucide-react";
import { clsx } from "clsx";

type PageMode = "library" | "builder";

interface TemplatesPageClientProps {
  projectId: string;
}

export function TemplatesPageClient({ projectId }: TemplatesPageClientProps) {
  const [mode, setMode] = React.useState<PageMode>("library");
  const [wizardTemplate, setWizardTemplate] =
    React.useState<ArtifactTemplate | null>(null);
  const [wizardOpen, setWizardOpen] = React.useState(false);

  const openWizard = (template: ArtifactTemplate) => {
    setWizardTemplate(template);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardTemplate(null);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={mode === "builder" ? "Template Builder" : "Templates"}
        eyebrow={mode === "builder" ? "BOM builder" : "BOM templates"}
        description={
          mode === "builder"
            ? "Design custom artifact templates with domain/slot structure"
            : "Browse and apply artifact templates to your project BOM"
        }
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: mode === "builder" ? "Template Builder" : "Templates" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {mode === "builder" ? (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<Library className="w-3.5 h-3.5" aria-hidden />}
                onClick={() => setMode("library")}
              >
                Back to Library
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Wrench className="w-3.5 h-3.5" aria-hidden />}
                onClick={() => setMode("builder")}
              >
                Open Builder
              </Button>
            )}
          </div>
        }
      />

      {/* Mode indicator */}
      <div className="flex items-center gap-1 px-5 py-1.5 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
        <ModeTab
          active={mode === "library"}
          onClick={() => setMode("library")}
          label="Template Library"
        />
        <ModeTab
          active={mode === "builder"}
          onClick={() => setMode("builder")}
          label="Builder"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {mode === "library" ? (
          <TemplateLibrary
            projectId={projectId}
            onApplyTemplate={openWizard}
            onOpenBuilder={() => setMode("builder")}
            className="h-full"
          />
        ) : (
          <BomBuilder projectId={projectId} className="h-full" />
        )}
      </div>

      {/* Apply Wizard Modal — custom overlay to support full wizard layout */}
      {wizardOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 bg-black/40"
            onClick={closeWizard}
          />
          {/* Panel */}
          <div
            className="relative w-full max-w-3xl h-[620px] rounded-lg shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Apply Template Wizard"
          >
            <ApplyWizard
              projectId={projectId}
              onClose={closeWizard}
              onSuccess={() => {
                closeWizard();
                setMode("library");
              }}
              initialTemplateId={wizardTemplate?.id ?? null}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "px-3 py-1 rounded text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]",
        active
          ? "bg-white text-blue-600 border border-[var(--border)] shadow-sm"
          : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </button>
  );
}
