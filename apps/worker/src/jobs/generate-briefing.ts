import { DashboardConfigSchema, LAYOUT_VARIANTS, SECTION_TYPES, type DashboardConfig } from "@signalos/shared";
import { writeBriefing, hasGeminiKey } from "../ai/gemini";
import { env } from "../env";
import { supabase } from "../supabase";
import { withJobSpan } from "../telemetry";

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

  let { data: stories, error } = await supabase
    .from("stories")
    .select("id, canonical_title, summary, category")
    .gte("last_updated_at", since.toISOString())
    .order("novelty_score", { ascending: false })
    .limit(12);

  if (error) {
    console.warn("[generateDailyBriefing] Error querying recent stories:", error.message);
  }

  if (!stories?.length) {
    const { data: fallbackStories } = await supabase
      .from("stories")
      .select("id, canonical_title, summary, category")
      .order("last_updated_at", { ascending: false })
      .limit(12);
    stories = fallbackStories ?? [];
  }

  if (!stories?.length) {
    return { skipped: true, reason: "no stories" };
  }

  let config = fallbackConfig(edition, stories);
  let title = `SignalOS · ${edition}`;
  let introduction = "A curated view of developments across your newsletters.";

  if (hasGeminiKey()) {
    try {
      // Query recent user taste feedback with full design metadata to inform adaptive UI theming
      const { data: rawTasteRatings } = await supabase
        .from("ui_taste_feedback")
        .select("theme_id, score, sentiment, notes")
        .order("created_at", { ascending: false })
        .limit(15);

      const parsedTasteRatings = (rawTasteRatings || []).map((row) => {
        let meta: Record<string, any> = {};
        try {
          if (row.notes && row.notes.startsWith("{")) {
            meta = JSON.parse(row.notes);
          }
        } catch {
          // ignore
        }
        return {
          themeId: row.theme_id,
          themeName: meta.themeName || row.theme_id,
          score: row.score,
          sentiment: row.sentiment,
          keywords: meta.keywords || [],
          fontFamily: meta.fontFamily || null,
          colors: meta.colors || null,
          atmosphere: meta.atmosphere || null,
          layoutStyle: meta.layoutStyle || null,
        };
      });

      const generated = await withJobSpan(
        "gemini.generate_daily_briefing",
        { "gen_ai.operation.name": "generate_daily_briefing" },
        () =>
          writeBriefing(
            stories.map((story) => ({
              id: story.id,
              title: story.canonical_title,
              summary: story.summary ?? "",
              category: story.category,
            })),
            {
              editionDate: edition,
              tasteRatings: parsedTasteRatings,
            },
          ),
      );

      const validLayout = (LAYOUT_VARIANTS as readonly string[]).includes(generated?.layout)
        ? (generated.layout as (typeof LAYOUT_VARIANTS)[number])
        : "balanced";

      const validSections = (generated?.sections || [])
        .map((sec: any) => ({
          type: (SECTION_TYPES as readonly string[]).includes(sec?.type) ? sec.type : "top_stories",
          title: String(sec?.title || "Top Developments"),
          storyIds: Array.isArray(sec?.storyIds)
            ? sec.storyIds.filter((id: string) => stories.some((s) => s.id === id))
            : [],
        }))
        .filter((sec: any) => sec.storyIds.length > 0);

      const parsed = DashboardConfigSchema.safeParse({
        edition,
        layout: validLayout,
        sections: validSections.length > 0 ? validSections : fallbackConfig(edition, stories).sections,
        themeSpec: generated?.themeSpec,
      });
      if (parsed.success) config = parsed.data;
      title = generated.title || title;
      introduction = generated.introduction || introduction;
    } catch (e) {
      console.warn("[generateDailyBriefing] Error generating AI briefing, using fallback:", e);
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
    .maybeSingle();

  if (briefingError) {
    console.error("[generateDailyBriefing] Error upserting daily_briefings:", briefingError);
    return { skipped: true, reason: briefingError.message };
  }

  if (briefing?.id) {
    const { error: configError } = await supabase.from("dashboard_configs").upsert(
      {
        briefing_id: briefing.id,
        config,
      },
      { onConflict: "briefing_id" },
    );
    if (configError) {
      console.warn("[generateDailyBriefing] Warning upserting dashboard_configs:", configError.message);
    }
  }

  // Storage optimization: prune heavy raw HTML from processed/ignored emails to conserve Supabase free tier
  try {
    await supabase
      .from("emails")
      .update({ body_html: null })
      .in("processing_status", ["processed", "ignored"])
      .not("body_html", "is", null);
  } catch (pruneErr) {
    console.warn("[Storage Pruner] Warning pruning legacy body_html:", pruneErr);
  }

  return { skipped: false, briefingId: briefing?.id, edition };
}
