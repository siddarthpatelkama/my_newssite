import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { encryptSecret } from "@/lib/crypto";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const returnedState = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get("signalos_oauth_state")?.value;
  const stateMatches = Boolean(returnedState && cookieState && returnedState.length === cookieState.length && timingSafeEqual(Buffer.from(returnedState), Buffer.from(cookieState)));
  if (!stateMatches) {
    return NextResponse.json({ error: "OAuth state is missing or invalid. Start the Gmail connection again." }, { status: 400 });
  }

  const responseFor = (response: NextResponse) => {
    response.cookies.set("signalos_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/gmail/callback",
      maxAge: 0,
    });
    return response;
  };
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    return responseFor(NextResponse.redirect(new URL(`/settings?gmail=error`, process.env.APP_URL ?? "http://localhost:3000")));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return responseFor(NextResponse.json({ error: "Missing OAuth code" }, { status: 400 }));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  const tokenKey = process.env.TOKEN_ENCRYPTION_KEY;
  const allowedEmail = process.env.GOOGLE_ALLOWED_EMAIL;
  if (!clientId || !clientSecret || !redirect || !tokenKey || !allowedEmail) {
    return responseFor(NextResponse.json({ error: "OAuth, GOOGLE_ALLOWED_EMAIL, or TOKEN_ENCRYPTION_KEY is not configured" }, { status: 500 }));
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return responseFor(NextResponse.json({ error: "Supabase service role is not configured" }, { status: 500 }));
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirect);
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    return NextResponse.json(
      { error: "Google did not return a refresh token. Revoke access and connect again with prompt=consent." },
      { status: 400 },
    );
  }

  oauth2.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const profile = await gmail.users.getProfile({ userId: "me" });
  if (profile.data.emailAddress?.toLowerCase() !== allowedEmail.trim().toLowerCase()) {
    return responseFor(NextResponse.json({ error: `Connected account does not match GOOGLE_ALLOWED_EMAIL (${allowedEmail}).` }, { status: 403 }));
  }

  const { error } = await supabase.from("gmail_credentials").upsert({
    id: "default",
    account_email: profile.data.emailAddress,
    encrypted_refresh_token: encryptSecret(tokens.refresh_token, tokenKey),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return responseFor(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return responseFor(NextResponse.redirect(new URL("/settings?gmail=connected", process.env.APP_URL ?? "http://localhost:3000")));
}
