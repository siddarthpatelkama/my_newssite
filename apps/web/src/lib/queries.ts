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
  if (!supabase) return demoStories;

  const { data: stories, error } = await supabase
    .from("stories")
    .select(
      "id, canonical_title, summary, why_it_matters, category, key_points, entities, novelty_score, quality_score, first_seen_at, last_updated_at, story_sources(article_id, articles(id, title, canonical_url, source_name))",
    )
    .order("last_updated_at", { ascending: false })
    .limit(40);

  if (error || !stories?.length) return demoStories;

  return (stories as unknown as StoryRow[]).map((story) => ({
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
}

export async function getStory(id: string) {
  const stories = await getStories();
  return stories.find((story) => story.id === id) ?? null;
}

export async function getBriefing(stories: StoryRecord[]) {
  if (demoMode) return demoBriefing;
  const supabase = createAdminSupabase();
  if (!supabase) return demoBriefing;

  const { data } = await supabase
    .from("daily_briefings")
    .select("edition_date, title, introduction, sections, dashboard_configs(config)")
    .eq("status", "published")
    .order("edition_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return {
      ...demoBriefing,
      sections: [
        {
          type: "top_stories" as const,
          title: "The important developments",
          storyIds: stories.slice(0, 6).map((story) => story.id),
        },
      ],
    };
  }

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
