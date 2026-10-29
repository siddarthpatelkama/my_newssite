import { generateDailyBriefing } from "./jobs/generate-briefing";
import { processPendingEmails } from "./jobs/process-email";
import { syncGmail } from "./jobs/sync-gmail";
import { withJobSpan } from "./telemetry";

const command = process.argv[2] ?? "help";

async function main() {
  switch (command) {
    case "sync": {
      const result = await withJobSpan("worker.gmail_sync", { "job.type": "gmail.sync" }, syncGmail);
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "backfill": {
      const result = await withJobSpan("worker.gmail_backfill", { "job.type": "gmail.backfill" }, () => syncGmail({ backfill: true }));
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "process": {
      const result = await withJobSpan("worker.process_emails", { "job.type": "email.process" }, processPendingEmails);
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "briefing": {
      const result = await withJobSpan("worker.generate_briefing", { "job.type": "briefing.generate" }, generateDailyBriefing);
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "run": {
      const sync = await withJobSpan("worker.gmail_sync", { "job.type": "gmail.sync" }, syncGmail);
      const process = await withJobSpan("worker.process_emails", { "job.type": "email.process" }, processPendingEmails);
      const briefing = await withJobSpan("worker.generate_briefing", { "job.type": "briefing.generate" }, generateDailyBriefing);
      console.log(JSON.stringify({ command, sync, process, briefing }));
      break;
    }
    default:
      console.log("Usage: tsx src/index.ts <sync|backfill|process|briefing|run>");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
