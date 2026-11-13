import type { ThemeSpec } from "@signalos/shared";
import { demoBriefing, demoMode, demoStories } from "./demo";
import { createAdminSupabase } from "./supabase/admin";
import { fetchOrGenerateMatterTimeline } from "./matter-history";

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
    emailId?: string | null;
    title: string;
    canonicalUrl: string | null;
    sourceName: string | null;
    newsletterName: string | null;
    gmailMessageId?: string | null;
  }>;
};

export type EmailRecord = {
  id: string;
  gmailMessageId: string | null;
  gmailThreadId: string | null;
  subject: string | null;
  receivedAt: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  senderName: string | null;
  senderEmail: string | null;
  canonicalUrl?: string | null;
  articleTitle?: string | null;
  storyId?: string | null;
  storyTitle?: string | null;
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
  timeline?: StoryMilestone[] | null;
  story_sources: Array<{
    article_id: string;
    articles: {
      id: string;
      email_id?: string | null;
      title: string;
      canonical_url: string | null;
      source_name: string | null;
    } | Array<{
      id: string;
      email_id?: string | null;
      title: string;
      canonical_url: string | null;
      source_name: string | null;
    }> | null;
  }> | null;
};

function mapArticle(article: {
  id: string;
  email_id?: string | null;
  title: string;
  canonical_url: string | null;
  source_name: string | null;
}) {
  return {
    id: article.id,
    emailId: article.email_id ?? null,
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
        "id, canonical_title, summary, why_it_matters, category, key_points, entities, novelty_score, quality_score, first_seen_at, last_updated_at, story_sources(article_id, articles(id, email_id, title, canonical_url, source_name))",
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
      "id, canonical_title, summary, why_it_matters, category, key_points, entities, novelty_score, quality_score, first_seen_at, last_updated_at, related_story_ids, timeline, story_sources(article_id, articles(id, email_id, title, canonical_url, source_name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (directRes.error) {
    // If table lacks related_story_ids or timeline column yet, fallback to basic select
    const fallbackRes = await supabase
      .from("stories")
      .select(
        "id, canonical_title, summary, why_it_matters, category, key_points, entities, novelty_score, quality_score, first_seen_at, last_updated_at, story_sources(article_id, articles(id, email_id, title, canonical_url, source_name))",
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

  // 3. Collect genuine historical related stories (only if explicitly linked by sequel ID)
  const relatedIds = new Set<string>();
  if (Array.isArray(storyRow.related_story_ids)) {
    for (const rid of storyRow.related_story_ids) {
      if (typeof rid === "string" && rid !== id) relatedIds.add(rid);
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

  // 4. Construct authoritative chronological subject matter history & precedents
  const timeline = await fetchOrGenerateMatterTimeline({
    id: storyRow.id,
    canonicalTitle: storyRow.canonical_title,
    summary: storyRow.summary,
    whyItMatters: storyRow.why_it_matters,
    category: storyRow.category,
    firstSeenAt: storyRow.first_seen_at,
    existingTimeline: storyRow.timeline,
  });

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
    .order("edition_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const activeTheme = await getActiveThemeSpec();

  if (error || !data) {
    return {
      ...emptyBriefing(),
      themeSpec: activeTheme,
    };
  }

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
    themeSpec: config?.themeSpec ?? activeTheme,
  };
}

export async function getActiveThemeSpec(): Promise<ThemeSpec | null> {
  const supabase = createAdminSupabase();
  if (!supabase) return null;

  try {
    // 1. Check latest briefing dashboard_configs
    const { data: briefingRow } = await supabase
      .from("daily_briefings")
      .select("dashboard_configs(config)")
      .order("edition_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const configRow = briefingRow?.dashboard_configs as { config?: { themeSpec?: ThemeSpec } } | { config?: { themeSpec?: ThemeSpec } }[] | null;
    const config = Array.isArray(configRow) ? configRow[0]?.config : configRow?.config;
    if (config?.themeSpec) {
      return config.themeSpec;
    }

    // 2. Direct dashboard_configs table check
    const { data: directConfig } = await supabase
      .from("dashboard_configs")
      .select("config")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const directCfg = directConfig?.config as { themeSpec?: ThemeSpec } | null;
    if (directCfg?.themeSpec) {
      return directCfg.themeSpec;
    }

    // 3. Fallback to latest taste feedback record containing full theme definition
    const { data: latestTaste } = await supabase
      .from("ui_taste_feedback")
      .select("theme_id, notes, sentiment, score")
      .order("created_at", { ascending: false })
      .limit(5);

    if (latestTaste) {
      for (const t of latestTaste) {
        if (t.notes && t.notes.startsWith("{")) {
          try {
            const parsed = JSON.parse(t.notes);
            if (parsed.colors && parsed.themeName) {
              return {
                themeName: parsed.themeName,
                headlineBadge: parsed.headlineBadge || `${parsed.themeName} · Active Edition`,
                reasoning: parsed.reasoning || "Applied from your generative design taste profile.",
                colors: parsed.colors,
                typography: parsed.typography || { headline: "Georgia, serif", body: "system-ui, sans-serif" },
                atmosphere: parsed.atmosphere || "sand_grain",
                keywords: parsed.keywords || [],
                layoutStyle: parsed.layoutStyle || "Editorial Broadsheet",
              };
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.warn("Unable to load active theme spec:", err);
  }

  return null;
}

export async function getEmail(id: string): Promise<EmailRecord | null> {
  const supabase = createAdminSupabase();

  if (supabase) {
    try {
      // 1. Direct query on emails table by email UUID
      const { data: directEmail } = await supabase
        .from("emails")
        .select("id, gmail_message_id, gmail_thread_id, subject, received_at, body_text, body_html, newsletter_id, newsletters(sender_name, sender_email)")
        .eq("id", id)
        .maybeSingle();

      if (directEmail) {
        const nl = directEmail.newsletters as { sender_name?: string | null; sender_email?: string | null } | null;
        const { data: art } = await supabase
          .from("articles")
          .select("id, title, canonical_url, story_sources(story_id, stories(id, canonical_title))")
          .eq("email_id", directEmail.id)
          .limit(1)
          .maybeSingle();

        const storySource = Array.isArray(art?.story_sources) ? art?.story_sources[0] : art?.story_sources;
        const story = storySource?.stories as { id?: string; canonical_title?: string } | null;

        return {
          id: directEmail.id,
          gmailMessageId: directEmail.gmail_message_id,
          gmailThreadId: directEmail.gmail_thread_id,
          subject: directEmail.subject,
          receivedAt: directEmail.received_at,
          bodyText: directEmail.body_text,
          bodyHtml: directEmail.body_html,
          senderName: nl?.sender_name ?? "Newsletter Sender",
          senderEmail: nl?.sender_email ?? null,
          canonicalUrl: art?.canonical_url ?? null,
          articleTitle: art?.title ?? directEmail.subject,
          storyId: story?.id ?? null,
          storyTitle: story?.canonical_title ?? null,
        };
      }

      // 2. Query by article ID (in case an article id was passed)
      const { data: articleRow } = await supabase
        .from("articles")
        .select("id, email_id, title, canonical_url, content_text, story_sources(story_id, stories(id, canonical_title)), emails(id, gmail_message_id, gmail_thread_id, subject, received_at, body_text, body_html, newsletters(sender_name, sender_email))")
        .eq("id", id)
        .maybeSingle();

      if (articleRow) {
        const rawEmail = Array.isArray(articleRow.emails) ? articleRow.emails[0] : articleRow.emails;
        const emailRow = rawEmail as unknown as {
          id: string;
          gmail_message_id: string | null;
          gmail_thread_id: string | null;
          subject: string | null;
          received_at: string | null;
          body_text: string | null;
          body_html: string | null;
          newsletters?: { sender_name?: string | null; sender_email?: string | null } | Array<{ sender_name?: string | null; sender_email?: string | null }> | null;
        } | null;

        const storySource = Array.isArray(articleRow.story_sources) ? articleRow.story_sources[0] : articleRow.story_sources;
        const story = (Array.isArray(storySource?.stories) ? storySource?.stories[0] : storySource?.stories) as { id?: string; canonical_title?: string } | null;
        const rawNl = Array.isArray(emailRow?.newsletters) ? emailRow?.newsletters[0] : emailRow?.newsletters;

        if (emailRow) {
          return {
            id: emailRow.id,
            gmailMessageId: emailRow.gmail_message_id,
            gmailThreadId: emailRow.gmail_thread_id,
            subject: emailRow.subject || articleRow.title,
            receivedAt: emailRow.received_at,
            bodyText: emailRow.body_text || articleRow.content_text,
            bodyHtml: emailRow.body_html,
            senderName: rawNl?.sender_name ?? "Curated Newsletter",
            senderEmail: rawNl?.sender_email ?? null,
            canonicalUrl: articleRow.canonical_url,
            articleTitle: articleRow.title,
            storyId: story?.id ?? null,
            storyTitle: story?.canonical_title ?? null,
          };
        } else {
          return {
            id: articleRow.id,
            gmailMessageId: null,
            gmailThreadId: null,
            subject: articleRow.title,
            receivedAt: new Date().toISOString(),
            bodyText: articleRow.content_text,
            bodyHtml: null,
            senderName: "Newsletter Publication",
            senderEmail: null,
            canonicalUrl: articleRow.canonical_url,
            articleTitle: articleRow.title,
            storyId: story?.id ?? null,
            storyTitle: story?.canonical_title ?? null,
          };
        }
      }

      // 3. Query by story ID (in case story id was passed)
      const { data: storyRow } = await supabase
        .from("stories")
        .select("id, canonical_title, story_sources(articles(id, email_id, title, canonical_url, content_text, emails(id, gmail_message_id, gmail_thread_id, subject, received_at, body_text, body_html, newsletters(sender_name, sender_email))))")
        .eq("id", id)
        .maybeSingle();

      if (storyRow) {
        const rawArt = Array.isArray(storyRow.story_sources?.[0]?.articles)
          ? storyRow.story_sources?.[0]?.articles[0]
          : storyRow.story_sources?.[0]?.articles;
        const firstArt = rawArt as unknown as {
          id: string;
          email_id?: string;
          title: string;
          canonical_url: string | null;
          content_text: string | null;
          emails?: {
            id: string;
            gmail_message_id: string | null;
            gmail_thread_id: string | null;
            subject: string | null;
            received_at: string | null;
            body_text: string | null;
            body_html: string | null;
            newsletters?: { sender_name?: string | null; sender_email?: string | null } | Array<{ sender_name?: string | null; sender_email?: string | null }> | null;
          } | Array<{
            id: string;
            gmail_message_id: string | null;
            gmail_thread_id: string | null;
            subject: string | null;
            received_at: string | null;
            body_text: string | null;
            body_html: string | null;
            newsletters?: { sender_name?: string | null; sender_email?: string | null } | Array<{ sender_name?: string | null; sender_email?: string | null }> | null;
          }> | null;
        } | null;

        if (firstArt) {
          const rawEmail = Array.isArray(firstArt.emails) ? firstArt.emails[0] : firstArt.emails;
          const emailRow = rawEmail as unknown as {
            id: string;
            gmail_message_id: string | null;
            gmail_thread_id: string | null;
            subject: string | null;
            received_at: string | null;
            body_text: string | null;
            body_html: string | null;
            newsletters?: { sender_name?: string | null; sender_email?: string | null } | Array<{ sender_name?: string | null; sender_email?: string | null }> | null;
          } | null;
          const rawNl = Array.isArray(emailRow?.newsletters) ? emailRow?.newsletters[0] : emailRow?.newsletters;

          return {
            id: emailRow?.id ?? firstArt.id,
            gmailMessageId: emailRow?.gmail_message_id ?? null,
            gmailThreadId: emailRow?.gmail_thread_id ?? null,
            subject: emailRow?.subject || firstArt.title,
            receivedAt: emailRow?.received_at ?? new Date().toISOString(),
            bodyText: emailRow?.body_text || firstArt.content_text,
            bodyHtml: emailRow?.body_html ?? null,
            senderName: rawNl?.sender_name ?? "Curated Newsletter",
            senderEmail: rawNl?.sender_email ?? null,
            canonicalUrl: firstArt.canonical_url,
            articleTitle: firstArt.title,
            storyId: storyRow.id,
            storyTitle: storyRow.canonical_title,
          };
        }
      }

      // 4. Query by gmail_message_id
      const { data: byGmailId } = await supabase
        .from("emails")
        .select("id, gmail_message_id, gmail_thread_id, subject, received_at, body_text, body_html, newsletter_id, newsletters(sender_name, sender_email)")
        .eq("gmail_message_id", id)
        .maybeSingle();

      if (byGmailId) {
        const nl = byGmailId.newsletters as { sender_name?: string | null; sender_email?: string | null } | null;
        return {
          id: byGmailId.id,
          gmailMessageId: byGmailId.gmail_message_id,
          gmailThreadId: byGmailId.gmail_thread_id,
          subject: byGmailId.subject,
          receivedAt: byGmailId.received_at,
          bodyText: byGmailId.body_text,
          bodyHtml: byGmailId.body_html,
          senderName: nl?.sender_name ?? "Newsletter Sender",
          senderEmail: nl?.sender_email ?? null,
        };
      }
    } catch (err) {
      console.warn("Unable to fetch email record from Supabase:", err);
    }
  }

  // Fallback demo fixture
  const demoMatch = demoStories.find(
    (s) => s.id === id || s.sources.some((src) => src.id === id || src.emailId === id),
  );
  const matchedSource = demoMatch?.sources[0];

  return {
    id,
    gmailMessageId: null,
    gmailThreadId: null,
    subject: matchedSource?.title || demoMatch?.canonicalTitle || "The AI Revolution in Software Engineering & Agent Architectures",
    receivedAt: demoMatch?.firstSeenAt || new Date().toISOString(),
    senderName: matchedSource?.sourceName || "Import AI / The Batch",
    senderEmail: "editor@newsletters.signalos.local",
    canonicalUrl: matchedSource?.canonicalUrl || "https://example.com/newsletter/issue-412",
    articleTitle: matchedSource?.title || "Autonomous Coding Agents and Frontier Models",
    storyId: demoMatch?.id ?? null,
    storyTitle: demoMatch?.canonicalTitle ?? null,
    bodyText: `Subject: ${matchedSource?.title || "Autonomous Coding Agents and Frontier Models"}\n\nWelcome to this edition of your curated personal intelligence paper.\n\nSummary:\n${demoMatch?.summary || "Coding agent frameworks are transitioning into full operating systems, acquiring memory, tools, and long-running control loops."}\n\nWhy It Matters:\n${demoMatch?.whyItMatters || "If you build software, the question is no longer whether agents can write code, but which parts of your workflow become durable agent loops."}\n\nKey Takeaways:\n${(demoMatch?.keyPoints || [
      "Frontier models with open weights allow self-hosted inference.",
      "Multi-agent swarms with verification loops outperform monolithic prompts.",
      "Real-world continuity attached to every card prevents hallucinations.",
    ]).map((p) => `• ${p}`).join("\n")}\n\nDelivered directly to your dedicated newsletter inbox and indexed by SignalOS.`,
    bodyHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #222;">
        <div style="border-bottom: 2px solid #222; padding-bottom: 16px; margin-bottom: 24px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #8c4b2d;">Original Newsletter Email</span>
          <h1 style="font-size: 26px; font-weight: 700; margin: 8px 0 6px 0; color: #111;">${matchedSource?.title || demoMatch?.canonicalTitle || "Autonomous Coding Agents and Frontier Models"}</h1>
          <p style="margin: 0; font-size: 13px; color: #666;">From: ${matchedSource?.sourceName || "Import AI"} &bull; Dedicated Newsletter Inbox</p>
        </div>
        <p style="font-size: 16px; margin-bottom: 20px;">Welcome to this week's intelligence dispatch.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">${demoMatch?.summary || "Coding agent frameworks are no longer chat wrappers. They are acquiring memory, tools, and long-running control loops."}</p>
        <div style="background: #f7f5f0; border-left: 4px solid #8c4b2d; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #8c4b2d;">Why this matters</h3>
          <p style="margin: 0; font-size: 15px; color: #333;">${demoMatch?.whyItMatters || "Durable agent loops are replacing manual step-by-step engineering workflows."}</p>
        </div>
        <ul style="font-size: 15px; padding-left: 20px; line-height: 1.8;">
          ${(demoMatch?.keyPoints || [
            "Frontier models with open weights allow self-hosted inference.",
            "Multi-agent swarms with verification loops outperform monolithic prompts.",
            "Real-world continuity attached to every card prevents hallucinations.",
          ]).map((k) => `<li>${k}</li>`).join("")}
        </ul>
        <p style="font-size: 14px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px;">Delivered to your dedicated newsletter inbox &bull; SignalOS</p>
      </div>
    `,
  };
}
