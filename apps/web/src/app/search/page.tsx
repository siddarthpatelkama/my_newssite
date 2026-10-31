import { DefaultShell } from "@/components/layout/DefaultShell";
import { StoryCard } from "@/components/editorial/StoryCard";
import { getStories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const stories = await getStories();
  const query = q.trim().toLowerCase();
  const results = query
    ? stories.filter((story) =>
        [story.canonicalTitle, story.summary, story.whyItMatters, ...story.entities]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : stories;

  return (
    <DefaultShell>
      <main>
        <h1 className="font-serif text-4xl">Search the archive</h1>
        <form className="mt-6">
          <input
            name="q"
            defaultValue={q}
            placeholder="Agents, Gmail, provenance…"
            className="w-full border-b border-ink bg-transparent py-3 font-serif text-2xl outline-none"
          />
        </form>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {results.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
        {!results.length ? <p className="mt-10 text-mute">No newsletter stories match yet.</p> : null}
      </main>
    </DefaultShell>
  );
}
