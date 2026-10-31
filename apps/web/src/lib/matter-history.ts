import { GoogleGenAI } from "@google/genai";
import { createAdminSupabase } from "./supabase/admin";
import type { StoryMilestone } from "./queries";

function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean));
  }
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) keys.push(k.trim());
  }
  return Array.from(new Set(keys.filter(Boolean)));
}

function isValidMatterTimeline(timeline?: unknown): timeline is StoryMilestone[] {
  if (!Array.isArray(timeline) || timeline.length < 2) return false;
  // If it contains worker email boilerplate or unrelated story titles, it's not a genuine matter timeline
  const boilerplatePatterns = [
    "newsletter briefing",
    "TechCrunch",
    "First reported in",
    "Developing Story Update",
    "Related Historical Coverage",
    "Initial Emergence",
  ];
  for (const item of timeline) {
    if (!item || typeof item !== "object") return false;
    const desc = String((item as StoryMilestone).description || "");
    const label = String((item as StoryMilestone).label || "");
    if (boilerplatePatterns.some((p) => desc.includes(p) || label.includes(p))) {
      return false;
    }
  }
  return true;
}

export async function fetchOrGenerateMatterTimeline(story: {
  id: string;
  canonicalTitle: string;
  summary: string | null;
  whyItMatters: string | null;
  category: string | null;
  firstSeenAt: string;
  existingTimeline?: StoryMilestone[] | null;
}): Promise<StoryMilestone[]> {
  // 1. If a valid, genuine matter timeline is already cached, return immediately
  if (isValidMatterTimeline(story.existingTimeline)) {
    return story.existingTimeline;
  }

  // 2. Generate authoritative, real-world subject matter history with Gemini
  const apiKeys = getGeminiApiKeys();
  const models = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];

  const prompt = `You are a Senior Investigative Tech Historian and Intelligence Analyst.
Analyze the following news story and provide a rich, authoritative, chronological Historical Background & Matter Timeline explaining the true history of this subject matter (precedents, origins, milestones leading up to this event, and future trajectory).

STRICT RULES:
1. DO NOT mention newsletters, emails, TechCrunch, inboxes, or other stories in the user's edition.
2. Focus 100% on the real-world events, history, science, technology, and precedents of the subject itself.
3. Provide 3 to 4 distinct, substantive chronological milestones.

Story:
Title: "${story.canonicalTitle}"
Summary: "${story.summary || ""}"
Why It Matters: "${story.whyItMatters || ""}"
Category: "${story.category || "technology"}"
Event Date: "${story.firstSeenAt.slice(0, 10)}"

Return valid JSON with this exact array structure:
[
  {
    "date": "Historical timeframe (e.g. '2017 - 2020' or specific year/period)",
    "label": "Concise milestone label (e.g. 'Origin & Early Foundations')",
    "description": "Rich 2-3 sentence historical context explaining the real-world precedents of this technology/incident."
  },
  {
    "date": "Intermediate timeframe (e.g. '2022 - 2024')",
    "label": "Concise milestone label (e.g. 'Technical & Regulatory Hurdles')",
    "description": "Rich 2-3 sentence context explaining the key developments leading up to today."
  },
  {
    "date": "${story.firstSeenAt.slice(0, 10)}",
    "label": "Current Breakthrough Milestone",
    "description": "Rich 2-3 sentence explanation of the specific milestone achieved today in this story."
  },
  {
    "date": "Strategic Horizon",
    "label": "Industry Consequence & Future Trajectory",
    "description": "Rich 2-3 sentence forward-looking perspective on how this reshapes the broader field."
  }
]`;

  let generatedMilestones: StoryMilestone[] | null = null;

  for (const key of apiKeys) {
    if (generatedMilestones) break;
    const ai = new GoogleGenAI({ apiKey: key });

    for (const model of models) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });

        if (res.text) {
          const parsed = JSON.parse(res.text);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            generatedMilestones = parsed.map((m: { date?: unknown; label?: unknown; description?: unknown }) => ({
              date: String(m.date || "Precedent"),
              label: String(m.label || "Historical Precedent"),
              description: String(m.description || ""),
            }));
            break;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
          break; // rotate key
        }
      }
    }
  }

  // Fallback if AI call failed
  if (!generatedMilestones || generatedMilestones.length === 0) {
    const year = new Date(story.firstSeenAt).getFullYear() || 2026;
    generatedMilestones = [
      {
        date: `${year - 4} – ${year - 2}`,
        label: "Foundational Research & Early Precedents",
        description: `Early exploratory work into ${story.category?.replace("-", " ") || "this field"} established initial feasibility, uncovering fundamental architectural trade-offs between centralized infrastructure and distributed execution.`,
      },
      {
        date: `${year - 1}`,
        label: "Technical Prototyping & Scaling Hurdles",
        description: `Engineering teams addressed critical bottlenecks in power efficiency, data throughput, and localized compute resilience, clearing the path toward production-ready deployments.`,
      },
      {
        date: story.firstSeenAt.slice(0, 10),
        label: "Current Milestone Achieved",
        description: story.summary || story.canonicalTitle,
      },
      {
        date: "Future Horizon",
        label: "Strategic Evolution & Industry Impact",
        description: story.whyItMatters || "Sets the benchmark for next-generation system architectures across the industry.",
      },
    ];
  }

  // Persist to Supabase so it's cached permanently in the database
  try {
    const supabase = createAdminSupabase();
    if (supabase) {
      await supabase
        .from("stories")
        .update({ timeline: generatedMilestones })
        .eq("id", story.id);
    }
  } catch (dbErr) {
    console.warn("[MatterTimeline] Non-fatal DB cache write failure:", dbErr);
  }

  return generatedMilestones;
}
