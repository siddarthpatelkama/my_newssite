import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";
import { UiTasteRatingBar } from "@/components/theme/UiTasteRatingBar";

export function NordicSlateTheme({
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
    <div className="relative min-h-screen bg-[#131716] text-[#ede8df] pb-28 font-sans selection:bg-[#84a98c]/30 selection:text-[#ede8df]">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-8 sm:px-8">
        {/* Soft Organic Navigation */}
        <nav className="flex items-center justify-between border-b border-[#29332e] pb-4 text-xs font-medium text-[#84a98c]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#84a98c]" />
            <span className="tracking-wide">Nordic Slate · Calm Reading</span>
          </div>
          <div className="flex gap-6 text-[#a8b3a5]">
            <Link href="/" className="hover:text-[#ede8df] transition-colors">Edition</Link>
            <Link href="/feed" className="hover:text-[#ede8df] transition-colors">Feed</Link>
            <Link href="/search" className="hover:text-[#ede8df] transition-colors">Search</Link>
            <Link href="/settings" className="hover:text-[#ede8df] transition-colors">Settings</Link>
          </div>
        </nav>

        {/* Masthead */}
        <header className="mt-10 mb-14 text-center">
          <span className="text-xs uppercase tracking-[0.28em] text-[#84a98c]">
            {formattedDate}
          </span>
          <h1 className="mt-3 font-serif text-5xl sm:text-7xl font-normal tracking-tight text-[#ede8df]">
            The Morning Signal
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg italic text-[#a8b3a5] leading-relaxed">
            {briefing.introduction ?? "A quiet, thoughtful review of technical advancements, free from manufactured urgency."}
          </p>
        </header>

        {/* Lead Story: Rounded Organic Card */}
        {lead ? (
          <article className="rounded-3xl border border-[#29332e] bg-[#1a211f] p-8 sm:p-10 shadow-lg">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="inline-block rounded-full bg-[#84a98c]/15 px-3 py-1 text-xs font-medium text-[#84a98c]">
                  Focus · {lead.category?.replace("-", " ") ?? "Architecture"}
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-medium leading-[1.2] text-[#ede8df]">
                  <Link href={`/stories/${lead.id}`} className="hover:text-[#84a98c] transition-colors">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <p className="mt-5 font-serif text-lg leading-relaxed text-[#c5cdc2]">
                  {lead.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {lead.keyPoints.slice(0, 3).map((pt) => (
                    <span key={pt} className="rounded-xl bg-[#242e2b] px-3 py-1.5 text-xs text-[#a8b3a5]">
                      • {pt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Why You Should Read */}
              <div className="rounded-2xl border border-[#2e3b35] bg-[#222b28] p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#84a98c] font-semibold">
                    Why it matters for your learning
                  </h3>
                  <p className="mt-3 font-serif text-sm leading-6 text-[#ede8df]">
                    {lead.whyItMatters}
                  </p>
                </div>

                <Link
                  href={`/stories/${lead.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[#84a98c] hover:text-[#ede8df] transition-colors"
                >
                  <span>Continue reading with sources</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        {/* Stories Grid */}
        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between border-b border-[#29332e] pb-3 text-xs text-[#84a98c]">
            <h3 className="font-serif text-2xl text-[#ede8df]">Quiet Signals</h3>
            <span>{remaining.length} stories compiled</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {remaining.map((story) => (
              <article
                key={story.id}
                className="flex flex-col rounded-2xl border border-[#29332e] bg-[#1a211f] p-6 hover:border-[#84a98c]/40 hover:bg-[#202926] transition-all"
              >
                <span className="text-[11px] text-[#84a98c] uppercase tracking-wider">
                  {story.category?.replace("-", " ") ?? "Signal"}
                </span>

                <h4 className="mt-2 font-serif text-xl font-medium leading-snug text-[#ede8df] hover:text-[#84a98c]">
                  <Link href={`/stories/${story.id}`}>{story.canonicalTitle}</Link>
                </h4>

                <p className="mt-3 font-serif text-sm leading-relaxed text-[#a8b3a5] line-clamp-3">
                  {story.summary}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#29332e] text-xs text-[#84a98c]">
                  <span className="truncate max-w-[160px] text-[#71806f]">{story.sources[0]?.sourceName ?? "Newsletter"}</span>
                  <Link href={`/stories/${story.id}`} className="hover:text-[#ede8df]">
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Real User Rating Slider Section at the end of the page */}
        <div className="mt-14">
          <UiTasteRatingBar currentTheme="nordic-slate" />
        </div>

        <footer className="mt-12 border-t border-[#29332e] pt-6 text-center text-xs text-[#71806f]">
          SignalOS · Scandinavian Basalt Edition · Quiet intelligence
        </footer>
      </div>

      <ThemeSwitcherDock currentTheme="nordic-slate" />
    </div>
  );
}

