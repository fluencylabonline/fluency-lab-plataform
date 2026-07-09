import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleIntl = createIntlMiddleware(routing);

/**
 * List of paths that should be considered as auth pages.
 */
const AUTH_PAGES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

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

  // 0. Bugfix: Corrige caminhos bugados vindos de templates do WhatsApp que contêm placeholders da Meta
  if (pathname.includes("%7B%7B1%7D%7D") || pathname.includes("{{1}}")) {
    const cleanedPath = pathname
      .replaceAll("%7B%7B1%7D%7D", "")
      .replaceAll("{{1}}", "");

    const url = new URL(request.url);
    url.pathname = cleanedPath;

    console.log(
      `[Proxy] Redirecting buggy WhatsApp path "${pathname}" to "${cleanedPath}"`,
    );
    return NextResponse.redirect(url, { status: 307 });
  }

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
  const isServerAction =
    request.method === "POST" && request.headers.has("next-action");

  if (!isServerAction) {
    const isAuthPage = AUTH_PAGES.some((page) =>
      normalizedPath.startsWith(page),
    );
    const isPublicPage =
      ["/", "/privacy", "/terms", "/certificate", "/create-password", "/reset-password", "/offline", "/download"].includes(
        normalizedPath,
      ) || normalizedPath.startsWith("/verify");

    if (!session && !isAuthPage && !isPublicPage) {
      // Redirect unauthenticated users to signin
      const signInUrl = new URL("/signin", request.url);
      // Store original URL to redirect back after login
      signInUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (session && isAuthPage) {
      // Redirect authenticated users to the hub
      return NextResponse.redirect(new URL("/hub", request.url));
    }
  }

  // 4. Continue with i18n handling
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'none';
    manifest-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""} https://apis.google.com https://www.youtube.com https://s.ytimg.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' data: https://fonts.gstatic.com;
    img-src 'self' data: blob: https://firebasestorage.googleapis.com https://images.unsplash.com https://i.ytimg.com https://lh3.googleusercontent.com https://*.stream-io-video.com https://*.stream-io-api.com https://user-images.githubusercontent.com;
    connect-src 'self' ${isDev ? "http://localhost:3000 ws://localhost:3000" : ""} https://*.firebaseio.com wss://*.firebaseio.com https://firebasestorage.googleapis.com https://*.googleapis.com https://apis.google.com https://fonts.gstatic.com https://*.stream-io-api.com wss://*.stream-io-api.com wss://*.getstream.io https://api.abacatepay.com https://lrclib.net https://*.stream-io-video.com wss://*.stream-io-video.com https://lh3.googleusercontent.com https://images.unsplash.com https://i.ytimg.com https://viacep.com.br;
    media-src 'self' blob: https://firebasestorage.googleapis.com;
    frame-src https://www.youtube.com https://drive.google.com https://accounts.google.com https://fluency-lab-plataform.firebaseapp.com https://fluencylabplataform.firebaseapp.com https://fluencylabplataform.web.app;
    object-src 'none';
    worker-src 'self' blob:;
    child-src 'self' blob:;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // Injetar nos cabeçalhos da requisição para os Server Components lerem via headers()
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", cspHeader);

  const response = await handleIntl(request);

  // Injetar o CSP na resposta final para o navegador
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_static (inside /public)
  // - all root files inside /public (e.g. /favicon.ico)
  matcher: ["/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)"],
};
