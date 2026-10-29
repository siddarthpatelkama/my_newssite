import { createAdminSupabase } from "@/lib/supabase/admin";

export async function getTelemetrySummary() {
  const supabase = createAdminSupabase();
  if (!supabase) return null;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("reader_events")
    .select("event_type, active_seconds, scroll_count, max_scroll_percent")
    .gte("created_at", since)
    .limit(10000);
  if (error || !data) return null;

  const total = (eventType: string) => data.filter((event) => event.event_type === eventType).length;
  return {
    pageViews: total("page_view"),
    readingSessions: total("read_session"),
    readingMinutes: Math.round(data.reduce((sum, event) => sum + (event.active_seconds ?? 0), 0) / 60),
    scrollBursts: data.reduce((sum, event) => sum + (event.scroll_count ?? 0), 0),
    maxReadDepth: Math.round(data.filter((event) => event.event_type === "read_session")
      .reduce((max, event) => Math.max(max, event.max_scroll_percent ?? 0), 0)),
    likes: total("like"),
    dislikes: total("dislike"),
    understood: total("understood"),
    needsContext: total("needs_context"),
  };
}
