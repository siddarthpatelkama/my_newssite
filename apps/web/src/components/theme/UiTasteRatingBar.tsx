"use client";

import { useEffect, useState } from "react";

export type ThemeId = string;

export function UiTasteRatingBar({ currentTheme }: { currentTheme: ThemeId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sentiment, setSentiment] = useState<"like" | "dislike">("like");
  const [score, setScore] = useState<number>(85);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState<number | null>(null);

  // Load existing rating for this theme from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`signalos_rating_${currentTheme}`);
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
  }, [currentTheme]);

  const handleOpen = (type: "like" | "dislike") => {
    setSentiment(type);
    setScore(type === "like" ? 85 : 20);
    setIsOpen(true);
  };

  const getScoreLabel = () => {
    if (sentiment === "like") {
      if (score >= 95) return "🔥 Absolute Masterpiece";
      if (score >= 85) return "⭐ Love this style";
      if (score >= 70) return "👍 Really like it";
      return "✓ Good / Decent";
    } else {
      if (score <= 15) return "🚫 Never show again";
      if (score <= 30) return "👎 Don't like this style";
      return "⚠️ Needs significant changes";
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      localStorage.setItem(`signalos_rating_${currentTheme}`, score.toString());
      setSavedScore(score);

      const res = await fetch("/api/ui-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: currentTheme,
          score,
          sentiment,
        }),
      });

      const data = await res.json();
      if (data.warning) {
        setToastMessage(`Saved locally (${score}/100)! (Run Supabase SQL to persist in DB)`);
      } else {
        setToastMessage(`✓ Successfully saved ${score}/100 to Supabase!`);
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
    <div className="w-full max-w-xl mx-auto my-12 px-4 select-none">
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="mb-3 text-center">
          <span className="inline-block rounded-xl bg-neutral-900/95 border border-amber-400/30 px-4 py-2 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-xl">
            {toastMessage}
          </span>
        </div>
      ) : null}

      {!isOpen ? (
        /* Compact In-Page Rating Capsule */
        <div className="mx-auto flex max-w-md items-center justify-between rounded-2xl border border-white/20 bg-neutral-950/80 px-5 py-3 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-white/35">
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Rate Today&apos;s Design
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              {savedScore !== null ? `Your current rating: ${savedScore}/100` : "Help the AI learn your taste"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpen("like")}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all"
              title="Like this UI"
            >
              <span>👍</span>
              <span>Like</span>
            </button>

            <button
              onClick={() => handleOpen("dislike")}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-all"
              title="Dislike this UI"
            >
              <span>👎</span>
              <span>Dislike</span>
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Smooth Slider Bar */
        <div className="mx-auto max-w-lg rounded-2xl border border-white/25 bg-neutral-950/95 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">{sentiment === "like" ? "👍" : "👎"}</span>
              <span className="text-sm font-bold uppercase tracking-wider text-white">
                {sentiment === "like" ? "How much do you like it?" : "How much do you dislike it?"}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Score & Dynamic Tag */}
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-black font-mono ${
                  sentiment === "like" ? "text-amber-300" : "text-rose-400"
                }`}
              >
                {score}
              </span>
              <span className="text-xs text-neutral-400 font-mono">/ 100</span>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                sentiment === "like"
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-200"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-200"
              }`}
            >
              {getScoreLabel()}
            </span>
          </div>

          {/* Smooth Interactive Drag Slider Bar */}
          <div className="mt-4">
            <input
              type="range"
              min={sentiment === "like" ? 50 : 0}
              max={sentiment === "like" ? 100 : 50}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
            />
            <div className="flex justify-between text-[11px] font-mono text-neutral-500 mt-1.5">
              <span>{sentiment === "like" ? "50 (Decent)" : "0 (Hate it)"}</span>
              <span>{sentiment === "like" ? "100 (Masterpiece)" : "50 (Mediocre)"}</span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-950 transition-all ${
                sentiment === "like"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 shadow-lg"
                  : "bg-gradient-to-r from-rose-400 to-rose-500 hover:brightness-110 shadow-lg"
              }`}
            >
              {submitting ? "Saving..." : "Save Score ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
