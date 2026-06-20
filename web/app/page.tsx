/**
 * Root index — redirects to the default project command center.
 * The default project id is seeded as 'proj_artifact_atlas'.
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/projects/proj_artifact_atlas");
}
