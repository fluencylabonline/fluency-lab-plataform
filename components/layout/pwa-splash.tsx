"use client";

import { useEffect, useState } from "react";
import { useDevice } from "@/hooks/ui/use-device";
import { SplashScreen } from "../ui/splash-screen";

export function PwaSplash() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check synchronously on mount (client-side)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                         (window.navigator as any).standalone === true;
    const hasShown = sessionStorage.getItem("pwa-splash-shown");

    if (isStandalone && !hasShown) {
      setShowSplash(true);
      sessionStorage.setItem("pwa-splash-shown", "true");
      
      const hideTimer = setTimeout(() => {
        setShowSplash(false);
        // Remove the blocking class after the splash is done
        document.documentElement.classList.remove("pwa-initializing");
      }, 3500); 

      return () => {
        clearTimeout(hideTimer);
        document.documentElement.classList.remove("pwa-initializing");
      };
    }
  }, []);


  if (!showSplash) return null;

  return <SplashScreen />;
}