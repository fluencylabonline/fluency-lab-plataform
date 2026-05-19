import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleIntl = createIntlMiddleware(routing);

/**
 * List of paths that should be considered as auth pages.
 */
const AUTH_PAGES = ["/signin", "/signup", "/forgot-password", "/reset-password"];

/**
 * Normalizes the pathname by removing the locale prefix.
 */
function normalizePathname(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length + 1) || "/";
    }
  }
  return pathname;
}

/**
 * Next.js 16 Proxy (formerly Middleware).
 * Handles both i18n and Route Protection.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session")?.value;

  // 1. Static and public assets exclusion
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico" ||
    pathname === "/sw.js";

  if (isPublicAsset) {
    return NextResponse.next();
  }

  // 2. Normalization
  const normalizedPath = normalizePathname(pathname);

  // 3. Route Protection Logic
  const isAuthPage = AUTH_PAGES.some((page) => normalizedPath.startsWith(page));
  const isPublicPage = ["/", "/privacy", "/terms", "/certificate", "/create-password"].includes(normalizedPath);

  if (!session && !isAuthPage && !isPublicPage) {
    // Redirect unauthenticated users to signin
    const signInUrl = new URL("/signin", request.url);
    // Store original URL to redirect back after login
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (session && (isAuthPage || normalizedPath === "/")) {
    // Redirect authenticated users to the hub
    return NextResponse.redirect(new URL("/hub", request.url));
  }

  // 4. Continue with i18n handling
  return handleIntl(request);
}

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_static (inside /public)
  // - all root files inside /public (e.g. /favicon.ico)
  matcher: ["/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)"],
};
