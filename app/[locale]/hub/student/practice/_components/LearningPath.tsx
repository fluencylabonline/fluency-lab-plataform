"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Lock,
  CheckCircle2,
  BookOpen,
  PenTool,
  Shuffle,
  Star,
  Headphones,
  RotateCcw,
} from "lucide-react";
import type { PracticeMode } from "@/modules/learning/learning.types";
import { ReplayConfirmVault } from "./ReplayConfirmVault";
import { useState } from "react";

interface DayNode {
  dayIndex: number;
  mode: PracticeMode;
  status: "completed" | "available" | "locked";
  xpEarned?: number;
  accuracy?: number;
  /** If true, student can re-practice (costs XP) */
  canReplay?: boolean;
}

interface LearningPathProps {
  planId: string;
  days: DayNode[];
  /** The day the student should practice today */
  todayDay: number;
  userXP: number;
}

const MODE_CONFIG: Record<PracticeMode, { label: string; icon: React.ReactNode; color: string; emoji: string }> = {
  flashcard_visual: { label: "Flashcards", icon: <BookOpen size={22} />, color: "bg-blue-500", emoji: "🃏" },
  gap_fill_listening: { label: "Preencher Lacuna", icon: <Headphones size={22} />, color: "bg-purple-500", emoji: "🎧" },
  sentence_unscramble: { label: "Reorganizar", icon: <Shuffle size={22} />, color: "bg-orange-500", emoji: "🔀" },
  flashcard_recall: { label: "Memória", icon: <Star size={22} />, color: "bg-indigo-500", emoji: "⭐" },
  quiz_comprehensive: { label: "Quiz", icon: <PenTool size={22} />, color: "bg-emerald-500", emoji: "✏️" },
  listening_choice: { label: "Compreensão", icon: <Headphones size={22} />, color: "bg-rose-500", emoji: "🎙️" },
  review_standard: { label: "Revisão", icon: <RotateCcw size={22} />, color: "bg-slate-500", emoji: "🔁" },
};

const DAY_LABELS = ["Dia 1", "Dia 2", "Dia 3", "Dia 4", "Dia 5", "Dia 6"];

// Zigzag X positions for nodes (percentage offset from center)
const ZIGZAG: number[] = [0, 30, -30, 30, 0, -30];

export function LearningPath({ planId, days, todayDay, userXP }: LearningPathProps) {
  const router = useRouter();
  const [replayNode, setReplayNode] = useState<DayNode | null>(null);

  const handleNodePress = (day: DayNode) => {
    if (day.status === "locked") return;

    if (day.status === "completed" && day.canReplay) {
      setReplayNode(day);
      return;
    }

    if (day.status === "available") {
      router.push(`/hub/student/practice/session?planId=${planId}&day=${day.dayIndex}`);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto gap-0 pb-24 pt-4">
      {days.map((day, index) => {
        const config = MODE_CONFIG[day.mode];
        const offsetX = ZIGZAG[index] ?? 0;
        const isToday = day.dayIndex === todayDay && day.status === "available";

        return (
          <motion.div
            key={day.dayIndex}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center"
            style={{ marginLeft: `${offsetX}%` }}
          >
            {/* Connector line (except for the first node) */}
            {index > 0 && (
              <div
                className={cn(
                  "w-0.5 h-10 -mt-1 -mb-1",
                  day.status === "locked" ? "bg-muted" : "bg-border"
                )}
              />
            )}

            {/* "Today" label */}
            {isToday && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest"
              >
                Hoje
              </motion.div>
            )}

            {/* Main node button */}
            <button
              onClick={() => handleNodePress(day)}
              disabled={day.status === "locked"}
              className={cn(
                "relative w-20 h-20 rounded-[28px] flex flex-col items-center justify-center transition-all duration-200",
                "border-b-4 active:border-b-2 active:translate-y-0.5",
                day.status === "completed" && `${config.color} border-black/20 text-white`,
                day.status === "available" && `${config.color} border-black/25 text-white`,
                day.status === "locked" && "bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed opacity-60",
                isToday && "ring-4 ring-primary/30 scale-110",
              )}
            >
              {day.status === "completed" ? (
                <CheckCircle2 size={28} className="text-white fill-white/20" />
              ) : day.status === "locked" ? (
                <Lock size={22} />
              ) : (
                config.icon
              )}

              {/* XP badge for completed days */}
              {day.status === "completed" && day.xpEarned !== undefined && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-full px-1.5 py-0.5 leading-tight border-2 border-white">
                  +{day.xpEarned}
                </span>
              )}

              {/* Replay icon for completed days */}
              {day.status === "completed" && day.canReplay && (
                <span className="absolute -bottom-2 -right-2 bg-background rounded-full p-0.5 border border-border">
                  <RotateCcw size={12} className="text-muted-foreground" />
                </span>
              )}
            </button>

            {/* Day label */}
            <div className="mt-2 mb-1 text-center">
              <p className={cn(
                "text-xs font-bold",
                day.status === "locked" ? "text-muted-foreground/50" : "text-foreground"
              )}>
                {DAY_LABELS[day.dayIndex - 1] ?? `Dia ${day.dayIndex}`}
              </p>
              <p className={cn(
                "text-[10px]",
                day.status === "locked" ? "text-muted-foreground/40" : "text-muted-foreground"
              )}>
                {config.emoji} {config.label}
              </p>
            </div>
          </motion.div>
        );
      })}

      {/* Completion celebration */}
      {days.every((d) => d.status === "completed") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 p-6 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-center max-w-xs mx-auto"
        >
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-bold text-yellow-800 dark:text-yellow-300 text-sm">Ciclo completo!</p>
          <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
            Você completou todos os 6 dias de prática.
          </p>
        </motion.div>
      )}

      {/* Replay Confirmation Vault */}
      <ReplayConfirmVault
        isOpen={!!replayNode}
        onOpenChange={(open) => !open && setReplayNode(null)}
        planId={planId}
        dayIndex={replayNode?.dayIndex || 1}
        currentDay={todayDay}
        userXP={userXP}
      />
    </div>
  );
}
