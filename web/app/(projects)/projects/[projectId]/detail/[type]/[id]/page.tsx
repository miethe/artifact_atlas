/**
 * Generic full-page detail route — /projects/[projectId]/detail/[type]/[id]
 * (P2A-005).
 *
 * Server component shell; renders the SAME tab registry as EntityModal in a
 * full-page (non-overlay) layout via the FullPageDetail client component.
 * The "Open full page" affordance in EntityModal links here, preserving ?tab=.
 *
 * useSearchParams lives in FullPageDetail → wrapped in a Suspense boundary.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { FullPageDetail } from "./FullPageDetail";

interface Props {
  params: Promise<{ projectId: string; type: string; id: string }>;
}

function humanizeType(type: string): string {
  return type.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, id } = await params;
  return { title: `${humanizeType(type)} — ${id}` };
}

export default async function EntityDetailPage({ params }: Props) {
  const { projectId, type, id } = await params;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={humanizeType(type)}
        eyebrow="Detail"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: humanizeType(type) },
          { label: id },
        ]}
      />

      {/* Suspense required because FullPageDetail uses useSearchParams */}
      <Suspense
        fallback={
          <div
            className="flex-1 animate-pulse bg-gray-50"
            aria-label="Loading detail…"
          />
        }
      >
        <FullPageDetail projectId={projectId} entityType={type} entityId={id} />
      </Suspense>
    </div>
  );
}
