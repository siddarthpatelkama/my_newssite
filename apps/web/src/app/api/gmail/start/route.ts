import { google } from "googleapis";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  const allowedEmail = process.env.GOOGLE_ALLOWED_EMAIL;
  if (!clientId || !clientSecret || !redirect || !allowedEmail) {
    return NextResponse.json(
      { error: "Gmail OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, and GOOGLE_ALLOWED_EMAIL." },
      { status: 500 },
    );
  }

  const state = randomBytes(32).toString("base64url");
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirect);
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state,
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });
  const response = NextResponse.redirect(url);
  response.cookies.set("signalos_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/gmail/callback",
    maxAge: 10 * 60,
  });
  return response;
}
