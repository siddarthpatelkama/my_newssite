import { TokyoNightTheme } from "@/components/themes/TokyoNightTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TokyoNightPage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <TokyoNightTheme stories={stories} briefing={briefing} />;
}

