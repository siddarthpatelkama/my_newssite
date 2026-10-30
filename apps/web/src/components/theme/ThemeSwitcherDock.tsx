"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type ThemeId =
  | "diwali"
  | "kyoto-sand"
  | "nordic-slate"
  | "broadsheet"
  | "swiss-grid"
  | "god-rays"
  | "tokyo-night"
  | "amber-terminal";

export const THEMES: Array<{
  id: ThemeId;
  name: string;
  tagline: string;
  path: string;
  dotColor: string;
  accentColor: string;
}> = [
  {
    id: "diwali",
    name: "🪔 Diwali",
    tagline: "Festival of Lights: floating earthen diyas, royal purple night sky & golden embers",
    path: "/ui/diwali",
    dotColor: "#f59e0b",
    accentColor: "from-amber-400 to-yellow-200",
  },
  {
    id: "kyoto-sand",
    name: "Kyoto Sand",
    tagline: "Wabi-sabi river sand, floating washi cards & sumi ink",
    path: "/ui/kyoto-sand",
    dotColor: "#4d5d4b",
    accentColor: "from-stone-400 to-emerald-800",
  },
  {
    id: "nordic-slate",
    name: "Nordic Slate",
    tagline: "Basalt slate, misty sage eucalyptus & quiet hygge comfort",
    path: "/ui/nordic-slate",
    dotColor: "#84a98c",
    accentColor: "from-emerald-400 to-teal-300",
  },
  {
    id: "broadsheet",
    name: "Broadsheet",
    tagline: "Heritage New York Times newsprint & vermilion rules",
    path: "/ui/broadsheet",
    dotColor: "#991b1b",
    accentColor: "from-red-600 to-amber-700",
  },
  {
    id: "swiss-grid",
    name: "Swiss Grid",
    tagline: "Brutalist international typographic grid & heavy black rules",
    path: "/ui/swiss-grid",
    dotColor: "#ffffff",
    accentColor: "from-neutral-200 to-white",
  },
  {
    id: "god-rays",
    name: "God Rays",
    tagline: "Volumetric celestial light rays over deep obsidian",
    path: "/ui/god-rays",
    dotColor: "#fbbf24",
    accentColor: "from-amber-400 to-yellow-200",
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    tagline: "Cyber-linear engineering console in midnight indigo",
    path: "/ui/tokyo-night",
    dotColor: "#38bdf8",
    accentColor: "from-sky-400 to-cyan-200",
  },
  {
    id: "amber-terminal",
    name: "Amber Terminal",
    tagline: "Bloomberg Alpha intelligence with phosphor amber glow",
    path: "/ui/amber-terminal",
    dotColor: "#f59e0b",
    accentColor: "from-amber-500 to-orange-400",
  },
];

export function ThemeSwitcherDock({ currentTheme }: { currentTheme: ThemeId }) {
  const pathname = usePathname();
  const [defaultSaved, setDefaultSaved] = useState<ThemeId | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("signalos_theme") as ThemeId | null;
      if (saved) setDefaultSaved(saved);
    } catch {
      // ignore
    }
  }, []);

  const handleSetDefault = (themeId: ThemeId) => {
    try {
      localStorage.setItem("signalos_theme", themeId);
      document.cookie = `signalos_theme=${themeId}; path=/; max-age=31536000`;
      setDefaultSaved(themeId);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[96vw]">
      {showToast ? (
        <div className="mb-2 text-center">
          <span className="inline-block rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-md">
            ✓ Set as your default Daily UI!
          </span>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-neutral-950/85 px-3 py-2 shadow-2xl backdrop-blur-xl">
        <div className="hidden sm:flex items-center gap-2 pl-2 pr-1 border-r border-white/10 text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
          <span className="text-amber-400 font-bold">7 UI Styles</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {THEMES.map((theme) => {
            const isActive = currentTheme === theme.id || pathname.includes(theme.path);
            const isSavedDefault = defaultSaved === theme.id;

            return (
              <Link
                key={theme.id}
                href={theme.path}
                title={`${theme.name} · ${theme.tagline}`}
                className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-white/20 text-white shadow-inner font-semibold"
                    : "text-neutral-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: theme.dotColor }}
                />
                <span>{theme.name}</span>
                {isSavedDefault ? (
                  <span className="text-[9px] text-amber-300 font-bold" title="Your default home UI">
                    ★
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => handleSetDefault(currentTheme)}
          className="ml-1 shrink-0 rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-400/25 transition-colors"
          title="Make this design your permanent default when opening the site"
        >
          {defaultSaved === currentTheme ? "★ Default" : "Set Default"}
        </button>
      </div>
    </div>
  );
}
