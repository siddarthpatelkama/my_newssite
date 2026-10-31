import { NextRequest, NextResponse } from "next/server";
import { fetchCustomFeed } from "@/lib/radar";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const feedUrl = body?.url;
    if (!feedUrl || typeof feedUrl !== "string") {
      return NextResponse.json({ error: "Missing or invalid feed url" }, { status: 400 });
    }
    const items = await fetchCustomFeed(feedUrl);
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch feed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedUrl = searchParams.get("url");

  if (!feedUrl) {
    return NextResponse.json({ error: "Missing feed url" }, { status: 400 });
  }

  try {
    const items = await fetchCustomFeed(feedUrl);
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

