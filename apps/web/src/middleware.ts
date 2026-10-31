import { NextResponse, type NextRequest } from "next/server";
import { authConfigured, sessionCookieName, verifySessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    path === "/login" ||
    path === "/api/auth/login" ||
    path === "/api/gmail/callback" ||
    path.startsWith("/icon") ||
    path.startsWith("/apple-icon") ||
    path === "/favicon.ico" ||
    path.endsWith(".png") ||
    path.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  if (!authConfigured()) {
    return NextResponse.redirect(new URL("/login?setup=required", request.url));
  }

  const token = request.cookies.get(sessionCookieName())?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${path}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
