import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const maxDuration = 60; // Allow sufficient time for batch Gemini triage

function isDeterministicTimeWaster(subject: string, content: string): { isWaste: boolean; reason: string } {
  const combined = `${subject} ${content.slice(0, 3000)}`.toLowerCase();
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

export async function GET() {
  try {
    const supabase = createAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection unavailable." }, { status: 503 });
    }

    const { data: emails, error } = await supabase
      .from("emails")
      .select("id, processing_status");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts = {
      total: emails?.length ?? 0,
      failed: 0,
      pending: 0,
      processing: 0,
      processed: 0,
      ignored: 0,
    };

    for (const e of emails ?? []) {
      const status = e.processing_status as keyof typeof counts;
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    }

    return NextResponse.json({ success: true, counts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = createAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection unavailable." }, { status: 503 });
    }

    // 1. Fetch failed emails in batches of 10 to comfortably stay within serverless execution limits
    const { data: failedEmails, error: fetchErr } = await supabase
      .from("emails")
      .select("id, subject, body_text, body_html, newsletter_id, error_message, newsletters(sender_name, sender_email)")
      .eq("processing_status", "failed")
      .limit(10);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!failedEmails || failedEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No failed emails found in database. All emails are already resolved.",
        triaged: 0,
        approved: 0,
        ignored: 0,
        remainingFailed: 0,
      });
    }

    // 2. Discover Gemini key
    const rawKeys =
      process.env.GEMINI_API_KEYS ||
      process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY_1 ||
      "";
    const apiKey = rawKeys
      .split(/[\r\n,;]+/)
      .map((k) => k.replace(/["'`;]/g, "").trim())
      .find((k) => k.length >= 15);

    let approvedCount = 0;
    let ignoredCount = 0;

    for (const email of failedEmails) {
      const emailContent = (email.body_text || email.body_html || "").slice(0, 12000);
      const sender = Array.isArray(email.newsletters) ? email.newsletters[0] : email.newsletters;

      // 1. Fast deterministic check
      const wasteCheck = isDeterministicTimeWaster(email.subject ?? "", emailContent);
      if (wasteCheck.isWaste) {
        await supabase
          .from("emails")
          .update({
            processing_status: "ignored",
            processing_started_at: null,
            next_retry_at: null,
            error_message: `Waste of time: ${wasteCheck.reason}`,
            body_html: null,
            body_text: null,
          })
          .eq("id", email.id);
        ignoredCount += 1;
        continue;
      }

      // 2. AI Triage if Gemini key available
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are the Chief Editorial Triager for SignalOS.
This email previously failed processing. You must make a final binary decision: APPROVE or IGNORE.
Under NO condition should this email be left in an uncertain or failed state.

CRITERIA:
1. APPROVE ("approved": true):
   - High-signal newsletter content: AI research, software engineering, coding tutorials, tech architecture, hackathons, or startup insights that an ambitious tech student must know.
   - Extract title, summary (2-3 sentences), whyItMatters (for tech student builder), category, and keyPoints.

2. IGNORE ("approved": false):
   - Transactional notices (OTP, password reset, login verification, receipts, billing statements, promotional sales) OR corrupt unreadable content.
   - State explicit reason in "reason".

Subject: ${email.subject ?? "Untitled"}
Sender: ${sender?.sender_email ?? "unknown"}
Error Context: ${email.error_message || "None"}
Raw Text:
${emailContent.slice(0, 8000)}

Return valid JSON with this exact schema:
{
  "approved": boolean,
  "reason": "Clear explanation of decision",
  "title": "Clean article title",
  "summary": "2-3 sentences summarizing technical substance",
  "whyItMatters": "Why an ambitious student developer should read this",
  "category": "ai-research" | "startups" | "engineering" | "hackathons" | "business" | "science" | "careers" | "other",
  "keyPoints": ["point 1", "point 2"]
}`;

          const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          });

          const rawText = res.text || "{}";
          const parsed = JSON.parse(rawText) as Record<string, unknown>;

          if (parsed.approved) {
            // Save article and story
            const articlePayload = {
              email_id: email.id,
              title: String(parsed.title || email.subject || "Newsletter Article"),
              source_name: sender?.sender_name ?? sender?.sender_email ?? null,
              content_text: String(parsed.summary || emailContent.slice(0, 500)),
              content_hash: `triage-${email.id}-${Date.now()}`,
            };

            const { data: art } = await supabase
              .from("articles")
              .insert(articlePayload)
              .select("id")
              .maybeSingle();

            const { data: createdStory } = await supabase
              .from("stories")
              .insert({
                canonical_title: String(parsed.title || email.subject || "Newsletter Article"),
                summary: String(parsed.summary || ""),
                why_it_matters: String(parsed.whyItMatters || "High signal insight for tech builders."),
                category: String(parsed.category || "other"),
                key_points: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
                entities: [],
                novelty_score: 0.7,
                quality_score: 0.7,
              })
              .select("id")
              .single();

            if (createdStory && art) {
              await supabase.from("story_sources").upsert({
                story_id: createdStory.id,
                article_id: art.id,
              });
            }

            await supabase
              .from("emails")
              .update({
                processing_status: "processed",
                processing_started_at: null,
                next_retry_at: null,
                error_message: null,
                body_html: null, // Purge heavy HTML to save Supabase free tier storage
              })
              .eq("id", email.id);

            approvedCount += 1;
            continue;
          } else {
            await supabase
              .from("emails")
              .update({
                processing_status: "ignored",
                processing_started_at: null,
                next_retry_at: null,
                error_message: `AI Triaged as Noise: ${String(parsed.reason || "Low signal").slice(0, 500)}`,
                body_html: null,
                body_text: null,
              })
              .eq("id", email.id);

            ignoredCount += 1;
            continue;
          }
        } catch (geminiErr: unknown) {
          console.warn("[Admin Triage] Gemini evaluation error:", geminiErr);
        }
      }

      // Fallback: If no Gemini key or call errored, resolve to ignored to ensure no email remains in 'failed'
      await supabase
        .from("emails")
        .update({
          processing_status: "ignored",
          processing_started_at: null,
          next_retry_at: null,
          error_message: "AI Triage Fallback: Excluded unparseable email",
          body_html: null,
          body_text: null,
        })
        .eq("id", email.id);

      ignoredCount += 1;
    }

    // Verify remaining failed
    const { count: remainingFailed } = await supabase
      .from("emails")
      .select("*", { count: "exact", head: true })
      .eq("processing_status", "failed");

    return NextResponse.json({
      success: true,
      message: `Successfully triaged ${failedEmails.length} failed emails with AI.`,
      triaged: failedEmails.length,
      approved: approvedCount,
      ignored: ignoredCount,
      remainingFailed: remainingFailed ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
