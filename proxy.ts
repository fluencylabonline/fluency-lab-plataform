import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleIntl = createIntlMiddleware(routing);

const AUTH_PAGES = ["/signin", "/invite", "/reset-password", "/create-password"];
const PUBLIC_API_ROUTES = ["/api/webhooks"];

/**
 * Next.js 16 Proxy (formerly Middleware).
 * Handles both i18n and Route Protection.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session")?.value;

  // 1. Allow public assets and metadata
  if (
    pathname.includes(".") || // files with extensions (favicon.ico, etc)
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public")
  ) {
    return NextResponse.next();
  }

  // 2. Allow Public API routes
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 3. Route Protection Logic
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (!session && !isAuthPage && pathname !== "/") {
    // Redirect unauthenticated users to signin
    const signInUrl = new URL("/signin", request.url);
    // Store original URL to redirect back after login
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (session && isAuthPage) {
    // Redirect authenticated users away from auth pages (e.g. to dashboard)
    // For now, redirect to root
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. Continue with i18n handling TEMPORARY
  if (pathname === "/") {
    return NextResponse.next();
  }
  return handleIntl(request);
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes, except those we explicitly allow/protect)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
