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
      
      // Hide the static splash as soon as the animated one is ready
      const staticSplash = document.getElementById("pwa-static-splash");
      if (staticSplash) {
        staticSplash.style.display = "none";
      }

      const hideTimer = setTimeout(() => {
        setShowSplash(false);
        document.documentElement.classList.remove("pwa-initializing");
      }, 3000); 

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