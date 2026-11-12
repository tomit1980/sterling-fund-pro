import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic routing only. The session cookie is NOT verified here (that happens in the pages via
 * requireUserPage / requireRolePage); we just avoid rendering protected pages for visitors with no
 * cookie at all, and hide /dev/* in production.
 */
const SESSION_COOKIE = "sfp_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain" } });
    }
    return NextResponse.next();
  }

  const isProtected = pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/admin" || pathname.startsWith("/admin/");
  if (isProtected && !request.cookies.get(SESSION_COOKIE)?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

// /login and /register are deliberately not matched: with a (possibly stale) cookie present the
// page itself verifies the session and redirects, so the proxy has nothing to decide there.
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/dev/:path*"],
};
