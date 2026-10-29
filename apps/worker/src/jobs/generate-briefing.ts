import { DashboardConfigSchema, type DashboardConfig } from "@signalos/shared";
import { writeBriefing } from "../ai/gemini";
import { env } from "../env";
import { supabase } from "../supabase";

function fallbackConfig(edition: string, stories: Array<{ id: string; canonical_title: string }>): DashboardConfig {
  return {
    edition,
    layout: "balanced" as const,
    sections: [
      {
        type: "top_stories" as const,
        title: "The important developments",
        storyIds: stories.slice(0, 4).map((story) => story.id),
      },
      {
        type: "technical_deep_dive" as const,
        title: "Understand the technology",
        storyIds: stories.slice(4, 6).map((story) => story.id),
      },
      {
        type: "radar" as const,
        title: "Stories that keep developing",
        storyIds: stories.slice(6, 8).map((story) => story.id),
      },
    ].filter((section) => section.storyIds.length > 0),
  };
}

export async function generateDailyBriefing(date = new Date()) {
  const edition = date.toISOString().slice(0, 10);
  const since = new Date(date);
  since.setUTCDate(since.getUTCDate() - 2);

  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, canonical_title, summary, category")
    .gte("last_updated_at", since.toISOString())
    .order("novelty_score", { ascending: false })
    .limit(12);

  if (error) throw error;
  if (!stories?.length) {
    return { skipped: true, reason: "no stories" };
  }

  let config = fallbackConfig(edition, stories);
  let title = `SignalOS · ${edition}`;
  let introduction = "A curated view of developments across your newsletters.";

  if (env.GEMINI_API_KEY) {
    try {
      const generated = await writeBriefing(
        stories.map((story) => ({
          id: story.id,
          title: story.canonical_title,
          summary: story.summary ?? "",
          category: story.category,
        })),
      );
      const parsed = DashboardConfigSchema.safeParse({
        edition,
        layout: generated.layout,
        sections: generated.sections,
      });
      if (parsed.success) config = parsed.data;
      title = generated.title || title;
      introduction = generated.introduction || introduction;
    } catch {
      // Keep the fallback layout when the model output is invalid.
    }
  }

  const { data: briefing, error: briefingError } = await supabase
    .from("daily_briefings")
    .upsert(
      {
        edition_date: edition,
        title,
        introduction,
        sections: config.sections,
        status: "published",
        published_at: new Date().toISOString(),
      },
      { onConflict: "edition_date" },
    )
    .select("id")
    .single();

  if (briefingError) throw briefingError;

  await supabase.from("dashboard_configs").upsert({
    briefing_id: briefing.id,
    config,
  });

  return { skipped: false, briefingId: briefing.id, edition };
}
