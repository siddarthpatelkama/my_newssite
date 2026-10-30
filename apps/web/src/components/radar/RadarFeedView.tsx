"use client";

import { useState } from "react";
import type { RadarItem } from "@/lib/radar";

export function RadarFeedView({ initialItems }: { initialItems: RadarItem[] }) {
  const [items, setItems] = useState<RadarItem[]>(initialItems);
  const [filter, setFilter] = useState<string>("all");
  const [feedbacks, setFeedbacks] = useState<Record<string, "like" | "dislike" | "save">>({});
  const [customUrl, setCustomUrl] = useState("");
  const [addingFeed, setAddingFeed] = useState(false);
  const [feedMessage, setFeedMessage] = useState<string | null>(null);

  const handleFeedback = async (item: RadarItem, action: "like" | "dislike" | "save") => {
    setFeedbacks((prev) => ({ ...prev, [item.id]: action }));

    try {
      await fetch("/api/radar/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleUrl: item.url,
          articleTitle: item.title,
          sourceName: item.source,
          action,
          category: item.category,
        }),
      });
    } catch (err) {
      console.error("Failed to send radar feedback:", err);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    setAddingFeed(true);
    setFeedMessage("Fetching feed...");

    try {
      const res = await fetch(`/api/radar/add?url=${encodeURIComponent(customUrl.trim())}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setItems((prev) => [...data.items, ...prev]);
        setFeedMessage(`✓ Successfully imported ${data.items.length} articles from feed!`);
        setCustomUrl("");
        setTimeout(() => setFeedMessage(null), 4000);
      } else {
        setFeedMessage("No valid articles found in this feed. Make sure it's an RSS or Atom XML link.");
      }
    } catch {
      setFeedMessage("Could not fetch feed. Check the URL and try again.");
    } finally {
      setAddingFeed(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (feedbacks[item.id] === "dislike") return false; // Instantly hide disliked items
    if (filter === "all") return true;
    if (filter === "saved") return feedbacks[item.id] === "save";
    return item.category === filter;
  });

  return (
    <div className="space-y-8">
      {/* Category Tabs & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: `All Signals (${items.length})` },
            { id: "ai_research", label: "🔬 arXiv AI" },
            { id: "cybersecurity", label: "🚨 Systems & Security" },
            { id: "tech_radar", label: "📡 Tech Radar" },
            { id: "saved", label: `🔖 Saved (${Object.values(feedbacks).filter((v) => v === "save").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-serif transition-all ${
                filter === tab.id
                  ? "bg-ink text-paper font-semibold shadow-sm"
                  : "border border-rule bg-paper text-mute hover:border-ink hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Feedback Counter */}
        <div className="text-[11px] font-mono text-mute flex items-center gap-2">
          <span>Active feedback loop:</span>
          <span className="font-bold text-ink">
            {Object.keys(feedbacks).length} ratings logged
          </span>
        </div>
      </div>

      {/* Add Custom Feed Input Bar */}
      <div className="rounded-2xl border border-rule/70 bg-ink/[0.02] p-4">
        <form onSubmit={handleAddFeed} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Paste any RSS, Substack, or arXiv feed URL (e.g. https://simonwillison.net/atom/entries/)..."
            className="w-full rounded-xl border border-rule bg-paper px-4 py-2 text-xs font-sans text-ink placeholder:text-mute focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={addingFeed || !customUrl.trim()}
            className="w-full sm:w-auto shrink-0 rounded-xl bg-ink px-5 py-2 font-serif text-xs font-semibold text-paper hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {addingFeed ? "Importing..." : "+ Add Stream"}
          </button>
        </form>
        {feedMessage ? (
          <p className="mt-2 text-xs font-mono text-crimson">{feedMessage}</p>
        ) : null}
      </div>

      {/* Articles Stream Grid */}
      {!filteredItems.length ? (
        <div className="border border-rule p-12 text-center text-mute">
          <p className="font-serif text-lg text-ink">No articles match this filter</p>
          <p className="mt-1 text-xs text-mute">Switch to &quot;All Signals&quot; or add a custom RSS link above.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredItems.map((item) => {
            const currentFeedback = feedbacks[item.id];
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-rule/80 bg-paper/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-ink/50 hover:shadow-md"
              >
                <div>
                  {/* Badge & Source */}
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-mute">
                    <span className="rounded-md border border-rule/60 bg-ink/[0.03] px-2 py-0.5">
                      {item.badge}
                    </span>
                    <span>{new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 font-serif text-xl font-bold leading-snug text-ink">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-crimson hover:underline"
                    >
                      {item.title}
                    </a>
                  </h3>

                  {/* Summary */}
                  <p className="mt-3 text-sm leading-relaxed text-ink/80 font-sans">
                    {item.summary}
                  </p>
                </div>

                {/* Card Feedback Loop Controls */}
                <div className="mt-6 border-t border-rule/50 pt-4 flex items-center justify-between">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-serif font-medium text-crimson hover:underline"
                  >
                    Read original source →
                  </a>

                  {/* Action Buttons: Signal (Like) / Noise (Dislike) / Save */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleFeedback(item, "like")}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-serif transition-all ${
                        currentFeedback === "like"
                          ? "border-emerald-600 bg-emerald-500/15 text-emerald-800 font-semibold"
                          : "border-rule bg-paper text-mute hover:border-ink hover:text-ink"
                      }`}
                      title="Boost: Show more signals like this"
                    >
                      <span>👍</span>
                      <span>{currentFeedback === "like" ? "Boosted ✓" : "Signal"}</span>
                    </button>

                    <button
                      onClick={() => handleFeedback(item, "dislike")}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-serif transition-all ${
                        currentFeedback === "dislike"
                          ? "border-rose-600 bg-rose-500/15 text-rose-800 font-semibold"
                          : "border-rule bg-paper text-mute hover:border-ink hover:text-ink"
                      }`}
                      title="Filter: Demote or hide topics like this"
                    >
                      <span>👎</span>
                      <span>Noise</span>
                    </button>

                    <button
                      onClick={() => handleFeedback(item, "save")}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-serif transition-all ${
                        currentFeedback === "save"
                          ? "border-amber-600 bg-amber-500/15 text-amber-800 font-semibold"
                          : "border-rule bg-paper text-mute hover:border-ink hover:text-ink"
                      }`}
                      title="Save this article"
                    >
                      <span>🔖</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

