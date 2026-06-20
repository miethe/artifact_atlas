/**
 * Templates — /projects/[projectId]/templates
 * Stage 3A: Template library + apply wizard + BOM builder.
 */

import type { Metadata } from "next";
import { TemplatesPageClient } from "./TemplatesPageClient";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return {
    title: `Templates — ${projectId}`,
    description: "Browse and apply artifact templates to your project BOM.",
  };
}

export default async function TemplatesPage({ params }: Props) {
  const { projectId } = await params;
  return <TemplatesPageClient projectId={projectId} />;
}
