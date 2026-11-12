import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy responsibilities (runs before every non-static request):
 *  1. Generate a per-request CSP nonce and emit the Content-Security-Policy header. Next.js reads the
 *     nonce from the request's CSP header and attaches it to its own inline scripts, so a strict
 *     `script-src 'self' 'nonce-…' 'strict-dynamic'` policy works without 'unsafe-inline'.
 *     Pages must render dynamically for this to apply — the root layout reads `headers()` to guarantee it.
 *  2. Optimistic auth routing: visitors with no session cookie at all are sent to /login before a
 *     protected page renders. The cookie is NOT verified here; pages call requireUserPage/requireRolePage.
 *  3. Hide /dev/* in production.
 */
const SESSION_COOKIE = "sfp_session";

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are used by Tailwind arbitrary values, next/font and lightweight-charts.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    isDev ? "" : "upgrade-insecure-requests",
  ];
  return directives.filter(Boolean).join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_MAILBOX !== "true") {
      return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain" } });
    }
  }

  const isProtected =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/admin" || pathname.startsWith("/admin/");
  if (isProtected && !request.cookies.get(SESSION_COOKIE)?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, image optimiser output and files with an extension.
    {
      source: "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
