import { EditionHeader } from "@/components/editorial/EditionHeader";
import { LeadStory } from "@/components/editorial/LeadStory";
import { StoryCard } from "@/components/editorial/StoryCard";
import { getBriefing, getStories } from "@/lib/queries";

export default async function HomePage() {
  const stories = await getStories();
  const briefing = await getBriefing(stories);
  const byId = new Map(stories.map((story) => [story.id, story]));
  const leadId = briefing.sections[0]?.storyIds[0];
  const lead = (leadId && byId.get(leadId)) || stories[0];
  const remaining = stories.filter((story) => story.id !== lead?.id);

  return (
    <main>
      <EditionHeader
        date={briefing.editionDate}
        title={briefing.title}
        introduction={briefing.introduction}
      />
      {lead ? <LeadStory story={lead} /> : null}

      <div className="mt-10 grid gap-10 md:grid-cols-3">
        {remaining.slice(0, 3).map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      <section className="mt-14">
        {briefing.sections.slice(1).map((section) => {
          const sectionStories = section.storyIds
            .map((id) => byId.get(id))
            .filter((story): story is NonNullable<typeof story> => Boolean(story));
          if (!sectionStories.length) return null;
          return (
            <div key={section.title} className="mb-12">
              <div className="mb-5 flex items-end justify-between border-b-2 border-ink pb-2">
                <h2 className="font-serif text-3xl">{section.title}</h2>
                <span className="text-[11px] uppercase tracking-[0.2em] text-mute">{section.type.replaceAll("_", " ")}</span>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {sectionStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
