"use client";

import { useEffect } from "react";
import { saveSubscriptionAction } from "@/modules/notification/notification.actions";
import { env } from "@/env";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

import { usePwaStore, type BeforeInstallPromptEvent } from "@/hooks/ui/use-pwa-store";

export function PwaHandler() {
  const { setDeferredPrompt, setUpdateAvailable, setRegistration, setStandalone } = usePwaStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    
    const checkStandalone = () => {
      const isStandaloneMode = 
        mediaQuery.matches || 
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      
      console.log("[PWA] Standalone mode:", isStandaloneMode);
      setStandalone(isStandaloneMode);
    };

    checkStandalone();
    mediaQuery.addEventListener("change", checkStandalone);

    return () => mediaQuery.removeEventListener("change", checkStandalone);
  }, [setStandalone]);

  useEffect(() => {
    // 1. Capture Install Prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log("[PWA] beforeinstallprompt fired");
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt" as unknown as keyof WindowEventMap, handleBeforeInstallPrompt as EventListener);

    // 2. Handle Service Worker and Push
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const initPwaSupport = async () => {
        try {
          console.log("[PWA] Waiting for service worker ready...");
          const registration = await navigator.serviceWorker.ready;
          console.log("[PWA] Service worker ready and registered");
          setRegistration(registration);

          // Detect Updates
          const onUpdate = () => {
            setUpdateAvailable(true);
          };

          if (registration.waiting) {
            onUpdate();
          }

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  onUpdate();
                }
              });
            }
          });

          // Original Push Subscription logic
          let subscription = await registration.pushManager.getSubscription();

          if (!subscription && Notification.permission === "granted") {
            const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey,
            });
          }

          if (subscription) {
            await saveSubscriptionAction({ subscription: subscription.toJSON() });
          }
        } catch (error) {
          console.error("PWA Handler error:", error);
        }
      };

      initPwaSupport();
    }

    return () => {
      window.removeEventListener("beforeinstallprompt" as unknown as keyof WindowEventMap, handleBeforeInstallPrompt as EventListener);
    };
  }, [setDeferredPrompt, setRegistration, setUpdateAvailable]);

  return null;
}
