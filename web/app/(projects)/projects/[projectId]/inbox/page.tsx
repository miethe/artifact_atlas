/**
 * Inbox Triage — /projects/[projectId]/inbox
 * UI-INBOX-001, UI-INBOX-002
 */

import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { InboxTriage } from "@/features/inbox/InboxTriage";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Inbox — ${projectId}` };
}

export default async function InboxPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Inbox"
        eyebrow="Asset triage"
        crumbs={[
          { label: "Projects", href: "/" },
          { label: projectId, href: `/projects/${projectId}` },
          { label: "Inbox" },
        ]}
      />

      {/* InboxTriage fills the remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <InboxTriage projectId={projectId} />
      </div>
    </div>
  );
}
