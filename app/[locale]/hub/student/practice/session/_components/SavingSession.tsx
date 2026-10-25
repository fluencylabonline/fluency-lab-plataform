"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const DOTS = [0, 1, 2];

export function SavingSession() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="relative flex h-28 w-28 items-center justify-center">
        {/* Expanding rings */}
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
          />
        ))}

        {/* Spinning arc */}
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="70 210"
            className="stroke-primary"
          />
        </motion.svg>

        {/* Center icon */}
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-7 w-7" />
        </motion.div>
      </div>

      <div className="flex items-center gap-1 text-muted-foreground">
        <span className="text-sm font-medium">Salvando sessão</span>
        {DOTS.map((i) => (
          <motion.span
            key={i}
            className="text-sm font-bold"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          >
            .
          </motion.span>
        ))}
      </div>
    </div>
  );
}
