"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedItems, removeSavedItem, type SavedItem } from "@/lib/saved";

export function SavedStoriesView() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<"all" | "story" | "radar">("all");
  const [mounted, setMounted] = useState(false);

  const loadItems = () => {
    setItems(getSavedItems());
  };

  useEffect(() => {
    setMounted(true);
    loadItems();

    const handleSync = () => loadItems();
    window.addEventListener("signalos_saved_change", handleSync);
    return () => window.removeEventListener("signalos_saved_change", handleSync);
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeSavedItem(id);
    loadItems();
  };

  if (!mounted) {
    return (
      <div className="py-16 text-center text-mute font-serif">
        <p>Loading your saved intelligence archive...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Masthead Header */}
      <div className="border-b-2 border-ink pb-6">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.25em] text-mute">
          <span>Personal Reading List</span>
          <span>{items.length} saved item{items.length === 1 ? "" : "s"}</span>
        </div>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Saved Stories
        </h1>
        <p className="mt-2 font-serif text-base text-mute max-w-xl">
          Your private reading queue of bookmarked newsletter dispatches, research preprints, and deep dives.
        </p>

        {/* Filter Tabs */}
        {items.length > 0 && (
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1 font-serif text-xs transition ${
                filter === "all"
                  ? "bg-ink text-paper font-semibold"
                  : "border border-rule bg-paper text-mute hover:text-ink"
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter("story")}
              className={`rounded-lg px-3 py-1 font-serif text-xs transition ${
                filter === "story"
                  ? "bg-ink text-paper font-semibold"
                  : "border border-rule bg-paper text-mute hover:text-ink"
              }`}
            >
              Newsletters ({items.filter((i) => i.type === "story").length})
            </button>
            <button
              onClick={() => setFilter("radar")}
              className={`rounded-lg px-3 py-1 font-serif text-xs transition ${
                filter === "radar"
                  ? "bg-ink text-paper font-semibold"
                  : "border border-rule bg-paper text-mute hover:text-ink"
              }`}
            >
              Radar & Preprints ({items.filter((i) => i.type === "radar").length})
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-rule/80 bg-paper/60 p-12 text-center max-w-xl mx-auto space-y-4">
          <span className="text-4xl">🔖</span>
          <h2 className="font-serif text-2xl font-bold text-ink">No saved stories yet</h2>
          <p className="text-sm font-serif text-mute leading-relaxed">
            Whenever you see an interesting story on the front edition or a preprint on Stream 1 Radar, click the 🔖 bookmark button to save it for quiet weekend reading.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/"
              className="inline-block rounded-xl bg-ink px-5 py-2 font-serif text-xs font-semibold text-paper hover:opacity-90 transition"
            >
              Explore Today&apos;s Edition →
            </Link>
            <Link
              href="/1"
              className="inline-block rounded-xl border border-rule bg-paper px-5 py-2 font-serif text-xs font-semibold text-ink hover:border-crimson hover:text-crimson transition"
            >
              Browse Radar Stream →
            </Link>
          </div>
        </div>
      ) : (
        /* Saved Items Grid */
        <div className="grid gap-6 md:grid-cols-2">
          {filteredItems.map((item) => {
            const isStory = item.type === "story";
            const storyUrl = isStory ? `/stories/${item.id}` : item.canonicalUrl || "#";
            const emailTargetId = item.emailId || item.id;

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-rule/80 bg-paper/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-ink/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-mute">
                    <span className="text-crimson font-semibold">
                      {item.category?.replace("-", " ") || (isStory ? "Newsletter Story" : "Radar Preprint")}
                    </span>
                    <span>
                      {new Date(item.savedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-serif text-xl font-bold leading-snug text-ink">
                    <Link href={storyUrl} target="_blank" className="hover:text-crimson">
                      {item.title}
                    </Link>
                  </h3>

                  {item.summary && (
                    <p className="mt-3 font-serif text-sm leading-relaxed text-ink/80 line-clamp-3">
                      {item.summary}
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-rule/40 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {isStory ? (
                      <>
                        <Link
                          href={`/stories/${item.id}`}
                          target="_blank"
                          className="font-serif font-medium text-ink hover:text-crimson transition"
                        >
                          Read story →
                        </Link>
                        <span className="text-rule">|</span>
                        <Link
                          href={`/emails/${emailTargetId}`}
                          target="_blank"
                          className="font-serif text-crimson hover:underline"
                        >
                          ✉️ Original email
                        </Link>
                      </>
                    ) : (
                      <a
                        href={item.canonicalUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif font-semibold text-crimson hover:underline"
                      >
                        📄 Read paper ↗
                      </a>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleRemove(item.id, e)}
                    className="text-mute hover:text-rose-700 transition font-mono text-[11px]"
                    title="Remove from saved stories"
                  >
                    ✕ Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

