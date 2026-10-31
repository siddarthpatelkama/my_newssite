import { generateDailyBriefing } from "./jobs/generate-briefing";
import { processPendingEmails, triageFailedEmails } from "./jobs/process-email";
import { syncGmail } from "./jobs/sync-gmail";
import { withJobSpan } from "./telemetry";
import { getApiKeys } from "./ai/gemini";
import { supabase } from "./supabase";
import { env } from "./env";

const command = process.argv[2] ?? "help";

async function withProcessingJob<T>(jobType: string, fn: () => Promise<T>): Promise<T> {
  let jobId: string | null = null;
  try {
    const { data } = await supabase
      .from("processing_jobs")
      .insert({ job_type: jobType, status: "running", attempts: 1 })
      .select("id")
      .maybeSingle();
    jobId = data?.id ?? null;
  } catch {}

  try {
    const result = await fn();
    if (jobId) {
      await supabase
        .from("processing_jobs")
        .update({
          status: "succeeded",
          payload: typeof result === "object" && result !== null ? result : {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }
    return result;
  } catch (error: any) {
    if (jobId) {
      await supabase
        .from("processing_jobs")
        .update({
          status: "failed",
          last_error: error?.message || String(error),
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }
    throw error;
  }
}

async function main() {
  const keys = getApiKeys();
  console.log(`[Worker] Initialized with command: '${command}'`);
  console.log(`[Worker] Supabase URL configured: ${Boolean(env.supabaseUrl)}`);
  console.log(`[Worker] Supabase Service Key configured: ${Boolean(env.SUPABASE_SERVICE_ROLE_KEY)}`);
  console.log(`[Worker] Gemini API keys detected: ${keys.length}`);

  switch (command) {
    case "sync": {
      const result = await withProcessingJob("gmail_sync", () =>
        withJobSpan("worker.gmail_sync", { "job.type": "gmail.sync" }, syncGmail),
      );
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "backfill": {
      const result = await withProcessingJob("gmail_backfill", () =>
        withJobSpan("worker.gmail_backfill", { "job.type": "gmail.backfill" }, () =>
          syncGmail({ backfill: true }),
        ),
      );
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "process": {
      const result = await withProcessingJob("email_process", () =>
        withJobSpan("worker.process_emails", { "job.type": "email.process" }, processPendingEmails),
      );
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "triage": {
      const result = await withProcessingJob("email_triage", () =>
        withJobSpan("worker.triage_failed_emails", { "job.type": "email.triage" }, () =>
          triageFailedEmails(100),
        ),
      );
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "briefing": {
      const result = await withProcessingJob("daily_briefing", () =>
        withJobSpan(
          "worker.generate_briefing",
          { "job.type": "briefing.generate" },
          generateDailyBriefing,
        ),
      );
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "run": {
      let sync = { scanned: 0, inserted: 0 };
      let triage = { triaged: 0, approved: 0, ignored: 0 };
      let process = { processed: 0 };
      let briefing: any = { skipped: true };

      console.log("\n================ [STEP 1/4: GMAIL SYNC] ================");
      try {
        sync = (await withProcessingJob("gmail_sync", () =>
          withJobSpan("worker.gmail_sync", { "job.type": "gmail.sync" }, syncGmail),
        )) ?? { scanned: 0, inserted: 0 };
        console.log(`[Worker] Gmail sync completed: ${sync.scanned} scanned, ${sync.inserted} inserted.`);
      } catch (err: any) {
        console.error("[Worker] Warning during Gmail sync:", err?.message || err);
      }

      console.log("\n================ [STEP 2/4: AI TRIAGE FAILED EMAILS] ==");
      try {
        triage = (await withProcessingJob("email_triage", () =>
          withJobSpan(
            "worker.triage_failed_emails",
            { "job.type": "email.triage" },
            () => triageFailedEmails(100),
          ),
        )) ?? { triaged: 0, approved: 0, ignored: 0 };
        console.log(`[Worker] AI Triage completed: ${triage.triaged} triaged (${triage.approved} approved, ${triage.ignored} ignored).`);
      } catch (err: any) {
        console.error("[Worker] Warning during AI triage:", err?.message || err);
      }

      console.log("\n================ [STEP 3/4: PROCESS EMAILS] ============");
      try {
        process = (await withProcessingJob("email_process", () =>
          withJobSpan(
            "worker.process_emails",
            { "job.type": "email.process" },
            processPendingEmails,
          ),
        )) ?? { processed: 0 };
        console.log(`[Worker] Email processing completed: ${process.processed} processed.`);
      } catch (err: any) {
        console.error("[Worker] Warning during email processing:", err?.message || err);
      }

      console.log("\n================ [STEP 4/4: GENERATE BRIEFING] =========");
      try {
        briefing = await withProcessingJob("daily_briefing", () =>
          withJobSpan(
            "worker.generate_briefing",
            { "job.type": "briefing.generate" },
            generateDailyBriefing,
          ),
        );
        console.log(`[Worker] Briefing generation completed:`, briefing);
      } catch (err: any) {
        console.error("[Worker] Warning during briefing generation:", err?.message || err);
      }

      console.log("\n================ [PIPELINE FINISHED] ===================");
      console.log(JSON.stringify({ command, sync, triage, process, briefing }));
      break;
    }
    default:
      console.log("Usage: tsx src/index.ts <sync|backfill|process|triage|briefing|run>");
  }
}

main()
  .then(() => {
    console.log("\n[Worker] Pipeline finished with code 0.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n[Worker] Unhandled top-level exception:", error);
    process.exit(1);
  });
