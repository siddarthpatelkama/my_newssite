import { extractEmailArticles, synthesizeStory, clusterTitle, hasGeminiKey } from "../ai/gemini";
import { extractArticlesFromHtml, hashContent, normalizeUrl } from "../gmail/parser";
import { supabase } from "../supabase";
import { env } from "../env";
import { withJobSpan } from "../telemetry";

async function withRetries<T>(fn: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= env.MAX_AI_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

export async function processPendingEmails(limit = env.MAX_EMAILS_PER_SYNC || 50) {
  // Re-queue failed emails for retry.
  // Emails marked 'ignored' (waste of time) stay excluded from the site.
  await supabase
    .from("emails")
    .update({ processing_status: "pending", next_retry_at: null, processing_attempts: 0 })
    .in("processing_status", ["failed"]);

  const { data: claimed, error } = await supabase.rpc("claim_pending_emails", { p_limit: limit });
  if (error) throw error;
  const ids: string[] = (claimed ?? []).map((email: { id: string }) => email.id);
  if (ids.length === 0) return { processed: 0 };

  const { data: emails, error: fetchError } = await supabase
    .from("emails")
    .select("id, subject, body_text, body_html, newsletter_id, processing_attempts, newsletters(sender_name, sender_email)")
    .in("id", ids);
  if (fetchError) throw fetchError;

  let processed = 0;
  for (const email of emails ?? []) {
    await processOneEmail(email);
    processed += 1;
  }
  return { processed };
}

async function processOneEmail(email: {
  id: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  newsletter_id: string | null;
  processing_attempts: number;
  newsletters: { sender_name: string | null; sender_email: string } | { sender_name: string | null; sender_email: string }[] | null;
}) {
  try {
    const sender = Array.isArray(email.newsletters) ? email.newsletters[0] : email.newsletters;
    const heuristic = extractArticlesFromHtml(email.body_html ?? "", email.body_text ?? "");
    let articles = heuristic;

    if (hasGeminiKey()) {
      const emailContent = (email.body_text || email.body_html || "").slice(0, 12000);
      const extracted = await withRetries(() =>
        withJobSpan("gemini.extract_newsletter", { "gen_ai.operation.name": "extract_newsletter" }, () =>
          extractEmailArticles({
            subject: email.subject ?? "",
            sender: sender?.sender_email ?? "unknown",
            text: emailContent,
          }),
        ),
      );

      // If Gemini identifies this email as a waste of time, do not show it on the site!
      if (!extracted.keep) {
        console.log(`[Curator] Filtered out waste of time: "${email.subject}". Reason: ${extracted.reason}`);
        const { error } = await supabase
          .from("emails")
          .update({
            processing_status: "ignored",
            processing_started_at: null,
            error_message: `Waste of time: ${extracted.reason.slice(0, 500)}`,
          })
          .eq("id", email.id);
        if (error) throw error;
        return;
      }

      if (extracted.articles.length > 0) {
        articles = extracted.articles.map((article) => ({
          title: article.title,
          canonicalUrl: article.canonicalUrl ? normalizeUrl(article.canonicalUrl) : undefined,
          contentText: article.contentText,
          contentHash: hashContent(`${article.canonicalUrl ? normalizeUrl(article.canonicalUrl) ?? "" : ""}\n${article.contentText}`),
        }));
      }
    }

    if (articles.length === 0 && (email.body_text?.trim() || email.subject?.trim())) {
      articles = [{
        title: email.subject || "Newsletter Intelligence",
        contentText: (email.body_text || email.subject || "").slice(0, 5000),
        contentHash: hashContent((email.body_text || email.subject || "").slice(0, 500)),
      }];
    }

    const { data: existingStories } = await supabase
      .from("stories")
      .select("id, canonical_title")
      .order("last_updated_at", { ascending: false })
      .limit(80);

    for (const article of articles) {
      const articlePayload = {
        email_id: email.id,
        title: article.title,
        canonical_url: article.canonicalUrl ?? null,
        source_name: sender?.sender_name ?? sender?.sender_email ?? null,
        content_text: article.contentText,
        content_hash: article.contentHash,
      };

      const existingArticle = await supabase
        .from("articles")
        .select("id, title, canonical_url, content_text")
        .eq("content_hash", article.contentHash)
        .eq("email_id", email.id)
        .maybeSingle();
      if (existingArticle.error) throw existingArticle.error;

      let articleRow = existingArticle.data;
      if (!articleRow) {
        const { data: inserted, error: articleError } = await supabase
          .from("articles")
          .insert(articlePayload)
          .select("id, title, canonical_url, content_text")
          .maybeSingle();
        if (articleError) throw articleError;
        articleRow = inserted;
      }
      if (!articleRow) continue;

      const synthesized = hasGeminiKey()
        ? await withRetries(() =>
            withJobSpan("gemini.synthesize_story", { "gen_ai.operation.name": "synthesize_story" }, () =>
              synthesizeStory({
                title: articleRow.title,
                content: articleRow.content_text ?? article.title,
                url: articleRow.canonical_url ?? undefined,
              }),
            ),
          )
        : {
            title: article.title,
            summary: (article.contentText || article.title).slice(0, 400),
            whyItMatters: "Needs Gemini processing.",
            category: "other" as const,
            keyPoints: [],
            entities: [],
            novelty: 0.5,
            sourceClaims: [],
          };

      const matchTitle = hasGeminiKey()
        ? await withJobSpan("gemini.cluster_title", { "gen_ai.operation.name": "cluster_title" }, () =>
            clusterTitle(synthesized.title, (existingStories ?? []).map((story) => story.canonical_title)),
          ).catch((e) => {
            console.warn(`[clusterTitle] Error clustering title, creating as new story:`, e);
            return null;
          })
        : null;

      const matched = existingStories?.find((story) => story.canonical_title === matchTitle);
      let storyId = matched?.id;

      if (!storyId) {
        const { data: created, error: storyError } = await supabase
          .from("stories")
          .insert({
            canonical_title: synthesized.title,
            summary: synthesized.summary,
            why_it_matters: synthesized.whyItMatters,
            category: synthesized.category,
            key_points: synthesized.keyPoints,
            entities: synthesized.entities,
            source_claims: synthesized.sourceClaims,
            novelty_score: synthesized.novelty,
            quality_score: 0.6,
          })
          .select("id")
          .single();
        if (storyError) throw storyError;
        storyId = created.id;
        existingStories?.push({ id: storyId, canonical_title: synthesized.title });
      } else {
        const { error: storyUpdateError } = await supabase
          .from("stories")
          .update({
            summary: synthesized.summary,
            why_it_matters: synthesized.whyItMatters,
            last_updated_at: new Date().toISOString(),
          })
          .eq("id", storyId);
        if (storyUpdateError) throw storyUpdateError;
        const { error: storyHistoryError } = await supabase.from("story_updates").insert({
          story_id: storyId,
          note: `Updated from ${sender?.sender_name ?? "newsletter"}`,
        });
        if (storyHistoryError) throw storyHistoryError;
      }

      const { error: sourceError } = await supabase.from("story_sources").upsert({
        story_id: storyId,
        article_id: articleRow.id,
      });
      if (sourceError) throw sourceError;
    }

    const { error: processedError } = await supabase.from("emails").update({
      processing_status: "processed",
      processing_started_at: null,
      next_retry_at: null,
    }).eq("id", email.id);
    if (processedError) throw processedError;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);
    const retryMinutes = Math.min(60, 2 ** Math.max(0, email.processing_attempts - 1));
    const { error: failureError } = await supabase
      .from("emails")
      .update({
        processing_status: "failed",
        processing_started_at: null,
        next_retry_at: new Date(Date.now() + retryMinutes * 60_000).toISOString(),
        error_message: message.slice(0, 1000),
      })
      .eq("id", email.id);
    if (failureError) throw failureError;
  }
}
