import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";

export function GodRaysTheme({
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
    <div className="relative min-h-screen bg-[#06070a] text-slate-100 overflow-x-hidden pb-28 font-sans selection:bg-amber-400/30 selection:text-amber-100">
      {/* ================= FIGMA GOD RAYS EFFECT ================= */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[850px] overflow-hidden z-0 select-none">
        {/* Core Corona Glow */}
        <div
          className="absolute top-[-160px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full blur-[80px]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 235, 185, 0.32) 0%, rgba(245, 180, 80, 0.14) 35%, rgba(200, 120, 30, 0.03) 65%, transparent 80%)",
          }}
        />

        {/* Volumetric SVG Light Rays */}
        <svg
          viewBox="0 0 1440 850"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1600px] h-[850px] animate-god-rays"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="godRayCenter" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF8E0" stopOpacity="0.45" />
              <stop offset="30%" stopColor="#FBD585" stopOpacity="0.25" />
              <stop offset="65%" stopColor="#D97706" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#06070a" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="godRaySideA" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF4CE" stopOpacity="0.32" />
              <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.16" />
              <stop offset="75%" stopColor="#B45309" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#06070a" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="godRaySideB" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFEBB0" stopOpacity="0.22" />
              <stop offset="40%" stopColor="#D97706" stopOpacity="0.10" />
              <stop offset="80%" stopColor="#78350F" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#06070a" stopOpacity="0" />
            </linearGradient>

            <filter id="godRayBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="22 6" />
            </filter>
          </defs>

          <g filter="url(#godRayBlur)">
            {/* Center Primary Ray */}
            <polygon points="720,-60 620,850 820,850" fill="url(#godRayCenter)" />
            {/* Left Rays */}
            <polygon points="720,-60 410,850 550,850" fill="url(#godRaySideA)" />
            <polygon points="720,-60 170,850 310,850" fill="url(#godRaySideB)" />
            <polygon points="720,-60 -90,850 60,850" fill="url(#godRaySideB)" />
            {/* Right Rays */}
            <polygon points="720,-60 890,850 1030,850" fill="url(#godRaySideA)" />
            <polygon points="720,-60 1130,850 1270,850" fill="url(#godRaySideB)" />
            <polygon points="720,-60 1380,850 1530,850" fill="url(#godRaySideB)" />
          </g>
        </svg>

        {/* Ambient Warm Golden Horizon Line */}
        <div className="absolute top-[320px] inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
      </div>

      {/* ================= CONTENT CONTAINER ================= */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-8 sm:px-8">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between border-b border-amber-300/15 pb-4 text-[11px] uppercase tracking-[0.24em] text-amber-200/70">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            <span>SignalOS · Celestial Ray</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-amber-200 transition-colors">Edition</Link>
            <Link href="/feed" className="hover:text-amber-200 transition-colors">Feed</Link>
            <Link href="/search" className="hover:text-amber-200 transition-colors">Search</Link>
            <Link href="/settings" className="hover:text-amber-200 transition-colors">Settings</Link>
          </div>
        </nav>

        {/* Masthead */}
        <header className="mt-12 mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-[11px] uppercase tracking-[0.3em] text-amber-300 backdrop-blur-md">
            <span>Volumetric Intelligence</span>
            <span className="text-amber-400/40">·</span>
            <span>{formattedDate}</span>
          </div>

          <h1 className="mt-5 font-serif text-5xl leading-tight sm:text-7xl font-bold tracking-tight text-white drop-shadow-[0_0_40px_rgba(251,191,36,0.25)]">
            The Daily Signal
          </h1>

          <p className="mx-auto mt-4 max-w-2xl font-serif text-xl italic text-amber-100/75 leading-relaxed">
            {briefing.introduction ?? "Illuminated newsletter intelligence curated for the ambitious student builder."}
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-amber-300/40" />
            <span className="text-xs text-amber-300/70">◆</span>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-amber-300/40" />
          </div>
        </header>

        {/* Empty State */}
        {!stories.length ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300/20 bg-white/[0.03] p-10 text-center backdrop-blur-xl">
            <h2 className="font-serif text-2xl text-amber-100">No newsletter stories yet</h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Connect your Gmail account to let the background worker curate newsletter stories into your illuminated edition.
            </p>
            <div className="mt-6">
              <a
                href="/api/gmail/start"
                className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-neutral-950 shadow-lg hover:brightness-110 transition-all"
              >
                Connect Gmail Account →
              </a>
            </div>
          </div>
        ) : null}

        {/* Lead Story */}
        {lead ? (
          <article className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent p-8 sm:p-10 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(245,158,11,0.2),0_20px_50px_rgba(0,0,0,0.7)]">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.22em] text-amber-300">
                  <span>★ Lead Story</span>
                  <span>·</span>
                  <span>{lead.category?.replace("-", " ") ?? "AI & TECH"}</span>
                </div>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-medium leading-[1.18] text-white">
                  <Link href={`/stories/${lead.id}`} className="hover:text-amber-200 transition-colors">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <p className="mt-5 font-serif text-lg leading-8 text-slate-200">{lead.summary}</p>

                <div className="mt-8 flex items-center gap-4 text-xs font-mono text-amber-200/60">
                  <span>SOURCES: {lead.sources.length} VERIFIED</span>
                  <span>·</span>
                  <span>UPDATED TODAY</span>
                </div>
              </div>

              {/* Why You Should Read This */}
              <div className="rounded-2xl border border-amber-300/20 bg-amber-500/[0.06] p-6 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] font-bold text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>Why you should read this</span>
                  </div>
                  <p className="mt-3 text-[15px] leading-7 text-amber-50/90 font-serif">
                    {lead.whyItMatters}
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    {lead.keyPoints.slice(0, 3).map((point) => (
                      <li key={point} className="flex items-start gap-2 border-t border-amber-300/10 pt-2.5">
                        <span className="text-amber-400 font-mono">→</span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/stories/${lead.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-amber-300 hover:text-amber-100 transition-colors"
                >
                  <span>Explore full breakdown & sources</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        {/* Stories Grid */}
        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between border-b border-amber-300/15 pb-3">
            <h3 className="font-serif text-2xl text-amber-100">Signals & Analysis</h3>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-300/60">
              {remaining.length} Curated Stories
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {remaining.map((story) => (
              <article
                key={story.id}
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-lg transition-all duration-300 hover:border-amber-400/40 hover:bg-white/[0.06] hover:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.15)]"
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-300/70">
                  <span>{story.category?.replace("-", " ") ?? "SIGNAL"}</span>
                  <span>{story.sources.length} {story.sources.length === 1 ? "SOURCE" : "SOURCES"}</span>
                </div>

                <h4 className="mt-3 font-serif text-xl font-medium leading-snug text-white group-hover:text-amber-200 transition-colors">
                  <Link href={`/stories/${story.id}`}>{story.canonicalTitle}</Link>
                </h4>

                <p className="mt-3 text-sm leading-6 text-slate-300/85 line-clamp-3 font-serif">
                  {story.summary}
                </p>

                {story.whyItMatters ? (
                  <div className="mt-4 border-t border-white/10 pt-3 text-xs text-amber-200/80 italic font-serif">
                    💡 {story.whyItMatters.slice(0, 110)}…
                  </div>
                ) : null}

                <div className="mt-auto pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5">
                  <span className="truncate max-w-[180px]">{story.sources[0]?.sourceName ?? "Newsletter"}</span>
                  <Link href={`/stories/${story.id}`} className="text-amber-300 hover:text-amber-100">
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-amber-300/15 pt-8 text-center text-xs text-amber-200/50">
          <p>SignalOS · The Celestial Edition · Powered by Google Gemini</p>
        </footer>
      </div>

      {/* Floating Theme Switcher Dock */}
      <ThemeSwitcherDock currentTheme="god-rays" />
    </div>
  );
}
