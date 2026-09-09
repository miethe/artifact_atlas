import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { OverviewView } from "@/features/overview";

export const metadata = { title: "AOS Overview" };

export default function OverviewPage() {
  return (
    <AppShell>
      <div className="flex min-h-full flex-col">
        <PageHeader
          title="AOS Overview"
          eyebrow="Fleet status"
          description="Latest authored signal and derived operating telemetry for every project."
          crumbs={[{ label: "Workspace", href: "/" }, { label: "Overview" }]}
        />
        <OverviewView />
      </div>
    </AppShell>
  );
}
