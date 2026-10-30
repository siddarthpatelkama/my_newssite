import {
  extractEmailArticles,
  synthesizeStory,
  clusterTitle,
  hasGeminiKey,
  triageFailedEmail,
  matchHistoricalContext,
} from "../ai/gemini";
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

export function isObviousTimeWaster(subject: string, content: string): { isWaste: boolean; reason: string } {
  const combined = `${subject} ${content.slice(0, 3000)}`.toLowerCase();

  // 1. Verification codes, OTPs, security alerts, login confirmations, password resets
  if (
    /\b(security code|verification code|one-time code|one-time password|otp|confirm your email|confirm the following action|security alert|password reset|login alert|verify your account|use this code|reveal environment variable|authorization code|confirm login)\b/i.test(
      combined,
    )
  ) {
    return {
      isWaste: true,
      reason: "Automated verification / security alert / OTP notification with zero educational or tech value.",
    };
  }

  // 2. Transactional receipts, billing, invoice notices
  if (
    /\b(payment receipt|invoice paid|subscription renewed|order confirmation|payment succeeded|billing statement|payment confirmation)\b/i.test(
      combined,
    )
  ) {
    return {
      isWaste: true,
      reason: "Transactional receipt or billing notification.",
    };
  }

  return { isWaste: false, reason: "" };
}

/**
 * Triage all emails currently stuck in 'failed' status using Gemini AI.
 * Guaranteed: No email is ever left in 'failed'. It is either approved (processed)
 * or marked as ignored (with explicit reasoning and HTML wiped to protect storage limits).
 */
export async function triageFailedEmails(limit = 100) {
  const { data: failedEmails, error: fetchErr } = await supabase
    .from("emails")
    .select("id, subject, body_text, body_html, newsletter_id, processing_attempts, error_message, newsletters(sender_name, sender_email)")
    .eq("processing_status", "failed")
    .limit(limit);

  if (fetchErr) {
    console.error("[triageFailedEmails] Failed to query failed emails from Supabase:", fetchErr);
    return { triaged: 0, approved: 0, ignored: 0 };
  }

  if (!failedEmails || failedEmails.length === 0) {
    return { triaged: 0, approved: 0, ignored: 0 };
  }

  console.log(`[triageFailedEmails] Found ${failedEmails.length} failed emails. Triaging with AI now...`);

  let approvedCount = 0;
  let ignoredCount = 0;

  for (const email of failedEmails) {
    try {
      const sender = Array.isArray(email.newsletters) ? email.newsletters[0] : email.newsletters;
      const emailContent = (email.body_text || email.body_html || "").slice(0, 12000);

      // Deterministic noise filter
      const wasteCheck = isObviousTimeWaster(email.subject ?? "", emailContent);
      if (wasteCheck.isWaste) {
        await supabase
          .from("emails")
          .update({
            processing_status: "ignored",
            processing_started_at: null,
            error_message: `Waste of time: ${wasteCheck.reason}`,
            body_html: null,
            body_text: null,
          })
          .eq("id", email.id);
        ignoredCount += 1;
        continue;
      }

      if (hasGeminiKey()) {
        const triaged = await triageFailedEmail({
          subject: email.subject ?? "",
          sender: sender?.sender_email ?? "unknown",
          text: emailContent,
          errorMessage: email.error_message,
        });

        if (triaged.approved && triaged.story) {
          const articlePayload = {
            email_id: email.id,
            title: triaged.story.title,
            source_name: sender?.sender_name ?? sender?.sender_email ?? null,
            content_text: triaged.story.summary,
            content_hash: hashContent(`triage-${email.id}-${Date.now()}`),
          };
          const { data: insertedArt } = await supabase
            .from("articles")
            .insert(articlePayload)
            .select("id")
            .maybeSingle();

          const { data: createdStory } = await supabase
            .from("stories")
            .insert({
              canonical_title: triaged.story.title,
              summary: triaged.story.summary,
              why_it_matters: triaged.story.whyItMatters,
              category: triaged.story.category,
              key_points: triaged.story.keyPoints,
              entities: triaged.story.entities,
              novelty_score: triaged.story.novelty,
              quality_score: 0.6,
            })
            .select("id")
            .single();

          if (createdStory && insertedArt) {
            await supabase.from("story_sources").upsert({
              story_id: createdStory.id,
              article_id: insertedArt.id,
            });
          }

          await supabase
            .from("emails")
            .update({
              processing_status: "processed",
              processing_started_at: null,
              next_retry_at: null,
              error_message: null,
              body_html: null,
            })
            .eq("id", email.id);
          approvedCount += 1;
        } else {
          await supabase
            .from("emails")
            .update({
              processing_status: "ignored",
              processing_started_at: null,
              next_retry_at: null,
              error_message: `AI Triaged as Noise: ${triaged.reason.slice(0, 500)}`,
              body_html: null,
              body_text: null,
            })
            .eq("id", email.id);
          ignoredCount += 1;
        }
      } else {
        await supabase
          .from("emails")
          .update({
            processing_status: "ignored",
            processing_started_at: null,
            next_retry_at: null,
            error_message: "AI Triage: No Gemini key configured. Triaged into ignored.",
            body_html: null,
            body_text: null,
          })
          .eq("id", email.id);
        ignoredCount += 1;
      }
    } catch (err: any) {
      console.error(`[triageFailedEmails] Triage error for "${email.subject}":`, err);
      // Guarantee: Under NO condition does this email remain in 'failed'
      await supabase
        .from("emails")
        .update({
          processing_status: "ignored",
          processing_started_at: null,
          next_retry_at: null,
          error_message: `AI Triage Exception: ${String(err?.message || err).slice(0, 500)}`,
          body_html: null,
          body_text: null,
        })
        .eq("id", email.id);
      ignoredCount += 1;
    }
  }

  console.log(`[triageFailedEmails] Completed: ${failedEmails.length} triaged (${approvedCount} approved, ${ignoredCount} ignored).`);
  return { triaged: failedEmails.length, approved: approvedCount, ignored: ignoredCount };
}

