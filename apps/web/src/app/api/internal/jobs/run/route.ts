import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    note: "Run the worker process for ingestion. This endpoint only authenticates cron. Long Gmail/Gemini jobs belong in apps/worker.",
    commands: ["pnpm worker:sync", "pnpm worker:process", "pnpm worker:briefing"],
  });
}
