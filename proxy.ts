import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Optimistic check only: a cookie being present doesn't mean the session is
// valid. Pages and actions call requireUser() for the real check. This never
// redirects away from /sign-in, so a stale cookie can't cause a loop.
export function proxy(request: NextRequest): NextResponse {
  if (getSessionCookie(request)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("returnTo", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/resumes/:path*", "/settings/:path*"],
};
