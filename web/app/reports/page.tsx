import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { ReportsHub } from "@/features/reports/ReportsHub";

export const metadata = { title: "Workspace Reports" };

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="flex h-full flex-col overflow-hidden">
        <PageHeader
          title="Workspace Reports"
          eyebrow="Reports hub"
          description="Delivery evidence across every project, including unattributed reports."
          crumbs={[{ label: "Workspace", href: "/" }, { label: "Reports" }]}
        />
        <Suspense fallback={<div className="flex-1 animate-pulse bg-gray-50" aria-label="Loading reports…" />}>
          <ReportsHub />
        </Suspense>
      </div>
    </AppShell>
  );
}
