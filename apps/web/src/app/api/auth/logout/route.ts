import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.set(sessionCookieName(), "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
