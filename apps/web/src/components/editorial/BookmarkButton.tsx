"use client";

import { useEffect, useState } from "react";
import { isItemSaved, saveItem, type SavedItem } from "@/lib/saved";

export interface BookmarkButtonProps {
  item: Omit<SavedItem, "savedAt">;
  className?: string;
  showLabel?: boolean;
}

export function BookmarkButton({ item, className = "", showLabel = false }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isItemSaved(item.id));

    const handleSync = () => {
      setSaved(isItemSaved(item.id));
    };

    window.addEventListener("signalos_saved_change", handleSync);
    return () => window.removeEventListener("signalos_saved_change", handleSync);
  }, [item.id]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowSaved = saveItem(item);
    setSaved(isNowSaved);
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-serif transition ${
        saved
          ? "border border-amber-600/50 bg-amber-500/10 text-amber-800 font-semibold"
          : "border border-rule/70 bg-paper/60 text-mute hover:border-ink hover:text-ink"
      } ${className}`}
      title={saved ? "Remove from saved stories" : "Save story for later"}
      aria-label={saved ? "Remove from saved stories" : "Save story for later"}
    >
      <span>{saved ? "🔖" : "📑"}</span>
      {showLabel ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}

