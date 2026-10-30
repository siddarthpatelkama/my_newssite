import { NordicSlateTheme } from "@/components/themes/NordicSlateTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NordicSlatePage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <NordicSlateTheme stories={stories} briefing={briefing} />;
}
