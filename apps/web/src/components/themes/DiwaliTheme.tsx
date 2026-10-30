"use client";

import Link from "next/link";
import { useState } from "react";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";
import { UiTasteRatingBar } from "@/components/theme/UiTasteRatingBar";

/** Handcrafted Earthen Diya Lamp with Interactive Flame */
function InteractiveDiya({
  className = "",
  size = "normal",
}: {
  className?: string;
  size?: "small" | "normal" | "large";
}) {
  const [showBlessing, setShowBlessing] = useState(false);

  const handleClick = () => {
    setShowBlessing(true);
    setTimeout(() => setShowBlessing(false), 2400);
  };

  const scale = size === "large" ? "w-24 h-12" : size === "small" ? "w-12 h-6" : "w-16 h-8";
  const flameScale = size === "large" ? "w-10 h-16 -mb-3" : size === "small" ? "w-6 h-9 -mb-2" : "w-8 h-12 -mb-2.5";

  return (
    <div
      onClick={handleClick}
      className={`group relative inline-block cursor-pointer select-none transition-transform duration-300 hover:scale-110 ${className}`}
      title="Click to light the sacred diya flame!"
    >
      {showBlessing ? (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400/90 px-3 py-1 text-[11px] font-bold text-neutral-950 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-75">
          ✨ Shubh Deepavali! May light triumph! ✨
        </div>
      ) : null}

      {/* Animated Flickering Flame */}
      <svg
        viewBox="0 0 40 60"
        className={`${flameScale} mx-auto animate-flame transition-all group-hover:brightness-125`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="flameInnerGrad" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FEF08A" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#DC2626" />
          </radialGradient>
        </defs>
        <path
          d="M20 2 C23 16 35 28 35 42 C35 52 28 58 20 58 C12 58 5 52 5 42 C5 28 17 16 20 2 Z"
          fill="url(#flameInnerGrad)"
        />
        <ellipse cx="20" cy="44" rx="6" ry="10" fill="#FFFBEB" opacity="0.95" />
      </svg>

      {/* Terracotta Clay Diya Base */}
      <svg viewBox="0 0 80 32" className={scale} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="clayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="40%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="gheeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <path d="M4 8 C16 2 64 2 76 8 C74 24 58 30 40 30 C22 30 6 24 4 8 Z" fill="url(#clayGrad)" />
        <ellipse cx="40" cy="8" rx="34" ry="5.5" fill="url(#gheeGrad)" opacity="0.9" />
        <path d="M6 8 C20 4 60 4 74 8" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </svg>
    </div>
  );
}

/** Floating Sky Lantern (Akash Kandil) */
function SkyLantern({ left, delay, duration }: { left: string; delay: string; duration: string }) {
  return (
    <div
      className="pointer-events-none absolute bottom-0 select-none animate-diwali-ember-1"
      style={{
        left,
        animationDelay: delay,
        animationDuration: duration,
      }}
    >
      <div className="flex flex-col items-center opacity-85">
        {/* Lantern Paper Body */}
        <div className="relative h-10 w-7 rounded-t-lg rounded-b-md bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600 shadow-[0_0_20px_rgba(245,158,11,0.8)]">
          {/* Inner Candle Glow */}
          <div className="absolute inset-x-2 top-3 h-4 rounded-full bg-yellow-200 blur-[2px] opacity-90 animate-pulse" />
        </div>
        {/* Lantern Ribbons / Tassels */}
        <div className="h-3 w-4 border-l border-r border-amber-300/40 opacity-70" />
      </div>
    </div>
  );
}

/** Intricate Sacred Mandala / Rangoli Geometry */
function SacredMandala() {
  return (
    <svg
      viewBox="0 0 800 800"
      className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[850px] opacity-10 select-none animate-god-rays-slow"
      fill="none"
      stroke="#F59E0B"
      strokeWidth="1.2"
    >
      <circle cx="400" cy="400" r="380" strokeDasharray="6 6" />
      <circle cx="400" cy="400" r="320" />
      <circle cx="400" cy="400" r="260" strokeDasharray="4 8" />
      <circle cx="400" cy="400" r="200" />
      <circle cx="400" cy="400" r="140" strokeDasharray="3 5" />
      <circle cx="400" cy="400" r="80" />

      {/* 16 Petals */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16;
        return (
          <g key={i} transform={`rotate(${angle} 400 400)`}>
            <path d="M 400 80 C 430 180, 430 260, 400 320 C 370 260, 370 180, 400 80 Z" fill="rgba(245, 158, 11, 0.05)" />
            <circle cx="400" cy="70" r="6" fill="#F59E0B" opacity="0.4" />
            <line x1="400" y1="20" x2="400" y2="70" />
          </g>
        );
      })}

      {/* 8 Inner Lotus Leaves */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8 + 22.5;
        return (
          <g key={i} transform={`rotate(${angle} 400 400)`}>
            <path d="M 400 200 C 420 280, 420 320, 400 360 C 380 320, 380 280, 400 200 Z" fill="rgba(251, 191, 36, 0.1)" />
          </g>
        );
      })}
    </svg>
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
    <div className="relative min-h-screen bg-[#07020d] text-amber-50 overflow-x-hidden pb-28 font-sans selection:bg-amber-500/30 selection:text-amber-100">
      {/* ================= ROYAL DIWALI ATMOSPHERE ================= */}
      <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
        {/* Royal Velvet Indigo & Golden Corona */}
        <div
          className="absolute top-[-140px] left-1/2 -translate-x-1/2 w-[1200px] h-[750px] rounded-full blur-[110px] opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(147, 51, 234, 0.32) 0%, rgba(245, 158, 11, 0.18) 35%, rgba(180, 83, 9, 0.05) 65%, transparent 85%)",
          }}
        />

        {/* Sacred Rangoli Mandala Geometry */}
        <SacredMandala />

        {/* Floating Sky Lanterns (Akash Kandils) */}
        <SkyLantern left="8%" delay="0s" duration="14s" />
        <SkyLantern left="22%" delay="4s" duration="18s" />
        <SkyLantern left="78%" delay="2s" duration="16s" />
        <SkyLantern left="92%" delay="7s" duration="15s" />

        {/* Floating Festival Embers */}
        <div className="absolute bottom-20 left-[15%] h-2.5 w-2.5 rounded-full bg-amber-400 blur-[1px] animate-diwali-ember-1" />
        <div className="absolute bottom-32 left-[35%] h-2 w-2 rounded-full bg-yellow-300 blur-[1px] animate-diwali-ember-2" />
        <div className="absolute bottom-10 right-[25%] h-3 w-3 rounded-full bg-amber-300 blur-[1px] animate-diwali-ember-3" />
        <div className="absolute bottom-40 right-[15%] h-2 w-2 rounded-full bg-orange-400 blur-[1px] animate-diwali-ember-1" />
        <div className="absolute bottom-60 left-[50%] h-1.5 w-1.5 rounded-full bg-amber-200 blur-[1px] animate-diwali-ember-2" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        {/* Top Festival Navigation */}
        <nav className="flex items-center justify-between border-b border-amber-400/25 pb-3 text-[11px] font-sans uppercase tracking-[0.24em] text-amber-300/80">
          <div className="flex items-center gap-2">
            <span className="text-base">🪔</span>
            <span>SignalOS · Deepavali Festival Edition</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-amber-200 transition-colors">Edition</Link>
            <Link href="/feed" className="hover:text-amber-200 transition-colors">Feed</Link>
            <Link href="/search" className="hover:text-amber-200 transition-colors">Search</Link>
            <Link href="/settings" className="hover:text-amber-200 transition-colors">Settings</Link>
          </div>
        </nav>

        {/* Masthead */}
        <header className="mt-12 mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-purple-900/50 via-amber-900/40 to-purple-900/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-amber-300 shadow-xl backdrop-blur-md">
            <span>🪔 Shubh Deepavali</span>
            <span className="text-amber-400/40">·</span>
            <span>{formattedDate}</span>
          </div>

          {/* Symmetrical Diya Masthead Flank */}
          <div className="mt-6 flex items-center justify-center gap-4 sm:gap-8">
            <InteractiveDiya size="large" className="hidden sm:inline-block transform -scale-x-100" />
            <h1 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-b from-[#FFFDF0] via-[#FDE68A] to-[#D97706] bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(245,158,11,0.4)]">
              The Daily Signal
            </h1>
            <InteractiveDiya size="large" className="hidden sm:inline-block" />
          </div>

          <p className="mx-auto mt-4 max-w-2xl font-serif text-xl italic text-amber-100/90 leading-relaxed">
            {briefing.introduction ?? "Celebrating the eternal triumph of clarity and wisdom over dark, noisy chaos. May today's insights enlighten your path."}
          </p>

          {/* Marigold Garland Divider */}
          <div className="mt-8 flex items-center justify-center gap-4 select-none">
            <div className="h-px w-28 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <span className="text-amber-300 text-sm tracking-widest">✦ 🪔 ✦ 🪔 ✦</span>
            <div className="h-px w-28 bg-gradient-to-l from-transparent via-amber-400/60 to-transparent" />
          </div>
        </header>

        {/* Lead Story: Royal Festive Card */}
        {lead ? (
          <article className="relative overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-b from-[#22103a]/75 via-[#16082a]/90 to-[#0b0314] p-8 sm:p-10 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(245,158,11,0.25),0_20px_50px_rgba(0,0,0,0.85)]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.22em] text-amber-300">
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
              <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-b from-amber-500/[0.12] to-amber-900/[0.15] p-6 backdrop-blur-md flex flex-col justify-between shadow-inner">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] font-bold text-amber-300">
                    <span className="text-base">🪔</span>
                    <span>Why you should read this</span>
                  </div>
                  <p className="mt-3 text-[15px] leading-7 text-amber-50 font-serif">
                    {lead.whyItMatters}
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-amber-100/80">
                    {lead.keyPoints.slice(0, 3).map((point) => (
                      <li key={point} className="flex items-start gap-2 border-t border-amber-400/20 pt-2.5">
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
                className="group relative flex flex-col rounded-2xl border border-amber-400/25 bg-gradient-to-b from-[#1b0b30]/60 to-[#0e041c]/90 p-6 backdrop-blur-md transition-all duration-300 hover:border-amber-400/60 hover:bg-[#261044]/80 hover:shadow-[0_10px_35px_-10px_rgba(245,158,11,0.3)]"
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
                  <div className="mt-4 border-t border-amber-400/20 pt-3 text-xs text-amber-300/85 italic font-serif">
                    💡 {story.whyItMatters.slice(0, 110)}…
                  </div>
                ) : null}

                <div className="mt-auto pt-4 flex items-center justify-between text-[11px] text-amber-200/60 border-t border-amber-400/15">
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
        <footer className="mt-12 border-t border-amber-400/25 pt-6 text-center text-xs text-amber-300/60 font-serif">
          <p>🪔 Shubh Deepavali · SignalOS Special Edition · May Knowledge &amp; Light Guide Your Code</p>
        </footer>
      </div>

      {/* Floating Theme Switcher Dock */}
      <ThemeSwitcherDock currentTheme="diwali" />
    </div>
  );
}
