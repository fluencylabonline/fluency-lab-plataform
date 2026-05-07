"use client";

import { useEffect, useState } from "react";
import { useDevice } from "@/hooks/ui/use-device";
import { TransitionAnimation } from "@/components/ui/transition-animation";

export function PwaSplash() {
  const { isStandalone } = useDevice();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Only show splash in standalone (PWA) mode
    // We use sessionStorage to ensure it only shows once per "session" (app open)
    // even if the RootLayout re-mounts (unlikely in Next.js but safe)
    const hasShown = sessionStorage.getItem("pwa-splash-shown");

    if (isStandalone && !hasShown) {
      // Use a timeout to avoid synchronous setState inside useEffect
      const startTimer = setTimeout(() => {
        setShowSplash(true);
        sessionStorage.setItem("pwa-splash-shown", "true");
      }, 0);
      
      const hideTimer = setTimeout(() => {
        setShowSplash(false);
      }, 4000); // Show for 4 seconds

      return () => {
        clearTimeout(startTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isStandalone]);

  if (!showSplash) return null;

  return <TransitionAnimation />;
}
