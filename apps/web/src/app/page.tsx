import { cookies } from "next/headers";
import { GodRaysTheme } from "@/components/themes/GodRaysTheme";
import { TokyoNightTheme } from "@/components/themes/TokyoNightTheme";
import { BroadsheetTheme } from "@/components/themes/BroadsheetTheme";
import { SwissGridTheme } from "@/components/themes/SwissGridTheme";
import { NordicSlateTheme } from "@/components/themes/NordicSlateTheme";
import { AmberTerminalTheme } from "@/components/themes/AmberTerminalTheme";
import { KyotoSandTheme } from "@/components/themes/KyotoSandTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ ui?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const theme = resolvedParams.ui || cookieStore.get("signalos_theme")?.value || "god-rays";

  const stories = await getStories();
  const briefing = await getBriefing(stories);

  switch (theme) {
    case "tokyo-night":
      return <TokyoNightTheme stories={stories} briefing={briefing} />;
    case "broadsheet":
      return <BroadsheetTheme stories={stories} briefing={briefing} />;
    case "swiss-grid":
      return <SwissGridTheme stories={stories} briefing={briefing} />;
    case "nordic-slate":
      return <NordicSlateTheme stories={stories} briefing={briefing} />;
    case "amber-terminal":
      return <AmberTerminalTheme stories={stories} briefing={briefing} />;
    case "kyoto-sand":
      return <KyotoSandTheme stories={stories} briefing={briefing} />;
    case "god-rays":
    default:
      return <GodRaysTheme stories={stories} briefing={briefing} />;
  }
}
