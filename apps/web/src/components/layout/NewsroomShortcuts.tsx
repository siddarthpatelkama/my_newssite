"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function NewsroomShortcuts() {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-story-card]"));

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setShowHelp(false);
        setSelectedIndex(-1);
        cards.forEach((c) => c.classList.remove("ring-2", "ring-crimson", "ring-offset-2", "ring-offset-paper"));
        return;
      }

      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>("input[name='q']");
        if (searchInput) {
          searchInput.focus();
        } else {
          router.push("/search");
        }
        return;
      }

      if (cards.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev < cards.length - 1 ? prev + 1 : 0;
          highlightCard(cards, next);
          return next;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : cards.length - 1;
          highlightCard(cards, next);
          return next;
        });
      } else if (e.key === "Enter" || e.key === "o") {
        if (selectedIndex >= 0 && selectedIndex < cards.length) {
          e.preventDefault();
          const card = cards[selectedIndex];
          if (card) {
            const storyId = card.getAttribute("data-story-card");
            if (storyId) {
              window.open(`/stories/${storyId}`, "_blank", "noopener,noreferrer");
            }
          }
        }
      } else if (e.key === "e") {
        if (selectedIndex >= 0 && selectedIndex < cards.length) {
          e.preventDefault();
          const card = cards[selectedIndex];
          if (card) {
            const emailId = card.getAttribute("data-email-id") || card.getAttribute("data-story-card");
            if (emailId) {
              window.open(`/emails/${emailId}`, "_blank", "noopener,noreferrer");
            }
          }
        }
      } else if (e.key === "s") {
        if (selectedIndex >= 0 && selectedIndex < cards.length) {
          e.preventDefault();
          const card = cards[selectedIndex];
          if (card) {
            const bookmarkBtn = card.querySelector<HTMLButtonElement>("button[aria-label*='Save'], button[title*='Save']");
            if (bookmarkBtn) {
              bookmarkBtn.click();
            }
          }
        }
      }
    };

    const highlightCard = (cards: HTMLElement[], index: number) => {
      cards.forEach((c, idx) => {
        if (idx === index) {
          c.classList.add("ring-2", "ring-crimson", "ring-offset-4", "ring-offset-paper", "rounded-xl");
          c.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          c.classList.remove("ring-2", "ring-crimson", "ring-offset-4", "ring-offset-paper", "rounded-xl");
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const cards = document.querySelectorAll<HTMLElement>("[data-story-card]");
      cards.forEach((c) => c.classList.remove("ring-2", "ring-crimson", "ring-offset-4", "ring-offset-paper", "rounded-xl"));
    };
  }, [selectedIndex, router]);

  return (
    <>
      {/* Subtle Floating Shortcut Indicator */}
      <div className="fixed bottom-4 right-4 z-40 hidden sm:block">
        <button
          onClick={() => setShowHelp(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-rule/80 bg-paper/90 px-3 py-1 font-mono text-[11px] text-mute shadow-sm backdrop-blur transition hover:border-ink hover:text-ink"
          title="Press ? for newsroom keyboard shortcuts"
        >
          <span>⌨️</span>
          <span>Shortcuts</span>
          <kbd className="rounded border border-rule/60 bg-ink/5 px-1 font-sans text-[10px]">?</kbd>
        </button>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rule bg-paper p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rule/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⌨️</span>
                <h3 className="font-serif text-lg font-bold text-ink">Newsroom Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1 text-mute hover:text-ink transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-rule/30">
                <span className="text-ink font-sans">Next story card</span>
                <div className="flex gap-1">
                  <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold">j</kbd>
                  <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold">↓</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-rule/30">
                <span className="text-ink font-sans">Previous story card</span>
                <div className="flex gap-1">
                  <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold">k</kbd>
                  <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold">↑</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-rule/30">
                <span className="text-ink font-sans">Open selected story</span>
                <div className="flex gap-1">
                  <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold">Enter</kbd>
                  <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold">o</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-rule/30">
                <span className="text-ink font-sans">Read original raw email</span>
                <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold text-crimson">e</kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-rule/30">
                <span className="text-ink font-sans">Bookmark / Save story</span>
                <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold text-amber-700">s</kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-rule/30">
                <span className="text-ink font-sans">Focus search archive</span>
                <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold">/</kbd>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-ink font-sans">Close help modal</span>
                <kbd className="rounded border border-rule bg-paper px-2 py-0.5 font-bold">Esc</kbd>
              </div>
            </div>

            <p className="text-[11px] font-sans text-mute pt-1 text-center">
              Designed for high-speed editorial reading. Works anywhere on the paper.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
