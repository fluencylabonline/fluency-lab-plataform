/// <reference lib="webworker" />
import { 
  type PrecacheEntry, 
  type RouteMatchCallbackOptions,
  type RuntimeCaching,
  Serwist,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  RangeRequestsPlugin,
  StaleWhileRevalidate 
} from "serwist";
import { PUBLIC_PAGES_CACHE, PUBLIC_PAGE_PATHS, purgePrivateCaches } from "./lib/pwa-cache";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// HTML e RSC de páginas logadas nunca vão para o Cache Storage: a chave é só a
// URL, então outra pessoa no mesmo aparelho veria a página de quem saiu.
const isPublicPage = (pathname: string) => PUBLIC_PAGE_PATHS.includes(pathname.replace(/\/$/, "") || "/");

const customCache: RuntimeCaching[] = [
  // 1. Google Fonts Webfonts
  {
    matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "google-fonts-webfonts",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 2. Google Fonts Stylesheets
  {
    matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "google-fonts-stylesheets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 3. Static Font Files
  {
    matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
    handler: new CacheFirst({
      cacheName: "static-font-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 4. Static Images (Optimized to CacheFirst)
  {
    matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: new CacheFirst({
      cacheName: "static-image-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 120, // High limit to store learning assets
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 5. Next.js Optimized Images (Optimized to CacheFirst)
  {
    matcher: /\/_next\/image\?url=.+$/i,
    handler: new CacheFirst({
      cacheName: "next-image",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 120,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 6. Next.js Static JS (StaleWhileRevalidate to prevent stale action hashes across deployments)
  {
    matcher: /\/_next\/static.+\.js$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "next-static-js-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 96,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 7. Practice Sound and Audio Files (CacheFirst with Range Requests, 30 days TTL)
  {
    matcher: /\.(?:mp3|wav|ogg)$/i,
    handler: new CacheFirst({
      cacheName: "static-audio-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 150, // Holds many pronunciation/listening bits
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxAgeFrom: "last-used",
        }),
        new RangeRequestsPlugin(),
      ],
    }),
  },
  // 8. Dynamic/Static Video Assets (CacheFirst with Range Requests, 15 days TTL)
  {
    matcher: /\.(?:mp4|webm)$/i,
    handler: new CacheFirst({
      cacheName: "static-video-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 15 * 24 * 60 * 60, // 15 days
          maxAgeFrom: "last-used",
        }),
        new RangeRequestsPlugin(),
      ],
    }),
  },
  // 9. Standard Static Javascript Assets (StaleWhileRevalidate)
  {
    matcher: /\.(?:js)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-js-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 48,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 10. Static CSS/Styles (StaleWhileRevalidate)
  {
    matcher: /\.(?:css|less)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-style-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 11. Next.js Data requests (NetworkFirst)
  {
    matcher: /\/_next\/data\/.+\/.+\.json$/i,
    handler: new NetworkFirst({
      cacheName: "next-data",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 12. Generic static JSON/XML/CSV (NetworkFirst)
  {
    matcher: /\.(?:json|xml|csv)$/i,
    handler: new NetworkFirst({
      cacheName: "static-data-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // 13. Exclude /api/auth/* from PWA caching entirely
  {
    matcher: /\/api\/auth\/.*/,
    handler: new NetworkOnly({
      networkTimeoutSeconds: 10,
    }),
  },
  // 14. API requests: respostas por usuário — sem Cache Storage. O cache HTTP
  // do navegador ainda vale para quem manda `Cache-Control: private`.
  {
    matcher: ({ sameOrigin, url: { pathname } }: RouteMatchCallbackOptions) => sameOrigin && pathname.startsWith("/api/"),
    method: "GET",
    handler: new NetworkOnly(),
  },
  // 15. Next.js RSC Prefetch requests (NetworkFirst)
  {
    matcher: ({ request, url: { pathname }, sameOrigin }: RouteMatchCallbackOptions) =>
      request.headers.get("RSC") === "1" && request.headers.get("Next-Router-Prefetch") === "1" && sameOrigin && isPublicPage(pathname),
    handler: new NetworkFirst({
      cacheName: PUBLIC_PAGES_CACHE.rscPrefetch,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    }),
  },
  // 16. Next.js RSC standard requests (NetworkFirst)
  {
    matcher: ({ request, url: { pathname }, sameOrigin }: RouteMatchCallbackOptions) => request.headers.get("RSC") === "1" && sameOrigin && isPublicPage(pathname),
    handler: new NetworkFirst({
      cacheName: PUBLIC_PAGES_CACHE.rsc,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    }),
  },
  // Exclude the /hub redirector route from caching to prevent Serwist redirect caching errors
  {
    matcher: ({ url: { pathname } }: RouteMatchCallbackOptions) => pathname === "/hub" || pathname === "/hub/",
    handler: new NetworkOnly(),
  },
  // 17. HTML Document Requests (NetworkFirst)
  {
    matcher: ({ request, url: { pathname }, sameOrigin }: RouteMatchCallbackOptions) =>
      request.mode === "navigate" && sameOrigin && isPublicPage(pathname),
    handler: new NetworkFirst({
      cacheName: PUBLIC_PAGES_CACHE.html,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
      // Without a timeout, a hung/slow network leaves the request pending
      // indefinitely instead of falling back to the cached page quickly.
      networkTimeoutSeconds: 10,
    }),
  },
  // 17b. Demais páginas (logadas): sempre rede. Offline cai no fallback /offline.
  {
    matcher: ({ request, sameOrigin }: RouteMatchCallbackOptions) =>
      sameOrigin && (request.mode === "navigate" || request.headers.get("RSC") === "1"),
    handler: new NetworkOnly(),
  },
  // 18. Other local GETs (NetworkFirst)
  {
    matcher: ({ url: { pathname }, sameOrigin }: RouteMatchCallbackOptions) => sameOrigin && !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: "others",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    }),
  },
  // 19. External GETs (NetworkFirst with short life)
  {
    matcher: ({ sameOrigin }: RouteMatchCallbackOptions) => !sameOrigin,
    handler: new NetworkFirst({
      cacheName: "cross-origin",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 60 * 60, // 1 hour
        }),
      ],
      networkTimeoutSeconds: 10,
    }),
  },
  // 20. Default catch-all (NetworkOnly)
  {
    matcher: /.*/i,
    method: "GET",
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: customCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json();
  if (data) {
    const title = data.title || "Notificação";
    const body = data.body || "";
    const icon = data.icon || "/icons/notification/notification-192.png";
    const badge = data.badge || "/icons/notification/notification-96.png";
    const url = data.url || "/hub";
    const type = data.type || "info";

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon,
        badge,
        data: { url, type },
      })
    );
  }
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || "/")
  );
});

interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
}

// Background Sync support
self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "sync-practice-queue") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SYNC_QUEUE" });
        });
      })
    );
  }
});

