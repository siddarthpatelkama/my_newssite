import Link from "next/link";
import { notFound } from "next/navigation";
import { DefaultShell } from "@/components/layout/DefaultShell";
import { SourceList } from "@/components/editorial/SourceList";
import { StoryTimeline } from "@/components/editorial/StoryTimeline";
import { StoryFeedback } from "@/components/telemetry/StoryFeedback";
import { getStories, getStory } from "@/lib/queries";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  const stories = await getStories();
  const currentIndex = stories.findIndex((s) => s.id === id);
  const nextStory = currentIndex >= 0 && currentIndex < stories.length - 1 ? stories[currentIndex + 1] : null;
  const prevStory = currentIndex > 0 ? stories[currentIndex - 1] : null;

  return (
    <DefaultShell>
      <article className="mx-auto max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-crimson">{story.category?.replace("-", " ")}</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{story.canonicalTitle}</h1>
        <p className="mt-6 font-serif text-2xl leading-9 text-ink/80">{story.summary}</p>
        <div className="mt-10 border-y border-rule py-6">
          <h2 className="text-[11px] uppercase tracking-[0.24em] font-medium text-crimson">
            Why you should read this
          </h2>
          <p className="mt-3 text-lg leading-8 font-serif text-ink">{story.whyItMatters}</p>
        </div>
        <ul className="mt-8 space-y-3">
          {story.keyPoints.map((point) => (
            <li key={point} className="border-l-2 border-crimson pl-4 leading-7">
              {point}
            </li>
          ))}
        </ul>

        {/* Historical Evolution & Precedent Timeline across weeks and months */}
        <StoryTimeline
          timeline={story.timeline}
          relatedHistoricalStories={story.relatedHistoricalStories}
        />

        <div className="mt-10">
          <SourceList sources={story.sources} />
        </div>
        <StoryFeedback
          storyId={story.id}
          nextStoryId={nextStory?.id ?? null}
          nextStoryTitle={nextStory?.canonicalTitle ?? null}
        />
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6 text-xs uppercase tracking-[0.2em] text-mute">
          {prevStory ? (
            <Link href={`/stories/${prevStory.id}`} className="hover:text-crimson">
              ← Previous: {prevStory.canonicalTitle.slice(0, 24)}…
            </Link>
          ) : (
            <Link href="/" className="hover:text-crimson">
              ← Back to edition
            </Link>
          )}
          {nextStory ? (
            <Link href={`/stories/${nextStory.id}`} className="hover:text-crimson">
              Next: {nextStory.canonicalTitle.slice(0, 24)}… →
            </Link>
          ) : null}
        </div>
      </article>
    </DefaultShell>
  );
}
