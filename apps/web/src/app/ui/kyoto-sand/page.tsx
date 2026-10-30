import { KyotoSandTheme } from "@/components/themes/KyotoSandTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function KyotoSandPage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <KyotoSandTheme stories={stories} briefing={briefing} />;
}

