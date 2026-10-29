import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";

export function StoryCard({ story, kicker }: { story: StoryRecord; kicker?: string }) {
  return (
    <article className="flex h-full flex-col border-t border-rule pt-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-crimson">
        {kicker ?? story.category?.replace("-", " ")}
      </p>
      <h3 className="mt-2 font-serif text-2xl leading-snug">
        <Link href={`/stories/${story.id}`} className="hover:text-crimson">
          {story.canonicalTitle}
        </Link>
      </h3>
      <p className="mt-3 text-[15px] leading-7 text-ink/80">{story.summary}</p>
      <p className="mt-auto pt-4 text-xs text-mute">
        {story.sources[0]?.sourceName ?? "Newsletter"} · {story.sources.length} source
        {story.sources.length === 1 ? "" : "s"}
      </p>
    </article>
  );
}
