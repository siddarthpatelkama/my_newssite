import { generateDailyBriefing } from "./jobs/generate-briefing";
import { processPendingEmails, triageFailedEmails } from "./jobs/process-email";
import { syncGmail } from "./jobs/sync-gmail";
import { withJobSpan } from "./telemetry";
import { getApiKeys } from "./ai/gemini";
import { env } from "./env";

const command = process.argv[2] ?? "help";

async function main() {
  const keys = getApiKeys();
  console.log(`[Worker] Initialized with command: '${command}'`);
  console.log(`[Worker] Supabase URL configured: ${Boolean(env.supabaseUrl)}`);
  console.log(`[Worker] Supabase Service Key configured: ${Boolean(env.SUPABASE_SERVICE_ROLE_KEY)}`);
  console.log(`[Worker] Gemini API keys detected: ${keys.length}`);

  switch (command) {
    case "sync": {
      const result = await withJobSpan("worker.gmail_sync", { "job.type": "gmail.sync" }, syncGmail);
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "backfill": {
      const result = await withJobSpan("worker.gmail_backfill", { "job.type": "gmail.backfill" }, () =>
        syncGmail({ backfill: true }),
      );
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "process": {
      const result = await withJobSpan("worker.process_emails", { "job.type": "email.process" }, processPendingEmails);
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "triage": {
      const result = await withJobSpan("worker.triage_failed_emails", { "job.type": "email.triage" }, () =>
        triageFailedEmails(100),
      );
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "briefing": {
      const result = await withJobSpan(
        "worker.generate_briefing",
        { "job.type": "briefing.generate" },
        generateDailyBriefing,
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
        sync = await withJobSpan("worker.gmail_sync", { "job.type": "gmail.sync" }, syncGmail);
        console.log(`[Worker] Gmail sync completed: ${sync.scanned} scanned, ${sync.inserted} inserted.`);
      } catch (err: any) {
        console.error("[Worker] Warning during Gmail sync:", err?.message || err);
      }

      console.log("\n================ [STEP 2/4: AI TRIAGE FAILED EMAILS] ==");
      try {
        triage = await withJobSpan(
          "worker.triage_failed_emails",
          { "job.type": "email.triage" },
          () => triageFailedEmails(100),
        );
        console.log(`[Worker] AI Triage completed: ${triage.triaged} triaged (${triage.approved} approved, ${triage.ignored} ignored).`);
      } catch (err: any) {
        console.error("[Worker] Warning during AI triage:", err?.message || err);
      }

      console.log("\n================ [STEP 3/4: PROCESS EMAILS] ============");
      try {
        process = await withJobSpan(
          "worker.process_emails",
          { "job.type": "email.process" },
          processPendingEmails,
        );
        console.log(`[Worker] Email processing completed: ${process.processed} processed.`);
      } catch (err: any) {
        console.error("[Worker] Warning during email processing:", err?.message || err);
      }

      console.log("\n================ [STEP 4/4: GENERATE BRIEFING] =========");
      try {
        briefing = await withJobSpan(
          "worker.generate_briefing",
          { "job.type": "briefing.generate" },
          generateDailyBriefing,
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
