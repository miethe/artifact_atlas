/**
 * IntentTree Node List — /projects/[projectId]/intent-nodes
 * Lists demo nodes; links to individual node context pages.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { DEMO_NODES } from "@/features/node/NodeDemoFixtures";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Intent Nodes — ${projectId}` };
}

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
  complete: "bg-gray-100 text-gray-600",
  draft: "bg-blue-100 text-blue-700",
};

export default async function IntentNodesPage({ params }: Props) {
  const { projectId } = await params;
  const nodes = DEMO_NODES.filter((n) => n.project_id === projectId || true);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Intent Nodes"
        eyebrow="IntentTree"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Intent Nodes" },
        ]}
      />

      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-2">
          {nodes.map((node) => (
            <Link
              key={node.id}
              href={`/projects/${projectId}/intent-nodes/${node.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded border border-[var(--border)] bg-[var(--surface)] hover:bg-gray-50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate group-hover:text-blue-600 transition-colors">
                  {node.title}
                </p>
                {node.description && (
                  <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">
                    {node.description}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_CLASSES[node.status] ?? "bg-gray-100 text-gray-600"}`}
              >
                {node.status}
              </span>
              <span className="shrink-0 text-[11px] text-[var(--ink-faint)] capitalize">
                {node.node_type}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
