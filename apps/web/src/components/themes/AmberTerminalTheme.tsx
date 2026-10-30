import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";

export function AmberTerminalTheme({
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
    <div className="relative min-h-screen bg-[#070707] text-[#fbbf24] pb-28 font-mono crt-grid selection:bg-[#fbbf24] selection:text-black">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        {/* Bloomberg-Style Top Ticker Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#332200] pb-2 text-[11px] uppercase tracking-wider text-[#d97706]">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-none bg-[#fbbf24] animate-pulse" />
            <span>TERMINAL: SIGNAL-OS.ALPHA {"//"} KEYS: 10_ACTIVE</span>
          </div>
          <div className="flex gap-4 text-[#92400e]">
            <Link href="/" className="hover:text-[#fbbf24]">[01:DESK]</Link>
            <Link href="/feed" className="hover:text-[#fbbf24]">[02:FEED]</Link>
            <Link href="/search" className="hover:text-[#fbbf24]">[03:FIND]</Link>
            <Link href="/settings" className="hover:text-[#fbbf24]">[04:SYS]</Link>
          </div>
        </div>

        {/* Terminal Header */}
        <header className="mt-8 mb-10 border-b-2 border-[#fbbf24] pb-6">
          <div className="text-xs text-[#b45309]">
            DISPATCH DATE: {briefing.editionDate} {"//"} REGION: GLOBAL
          </div>
          <h1 className="mt-2 font-serif text-4xl sm:text-7xl font-bold tracking-tight text-[#fbbf24] drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
            THE ALPHA SIGNAL
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[#fef3c7]/80 font-sans">
            &gt; {briefing.introduction ?? "Executive newsletter synthesis: high-signal alpha extracted, fluff discarded."}
          </p>
        </header>

        {/* Lead Story: Terminal Box */}
        {lead ? (
          <article className="border border-[#b45309] bg-[#120d04] p-6 sm:p-8 shadow-[0_0_30px_-10px_rgba(251,191,36,0.15)]">
            <div className="flex items-center justify-between text-xs text-[#d97706] border-b border-[#382604] pb-3 mb-4">
              <span className="bg-[#fbbf24] text-black px-2 py-0.5 font-bold">
                PRIME_ALPHA {"//"} {lead.category?.toUpperCase() ?? "TECH"}
              </span>
              <span>CONFIDENCE: 98.4% {"//"} VERIFIED</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#fef3c7] leading-snug">
                  <Link href={`/stories/${lead.id}`} className="hover:text-[#fbbf24]">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <p className="mt-4 font-sans text-base text-[#fde68a] leading-relaxed">
                  {lead.summary}
                </p>

                <div className="mt-6 border-t border-[#382604] pt-4">
                  <span className="text-xs text-[#d97706] block mb-2 font-bold">&gt;&gt; KEY_PROPOSITIONS:</span>
                  <ul className="space-y-1.5 text-xs text-[#fef3c7]">
                    {lead.keyPoints.slice(0, 3).map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <span className="text-[#fbbf24]">[+]</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Value Box */}
              <div className="border border-[#d97706] bg-[#1c1305] p-5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#fbbf24]">
                    [WHY_THIS_MATTERS]
                  </span>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-[#fde68a]">
                    {lead.whyItMatters}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#382604]">
                  <Link
                    href={`/stories/${lead.id}`}
                    className="inline-block bg-[#fbbf24] text-black px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
                  >
                    ACCESS_SOURCES ({lead.sources.length}) &gt;&gt;
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ) : null}

        {/* Stories Grid */}
        <section className="mt-12">
          <div className="flex items-center justify-between border-b border-[#b45309] pb-2 mb-6 text-xs text-[#d97706]">
            <span>SIGNALS_INDEX ({remaining.length} ENTRIES)</span>
            <span>DATASTREAM: STABLE</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {remaining.map((story) => (
              <article
                key={story.id}
                className="border border-[#452c03] bg-[#0f0b03] p-5 flex flex-col hover:border-[#fbbf24] transition-all"
              >
                <span className="text-[10px] text-[#d97706] uppercase">
                  [{story.category?.toUpperCase() ?? "BRIEF"}]
                </span>

                <h3 className="mt-2 font-serif text-lg font-bold text-[#fef3c7] hover:text-[#fbbf24]">
                  <Link href={`/stories/${story.id}`}>{story.canonicalTitle}</Link>
                </h3>

                <p className="mt-2 font-sans text-xs text-[#fde68a]/80 line-clamp-3">
                  {story.summary}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#291b03] text-[10px] text-[#92400e]">
                  <span className="truncate max-w-[140px]">{story.sources[0]?.sourceName ?? "Newsletter"}</span>
                  <Link href={`/stories/${story.id}`} className="text-[#fbbf24] hover:underline">
                    DETAILS &gt;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-20 border-t border-[#382604] pt-6 text-center text-xs text-[#92400e]">
          TERMINAL END {"//"} SIGNAL_OS PHOSPHOR_EDITION {"//"} 2026
        </footer>
      </div>

      <ThemeSwitcherDock currentTheme="amber-terminal" />
    </div>
  );
}
