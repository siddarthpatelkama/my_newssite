import { CyberAttackTheme } from "@/components/themes/CyberAttackTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CyberAttackPage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <CyberAttackTheme stories={stories} briefing={briefing} />;
}
