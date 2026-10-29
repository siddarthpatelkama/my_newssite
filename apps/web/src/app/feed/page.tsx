import { StoryCard } from "@/components/editorial/StoryCard";
import { getStories } from "@/lib/queries";

export default async function FeedPage() {
  const stories = await getStories();
  return (
    <main>
      <h1 className="font-serif text-4xl">The running feed</h1>
      <p className="mt-2 max-w-2xl text-mute">
        Canonical stories after clustering. New newsletters update these records instead of creating duplicate cards.
      </p>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </main>
  );
}
