/**
 * Project Command Center — /projects/[projectId]
 *
 * Stage 2A: Full command center with KPI cards, panels, and MeatyWiki sync bar.
 * Implements UI-HOME-001 (dashboard data model), UI-HOME-002 (panels),
 * UI-HOME-003 (MeatyWiki sync actions).
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { CommandCenterView } from "@/features/dashboard/CommandCenterView";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Command Center — ${projectId}` };
}

export default async function ProjectCommandCenterPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Command Center"
        eyebrow="Project overview"
        description={`Artifact graph, BOM status, and agent activity for: ${projectId}`}
        crumbs={[{ label: "Projects", href: "/" }, { label: projectId }]}
      />

      {/*
       * CommandCenterView is a client component — it owns all data fetching
       * via React Query hooks with fixture fallbacks when the backend is offline.
       */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg)]">
        <CommandCenterView projectId={projectId} />
      </div>
    </div>
  );
}
