import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ThemeSpec } from "@signalos/shared";

export async function POST() {
  try {
    const supabase = createAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection unavailable." }, { status: 503 });
    }

    // 1. Fetch recent user taste ratings
    const { data: rawRatings } = await supabase
      .from("ui_taste_feedback")
      .select("theme_id, score, sentiment, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const parsedRatings = (rawRatings || []).map((r) => {
      let meta: Record<string, unknown> = {};
      try {
        if (r.notes && r.notes.startsWith("{")) meta = JSON.parse(r.notes) as Record<string, unknown>;
      } catch {}
      return {
        themeId: r.theme_id,
        themeName: typeof meta.themeName === "string" ? meta.themeName : r.theme_id,
        score: r.score,
        sentiment: r.sentiment,
        keywords: Array.isArray(meta.keywords) ? (meta.keywords as string[]) : [],
        colors: typeof meta.colors === "object" && meta.colors !== null ? (meta.colors as Record<string, string>) : {},
        atmosphere: typeof meta.atmosphere === "string" ? (meta.atmosphere as ThemeSpec["atmosphere"]) : "sand_grain",
      };
    });

    // 2. Fetch today's top stories
    const { data: stories } = await supabase
      .from("stories")
      .select("id, canonical_title, category")
      .order("last_updated_at", { ascending: false })
      .limit(8);

    // 3. Check for Gemini API keys with multi-key rotation and modern model fallback
    const rawKeys = [
      process.env.GEMINI_API_KEYS,
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ]
      .filter(Boolean)
      .join("\n");

    const apiKeys = rawKeys
      .split(/[\r\n,;]+/)
      .map((k) => k.replace(/["'`;]/g, "").trim())
      .filter((k) => k.length >= 15);

    let evolvedTheme: ThemeSpec | null = null;

    if (apiKeys.length > 0) {
      const candidateModels = [
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-flash-latest",
      ];

      const prompt = `You are the lead art director and generative UI designer for SignalOS personal intelligence paper.
Date: ${new Date().toISOString().slice(0, 10)}.

User's UI/UX Taste Profile (From Rating Bar):
${JSON.stringify(parsedRatings, null, 2)}

Today's Top Curated Headlines:
${JSON.stringify((stories || []).map((s) => ({ title: s.canonical_title, category: s.category })), null, 2)}

TASK:
Synthesize an evolved themeSpec that respects the user's top-rated aesthetics and design keywords, adapting to today's date and headlines.
- If today or this week coincides with a major festival (e.g. Diwali, Dasara, New Year), infuse that festival's aura.
- If today's top stories are heavily focused on cybersecurity or exploits, adapt towards a subtle stealth terminal cyber aesthetic.
- Otherwise, evolve towards the user's favorite styles (e.g. Kyoto Sand, Swiss Minimalist, Nordic Slate). High contrast, gorgeous typography, and legible palette are strictly mandatory.

Return JSON only:
{
  "themeName": string,
  "headlineBadge": string,
  "reasoning": string,
  "colors": {
    "paper": "#hex background (e.g. #ede8df)",
    "ink": "#hex primary text (high contrast)",
    "rule": "#hex border lines",
    "crimson": "#hex accent highlight",
    "mute": "#hex secondary text"
  },
  "typography": {
    "headline": "Georgia, serif",
    "body": "system-ui, sans-serif"
  },
  "atmosphere": "none" | "god_rays" | "cyber_grid" | "diwali_glow" | "sand_grain",
  "keywords": ["tag1", "tag2", "tag3"],
  "layoutStyle": "string"
}`;

      for (const key of apiKeys) {
        if (evolvedTheme) break;
        const ai = new GoogleGenAI({ apiKey: key });

        for (const model of candidateModels) {
          try {
            const res = await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                temperature: 0.3,
                responseMimeType: "application/json",
              },
            });

            if (res.text) {
              evolvedTheme = JSON.parse(res.text) as ThemeSpec;
              break;
            }
          } catch (modelErr: unknown) {
            const msg = modelErr instanceof Error ? modelErr.message : String(modelErr);
            console.warn(`[Theme Evolve] Key failed on ${model}: ${msg.slice(0, 80)}`);
            if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
              break; // rotate to next key
            }
          }
        }
      }
    }

    // Fallback if no Gemini key or call failed: synthesize based on user's highest rated style
    if (!evolvedTheme) {
      const topRating = parsedRatings.find((r) => r.score >= 80) || parsedRatings[0];
      const themeName = topRating?.themeName || "Kyoto Sand";
      evolvedTheme = {
        themeName: `${themeName} (Evolved)`,
        headlineBadge: `${themeName} · Evolved Edition`,
        reasoning: `Synthesized from your rating (${topRating?.score || 95}/100) emphasizing warm tactile paper and editorial typography.`,
        colors: {
          paper: topRating?.colors?.paper || "#ede8df",
          ink: topRating?.colors?.ink || "#242220",
          rule: topRating?.colors?.rule || "#d8d1c5",
          crimson: topRating?.colors?.crimson || "#8c4b2d",
          mute: topRating?.colors?.mute || "#756f66",
        },
        typography: {
          headline: "Georgia, serif",
          body: "system-ui, sans-serif",
        },
        atmosphere: (topRating?.atmosphere as ThemeSpec["atmosphere"]) || "sand_grain",
        keywords: topRating?.keywords || ["wabi-sabi", "warm-sand-paper", "sumi-ink", "editorial-serif"],
        layoutStyle: "Japanese Wabi-Sabi Editorial Broadsheet",
      };
    }

    // 4. Update the latest briefing in Supabase with this themeSpec
    const { data: latestBriefing } = await supabase
      .from("daily_briefings")
      .select("id")
      .order("edition_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestBriefing?.id) {
      const { data: currentConfigRow } = await supabase
        .from("dashboard_configs")
        .select("config")
        .eq("briefing_id", latestBriefing.id)
        .maybeSingle();

      const existingConfig = currentConfigRow?.config || {};
      const updatedConfig = {
        ...existingConfig,
        themeSpec: evolvedTheme,
      };

      await supabase.from("dashboard_configs").upsert(
        {
          briefing_id: latestBriefing.id,
          config: updatedConfig,
        },
        { onConflict: "briefing_id" },
      );

      // Invalidate full Next.js cache so the newly evolved theme applies immediately to all pages
      revalidatePath("/", "layout");
    }

    return NextResponse.json({
      success: true,
      evolvedTheme,
      message: `Successfully evolved theme to "${evolvedTheme.themeName}"!`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
