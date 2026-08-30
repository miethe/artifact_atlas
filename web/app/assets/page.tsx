/**
 * /assets — cross-project asset browse view (M4 AC2).
 * Not project-scoped: renders assets from every project in one place,
 * filterable by artifact_type, tag, source_kind, and project.
 */

import { AppShell } from "@/components/shell/AppShell";
import { AssetBrowseView } from "@/features/assets/AssetBrowseView";

export const metadata = {
  title: "Browse Assets",
};

export default function AssetsBrowsePage() {
  return (
    <AppShell>
      <AssetBrowseView />
    </AppShell>
  );
}
