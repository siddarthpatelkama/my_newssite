import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";

export function TokyoNightTheme({
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
    <div className="relative min-h-screen bg-[#090d16] text-slate-100 pb-28 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Background Engineering Grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        {/* Engineering Status Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-sky-500/20 pb-3 text-[11px] font-mono tracking-wider text-sky-400/80">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>SIGNAL_OS {"//"} NODE_01 [SYSTEM: ONLINE]</span>
          </div>
          <div className="flex items-center gap-5 text-slate-400">
            <Link href="/" className="hover:text-sky-400 transition-colors">[EDITION]</Link>
            <Link href="/feed" className="hover:text-sky-400 transition-colors">[FEED]</Link>
            <Link href="/search" className="hover:text-sky-400 transition-colors">[SEARCH]</Link>
            <Link href="/settings" className="hover:text-sky-400 transition-colors">[SETTINGS]</Link>
          </div>
        </div>

        {/* Console Header */}
        <header className="mt-8 mb-12">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>&gt; sys.fetch_briefing</span>
            <span className="text-slate-500">{"//"}</span>
            <span>{briefing.editionDate}</span>
          </div>

          <h1 className="mt-3 font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
            The Nightly Signal
          </h1>

          <p className="mt-3 max-w-2xl text-base text-slate-400 font-sans">
            {briefing.introduction ?? "Curated technical intelligence compiled from engineering, AI, and startup newsletters."}
          </p>
        </header>

        {/* Lead Story Card */}
        {lead ? (
          <article className="rounded-2xl border border-sky-500/30 bg-[#0d1322]/90 p-8 shadow-[0_0_40px_-15px_rgba(56,189,248,0.2)]">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-sky-400">
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5">
                    ● TOP_SIGNAL
                  </span>
                  <span>{lead.category?.toUpperCase() ?? "ENGINEERING"}</span>
                </div>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-semibold leading-snug text-white">
                  <Link href={`/stories/${lead.id}`} className="hover:text-sky-300 transition-colors">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <p className="mt-4 text-slate-300 leading-relaxed font-sans text-base">
                  {lead.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {lead.keyPoints.slice(0, 3).map((point) => (
                    <div key={point} className="rounded-lg bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 text-xs text-slate-300">
                      ⚡ {point}
                    </div>
                  ))}
                </div>
              </div>

              {/* Why It Matters Callout */}
              <div className="rounded-xl border border-cyan-500/25 bg-[#09152a] p-6 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                    [WHY_THIS_MATTERS_FOR_YOU]
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">
                    {lead.whyItMatters}
                  </p>
                </div>

                <Link
                  href={`/stories/${lead.id}`}
                  className="mt-6 inline-flex items-center gap-2 font-mono text-xs text-sky-400 hover:text-sky-200"
                >
                  <span>&gt; inspect_sources ({lead.sources.length})</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        {/* Stories Grid */}
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono text-slate-400">
            <span>[PIPELINE_SIGNALS: {remaining.length}]</span>
            <span>SORT: NOVELTY_SCORE</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {remaining.map((story) => (
              <article
                key={story.id}
                className="group flex flex-col rounded-xl border border-slate-800 bg-[#0d1322]/80 p-5 hover:border-sky-500/40 hover:bg-[#11192e] transition-all"
              >
                <div className="text-[10px] font-mono text-sky-400 uppercase">
                  {story.category?.replace("-", " ") ?? "DEV_SIGNAL"}
                </div>

                <h3 className="mt-2 font-serif text-lg font-medium leading-snug text-white group-hover:text-sky-300 transition-colors">
                  <Link href={`/stories/${story.id}`}>{story.canonicalTitle}</Link>
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-400 line-clamp-3">
                  {story.summary}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <span className="truncate max-w-[160px]">{story.sources[0]?.sourceName ?? "Newsletter"}</span>
                  <Link href={`/stories/${story.id}`} className="text-sky-400 hover:text-sky-200">
                    [READ]
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-slate-800/80 pt-6 text-center font-mono text-xs text-slate-500">
          SIGNAL_OS {"//"} TOKYO_NIGHT_EDITION {"//"} 2026
        </footer>
      </div>

      <ThemeSwitcherDock currentTheme="tokyo-night" />
    </div>
  );
}
