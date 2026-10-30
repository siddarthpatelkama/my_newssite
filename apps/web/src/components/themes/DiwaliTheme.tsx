import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";
import { UiTasteRatingBar } from "@/components/theme/UiTasteRatingBar";

/** Handcrafted Earthen Diya Lamp with Animated Flame */
function DiyaLamp({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* Animated Flickering Flame */}
      <svg
        viewBox="0 0 40 60"
        className="w-8 h-12 -mb-2.5 mx-auto animate-flame"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="flameInner" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FEF08A" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#DC2626" />
          </radialGradient>
        </defs>
        {/* Outer Glow Path */}
        <path
          d="M20 2 C23 16 35 28 35 42 C35 52 28 58 20 58 C12 58 5 52 5 42 C5 28 17 16 20 2 Z"
          fill="url(#flameInner)"
        />
        {/* Core Bright Teardrop */}
        <ellipse cx="20" cy="44" rx="6" ry="10" fill="#FFFBEB" opacity="0.9" />
      </svg>

      {/* Terracotta Clay Diya Base */}
      <svg
        viewBox="0 0 80 32"
        className="w-16 h-7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="diyaClay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="40%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="gheePool" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        {/* Clay Bowl */}
        <path
          d="M4 8 C16 2 64 2 76 8 C74 24 58 30 40 30 C22 30 6 24 4 8 Z"
          fill="url(#diyaClay)"
        />
        {/* Diya Rim with Gold Ghee Glow */}
        <ellipse cx="40" cy="8" rx="34" ry="5.5" fill="url(#gheePool)" opacity="0.9" />
        {/* Earthen Rim Highlight */}
        <path
          d="M6 8 C20 4 60 4 74 8"
          stroke="#FDE68A"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

export function DiwaliTheme({
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
    <div className="relative min-h-screen bg-[#0a0414] text-amber-50 overflow-x-hidden pb-28 font-sans selection:bg-amber-500/30 selection:text-amber-100">
      {/* ================= FESTIVAL AMBIENT BACKDROP ================= */}
      <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
        {/* Deep Royal Purple & Warm Gold Corona */}
        <div
          className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[100px] opacity-70"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(147, 51, 234, 0.28) 0%, rgba(245, 158, 11, 0.16) 40%, rgba(180, 83, 9, 0.04) 70%, transparent 85%)",
          }}
        />

        {/* Floating Festival Embers */}
        <div className="absolute bottom-20 left-[15%] h-2.5 w-2.5 rounded-full bg-amber-400 blur-[1px] animate-diwali-ember-1" />
        <div className="absolute bottom-32 left-[35%] h-2 w-2 rounded-full bg-yellow-300 blur-[1px] animate-diwali-ember-2" />
        <div className="absolute bottom-10 right-[25%] h-3 w-3 rounded-full bg-amber-300 blur-[1px] animate-diwali-ember-3" />
        <div className="absolute bottom-40 right-[15%] h-2 w-2 rounded-full bg-orange-400 blur-[1px] animate-diwali-ember-1" />
        <div className="absolute bottom-60 left-[50%] h-1.5 w-1.5 rounded-full bg-amber-200 blur-[1px] animate-diwali-ember-2" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        {/* Top Festival Navigation */}
        <nav className="flex items-center justify-between border-b border-amber-400/20 pb-3 text-[11px] font-sans uppercase tracking-[0.24em] text-amber-300/80">
          <div className="flex items-center gap-2">
            <span className="text-base">🪔</span>
            <span>SignalOS · Deepavali Edition</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-amber-200 transition-colors">Edition</Link>
            <Link href="/feed" className="hover:text-amber-200 transition-colors">Feed</Link>
            <Link href="/search" className="hover:text-amber-200 transition-colors">Search</Link>
            <Link href="/settings" className="hover:text-amber-200 transition-colors">Settings</Link>
          </div>
        </nav>

        {/* Masthead */}
        <header className="mt-10 mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-purple-900/40 via-amber-900/30 to-purple-900/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-amber-300 shadow-lg backdrop-blur-md">
            <span>🪔 Happy Deepavali</span>
            <span className="text-amber-400/40">·</span>
            <span>{formattedDate}</span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6">
            <DiyaLamp className="hidden sm:inline-block transform -scale-x-100" />
            <h1 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight text-white drop-shadow-[0_0_35px_rgba(245,158,11,0.35)]">
              The Daily Signal
            </h1>
            <DiyaLamp className="hidden sm:inline-block" />
          </div>

          <p className="mx-auto mt-4 max-w-2xl font-serif text-xl italic text-amber-100/85 leading-relaxed">
            {briefing.introduction ?? "Celebrating the victory of illuminated intelligence over noisy darkness. May today's ideas spark wisdom."}
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px w-28 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
            <span className="text-amber-300 text-xs">✨ 🪔 ✨</span>
            <div className="h-px w-28 bg-gradient-to-l from-transparent via-amber-400/50 to-transparent" />
          </div>
        </header>

        {/* Lead Story: Royal Festive Card */}
        {lead ? (
          <article className="relative overflow-hidden rounded-3xl border border-amber-400/35 bg-gradient-to-b from-[#211138]/70 via-[#18092c]/85 to-[#0d041a] p-8 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(245,158,11,0.22),0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.22em] text-amber-300">
                  <span>🪔 Lead Dispatch</span>
                  <span>·</span>
                  <span>{lead.category?.replace("-", " ") ?? "TECHNOLOGY"}</span>
                </div>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-semibold leading-[1.18] text-white">
                  <Link href={`/stories/${lead.id}`} className="hover:text-amber-300 transition-colors">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <p className="mt-5 font-serif text-lg leading-8 text-amber-100/90">{lead.summary}</p>

                <div className="mt-8 flex items-center gap-4 text-xs font-mono text-amber-300/70">
                  <span>SOURCES: {lead.sources.length} VERIFIED</span>
                  <span>·</span>
                  <span>SPECIAL FESTIVAL CURATION</span>
                </div>
              </div>

              {/* Why You Should Read This (Illuminated Diya Box) */}
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.08] p-6 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] font-bold text-amber-300">
                    <span className="text-sm">🪔</span>
                    <span>Why you should read this</span>
                  </div>
                  <p className="mt-3 text-[15px] leading-7 text-amber-50 font-serif">
                    {lead.whyItMatters}
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-amber-100/80">
                    {lead.keyPoints.slice(0, 3).map((point) => (
                      <li key={point} className="flex items-start gap-2 border-t border-amber-400/15 pt-2.5">
                        <span className="text-amber-400 font-mono">✦</span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/stories/${lead.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-amber-300 hover:text-white transition-colors"
                >
                  <span>Explore full breakdown &amp; sources</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        {/* Stories Grid */}
        <section className="mt-14">
          <div className="mb-6 flex items-center justify-between border-b border-amber-400/20 pb-3">
            <h3 className="font-serif text-2xl text-amber-200">Festival Intelligence Dispatches</h3>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-300/70">
              {remaining.length} Stories Filtered
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {remaining.map((story) => (
              <article
                key={story.id}
                className="group relative flex flex-col rounded-2xl border border-amber-400/20 bg-gradient-to-b from-[#1c0c32]/50 to-[#10051e]/80 p-6 backdrop-blur-md transition-all duration-300 hover:border-amber-400/50 hover:bg-[#251042]/70 hover:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.2)]"
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-400/80">
                  <span>{story.category?.replace("-", " ") ?? "SIGNAL"}</span>
                  <span>{story.sources.length} {story.sources.length === 1 ? "SOURCE" : "SOURCES"}</span>
                </div>

                <h4 className="mt-3 font-serif text-xl font-medium leading-snug text-white group-hover:text-amber-300 transition-colors">
                  <Link href={`/stories/${story.id}`}>{story.canonicalTitle}</Link>
                </h4>

                <p className="mt-3 text-sm leading-6 text-amber-100/75 line-clamp-3 font-serif">
                  {story.summary}
                </p>

                {story.whyItMatters ? (
                  <div className="mt-4 border-t border-amber-400/15 pt-3 text-xs text-amber-300/85 italic font-serif">
                    💡 {story.whyItMatters.slice(0, 110)}…
                  </div>
                ) : null}

                <div className="mt-auto pt-4 flex items-center justify-between text-[11px] text-amber-200/60 border-t border-amber-400/10">
                  <span className="truncate max-w-[180px]">{story.sources[0]?.sourceName ?? "Newsletter"}</span>
                  <Link href={`/stories/${story.id}`} className="text-amber-300 hover:text-white font-medium">
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Real User Rating Slider Section at the end of the page */}
        <div className="mt-14">
          <UiTasteRatingBar currentTheme="diwali" />
        </div>

        {/* Festival Footer */}
        <footer className="mt-12 border-t border-amber-400/20 pt-6 text-center text-xs text-amber-300/60 font-serif">
          <p>🪔 Shubh Deepavali · SignalOS Special Edition · May Knowledge &amp; Light Guide Your Code</p>
        </footer>
      </div>

      {/* Floating Theme Switcher Dock */}
      <ThemeSwitcherDock currentTheme="diwali" />
    </div>
  );
}
