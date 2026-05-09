"use client";

import { useEffect, useState } from "react";
import { useDevice } from "@/hooks/ui/use-device";
import { SplashScreen } from "../ui/splash-screen";

export function PwaSplash() {
  const { isStandalone } = useDevice();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if the inline script flagged this as a cold start
    const isInitializing = document.documentElement.classList.contains("pwa-initializing");
    
    if (isStandalone && isInitializing) {
      setTimeout(() => {
        setShowSplash(true);
        sessionStorage.setItem("pwa-splash-shown", "true");
      }, 0);

      // The SplashScreen component handles its own animation (approx 3s)
      // We wait slightly longer than the internal timers to ensure a smooth transition
      const timer = setTimeout(() => {
        setShowSplash(false);
        document.documentElement.classList.remove("pwa-initializing");
      }, 3200); 

      return () => clearTimeout(timer);
    } else {
      // If we're not initializing, ensure the class is removed just in case
      document.documentElement.classList.remove("pwa-initializing");
    }
  }, [isStandalone]);

  if (!showSplash) return null;

  return <SplashScreen />;
}
