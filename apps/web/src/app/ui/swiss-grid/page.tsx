import { SwissGridTheme } from "@/components/themes/SwissGridTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SwissGridPage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <SwissGridTheme stories={stories} briefing={briefing} />;
}
