"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ControlButtonProps {
  onClick: () => void;
  isEnabled?: boolean;
  enabledIcon: React.ElementType;
  disabledIcon: React.ElementType;
  variant?: "default" | "destructive";
  className?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  isEnabled = true,
  enabledIcon: EnabledIcon,
  disabledIcon: DisabledIcon,
  variant = "default",
  className,
}) => {
  const isDestructive = variant === "destructive";

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "p-3 rounded-full transition-all duration-200 ease-in-out flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900",
        isDestructive
          ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 shadow-lg shadow-red-500/20"
          : isEnabled
            ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
            : "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 shadow-md shadow-red-500/20",
        className,
      )}
    >
      {isEnabled ? <EnabledIcon size={20} /> : <DisabledIcon size={20} />}
    </motion.button>
  );
};
