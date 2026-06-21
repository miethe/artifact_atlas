/**
 * Coverage & Gaps — /projects/[projectId]/coverage
 * BOM-UI-006
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { CoverageView } from "@/features/coverage";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return {
    title: `Coverage & Gaps — ${projectId}`,
    description: "BOM readiness score, coverage matrix, and gap recommendations.",
  };
}

export default async function CoveragePage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Coverage & Gaps"
        eyebrow="Readiness"
        description="Track artifact coverage, identify gaps, and get actionable recommendations."
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Coverage & Gaps" },
        ]}
      />
      <div className="flex-1 overflow-hidden">
        <CoverageView projectId={projectId} />
      </div>
    </div>
  );
}
