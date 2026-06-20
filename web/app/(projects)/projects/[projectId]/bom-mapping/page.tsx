/**
 * Inbox → BOM Mapping — /projects/[projectId]/bom-mapping
 * BOM-UI-005
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { BomMappingView } from "@/features/bom-mapping";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return {
    title: `Inbox → BOM Mapping — ${projectId}`,
    description: "Map inbox items to BOM slots using drag & drop or keyboard assignment.",
  };
}

export default async function BomMappingPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Inbox → BOM Mapping"
        eyebrow="Triage"
        description="Assign inbox items to BOM slots. Drag and drop or use keyboard mapping."
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Inbox → BOM Mapping" },
        ]}
      />
      <div className="flex-1 overflow-hidden">
        <BomMappingView projectId={projectId} />
      </div>
    </div>
  );
}
