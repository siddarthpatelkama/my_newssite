"use client";

import { useEffect, useState } from "react";
import type { ThemeSpec } from "@signalos/shared";

// Default Kyoto Sand aesthetic baseline
const DEFAULT_THEME_SPEC: ThemeSpec = {
  themeName: "Kyoto Sand",
  headlineBadge: "Kyoto Minimalist Edition",
  reasoning: "Warm organic washi paper with sumi ink and balanced Japanese editorial spacing.",
  colors: {
    paper: "#ede8df",
    ink: "#242220",
    rule: "#d8d1c5",
    crimson: "#8c4b2d",
    mute: "#756f66",
  },
  typography: {
    headline: "Georgia, serif",
    body: "system-ui, sans-serif",
  },
  atmosphere: "sand_grain",
  keywords: [
    "kyoto-sand",
    "wabi-sabi",
    "warm-washi-paper",
    "sumi-ink",
    "terracotta-accent",
    "editorial-serif",
    "zen-minimalist",
    "balanced-whitespace",
  ],
  layoutStyle: "Japanese Wabi-Sabi Editorial Broadsheet",
};

export function UiTasteRatingBar({ themeSpec }: { themeSpec?: ThemeSpec | null }) {
  const active = themeSpec || DEFAULT_THEME_SPEC;
  const currentThemeId = active.themeName.toLowerCase().replace(/\s+/g, "-");

  const [isOpen, setIsOpen] = useState(false);
  const [sentiment, setSentiment] = useState<"like" | "dislike">("like");
  const [score, setScore] = useState<number>(85);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState<number | null>(null);

  // Load existing rating for this theme from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`signalos_rating_${currentThemeId}`);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) setSavedScore(parsed);
      } else {
        setSavedScore(null);
      }
    } catch {
      // ignore
    }
    setIsOpen(false);
  }, [currentThemeId]);

  const handleOpen = (type: "like" | "dislike") => {
    setSentiment(type);
    setScore(type === "like" ? 85 : 20);
    setIsOpen(true);
  };

  const getScoreLabel = () => {
    if (sentiment === "like") {
      if (score >= 95) return "🔥 Absolute Masterpiece · Keep this DNA";
      if (score >= 85) return "⭐ Love this style · Reinforce this palette";
      if (score >= 70) return "👍 Like it · Subtle refinement needed";
      return "✓ Decent · Acceptable baseline";
    } else {
      if (score <= 15) return "🚫 Dislike · Never generate this style again";
      if (score <= 30) return "👎 Avoid this color & layout combination";
      return "⚠️ Needs major typography / contrast rework";
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      localStorage.setItem(`signalos_rating_${currentThemeId}`, score.toString());
      setSavedScore(score);

      const res = await fetch("/api/ui-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: currentThemeId,
          themeName: active.themeName,
          score,
          sentiment,
          fontFamily: `${active.typography?.headline || "Georgia, serif"} / ${active.typography?.body || "system-ui"}`,
          colors: active.colors,
          atmosphere: active.atmosphere,
          keywords: active.keywords || [],
          layoutStyle: active.layoutStyle || "Editorial Broadsheet",
          notes: `User rated ${score}/100 (${sentiment}). Keywords: ${(active.keywords || []).join(", ")}. Palette: paper=${active.colors.paper}, ink=${active.colors.ink}, accent=${active.colors.crimson}.`,
        }),
      });

      const data = await res.json();
      if (data.warning) {
        setToastMessage(`Saved locally (${score}/100)! (Persisting in memory)`);
      } else {
        setToastMessage(`✓ Saved ${score}/100 to AI Memory for ${active.themeName}!`);
      }
    } catch (e) {
      console.error("Failed to submit rating:", e);
      setToastMessage(`Saved locally (${score}/100)!`);
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setToastMessage(null), 4000);
      }, 1200);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto my-14 px-4 select-none">
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="mb-4 text-center animate-in fade-in zoom-in-95">
          <span className="inline-block rounded-xl border border-rule bg-paper px-5 py-2.5 text-xs font-serif font-medium text-ink shadow-md">
            {toastMessage}
          </span>
        </div>
      ) : null}

      {!isOpen ? (
        /* Curated In-Page Taste Card: Fully matched with the active UI */
        <div className="rounded-2xl border border-rule/80 bg-paper/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-ink/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Design DNA info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold text-ink">
                  Aesthetic Rating: {active.themeName}
                </span>
                {savedScore !== null ? (
                  <span className="rounded-full border border-rule bg-paper px-2 py-0.5 text-[11px] font-mono font-medium text-crimson">
                    Your rating: {savedScore}/100
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-mute font-sans">
                Fonts: <span className="text-ink font-serif font-medium">{active.typography?.headline || "Georgia, Serif"}</span> · Atmosphere: <span className="text-ink font-mono">{active.atmosphere}</span>
              </p>

              {/* Design keywords pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(active.keywords || []).slice(0, 5).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-md border border-rule/60 bg-ink/[0.03] px-2 py-0.5 text-[10px] font-mono text-mute"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Like / Dislike Buttons: Native to the active UI palette */}
            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <button
                onClick={() => handleOpen("like")}
                className="flex items-center gap-2 rounded-xl border-2 border-rule bg-paper px-4 py-2 text-xs font-serif font-medium text-ink transition-all hover:border-ink hover:bg-ink/[0.04] active:scale-95 shadow-sm"
                title="Like this UI style"
              >
                <span>👍</span>
                <span>Like</span>
              </button>

              <button
                onClick={() => handleOpen("dislike")}
                className="flex items-center gap-2 rounded-xl border-2 border-rule bg-paper px-4 py-2 text-xs font-serif font-medium text-ink transition-all hover:border-ink hover:bg-ink/[0.04] active:scale-95 shadow-sm"
                title="Dislike this UI style"
              >
                <span>👎</span>
                <span>Dislike</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Smooth Slider: Curated with the Theme */
        <div className="rounded-2xl border-2 border-rule bg-paper p-6 sm:p-7 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header Row */}
          <div className="flex items-start justify-between border-b border-rule/60 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{sentiment === "like" ? "👍" : "👎"}</span>
                <h3 className="font-serif text-lg font-bold text-ink">
                  {sentiment === "like"
                    ? `How much do you like ${active.themeName}?`
                    : `How much do you dislike ${active.themeName}?`}
                </h3>
              </div>
              <p className="mt-1 text-xs text-mute">
                The AI will analyze these exact color tokens, fonts, and keywords to evolve tomorrow&apos;s UI.
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-mute hover:bg-ink/5 hover:text-ink transition-colors text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Color Tokens Swatches */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-rule/50 bg-ink/[0.02] p-3 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-mute">Palette DNA:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full border border-rule" style={{ backgroundColor: active.colors.paper }} />
              <span className="font-mono text-[10px] text-mute">paper ({active.colors.paper})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full border border-rule" style={{ backgroundColor: active.colors.ink }} />
              <span className="font-mono text-[10px] text-mute">ink ({active.colors.ink})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full border border-rule" style={{ backgroundColor: active.colors.crimson }} />
              <span className="font-mono text-[10px] text-mute">accent ({active.colors.crimson})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full border border-rule" style={{ backgroundColor: active.colors.rule }} />
              <span className="font-mono text-[10px] text-mute">border ({active.colors.rule})</span>
            </div>
          </div>

          {/* Score & Vibe Tag */}
          <div className="mt-5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl font-black text-ink">{score}</span>
              <span className="font-mono text-sm text-mute">/ 100</span>
            </div>
            <span className="rounded-full border border-rule bg-paper px-3.5 py-1 text-xs font-serif font-medium text-crimson shadow-sm">
              {getScoreLabel()}
            </span>
          </div>

          {/* Smooth Interactive Drag Slider */}
          <div className="mt-4">
            <input
              type="range"
              min={sentiment === "like" ? 50 : 0}
              max={sentiment === "like" ? 100 : 50}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-rule focus:outline-none"
              style={{
                accentColor: active.colors.crimson,
              }}
            />
            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-mute">
              <span>{sentiment === "like" ? "50 (Decent)" : "0 (Never again)"}</span>
              <span>{sentiment === "like" ? "100 (Masterpiece)" : "50 (Mediocre)"}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-rule/60 pt-4">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-rule px-4 py-2 text-xs font-serif text-mute hover:border-ink hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="rounded-xl bg-ink px-6 py-2 text-xs font-serif font-semibold text-paper shadow transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Saving to AI..." : "Save Rating ✓"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
