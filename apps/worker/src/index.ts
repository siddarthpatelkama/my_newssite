import { generateDailyBriefing } from "./jobs/generate-briefing";
import { processPendingEmails } from "./jobs/process-email";
import { syncGmail } from "./jobs/sync-gmail";

const command = process.argv[2] ?? "help";

async function main() {
  switch (command) {
    case "sync": {
      const result = await syncGmail();
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "backfill": {
      const result = await syncGmail({ backfill: true });
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "process": {
      const result = await processPendingEmails();
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "briefing": {
      const result = await generateDailyBriefing();
      console.log(JSON.stringify({ command, ...result }));
      break;
    }
    case "run": {
      const sync = await syncGmail();
      const process = await processPendingEmails();
      const briefing = await generateDailyBriefing();
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
