/**
 * Asset Detail / Review — /projects/[projectId]/assets/[assetId]
 * Large preview, lifecycle status (with confirm gate),
 * provenance, versions, related assets, AI summary placeholder, policy panel.
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { AssetDetail } from "@/features/assets";

interface Props {
  params: Promise<{ projectId: string; assetId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assetId } = await params;
  return { title: `Asset — ${assetId}` };
}

export default async function AssetDetailPage({ params }: Props) {
  const { projectId, assetId } = await params;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Asset Detail"
        eyebrow="Review"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Assets", href: `/projects/${projectId}/assets` },
          { label: assetId },
        ]}
      />

      <div className="flex-1 overflow-hidden">
        <AssetDetail assetId={assetId} projectId={projectId} />
      </div>
    </div>
  );
}
