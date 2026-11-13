import { DefaultShell } from "@/components/layout/DefaultShell";
import { SavedStoriesView } from "@/components/editorial/SavedStoriesView";
import { getActiveThemeSpec } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const themeSpec = await getActiveThemeSpec();

  return (
    <DefaultShell themeSpec={themeSpec}>
      <main className="max-w-5xl mx-auto">
        <SavedStoriesView />
      </main>
    </DefaultShell>
  );
}
