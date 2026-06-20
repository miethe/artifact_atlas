/**
 * Asset Library — /projects/[projectId]/assets
 * Server component shell; delegates to AssetLibrary client component.
 * useSearchParams is inside AssetLibrary → Suspense boundary required.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { AssetLibrary } from "@/features/assets";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Assets — ${projectId}` };
}

export default async function AssetsPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Assets"
        eyebrow="Asset library"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Assets" },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus className="w-3.5 h-3.5" aria-hidden />}
            aria-label="Add asset"
          >
            Add Asset
          </Button>
        }
      />

      {/* Suspense required because AssetLibrary uses useSearchParams */}
      <Suspense
        fallback={
          <div className="flex-1 animate-pulse bg-gray-50" aria-label="Loading asset library…" />
        }
      >
        <AssetLibrary projectId={projectId} />
      </Suspense>
    </div>
  );
}
