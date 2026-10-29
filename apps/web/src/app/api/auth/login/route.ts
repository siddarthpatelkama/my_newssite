import { NextRequest, NextResponse } from "next/server";
import { authConfigured, createSessionToken, passwordMatches, sessionCookieName, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!authConfigured()) {
    return NextResponse.json({ error: "Set APP_PASSWORD and APP_SESSION_SECRET in apps/web/.env.local first." }, { status: 503 });
  }

  let body: { password?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.password !== "string" || !(await passwordMatches(body.password))) {
    return NextResponse.json({ error: "That password did not match." }, { status: 401 });
  }

  const next = typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//")
    ? body.next
    : "/";
  const response = NextResponse.json({ next });
  response.cookies.set(sessionCookieName(), await createSessionToken(), sessionCookieOptions);
  return response;
}
