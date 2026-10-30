import { BroadsheetTheme } from "@/components/themes/BroadsheetTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BroadsheetPage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <BroadsheetTheme stories={stories} briefing={briefing} />;
}

