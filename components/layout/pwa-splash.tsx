"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "../ui/splash-screen";

export function PwaSplash() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                         ("standalone" in window.navigator && (window.navigator as Navigator & { standalone: boolean }).standalone === true);
    const hasShown = sessionStorage.getItem("pwa-splash-shown");
    const willShow = !!(isStandalone && !hasShown);
    if (willShow) {
      window.__pwa_initializing = true;
    }
    return willShow;
  });

  useEffect(() => {
    if (showSplash) {
      sessionStorage.setItem("pwa-splash-shown", "true");
      
      // Garante que a classe pwa-initializing está presente mesmo após a hidratação do React
      document.documentElement.classList.add("pwa-initializing");
      
      // Hide the static splash as soon as the animated one is ready
      const staticSplash = document.getElementById("pwa-static-splash");
      if (staticSplash) {
        staticSplash.style.display = "none";
      }

      const hideTimer = setTimeout(() => {
        setShowSplash(false);
        window.__pwa_initializing = false;
        document.documentElement.classList.remove("pwa-initializing");
        window.dispatchEvent(new Event("pwa-splash-hidden"));
      }, 3000); 

      return () => {
        clearTimeout(hideTimer);
        window.__pwa_initializing = false;
        document.documentElement.classList.remove("pwa-initializing");
        window.dispatchEvent(new Event("pwa-splash-hidden"));
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