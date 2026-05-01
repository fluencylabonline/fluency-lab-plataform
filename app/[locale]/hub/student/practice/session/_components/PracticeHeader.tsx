"use client";

import { X, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface PracticeHeaderProps {
  progress: number; // 0 to 100
  streak?: number;
  onClose: () => void;
}

export function PracticeHeader({ progress, streak = 0, onClose }: PracticeHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 p-2 px-3 bg-background/80 backdrop-blur-sm border-b border-border">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="shrink-0 hover:bg-muted transition-colors rounded-full"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </Button>

      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          <div className="absolute top-1 left-0 right-0 h-1 bg-white/30 rounded-full" />
        </motion.div>
      </div>

      {streak > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="text-base font-bold text-orange-500">{streak}</span>
        </div>
      )}
    </header>
  );
}
