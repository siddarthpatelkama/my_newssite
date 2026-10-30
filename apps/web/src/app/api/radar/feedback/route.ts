import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";

const FeedbackSchema = z.object({
  articleUrl: z.string().min(1),
  articleTitle: z.string().min(1),
  sourceName: z.string().min(1),
  action: z.enum(["like", "dislike", "save"]),
  category: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = FeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid feedback payload", details: parsed.error.issues }, { status: 400 });
    }

    const supabase = createAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection unavailable" }, { status: 503 });
    }

    const { articleUrl, articleTitle, sourceName, action, category, score } = parsed.data;

    // 1. Try inserting into radar_feedback
    const { error: radarErr } = await supabase.from("radar_feedback").insert({
      article_url: articleUrl,
      article_title: articleTitle,
      source_name: sourceName,
      action,
      category: category || "general",
      score: score ?? (action === "like" ? 90 : action === "dislike" ? 15 : 80),
    });

    // 2. Also record in ui_taste_feedback for evolutionary AI learning
    const sentiment = action === "dislike" ? "dislike" : "like";
    const tasteScore = score ?? (action === "like" ? 90 : action === "dislike" ? 15 : 85);
    const notesPayload = JSON.stringify({
      type: "radar_feedback",
      articleUrl,
      articleTitle,
      sourceName,
      action,
      category: category || "general",
      savedAt: new Date().toISOString(),
    });

    await supabase.from("ui_taste_feedback").insert({
      theme_id: `radar-${category || "stream"}`,
      score: tasteScore,
      sentiment,
      notes: notesPayload,
    });

    return NextResponse.json({
      success: true,
      action,
      articleTitle,
      logged: !radarErr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
