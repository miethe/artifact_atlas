"use client";

/**
 * TemplatesPageClient — client shell for the templates page.
 *
 * WS-5: the builder now lives on its own route
 * (/projects/[projectId]/templates/builder?templateId=). The old inline
 * builder mode is replaced by navigation; template cards expose an
 * "Open in BOM Builder" affordance.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui";
import { TemplateLibrary } from "@/features/templates/TemplateLibrary";
import { ApplyWizard } from "@/features/templates/components/ApplyWizard";
import type { ArtifactTemplate } from "@/features/templates/types";
import { Wrench } from "lucide-react";

interface TemplatesPageClientProps {
  projectId: string;
}

export function TemplatesPageClient({ projectId }: TemplatesPageClientProps) {
  const router = useRouter();
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

  const builderHref = `/projects/${projectId}/templates/builder`;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Templates"
        eyebrow="BOM templates"
        description="Browse and apply artifact templates to your project BOM"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Templates" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Wrench className="w-3.5 h-3.5" aria-hidden />}
              onClick={() => router.push(builderHref)}
            >
              Open BOM Builder
            </Button>
          </div>
        }
      />

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <TemplateLibrary
          projectId={projectId}
          onApplyTemplate={openWizard}
          onOpenBuilder={() => router.push(builderHref)}
          onOpenInBuilder={(template) =>
            router.push(`${builderHref}?templateId=${template.id}`)
          }
          className="h-full"
        />
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
              onSuccess={closeWizard}
              initialTemplateId={wizardTemplate?.id ?? null}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
