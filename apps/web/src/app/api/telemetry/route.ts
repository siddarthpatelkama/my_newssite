import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { recordSpan } from "@/lib/telemetry/spans";

const EventSchema = z.object({
  visitorId: z.string().uuid(),
  sessionId: z.string().uuid(),
  eventType: z.enum(["page_view", "read_session", "like", "dislike", "understood", "needs_context"]),
  storyId: z.string().uuid().nullable().optional(),
  path: z.string().regex(/^\/(?:feed|search|saved|settings)?$|^\/stories\/[0-9a-f-]{36}$/i).max(80),
  activeSeconds: z.number().int().min(0).max(86400).optional(),
  scrollCount: z.number().int().min(0).max(10000).optional(),
  maxScrollPercent: z.number().int().min(0).max(100).optional(),
}).strict().superRefine((event, ctx) => {
  const isStory = event.path.startsWith("/stories/");
  if (isStory !== Boolean(event.storyId) && event.storyId !== undefined && event.storyId !== null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Story path and ID do not match." });
  }
  if (event.eventType === "read_session" && !event.storyId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A reading session needs a story ID." });
  }
  if (["like", "dislike", "understood", "needs_context"].includes(event.eventType) && !event.storyId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Story feedback needs a story ID." });
  }
});

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 4096) {
      return NextResponse.json({ error: "Event is too large." }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid telemetry event." }, { status: 400 });

  const supabase = createAdminSupabase();
  if (!supabase) return NextResponse.json({ error: "Telemetry storage is unavailable." }, { status: 503 });

  const event = parsed.data;
  const { error } = await supabase.from("reader_events").insert({
    visitor_id: event.visitorId,
    session_id: event.sessionId,
    event_type: event.eventType,
    story_id: event.storyId ?? null,
    path: event.path,
    active_seconds: event.eventType === "read_session" ? event.activeSeconds ?? 0 : null,
    scroll_count: event.eventType === "read_session" ? event.scrollCount ?? 0 : null,
    max_scroll_percent: event.eventType === "read_session" ? event.maxScrollPercent ?? 0 : null,
  });

  // Mirror interaction into user_interactions table for analytics and personalized ranking
  if (event.storyId) {
    const actionMap: Record<string, string> = {
      page_view: "view",
      read_session: "view",
      like: "like",
      dislike: "dislike",
      understood: "like",
      needs_context: "skip",
    };
    const action = actionMap[event.eventType] || "view";
    try {
      await supabase.from("user_interactions").insert({
        story_id: event.storyId,
        action,
        user_id: null,
      });
    } catch {}
  }

  await recordSpan({
    name: "telemetry.store_reader_event",
    startTime: startedAt,
    status: error ? "error" : "ok",
    attributes: { "app.event_type": event.eventType },
  });
  if (error) return NextResponse.json({ error: "Could not save event." }, { status: 503 });
  return new NextResponse(null, { status: 204 });
}
