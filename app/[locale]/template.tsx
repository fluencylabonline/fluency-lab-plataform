"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export default function Template({ children }: { children: React.ReactNode }) {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as NavigatorStandalone).standalone;
      setIsPWA(!!isStandalone);
    };
    checkPWA();
  }, []);

  const variants = {
    hidden: isPWA ? { x: 30, opacity: 0 } : { opacity: 0 },
    enter: { x: 0, opacity: 1 },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="enter"
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        opacity: { duration: 0.2 }
      }}
      className="flex flex-col flex-1 w-full h-full"
    >
      {children}
    </motion.div>
  );
}