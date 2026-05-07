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
      setShowSplash(true);
      sessionStorage.setItem("pwa-splash-shown", "true");
      
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 4000); // Show for 4 seconds

      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  if (!showSplash) return null;

  return <TransitionAnimation />;
}
