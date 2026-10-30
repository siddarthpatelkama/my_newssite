import { GodRaysTheme } from "@/components/themes/GodRaysTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GodRaysPage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <GodRaysTheme stories={stories} briefing={briefing} />;
}

