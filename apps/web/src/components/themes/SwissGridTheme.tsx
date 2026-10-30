import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";

export function SwissGridTheme({
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

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-black pb-28 font-sans selection:bg-[#ff3b00] selection:text-white">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        {/* Top Swiss Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 text-xs uppercase tracking-widest font-mono font-bold">
          <span>SIGNAL_OS {"//"} CH-8001</span>
          <span className="text-[#ff3b00]">EDITION: {briefing.editionDate}</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[#ff3b00]">EDITION</Link>
            <Link href="/feed" className="hover:text-[#ff3b00]">INDEX</Link>
            <Link href="/settings" className="hover:text-[#ff3b00]">PREFS</Link>
          </div>
        </div>

        {/* Brutalist Title */}
        <header className="mt-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline border-b-4 border-black pb-8">
            <div className="md:col-span-8">
              <h1 className="text-6xl sm:text-8xl font-black uppercase tracking-tighter leading-none">
                THE SIGNAL
              </h1>
            </div>
            <div className="md:col-span-4 font-mono text-xs uppercase tracking-wider text-neutral-600 leading-relaxed">
              <span className="text-[#ff3b00] font-bold">[MISSION]</span>{" "}
              {briefing.introduction ?? "SYSTEMATIC REDUCTION OF NEWSLETTER NOISE INTO SHARP ARCHITECTURAL SIGNAL."}
            </div>
          </div>
        </header>

        {/* Lead Story: Modular Grid */}
        {lead ? (
          <article className="border-b-2 border-black pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="bg-black text-white px-2 py-0.5">01 {"//"} TOP STORY</span>
                  <span className="text-[#ff3b00]">{lead.category?.toUpperCase() ?? "GENERAL"}</span>
                </div>

                <h2 className="font-serif text-4xl sm:text-6xl font-bold leading-tight">
                  <Link href={`/stories/${lead.id}`} className="hover:text-[#ff3b00] transition-colors">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <p className="mt-6 text-lg font-serif text-neutral-800 leading-relaxed max-w-2xl">
                  {lead.summary}
                </p>

                <div className="mt-8 border-t-2 border-black pt-4">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider block mb-2">
                    CORE PROPOSITIONS:
                  </span>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {lead.keyPoints.slice(0, 4).map((pt, idx) => (
                      <div key={pt} className="border border-black p-3 text-xs font-mono leading-relaxed bg-white">
                        <span className="text-[#ff3b00] font-bold mr-1">0{idx + 1}.</span> {pt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inverted Black Box: Why You Should Read */}
              <div className="lg:col-span-4 bg-black text-white p-6 flex flex-col justify-between">
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#ff3b00] mb-4">
                    [ANALYSIS &amp; RELEVANCE]
                  </div>
                  <p className="font-serif text-base leading-relaxed text-neutral-200">
                    {lead.whyItMatters}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-neutral-700">
                  <Link
                    href={`/stories/${lead.id}`}
                    className="inline-block bg-[#ff3b00] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
                  >
                    INSPECT SOURCES ({lead.sources.length}) →
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ) : null}

        {/* Stories Grid */}
        <section className="mt-12">
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-6 font-mono text-xs font-bold uppercase">
            <span>INDEXED ARTICLES ({remaining.length})</span>
            <span>SORT: CHRONOLOGICAL</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {remaining.map((story, i) => (
              <article key={story.id} className="border-t-2 border-black pt-3 flex flex-col">
                <span className="font-mono text-[11px] font-bold text-[#ff3b00]">
                  {"//"} 0{i + 2} {story.category?.toUpperCase() ?? "BRIEF"}
                </span>

                <h3 className="mt-2 font-serif text-xl font-bold leading-snug">
                  <Link href={`/stories/${story.id}`} className="hover:text-[#ff3b00]">
                    {story.canonicalTitle}
                  </Link>
                </h3>

                <p className="mt-3 text-xs leading-5 text-neutral-700 font-sans line-clamp-3">
                  {story.summary}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between font-mono text-[10px] text-neutral-500 uppercase border-t border-neutral-300">
                  <span>{story.sources[0]?.sourceName ?? "NEWSLETTER"}</span>
                  <Link href={`/stories/${story.id}`} className="font-bold text-black hover:text-[#ff3b00]">
                    VIEW →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-20 border-t-2 border-black pt-6 text-center font-mono text-xs font-bold uppercase">
          SIGNAL_OS {"//"} INTERNATIONAL TYPOGRAPHIC SYSTEM {"//"} 2026
        </footer>
      </div>

      <ThemeSwitcherDock currentTheme="swiss-grid" />
    </div>
  );
}
