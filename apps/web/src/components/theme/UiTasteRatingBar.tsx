"use client";

import { useEffect, useState } from "react";
import type { ThemeId } from "./ThemeSwitcherDock";

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
        setToastMessage(`Saved locally (${score}/100)! Note: Run Supabase SQL table code.`);
      } else {
        setToastMessage(`Saved ${score}/100 to Supabase! ✓`);
      }
    } catch (e) {
      console.error("Failed to submit rating:", e);
      setToastMessage(`Saved locally (${score}/100)!`);
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setToastMessage(null), 3500);
      }, 1200);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 select-none">
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="mb-2 text-right">
          <span className="inline-block rounded-xl bg-neutral-900/95 border border-amber-400/30 px-3.5 py-1.5 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-xl">
            {toastMessage}
          </span>
        </div>
      ) : null}

      {!isOpen ? (
        /* Compact Pill Button */
        <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-neutral-950/85 px-3 py-1.5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/35">
          <span className="text-[11px] font-mono text-neutral-400 pl-1">
            {savedScore !== null ? `Rated: ${savedScore}/100` : "Rate style:"}
          </span>

          <button
            onClick={() => handleOpen("like")}
            className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all"
            title="Like this UI"
          >
            <span>👍</span>
            <span className="hidden sm:inline">Like</span>
          </button>

          <button
            onClick={() => handleOpen("dislike")}
            className="flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-all"
            title="Dislike this UI"
          >
            <span>👎</span>
            <span className="hidden sm:inline">Dislike</span>
          </button>
        </div>
      ) : (
        /* Expanded Smooth Slider Bar */
        <div className="w-[320px] sm:w-[380px] rounded-2xl border border-white/25 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-base">{sentiment === "like" ? "👍" : "👎"}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {sentiment === "like" ? "How much do you like it?" : "How much do you dislike it?"}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          {/* Score & Dynamic Tag */}
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-black font-mono ${
                  sentiment === "like" ? "text-amber-300" : "text-rose-400"
                }`}
              >
                {score}
              </span>
              <span className="text-xs text-neutral-400 font-mono">/ 100</span>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                sentiment === "like"
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-200"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-200"
              }`}
            >
              {getScoreLabel()}
            </span>
          </div>

          {/* Smooth Interactive Drag Slider Bar */}
          <div className="mt-3">
            <input
              type="range"
              min={sentiment === "like" ? 50 : 0}
              max={sentiment === "like" ? 100 : 50}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
              <span>{sentiment === "like" ? "50 (Decent)" : "0 (Hate it)"}</span>
              <span>{sentiment === "like" ? "100 (Masterpiece)" : "50 (Mediocre)"}</span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-950 transition-all ${
                sentiment === "like"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110"
                  : "bg-gradient-to-r from-rose-400 to-rose-500 hover:brightness-110"
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
