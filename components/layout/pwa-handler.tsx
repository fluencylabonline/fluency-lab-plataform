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

import { useDeviceStore, type BeforeInstallPromptEvent } from "@/hooks/ui/use-device";

const MOBILE_BREAKPOINT = 768;

export function PwaHandler() {
  const { setDeferredPrompt, setUpdateAvailable, setRegistration, setStandalone, setIsMobile } = useDeviceStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Mobile Detection
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    mql.addEventListener("change", checkMobile);

    // Standalone Detection
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const checkStandalone = () => {
      const isStandaloneMode =
        mediaQuery.matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

      setStandalone(isStandaloneMode);
    };

    checkStandalone();
    mediaQuery.addEventListener("change", checkStandalone);

    return () => {
      mql.removeEventListener("change", checkMobile);
      mediaQuery.removeEventListener("change", checkStandalone);
    };
  }, [setStandalone, setIsMobile]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log("[PWA] beforeinstallprompt fired");
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt" as unknown as keyof WindowEventMap, handleBeforeInstallPrompt as EventListener);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const initPwaSupport = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          setRegistration(registration);

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
        } catch {
          //console.error("PWA Handler error:", error);
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
