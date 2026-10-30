import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";

export function LeadStory({ story }: { story: StoryRecord }) {
  return (
    <article className="grid gap-8 border-b border-ink pb-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-crimson">
          Top story · {story.category?.replace("-", " ")}
        </p>
        <h2 className="mt-3 font-serif text-4xl leading-[1.15] sm:text-6xl">
          <Link href={`/stories/${story.id}`}>{story.canonicalTitle}</Link>
        </h2>
        <p className="mt-6 max-w-2xl font-serif text-xl leading-8 text-ink/80">{story.summary}</p>
      </div>
      <div className="border-l-0 border-rule lg:border-l lg:pl-8">
        <p className="text-[11px] uppercase tracking-[0.24em] font-medium text-crimson">
          Why you should read this
        </p>
        <p className="mt-3 text-[16px] leading-7">{story.whyItMatters}</p>
        <ul className="mt-6 space-y-2 text-sm leading-6">
          {story.keyPoints.slice(0, 3).map((point) => (
            <li key={point} className="border-t border-rule pt-2">
              {point}
            </li>
          ))}
        </ul>
        <Link href={`/stories/${story.id}`} className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-crimson">
          Continue with sources →
        </Link>
      </div>
    </article>
  );
}
