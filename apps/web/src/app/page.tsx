import { cookies } from "next/headers";
import { DiwaliTheme } from "@/components/themes/DiwaliTheme";
import { CyberAttackTheme } from "@/components/themes/CyberAttackTheme";
import { KyotoSandTheme } from "@/components/themes/KyotoSandTheme";
import { NordicSlateTheme } from "@/components/themes/NordicSlateTheme";
import { BroadsheetTheme } from "@/components/themes/BroadsheetTheme";
import { SwissGridTheme } from "@/components/themes/SwissGridTheme";
import { GodRaysTheme } from "@/components/themes/GodRaysTheme";
import { TokyoNightTheme } from "@/components/themes/TokyoNightTheme";
import { AmberTerminalTheme } from "@/components/themes/AmberTerminalTheme";
import { getBriefing, getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ ui?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const theme = resolvedParams.ui || cookieStore.get("signalos_theme")?.value || "diwali";

  const stories = await getStories();
  const briefing = await getBriefing(stories);

  switch (theme) {
    case "diwali":
      return <DiwaliTheme stories={stories} briefing={briefing} />;
    case "cyber-attack":
      return <CyberAttackTheme stories={stories} briefing={briefing} />;
    case "kyoto-sand":
      return <KyotoSandTheme stories={stories} briefing={briefing} />;
    case "nordic-slate":
      return <NordicSlateTheme stories={stories} briefing={briefing} />;
    case "broadsheet":
      return <BroadsheetTheme stories={stories} briefing={briefing} />;
    case "swiss-grid":
      return <SwissGridTheme stories={stories} briefing={briefing} />;
    case "god-rays":
      return <GodRaysTheme stories={stories} briefing={briefing} />;
    case "tokyo-night":
      return <TokyoNightTheme stories={stories} briefing={briefing} />;
    case "amber-terminal":
      return <AmberTerminalTheme stories={stories} briefing={briefing} />;
    default:
      return <DiwaliTheme stories={stories} briefing={briefing} />;
  }
}
