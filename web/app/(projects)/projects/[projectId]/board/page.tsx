/**
 * Feature / Topic Board — /projects/[projectId]/board
 * UI-BOARD-001: kanban, draggable cards, keyboard move fallback.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { AssetBoard } from "@/features/board/AssetBoard";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Board — ${projectId}` };
}

export default async function BoardPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Board"
        eyebrow="Feature &amp; topic board"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Board" },
        ]}
      />

      {/* Board fills remaining height; horizontal scroll handled internally */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <AssetBoard projectId={projectId} />
      </div>
    </div>
  );
}
