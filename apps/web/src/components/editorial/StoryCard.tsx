import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";
import { BookmarkButton } from "./BookmarkButton";

export function StoryCard({ story, kicker }: { story: StoryRecord; kicker?: string }) {
  const primarySource = story.sources[0];
  const emailTargetId = primarySource?.emailId || primarySource?.id || story.id;
  const canonicalUrl = primarySource?.canonicalUrl;

  return (
    <article
      data-story-card={story.id}
      data-email-id={emailTargetId}
      className="story-card flex h-full flex-col border-t border-rule pt-4 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.22em] text-crimson">
          {kicker ?? story.category?.replace("-", " ")}
        </p>
        <BookmarkButton
          item={{
            id: story.id,
            title: story.canonicalTitle,
            summary: story.summary,
            category: story.category,
            sourceName: primarySource?.sourceName ?? null,
            canonicalUrl,
            emailId: primarySource?.emailId ?? null,
            type: "story",
          }}
        />
      </div>

      <h3 className="mt-2 font-serif text-2xl leading-snug">
        <Link href={`/stories/${story.id}`} target="_blank" className="hover:text-crimson">
          {story.canonicalTitle}
        </Link>
      </h3>
      <p className="mt-3 text-[15px] leading-7 text-ink/80">{story.summary}</p>
      <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-rule/40 text-xs">
        <span className="text-mute">
          {primarySource?.sourceName ?? "Newsletter"} · {story.sources.length} source
          {story.sources.length === 1 ? "" : "s"}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Button to Read Original Email */}
          <Link
            href={`/emails/${emailTargetId}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded border border-rule/80 bg-paper/80 px-2.5 py-1 font-serif text-xs font-medium text-crimson transition hover:border-crimson hover:bg-paper"
            title="Read the original newsletter email"
          >
            <span>✉️</span>
            <span>Read original email →</span>
          </Link>

          {canonicalUrl && (
            <a
              href={canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mute hover:text-ink transition px-1"
              title="Open external web source link"
            >
              <span>↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
