import { DiwaliTheme } from "@/components/themes/DiwaliTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DiwaliPage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <DiwaliTheme stories={stories} briefing={briefing} />;
}