export async function processPendingEmails(limit = env.MAX_EMAILS_PER_SYNC || 50) {
  // 1. Triage any previously failed emails first so zero emails sit in 'failed'
  try {
    await triageFailedEmails(50);
  } catch (triageErr) {
    console.warn("[Worker] Initial triage pass warning:", triageErr);
  }

  // 2. Claim pending emails
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
    try {
      await processOneEmail(email);
      processed += 1;
    } catch (err) {
      console.error(`[Worker] Error processing email "${email.subject}":`, err);
    }
  }

  // 3. Final safety triage pass: ensure any newly surfaced failures are triaged into approved or ignored
  try {
    await triageFailedEmails(20);
  } catch (finalTriageErr) {
    console.warn("[Worker] Final triage pass warning:", finalTriageErr);
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
  const sender = Array.isArray(email.newsletters) ? email.newsletters[0] : email.newsletters;
  const emailContent = (email.body_text || email.body_html || "").slice(0, 12000);

  try {
    // 1. Filter out obvious transactional / security / OTP emails deterministically
    const wasteCheck = isObviousTimeWaster(email.subject ?? "", emailContent);
    if (wasteCheck.isWaste) {
      console.log(`[Curator] Deterministically filtered out time-waster: "${email.subject}". Reason: ${wasteCheck.reason}`);
      const { error } = await supabase
        .from("emails")
        .update({
          processing_status: "ignored",
          processing_started_at: null,
          error_message: `Waste of time: ${wasteCheck.reason}`,
          body_html: null,
          body_text: null,
        })
        .eq("id", email.id);
      if (error) throw error;
      return;
    }

    const heuristic = extractArticlesFromHtml(email.body_html ?? "", email.body_text ?? "");
    let articles = heuristic;

    if (hasGeminiKey()) {
      const extracted = await withRetries(() =>
        withJobSpan("gemini.extract_newsletter", { "gen_ai.operation.name": "extract_newsletter" }, () =>
          extractEmailArticles({
            subject: email.subject ?? "",
            sender: sender?.sender_email ?? "unknown",
            text: emailContent,
          }),
        ),
      );

      // If Gemini identifies this email as a waste of time, mark ignored and purge
      if (!extracted.keep) {
        console.log(`[Curator] Filtered out waste of time: "${email.subject}". Reason: ${extracted.reason}`);
        const { error } = await supabase
          .from("emails")
          .update({
            processing_status: "ignored",
            processing_started_at: null,
            error_message: `Waste of time: ${extracted.reason.slice(0, 500)}`,
            body_html: null,
            body_text: null,
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

    // Historical continuity: fetch stories across the last 90 days to match precedents and evolutions
    const { data: historicalStories } = await supabase
      .from("stories")
      .select("id, canonical_title, summary, category, entities, first_seen_at, last_updated_at")
      .order("first_seen_at", { ascending: false })
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

      // 1. Direct cluster match check
      const matchTitle = hasGeminiKey()
        ? await withJobSpan("gemini.cluster_title", { "gen_ai.operation.name": "cluster_title" }, () =>
            clusterTitle(synthesized.title, (historicalStories ?? []).map((story) => story.canonical_title)),
          ).catch((e) => {
            console.warn(`[clusterTitle] Error clustering title, evaluating historical context:`, e);
            return null;
          })
        : null;

      let storyId = historicalStories?.find((story) => story.canonical_title === matchTitle)?.id;

      // 2. Historical continuity check (across days, weeks, months)
      let historyMatch = null;
      if (!storyId && hasGeminiKey() && (historicalStories?.length ?? 0) > 0) {
        try {
          historyMatch = await withJobSpan("gemini.match_historical", { "gen_ai.operation.name": "match_historical" }, () =>
            matchHistoricalContext(
              {
                title: synthesized.title,
                summary: synthesized.summary,
                category: synthesized.category,
                entities: synthesized.entities,
              },
              historicalStories ?? [],
            ),
          );
        } catch (e) {
          console.warn("[matchHistoricalContext] Historical matching non-fatal error:", e);
        }
      }

      if (historyMatch?.isContinuationOfId) {
        storyId = historyMatch.isContinuationOfId;
        console.log(`[Historical Context] Connected story "${synthesized.title}" as continuation of story ${storyId}`);
      }

      if (!storyId) {
        const relatedIds = historyMatch?.relatedStoryIds ?? [];
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
            related_story_ids: relatedIds,
          })
          .select("id")
          .single();
        if (storyError) throw storyError;
        storyId = created.id;

        historicalStories?.unshift({
          id: storyId,
          canonical_title: synthesized.title,
          summary: synthesized.summary,
          category: synthesized.category,
          entities: synthesized.entities,
          first_seen_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
        });

        if (historyMatch?.updateNote) {
          await supabase.from("story_updates").insert({
            story_id: storyId,
            note: historyMatch.updateNote,
          });
        }
      } else {
        const updateNote =
          historyMatch?.updateNote ||
          `Follow-up coverage from ${sender?.sender_name ?? "newsletter"}`;

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
          note: updateNote,
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
      error_message: null,
      body_html: null, // Conserve Supabase free-tier storage
    }).eq("id", email.id);
    if (processedError) throw processedError;

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);

    console.warn(`[Worker] Exception while processing email "${email.subject}". Running AI triage fallback immediately...`, message);

    // AI TRIAGE IMMEDIATE FALLBACK: Under no condition does this email remain in 'failed'
    if (hasGeminiKey()) {
      try {
        const triaged = await triageFailedEmail({
          subject: email.subject ?? "",
          sender: sender?.sender_email ?? "unknown",
          text: emailContent,
          errorMessage: message,
        });

        if (triaged.approved && triaged.story) {
          const articlePayload = {
            email_id: email.id,
            title: triaged.story.title,
            source_name: sender?.sender_name ?? sender?.sender_email ?? null,
            content_text: triaged.story.summary,
            content_hash: hashContent(`triage-${email.id}-${Date.now()}`),
          };
          const { data: insertedArt } = await supabase.from("articles").insert(articlePayload).select("id").maybeSingle();
          const { data: createdStory } = await supabase.from("stories").insert({
            canonical_title: triaged.story.title,
            summary: triaged.story.summary,
            why_it_matters: triaged.story.whyItMatters,
            category: triaged.story.category,
            key_points: triaged.story.keyPoints,
            entities: triaged.story.entities,
            novelty_score: triaged.story.novelty,
            quality_score: 0.6,
          }).select("id").single();

          if (createdStory && insertedArt) {
            await supabase.from("story_sources").upsert({
              story_id: createdStory.id,
              article_id: insertedArt.id,
            });
          }

          await supabase.from("emails").update({
            processing_status: "processed",
            processing_started_at: null,
            next_retry_at: null,
            error_message: null,
            body_html: null,
          }).eq("id", email.id);
          return;
        } else {
          await supabase.from("emails").update({
            processing_status: "ignored",
            processing_started_at: null,
            next_retry_at: null,
            error_message: `AI Triaged as Noise: ${triaged.reason.slice(0, 500)}`,
            body_html: null,
            body_text: null,
          }).eq("id", email.id);
          return;
        }
      } catch (triageFallbackErr) {
        console.error(`[Worker] AI triage fallback exception for "${email.subject}":`, triageFallbackErr);
      }
    }

    // If all else fails or no Gemini key, mark as ignored so it never sits stuck in 'failed'
    await supabase.from("emails").update({
      processing_status: "ignored",
      processing_started_at: null,
      next_retry_at: null,
      error_message: `Triaged: Processing unrecoverable (${message.slice(0, 300)})`,
      body_html: null,
      body_text: null,
    }).eq("id", email.id);
  }
}
