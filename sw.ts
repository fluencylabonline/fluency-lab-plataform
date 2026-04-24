/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
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
    const icon = data.icon || "/icons/android/android-launchericon-192-192.png";
    const badge = data.badge || "/icons/android/android-launchericon-96-96.png";
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

serwist.addEventListeners();
