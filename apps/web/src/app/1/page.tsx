import { DefaultShell } from "@/components/layout/DefaultShell";
import { RadarFeedView } from "@/components/radar/RadarFeedView";
import { UiTasteRatingBar } from "@/components/theme/UiTasteRatingBar";
import { fetchRadarItems } from "@/lib/radar";
import { getActiveThemeSpec } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function RadarStreamOnePage() {
  const [items, themeSpec] = await Promise.all([
    fetchRadarItems(),
    getActiveThemeSpec(),
  ]);

  return (
    <DefaultShell themeSpec={themeSpec}>
      <main className="space-y-12">
        {/* Stream 1 Masthead */}
        <div className="border-b-2 border-ink pb-6">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.25em] text-mute">
            <span>Stream 1 · Multi-Source Engine</span>
            <span>External Feeds · Zero Inbox Mixing</span>
          </div>
          <h1 className="mt-3 font-serif text-4xl sm:text-6xl font-bold tracking-tight text-ink">
            The Radar Feed
          </h1>
          <p className="mt-3 font-serif text-lg text-mute max-w-2xl leading-relaxed">
            Autonomous multi-source research engine. Pulling live arXiv AI papers, systems security preprints, and engineering developments—curated separately from your private Gmail newsletter edition.
          </p>
        </div>

        {/* Live Interactive Stream View with Feedback on every card */}
        <RadarFeedView initialItems={items} />

        {/* Stream 1 Curation & Taste Rating Bar */}
        <div className="pt-8 border-t border-rule/60">
          <div className="text-center mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-mute">
              Stream 1 Quality Control
            </span>
          </div>
          <UiTasteRatingBar themeSpec={themeSpec} />
        </div>
      </main>
    </DefaultShell>
  );
}

