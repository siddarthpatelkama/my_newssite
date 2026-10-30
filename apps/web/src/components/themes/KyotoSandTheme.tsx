import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";
import { UiTasteRatingBar } from "@/components/theme/UiTasteRatingBar";

export function KyotoSandTheme({
  stories,
  briefing,
}: {
  stories: StoryRecord[];
  briefing: {
    editionDate: string;
    title: string;
    introduction: string | null;
    sections: Array<{ title: string; type: string; storyIds: string[] }>;
  };
}) {
  const byId = new Map(stories.map((story) => [story.id, story]));
  const leadId = briefing.sections[0]?.storyIds[0];
  const lead = (leadId && byId.get(leadId)) || stories[0];
  const remaining = stories.filter((story) => story.id !== lead?.id);

  const formattedDate = new Date(`${briefing.editionDate}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative min-h-screen bg-[#ede7dd] text-[#23211f] pb-28 font-serif selection:bg-[#4d5d4b]/20 selection:text-[#23211f]">
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-8 sm:px-8">
        {/* Zen Balance Header */}
        <nav className="flex items-center justify-between border-b border-[#dad2c4] pb-4 font-sans text-xs uppercase tracking-[0.24em] text-[#787166]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d5d4b]" />
            <span>Kyoto · Wabi-Sabi Dispatch</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-[#4d5d4b] transition-colors">Edition</Link>
            <Link href="/feed" className="hover:text-[#4d5d4b] transition-colors">Feed</Link>
            <Link href="/search" className="hover:text-[#4d5d4b] transition-colors">Search</Link>
            <Link href="/settings" className="hover:text-[#4d5d4b] transition-colors">Settings</Link>
          </div>
        </nav>

        {/* Masthead */}
        <header className="mt-12 mb-14 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[#787166]">
            {formattedDate}
          </p>
          <h1 className="mt-2 font-serif text-5xl sm:text-7xl font-normal tracking-tight text-[#23211f]">
            The Daily Signal
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic text-[#635c52] leading-relaxed">
            {briefing.introduction ?? "Mindful synthesis of the day's technical ideas, curated with quiet precision."}
          </p>
          <div className="mt-6 flex justify-center">
            <span className="h-px w-12 bg-[#dad2c4]" />
          </div>
        </header>

        {/* Lead Story: Floating Washi Card */}
        {lead ? (
          <article className="rounded-2xl border border-[#dad2c4] bg-[#f6f2ea] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <span className="inline-block rounded-full bg-[#4d5d4b]/10 border border-[#4d5d4b]/20 px-3 py-0.5 font-sans text-[11px] uppercase tracking-wider text-[#4d5d4b]">
                  {lead.category?.replace("-", " ") ?? "Core Insight"}
                </span>

                <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-normal leading-[1.2] text-[#23211f]">
                  <Link href={`/stories/${lead.id}`} className="hover:text-[#4d5d4b] transition-colors">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <p className="mt-5 font-serif text-lg leading-relaxed text-[#4d473f]">
                  {lead.summary}
                </p>

                <div className="mt-6 space-y-2 text-sm text-[#5a5247]">
                  {lead.keyPoints.slice(0, 3).map((pt) => (
                    <div key={pt} className="border-t border-[#e2dcd0] pt-2 flex items-start gap-2">
                      <span className="text-[#4d5d4b] font-sans">▪</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contemplative Note */}
              <div className="rounded-xl border border-[#dad2c4] bg-[#ede7dd]/60 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-sans text-[11px] uppercase tracking-wider text-[#4d5d4b] font-bold">
                    Why this deserves your focus
                  </h3>
                  <p className="mt-3 font-serif text-base leading-7 text-[#23211f]">
                    {lead.whyItMatters}
                  </p>
                </div>

                <Link
                  href={`/stories/${lead.id}`}
                  className="mt-6 inline-block font-sans text-xs uppercase tracking-wider text-[#4d5d4b] hover:text-[#23211f] font-semibold"
                >
                  Continue with source notes →
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        {/* Stories Grid */}
        <section className="mt-14">
          <div className="mb-6 flex items-baseline justify-between border-b border-[#dad2c4] pb-2 font-sans text-xs text-[#787166]">
            <h3 className="font-serif text-2xl text-[#23211f]">Harmonic Signals</h3>
            <span>{remaining.length} stories recorded</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {remaining.map((story) => (
              <article
                key={story.id}
                className="flex flex-col rounded-xl border border-[#dad2c4] bg-[#f6f2ea] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow"
              >
                <span className="font-sans text-[10px] uppercase tracking-wider text-[#4d5d4b]">
                  {story.category?.replace("-", " ") ?? "Note"}
                </span>

                <h4 className="mt-2 font-serif text-xl font-normal leading-snug text-[#23211f] hover:text-[#4d5d4b]">
                  <Link href={`/stories/${story.id}`}>{story.canonicalTitle}</Link>
                </h4>

                <p className="mt-3 font-serif text-sm leading-relaxed text-[#5a5247] line-clamp-3">
                  {story.summary}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between font-sans text-[11px] text-[#787166] border-t border-[#e2dcd0]">
                  <span className="truncate max-w-[150px]">{story.sources[0]?.sourceName ?? "Newsletter"}</span>
                  <Link href={`/stories/${story.id}`} className="text-[#4d5d4b] hover:underline">
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Real User Rating Slider Section at the end of the page */}
        <div className="mt-14">
          <UiTasteRatingBar currentTheme="kyoto-sand" />
        </div>

        <footer className="mt-12 border-t border-[#dad2c4] pt-6 text-center font-sans text-xs text-[#787166]">
          SignalOS · Kyoto Sand &amp; Sumi Edition · 2026
        </footer>
      </div>

      <ThemeSwitcherDock currentTheme="kyoto-sand" />
    </div>
  );
}

