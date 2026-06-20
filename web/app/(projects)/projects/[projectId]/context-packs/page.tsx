/**
 * Context Packs — /projects/[projectId]/context-packs
 *
 * Stage 1b: shell-wrapped placeholder.
 * Future stage will fill with context pack list, builder, publish actions.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Context Packs — ${projectId}` };
}

export default async function ContextPacksPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Context Packs"
        eyebrow="Agent context"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Context Packs" },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus className="w-3.5 h-3.5" aria-hidden />}
            aria-label="Create context pack"
          >
            New Pack
          </Button>
        }
      />

      <section
        aria-label="Context packs content"
        className="flex-1 p-5 overflow-y-auto"
        data-fill-target="context-packs"
      >
        <div className="rounded border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] p-8 text-center text-sm text-[var(--ink-muted)]">
          <p className="font-medium text-[var(--ink)]">Context Packs</p>
          <p className="mt-1">Pack list, builder, and publish/export actions will be rendered here in a future stage.</p>
          <p className="mt-1 text-xs font-mono">projectId: {projectId}</p>
        </div>
      </section>
    </div>
  );
}
