/**
 * IntentTree Node Context — /projects/[projectId]/intent-nodes/[nodeId]
 * UI-NODE-001: node metadata header, linked entities, context/assets/outputs tabs, agent actions.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { NodeContextView } from "@/features/node/NodeContextView";

interface Props {
  params: Promise<{ projectId: string; nodeId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nodeId } = await params;
  return { title: `Intent Node — ${nodeId}` };
}

export default async function IntentNodePage({ params }: Props) {
  const { projectId, nodeId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Intent Node"
        eyebrow="IntentTree"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Intent Nodes", href: `/projects/${projectId}/intent-nodes` },
          { label: nodeId },
        ]}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <NodeContextView nodeId={nodeId} projectId={projectId} />
      </div>
    </div>
  );
}
