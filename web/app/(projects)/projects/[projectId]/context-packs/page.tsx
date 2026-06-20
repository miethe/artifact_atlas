/**
 * Context Packs — /projects/[projectId]/context-packs
 *
 * CP-UI-001 + CP-UI-002: Context Pack Builder and Policy Controls.
 * Client rendering delegated to ContextPacksView.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ContextPacksView } from "@/features/context-packs";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return {
    title: `Context Packs — ${projectId}`,
    description: "Build and publish context packs for agent workflows.",
  };
}

export default async function ContextPacksPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Context Packs"
        eyebrow="Agent context"
        description="Build scoped context packs for agent workflows and MCP handoffs."
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Context Packs" },
        ]}
      />

      <ContextPacksView projectId={projectId} />
    </div>
  );
}
