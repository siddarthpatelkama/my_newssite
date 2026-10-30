import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";

const RatingSchema = z.object({
  themeId: z.string().min(1).max(64),
  score: z.number().int().min(0).max(100),
  sentiment: z.enum(["like", "dislike"]),
  themeName: z.string().optional(),
  fontFamily: z.string().optional(),
  colors: z.record(z.string()).optional(),
  atmosphere: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  layoutStyle: z.string().optional(),
  notes: z.string().max(1000).optional(),
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

    const {
      themeId,
      score,
      sentiment,
      themeName,
      fontFamily,
      colors,
      atmosphere,
      keywords,
      layoutStyle,
      notes,
    } = parsed.data;

    // Full structured metadata object for AI evolutionary learning
    const richMetadata = {
      themeName: themeName || themeId,
      fontFamily: fontFamily || "Georgia (Serif) & System Sans",
      colors: colors || {},
      atmosphere: atmosphere || "sand_grain",
      keywords: keywords || [],
      layoutStyle: layoutStyle || "Editorial Broadsheet",
      userNote: notes || null,
      savedAt: new Date().toISOString(),
    };

    const notesPayload = JSON.stringify(richMetadata);

    // First attempt: insert with dedicated design columns if table was expanded
    let insertResult = await supabase
      .from("ui_taste_feedback")
      .insert({
        theme_id: themeId,
        score,
        sentiment,
        notes: notesPayload,
        design_spec: richMetadata,
        keywords: keywords || [],
        font_family: fontFamily || "Georgia (Serif) & System Sans",
      })
      .select("id, theme_id, score, sentiment, created_at")
      .single();

    // Fallback if design_spec / keywords columns don't exist yet: insert into standard columns
    if (insertResult.error && (insertResult.error.message.includes("column") || insertResult.error.code === "42703")) {
      insertResult = await supabase
        .from("ui_taste_feedback")
        .insert({
          theme_id: themeId,
          score,
          sentiment,
          notes: notesPayload,
        })
        .select("id, theme_id, score, sentiment, created_at")
        .single();
    }

    if (insertResult.error) {
      console.error("[UI Rating] Error inserting into Supabase:", insertResult.error.message);
      return NextResponse.json({
        success: false,
        warning: `Database table not found or error: ${insertResult.error.message}`,
        score,
        themeId,
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      rating: insertResult.data,
      metadata: richMetadata,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
