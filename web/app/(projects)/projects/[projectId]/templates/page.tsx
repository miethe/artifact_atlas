/**
 * Templates — /projects/[projectId]/templates
 *
 * Stage 1b: shell-wrapped placeholder.
 * Future stage will fill with template library, BOM template browser, apply actions.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Templates — ${projectId}` };
}

export default async function TemplatesPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Templates"
        eyebrow="BOM templates"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Templates" },
        ]}
      />

      <section
        aria-label="Templates content"
        className="flex-1 p-5 overflow-y-auto"
        data-fill-target="templates"
      >
        <div className="rounded border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] p-8 text-center text-sm text-[var(--ink-muted)]">
          <p className="font-medium text-[var(--ink)]">Templates</p>
          <p className="mt-1">Template library and BOM template browser will be rendered here in a future stage.</p>
          <p className="mt-1 text-xs font-mono">projectId: {projectId}</p>
        </div>
      </section>
    </div>
  );
}
