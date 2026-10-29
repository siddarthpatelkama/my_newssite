import { randomBytes } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { supabase } from "./supabase";

const traceContext = new AsyncLocalStorage<{ traceId: string; spanId: string }>();

export async function withJobSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  job: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  const parent = traceContext.getStore();
  const traceId = parent?.traceId ?? randomBytes(16).toString("hex");
  const spanId = randomBytes(8).toString("hex");
  const safeAttributes = { ...attributes };
  let status: "ok" | "error" = "ok";
  return traceContext.run({ traceId, spanId }, async () => {
    try {
      const result = await job();
      if (result && typeof result === "object") {
        for (const [key, value] of Object.entries(result)) {
          if (typeof value === "number" || typeof value === "boolean") safeAttributes[`job.result.${key}`] = value;
        }
      }
      return result;
    } catch (error) {
      status = "error";
      safeAttributes["error.message"] = (error instanceof Error ? error.message : String(error)).slice(0, 300);
      throw error;
    } finally {
      const endedAt = Date.now();
      try {
        const { error } = await supabase.from("otel_spans").insert({
          trace_id: traceId,
          span_id: spanId,
          parent_span_id: parent?.spanId ?? null,
          span_name: name,
          span_kind: "internal",
          status,
          start_time: new Date(startedAt).toISOString(),
          end_time: new Date(endedAt).toISOString(),
          duration_ms: Math.max(0, endedAt - startedAt),
          attributes: safeAttributes,
          service_name: "signalos-worker",
        });
        if (error) console.warn("Telemetry span could not be stored.");
      } catch {
        console.warn("Telemetry span could not be stored.");
      }
    }
  });
}
