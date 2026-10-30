import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";

export function BroadsheetTheme({
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
    <div className="relative min-h-screen bg-[#f7f3e8] text-[#141210] pb-28 font-serif selection:bg-[#991b1b]/20">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        {/* Top Folio Bar */}
        <div className="flex items-center justify-between border-b border-[#141210] pb-2 text-[11px] font-sans uppercase tracking-[0.28em] text-[#635a4f]">
          <span>Vol. I · No. 42</span>
          <span>Personal Gazette of Record</span>
          <span>Daily Edition</span>
        </div>

        {/* Traditional Double Line Masthead */}
        <header className="mt-4 border-y-4 border-double border-[#141210] py-6 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.42em] text-[#991b1b] font-bold">
            The Continental Dispatch
          </p>
          <h1 className="mt-2 font-serif text-6xl sm:text-8xl font-black tracking-tight leading-none">
            The Daily Signal
          </h1>
          <p className="mt-3 font-serif text-lg italic text-[#635a4f]">
            {briefing.introduction ?? "A compendium of electronic dispatches, distilled for the discerning student & scholar."}
          </p>
        </header>

        {/* Navigation Bar */}
        <nav className="flex justify-center gap-8 border-b border-[#141210] py-2.5 font-sans text-[11px] uppercase tracking-[0.24em] text-[#635a4f]">
          <Link href="/" className="hover:text-[#991b1b]">Edition</Link>
          <Link href="/feed" className="hover:text-[#991b1b]">The Running Wire</Link>
          <Link href="/search" className="hover:text-[#991b1b]">Gazette Archives</Link>
          <Link href="/settings" className="hover:text-[#991b1b]">Telegraph Desk</Link>
        </nav>

        {/* Dateline */}
        <div className="my-6 text-center font-sans text-xs uppercase tracking-[0.3em] text-[#635a4f]">
          <span>London · San Francisco · Tokyo — {formattedDate}</span>
        </div>

        {/* Lead Story */}
        {lead ? (
          <article className="border-b-2 border-[#141210] pb-10">
            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-[0.26em] text-[#991b1b] font-bold">
                  The Lead Dispatch · {lead.category?.replace("-", " ") ?? "TECHNOLOGY"}
                </p>

                <h2 className="mt-3 font-serif text-4xl sm:text-6xl font-bold leading-[1.12]">
                  <Link href={`/stories/${lead.id}`} className="hover:text-[#991b1b] transition-colors">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <div className="mt-6 font-serif text-xl leading-8 text-[#2a241e]">
                  <span className="float-left mr-3 mt-1 font-serif text-5xl font-bold leading-none text-[#991b1b]">
                    {lead.summary?.charAt(0) ?? "T"}
                  </span>
                  <span>{lead.summary?.slice(1)}</span>
                </div>
              </div>

              {/* Framed Editorial Column */}
              <div className="border-l-0 border-[#d3c8b4] lg:border-l lg:pl-8">
                <div className="border-2 border-[#141210] p-6 bg-[#efe9dc]">
                  <p className="font-sans text-[11px] uppercase tracking-[0.24em] font-bold text-[#991b1b]">
                    Special Intelligence Note
                  </p>
                  <p className="mt-3 font-serif text-base leading-7 text-[#141210]">
                    {lead.whyItMatters}
                  </p>

                  <div className="mt-6 border-t border-[#141210] pt-4">
                    <p className="font-sans text-[10px] uppercase tracking-wider text-[#635a4f] font-semibold">
                      Primary Findings
                    </p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {lead.keyPoints.slice(0, 3).map((pt) => (
                        <li key={pt} className="border-b border-[#d3c8b4] pb-2">
                          — {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/stories/${lead.id}`}
                    className="mt-6 inline-block font-sans text-xs uppercase tracking-[0.2em] text-[#991b1b] font-bold"
                  >
                    Examine Documents &amp; Sources →
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ) : null}

        {/* 3-Column Newspaper Stories Grid */}
        <section className="mt-10">
          <div className="mb-6 flex items-baseline justify-between border-b border-[#141210] pb-2 font-sans">
            <h3 className="font-serif text-2xl font-bold">Dispatches from the Field</h3>
            <span className="text-xs uppercase tracking-wider text-[#635a4f]">{remaining.length} Reports Filed</span>
          </div>

          <div className="grid gap-8 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#d3c8b4]">
            {remaining.map((story, i) => (
              <article key={story.id} className={`flex flex-col ${i > 0 ? "md:pl-8" : ""}`}>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#991b1b] font-bold">
                  {story.category?.replace("-", " ") ?? "GENERAL"}
                </p>

                <h4 className="mt-2 font-serif text-2xl font-semibold leading-snug">
                  <Link href={`/stories/${story.id}`} className="hover:text-[#991b1b]">
                    {story.canonicalTitle}
                  </Link>
                </h4>

                <p className="mt-3 font-serif text-sm leading-6 text-[#383129] line-clamp-4">
                  {story.summary}
                </p>

                <p className="mt-auto pt-4 font-sans text-[11px] text-[#635a4f] border-t border-[#d3c8b4]">
                  {story.sources[0]?.sourceName ?? "Newsletter"} · {story.sources.length} source{story.sources.length === 1 ? "" : "s"}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t-2 border-[#141210] pt-6 text-center font-sans text-xs uppercase tracking-widest text-[#635a4f]">
          Printed electronically by SignalOS · Verbatim et Literatim
        </footer>
      </div>

      <ThemeSwitcherDock currentTheme="broadsheet" />
    </div>
  );
}

