import { AmberTerminalTheme } from "@/components/themes/AmberTerminalTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AmberTerminalPage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);

  return <AmberTerminalTheme stories={stories} briefing={briefing} />;
}

