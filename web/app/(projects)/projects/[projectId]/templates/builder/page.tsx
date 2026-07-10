/**
 * BOM Builder — /projects/[projectId]/templates/builder?templateId=
 *
 * WS-5: three-panel template editor per
 * artifact_atlas_project_template_interface.png. Accepts ?templateId= to edit
 * an existing template; without it, starts a new draft.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { BomBuilderPage } from "@/features/templates/builder/BomBuilderPage";

interface Props {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ templateId?: string | string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return {
    title: `BOM Builder — ${projectId}`,
    description: "Design the expected Artifact BOM structure for this project type.",
  };
}

export default async function BuilderRoute({ params, searchParams }: Props) {
  const { projectId } = await params;
  const sp = await searchParams;
  const templateId =
    typeof sp.templateId === "string" && sp.templateId.length > 0
      ? sp.templateId
      : null;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="BOM Builder"
        eyebrow="Templates"
        description="Design the expected Artifact BOM structure for this project type."
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Templates", href: `/projects/${projectId}/templates` },
          { label: "BOM Builder" },
        ]}
      />
      <section aria-label="BOM Builder" className="flex-1 min-h-0">
        <BomBuilderPage projectId={projectId} templateId={templateId} />
      </section>
    </div>
  );
}
