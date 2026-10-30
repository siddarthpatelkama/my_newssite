import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";

const RatingSchema = z.object({
  themeId: z.string().min(1).max(64),
  score: z.number().int().min(0).max(100),
  sentiment: z.enum(["like", "dislike"]),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RatingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rating payload.", details: parsed.error.issues }, { status: 400 });
    }

    const supabase = createAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection unavailable." }, { status: 503 });
    }

    const { themeId, score, sentiment, notes } = parsed.data;

    const { data, error } = await supabase.from("ui_taste_feedback").insert({
      theme_id: themeId,
      score,
      sentiment,
      notes: notes ?? null,
    }).select("id, theme_id, score, sentiment, created_at").single();

    if (error) {
      console.error("[UI Rating] Error inserting into Supabase:", error.message);
      // Return 200 with saved: false if table does not exist yet so the UI doesn't crash before SQL is run
      return NextResponse.json({
        success: false,
        warning: `Database table not found or error: ${error.message}. Please run the SQL migration in Supabase SQL Editor.`,
        score,
        themeId,
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, rating: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

