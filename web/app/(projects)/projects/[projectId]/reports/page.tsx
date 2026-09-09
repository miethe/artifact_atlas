import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ProjectReportsView } from "@/features/reports";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Reports — ${projectId}` };
}

export default async function ProjectReportsPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Reports"
        eyebrow="Delivery reports"
        description="Verified delivery reports attributed to this project."
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Reports" },
        ]}
      />
      <Suspense
        fallback={
          <div
            className="flex-1 animate-pulse bg-gray-50"
            aria-label="Loading project reports…"
          />
        }
      >
        <ProjectReportsView projectId={projectId} />
      </Suspense>
    </div>
  );
}
