"use client";

import { useEffect, useState } from "react";
import { useDevice } from "@/hooks/ui/use-device";
import { SplashScreen } from "../ui/splash-screen";

export function PwaSplash() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                         (window.navigator as any).standalone === true;
    const hasShown = sessionStorage.getItem("pwa-splash-shown");
    return !!(isStandalone && !hasShown);
  });

  useEffect(() => {
    if (showSplash) {
      sessionStorage.setItem("pwa-splash-shown", "true");
      
      const hideTimer = setTimeout(() => {
        setShowSplash(false);
        document.documentElement.classList.remove("pwa-initializing");
      }, 3000); // Synced with SplashScreen.tsx total time

      return () => {
        clearTimeout(hideTimer);
        document.documentElement.classList.remove("pwa-initializing");
      };
    }
  }, [showSplash]);

  if (!showSplash) return null;

  return (
    <div suppressHydrationWarning>
      <SplashScreen />
    </div>
  );
}