/**
 * Artifact BOM page — /projects/[projectId]/bom
 *
 * Stage 3B: BOM Overview + Slot Interactions (BOM-UI-003, BOM-UI-004)
 * Renders KPI row, domain tabs, slot grid, template sources, legend, quick actions.
 * All slot interactions route through API hooks; audit-sensitive actions confirm via Dialog.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { BomOverview } from "@/features/bom";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Artifact BOM — ${projectId}` };
}

export default async function BomPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Artifact BOM"
        eyebrow="Bill of materials"
        description="Coverage matrix, slot assignments, and gap analysis."
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Artifact BOM" },
        ]}
      />

      <section
        aria-label="BOM content"
        className="flex-1 overflow-y-auto relative"
        data-fill-target="artifact-bom"
      >
        <BomOverview projectId={projectId} />
      </section>
    </div>
  );
}