/**
 * Web Share Target: the OS share sheet POSTs the shared audio here. Files cannot be
 * carried in a redirect, so they are parked in the Cache API and the import page
 * picks them up (see SHARED_AUDIO_CACHE in the audio import component).
 */
const SHARED_AUDIO_CACHE = "shared-audio";

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "POST" || url.pathname !== "/share-target") return;

  event.respondWith(
    (async () => {
      try {
        const formData = await event.request.formData();
        const files = formData.getAll("audio").filter((f): f is File => f instanceof File);
        const cache = await caches.open(SHARED_AUDIO_CACHE);
        for (const key of await cache.keys()) await cache.delete(key);
        await Promise.all(
          files.map((file, index) =>
            cache.put(
              `/__shared-audio/${index}`,
              new Response(file, {
                headers: {
                  "Content-Type": file.type || "application/octet-stream",
                  "X-File-Name": encodeURIComponent(file.name),
                },
              }),
            ),
          ),
        );
        return Response.redirect("/hub/admin/students/onboarding/from-audio?shared=1", 303);
      } catch {
        return Response.redirect("/hub/admin/students/onboarding/from-audio", 303);
      }
    })(),
  );
});

// Versões antigas do SW guardavam /hub e /api no Cache Storage. Ao ativar esta
// versão, apagamos esses caches de todos os aparelhos.
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(purgePrivateCaches());
});

serwist.addEventListeners();
