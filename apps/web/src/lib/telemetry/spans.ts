import { randomBytes } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase/admin";

type SpanStatus = "ok" | "error";

export async function recordSpan(input: {
  name: string;
  startTime: number;
  status: SpanStatus;
  attributes?: Record<string, string | number | boolean>;
}) {
  const supabase = createAdminSupabase();
  if (!supabase) return;

  const endTime = Date.now();
  try {
    const { error } = await supabase.from("otel_spans").insert({
      trace_id: randomBytes(16).toString("hex"),
      span_id: randomBytes(8).toString("hex"),
      span_name: input.name.slice(0, 120),
      span_kind: "internal",
      status: input.status,
      start_time: new Date(input.startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      duration_ms: Math.max(0, endTime - input.startTime),
      attributes: input.attributes ?? {},
      service_name: "signalos-web",
    });
    if (error) console.warn("Telemetry span could not be stored.");
  } catch {
    console.warn("Telemetry span could not be stored.");
  }
}
