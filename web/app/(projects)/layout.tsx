/**
 * (projects) route group layout.
 * Wraps all project-scoped routes with the AppShell.
 * projectId is extracted in each page from params.
 *
 * NOTE: AppShell is a client component; the layout itself can be a Server Component
 * since it simply renders children inside the shell.
 */

import { AppShell } from "@/components/shell/AppShell";

interface ProjectsLayoutProps {
  children: React.ReactNode;
  params?: Promise<{ projectId?: string }>;
}

export default async function ProjectsLayout({
  children,
  params,
}: ProjectsLayoutProps) {
  // projectId may be undefined at the group level (resolved per-page)
  const resolvedParams = await params;
  const projectId = resolvedParams?.projectId;

  return <AppShell projectId={projectId}>{children}</AppShell>;
}
