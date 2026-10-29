import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceList } from "@/components/editorial/SourceList";
import { getStory } from "@/lib/queries";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.24em] text-crimson">{story.category?.replace("-", " ")}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{story.canonicalTitle}</h1>
      <p className="mt-6 font-serif text-2xl leading-9 text-ink/80">{story.summary}</p>
      <div className="mt-10 border-y border-rule py-6">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-mute">Why it matters</h2>
        <p className="mt-3 text-lg leading-8">{story.whyItMatters}</p>
      </div>
      <ul className="mt-8 space-y-3">
        {story.keyPoints.map((point) => (
          <li key={point} className="border-l-2 border-crimson pl-4 leading-7">
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <SourceList sources={story.sources} />
      </div>
      <Link href="/" className="mt-10 inline-block text-xs uppercase tracking-[0.2em] text-mute">
        ← Back to the edition
      </Link>
    </article>
  );
}
