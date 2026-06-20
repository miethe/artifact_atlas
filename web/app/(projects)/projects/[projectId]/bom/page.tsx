/**
 * Artifact BOM — /projects/[projectId]/bom
 *
 * Stage 1b: shell-wrapped placeholder.
 * Future stage will fill with BOM coverage matrix, slot assignments, gap analysis.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";

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
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Artifact BOM" },
        ]}
      />

      <section
        aria-label="BOM content"
        className="flex-1 p-5 overflow-y-auto"
        data-fill-target="artifact-bom"
      >
        <div className="rounded border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] p-8 text-center text-sm text-[var(--ink-muted)]">
          <p className="font-medium text-[var(--ink)]">Artifact BOM</p>
          <p className="mt-1">Coverage matrix, slot assignments, and gap analysis will be rendered here in a future stage.</p>
          <p className="mt-1 text-xs font-mono">projectId: {projectId}</p>
        </div>
      </section>
    </div>
  );
}
