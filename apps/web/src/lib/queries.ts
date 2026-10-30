import type { ThemeSpec } from "@signalos/shared";
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

export type StoryMilestone = {
  date: string;
  label: string;
  description: string;
  relatedStoryId?: string | null;
  relatedStoryTitle?: string | null;
};

export type StoryDetailRecord = StoryRecord & {
  storyUpdates: Array<{
    id: string;
    note: string;
    createdAt: string;
    relatedStoryId?: string | null;
  }>;
  relatedHistoricalStories: Array<{
    id: string;
    canonicalTitle: string;
    summary: string | null;
    category: string | null;
    firstSeenAt: string;
  }>;
  timeline: StoryMilestone[];
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
  related_story_ids?: string[] | null;
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

export async function getStory(id: string): Promise<StoryDetailRecord | null> {
  if (demoMode) {
    const story = demoStories.find((s) => s.id === id);
    if (!story) return null;
    const otherStories = demoStories.filter((s) => s.id !== id);
    return {
      ...story,
      storyUpdates: [
        {
          id: "upd-1",
          note: "Initial emergence: Core architecture paradigm shift first highlighted across lab reports.",
          createdAt: story.firstSeenAt,
          relatedStoryId: otherStories[0]?.id ?? null,
        },
        {
          id: "upd-2",
          note: "Follow-up verification: Open benchmarks confirmed execution speedups and autonomous reasoning breakthroughs.",
          createdAt: story.lastUpdatedAt,
          relatedStoryId: otherStories[1]?.id ?? null,
        },
      ],
      relatedHistoricalStories: otherStories.map((o) => ({
        id: o.id,
        canonicalTitle: o.canonicalTitle,
        summary: o.summary,
        category: o.category,
        firstSeenAt: o.firstSeenAt,
      })),
      timeline: [
        {
          date: story.firstSeenAt.slice(0, 10),
          label: "Historical Emergence",
          description: "Initial discovery & discussion surfaced across incoming newsletters.",
          relatedStoryId: otherStories[0]?.id ?? null,
          relatedStoryTitle: otherStories[0]?.canonicalTitle ?? null,
        },
        {
          date: story.lastUpdatedAt.slice(0, 10),
          label: "Latest Continuity Milestone",
          description: story.summary || "Latest developments synthesized into primary briefing card.",
        },
      ],
    };
  }

  const supabase = createAdminSupabase();
  if (!supabase) return null;

  // 1. Fetch the primary story record
  let storyRow: StoryRow | null = null;
  const directRes = await supabase
    .from("stories")
    .select(
      "id, canonical_title, summary, why_it_matters, category, key_points, entities, novelty_score, quality_score, first_seen_at, last_updated_at, related_story_ids, story_sources(article_id, articles(id, title, canonical_url, source_name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (directRes.error) {
    // If table lacks related_story_ids column yet, fallback to basic select
    const fallbackRes = await supabase
      .from("stories")
      .select(
        "id, canonical_title, summary, why_it_matters, category, key_points, entities, novelty_score, quality_score, first_seen_at, last_updated_at, story_sources(article_id, articles(id, title, canonical_url, source_name))",
      )
      .eq("id", id)
      .maybeSingle();
    storyRow = fallbackRes.data as unknown as StoryRow | null;
  } else {
    storyRow = directRes.data as unknown as StoryRow | null;
  }

  if (!storyRow) {
    const all = await getStories();
    const fallback = all.find((s) => s.id === id);
    if (!fallback) return null;
    return {
      ...fallback,
      storyUpdates: [],
      relatedHistoricalStories: [],
      timeline: [
        {
          date: fallback.firstSeenAt.slice(0, 10),
          label: "First Coverage",
          description: fallback.canonicalTitle,
        },
      ],
    };
  }

  const baseStory: StoryRecord = {
    id: storyRow.id,
    canonicalTitle: storyRow.canonical_title,
    summary: storyRow.summary,
    whyItMatters: storyRow.why_it_matters,
    category: storyRow.category,
    keyPoints: storyRow.key_points ?? [],
    entities: storyRow.entities ?? [],
    noveltyScore: storyRow.novelty_score,
    qualityScore: storyRow.quality_score,
    firstSeenAt: storyRow.first_seen_at,
    lastUpdatedAt: storyRow.last_updated_at,
    sources:
      storyRow.story_sources?.flatMap((row) => {
        if (!row.articles) return [];
        return Array.isArray(row.articles) ? row.articles.map(mapArticle) : [mapArticle(row.articles)];
      }) ?? [],
  };

  // 2. Fetch story updates
  const { data: rawUpdates } = await supabase
    .from("story_updates")
    .select("id, note, created_at")
    .eq("story_id", id)
    .order("created_at", { ascending: true });

  const storyUpdates = (rawUpdates ?? []).map((u) => ({
    id: u.id,
    note: u.note,
    createdAt: u.created_at,
    relatedStoryId: null as string | null,
  }));

  // 3. Collect historical related stories
  const relatedIds = new Set<string>();
  if (Array.isArray(storyRow.related_story_ids)) {
    for (const rid of storyRow.related_story_ids) {
      if (typeof rid === "string" && rid !== id) relatedIds.add(rid);
    }
  }

  // Also query other stories that share common key entities
  if (relatedIds.size < 3 && storyRow.entities && storyRow.entities.length > 0) {
    const { data: entityMatches } = await supabase
      .from("stories")
      .select("id")
      .neq("id", id)
      .overlaps("entities", storyRow.entities.slice(0, 3))
      .order("first_seen_at", { ascending: false })
      .limit(3);

    for (const em of entityMatches ?? []) {
      relatedIds.add(em.id);
    }
  }

  let relatedHistoricalStories: StoryDetailRecord["relatedHistoricalStories"] = [];
  if (relatedIds.size > 0) {
    const { data: relatedRows } = await supabase
      .from("stories")
      .select("id, canonical_title, summary, category, first_seen_at")
      .in("id", Array.from(relatedIds).slice(0, 5));

    if (relatedRows) {
      relatedHistoricalStories = relatedRows.map((r) => ({
        id: r.id,
        canonicalTitle: r.canonical_title,
        summary: r.summary,
        category: r.category,
        firstSeenAt: r.first_seen_at,
      }));
    }
  }

  // 4. Construct rich chronological timeline across time
  const timeline: StoryMilestone[] = [
    {
      date: storyRow.first_seen_at.slice(0, 10),
      label: "Initial Emergence",
      description: `First reported in newsletter briefing: "${storyRow.canonical_title}"`,
    },
  ];

  for (const upd of storyUpdates) {
    timeline.push({
      date: upd.createdAt.slice(0, 10),
      label: "Developing Story Update",
      description: upd.note,
    });
  }

  // If there are related historical stories from last week or last month, anchor them into the timeline
  for (const hist of relatedHistoricalStories) {
    timeline.push({
      date: hist.firstSeenAt.slice(0, 10),
      label: "Related Historical Coverage",
      description: hist.canonicalTitle,
      relatedStoryId: hist.id,
      relatedStoryTitle: hist.canonicalTitle,
    });
  }

  // Sort timeline chronologically
  timeline.sort((a, b) => (a.date > b.date ? 1 : -1));

  return {
    ...baseStory,
    storyUpdates,
    relatedHistoricalStories,
    timeline,
  };
}

export async function getBriefing(stories: StoryRecord[]) {
  if (demoMode) return { ...demoBriefing, themeSpec: null as ThemeSpec | null };
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
    themeSpec: null as ThemeSpec | null,
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

  const configRow = data.dashboard_configs as { config?: (typeof demoBriefing & { themeSpec?: ThemeSpec }) } | { config?: (typeof demoBriefing & { themeSpec?: ThemeSpec }) }[] | null;
  const config = Array.isArray(configRow) ? configRow[0]?.config : configRow?.config;

  return {
    editionDate: data.edition_date as string,
    title: data.title as string,
    introduction: data.introduction as string | null,
    layout: (config as { layout?: string } | undefined)?.layout ?? "balanced",
    sections:
      (config as typeof demoBriefing | undefined)?.sections ??
      (data.sections as typeof demoBriefing.sections),
    themeSpec: config?.themeSpec ?? null,
  };
}

export async function getActiveThemeSpec(): Promise<ThemeSpec | null> {
  const briefing = await getBriefing([]);
  return briefing.themeSpec ?? null;
}
