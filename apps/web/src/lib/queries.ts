import { demoBriefing, demoMode, demoStories } from "./demo";
import { createAdminSupabase } from "./supabase/admin";

export type StoryRecord = {
  id: string;
  canonicalTitle: string;
  summary: string | null;
  whyItMatters: string | null;
  category: string | null;
  keyPoints: string[];
  entities: string[];
  noveltyScore: number | null;
  qualityScore: number | null;
  firstSeenAt: string;
  lastUpdatedAt: string;
  sources: Array<{
    id: string;
    title: string;
    canonicalUrl: string | null;
    sourceName: string | null;
    newsletterName: string | null;
  }>;
};

type StoryRow = {
  id: string;
  canonical_title: string;
  summary: string | null;
  why_it_matters: string | null;
  category: string | null;
  key_points: string[] | null;
  entities: string[] | null;
  novelty_score: number | null;
  quality_score: number | null;
  first_seen_at: string;
  last_updated_at: string;
  story_sources: Array<{
    article_id: string;
    articles: {
      id: string;
      title: string;
      canonical_url: string | null;
      source_name: string | null;
    } | Array<{
      id: string;
      title: string;
      canonical_url: string | null;
      source_name: string | null;
    }> | null;
  }> | null;
};

function mapArticle(article: {
  id: string;
  title: string;
  canonical_url: string | null;
  source_name: string | null;
}) {
  return {
    id: article.id,
    title: article.title,
    canonicalUrl: article.canonical_url,
    sourceName: article.source_name,
    newsletterName: article.source_name,
  };
}

export async function getStories(): Promise<StoryRecord[]> {
  if (demoMode) return demoStories;
  const supabase = createAdminSupabase();
  if (!supabase) return [];

  const [storiesRes, dislikesRes] = await Promise.all([
    supabase
      .from("stories")
      .select(
        "id, canonical_title, summary, why_it_matters, category, key_points, entities, novelty_score, quality_score, first_seen_at, last_updated_at, story_sources(article_id, articles(id, title, canonical_url, source_name))",
      )
      .order("last_updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("reader_events")
      .select("story_id")
      .eq("event_type", "dislike")
      .not("story_id", "is", null)
      .limit(100),
  ]);

  if (storiesRes.error) {
    console.error("Unable to load stories from Supabase:", storiesRes.error.message);
    return [];
  }

  if (!storiesRes.data?.length) return [];

  const dislikedSet = new Set(
    (dislikesRes.data ?? []).map((d: { story_id: string | null }) => d.story_id).filter(Boolean),
  );

  const mapped = (storiesRes.data as unknown as StoryRow[]).map((story) => ({
    id: story.id,
    canonicalTitle: story.canonical_title,
    summary: story.summary,
    whyItMatters: story.why_it_matters,
    category: story.category,
    keyPoints: story.key_points ?? [],
    entities: story.entities ?? [],
    noveltyScore: story.novelty_score,
    qualityScore: story.quality_score,
    firstSeenAt: story.first_seen_at,
    lastUpdatedAt: story.last_updated_at,
    sources:
      story.story_sources?.flatMap((row) => {
        if (!row.articles) return [];
        return Array.isArray(row.articles) ? row.articles.map(mapArticle) : [mapArticle(row.articles)];
      }) ?? [],
  }));

  // Disliked ("Not for me") stories are automatically demoted down to the bottom of the list
  if (dislikedSet.size > 0) {
    mapped.sort((a, b) => {
      const aDisliked = dislikedSet.has(a.id) ? 1 : 0;
      const bDisliked = dislikedSet.has(b.id) ? 1 : 0;
      return aDisliked - bDisliked;
    });
  }

  return mapped;
}

export async function getStory(id: string) {
  const stories = await getStories();
  return stories.find((story) => story.id === id) ?? null;
}

export async function getBriefing(stories: StoryRecord[]) {
  if (demoMode) return demoBriefing;
  const supabase = createAdminSupabase();
  const emptyBriefing = () => ({
    editionDate: new Date().toISOString().slice(0, 10),
    title: stories.length ? "Your daily edition" : "Your first edition is on its way",
    introduction: stories.length
      ? "A live edition assembled from your newsletter stories."
      : "No newsletter stories are available yet. Connect Gmail, label newsletters, and run the sync and processing jobs to populate this edition.",
    layout: "balanced" as const,
    sections: stories.length
      ? [{ type: "top_stories" as const, title: "From your newsletters", storyIds: stories.slice(0, 6).map((story) => story.id) }]
      : [],
  });

  if (!supabase) return emptyBriefing();

  const { data, error } = await supabase
    .from("daily_briefings")
    .select("edition_date, title, introduction, sections, dashboard_configs(config)")
    .eq("status", "published")
    .order("edition_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Unable to load the published briefing from Supabase:", error.message);
    return emptyBriefing();
  }

  if (!data) return emptyBriefing();

  const configRow = data.dashboard_configs as { config?: typeof demoBriefing } | { config?: typeof demoBriefing }[] | null;
  const config = Array.isArray(configRow) ? configRow[0]?.config : configRow?.config;

  return {
    editionDate: data.edition_date as string,
    title: data.title as string,
    introduction: data.introduction as string | null,
    layout: (config as { layout?: string } | undefined)?.layout ?? "balanced",
    sections:
      (config as typeof demoBriefing | undefined)?.sections ??
      (data.sections as typeof demoBriefing.sections),
  };
}
