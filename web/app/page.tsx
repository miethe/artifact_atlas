/**
 * Root index — the Projects landing page.
 * Every project as a card + "New Project" create flow (WS-4).
 */

import { AppShell } from "@/components/shell/AppShell";
import { ProjectsIndexView } from "@/features/projects/ProjectsIndexView";

export const metadata = {
  title: "Projects",
};

export default function RootPage() {
  return (
    <AppShell>
      <ProjectsIndexView />
    </AppShell>
  );
}
