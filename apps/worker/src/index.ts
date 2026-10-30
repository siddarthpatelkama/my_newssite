import { generateDailyBriefing } from "./jobs/generate-briefing";
import { processPendingEmails } from "./jobs/process-email";
import { syncGmail } from "./jobs/sync-gmail";
import { withJobSpan } from "./telemetry";
import { getApiKeys } from "./ai/gemini";

const command = process.argv[2] ?? "help";

async function main() {
  const keys = getApiKeys();
  console.log(`[Worker] Initialized with command: '${command}'`);
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
      console.log("\n================ [STEP 1/3: GMAIL SYNC] ================");
      const sync = await withJobSpan("worker.gmail_sync", { "job.type": "gmail.sync" }, syncGmail);
      console.log(`[Worker] Gmail sync completed: ${sync.scanned} scanned, ${sync.inserted} inserted.`);

      console.log("\n================ [STEP 2/3: PROCESS EMAILS] ============");
      const process = await withJobSpan(
        "worker.process_emails",
        { "job.type": "email.process" },
        processPendingEmails,
      );
      console.log(`[Worker] Email processing completed: ${process.processed} processed.`);

      console.log("\n================ [STEP 3/3: GENERATE BRIEFING] =========");
      const briefing = await withJobSpan(
        "worker.generate_briefing",
        { "job.type": "briefing.generate" },
        generateDailyBriefing,
      );
      console.log(`[Worker] Briefing generation completed:`, briefing);

      console.log("\n================ [PIPELINE FINISHED] ===================");
      console.log(JSON.stringify({ command, sync, process, briefing }));
      break;
    }
    default:
      console.log("Usage: tsx src/index.ts <sync|backfill|process|briefing|run>");
  }
}

main()
  .then(() => {
    console.log("[Worker] Exiting with success.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n[Worker] FATAL PIPELINE ERROR:", error);
    process.exit(1);
  });
