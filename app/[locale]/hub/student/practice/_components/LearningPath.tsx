"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Lock,
  Star,
  RotateCcw,
  Image as ImageIcon,
  Shuffle,
  Brain,
  FileQuestion,
  Headphones,
  History as HistoryIcon
} from "lucide-react";
import type { PracticeMode } from "@/modules/learning/learning.types";
import { ReplayConfirmVault } from "./ReplayConfirmVault";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

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

// Configurações visuais do Snake Design
const CONFIG = {
  desktopItemHeight: 140, // Distância vertical entre bolinhas
  desktopAmplitude: 80, // O quanto ela vai para esquerda/direita (zigue-zague)
  desktopCenter: 150, // O centro do container (largura 300px / 2)
};

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

  const sortedDays = [...days].sort((a, b) => a.dayIndex - b.dayIndex);

  // Filtro para Mobile (Mostra janela de 3 dias baseada na lição atual)
  const currentIndex = sortedDays.findIndex(d => d.dayIndex === todayDay);
  let mobileStartIndex = currentIndex - 1;
  if (mobileStartIndex < 0) mobileStartIndex = 0;
  if (mobileStartIndex > sortedDays.length - 3) mobileStartIndex = Math.max(0, sortedDays.length - 3);
  const mobileDays = sortedDays.slice(mobileStartIndex, mobileStartIndex + 3);

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-row justify-between items-center mt-3 px-4">
        <div />
        <span className="text-lg font-bold text-primary">Plano</span>
        <Link
          className="text-muted-foreground hover:text-primary"
          href="/student/practice"
        >
          <HistoryIcon size={20} />
        </Link>
      </div>

      <div className="w-full relative flex flex-col items-center py-12">
      {/* Replay Confirmation Vault */}
      <ReplayConfirmVault
        isOpen={!!replayNode}
        onOpenChange={(open) => !open && setReplayNode(null)}
        planId={planId}
        dayIndex={replayNode?.dayIndex || 1}
        currentDay={todayDay}
        userXP={userXP}
      />

      {/* ================= MOBILE VIEW (Horizontal Window) ================= */}
      <div className="flex lg:hidden flex-col items-center w-full py-8">
        <div className="relative flex items-center justify-center gap-6 md:gap-12">
          {/* Linha de Fundo Mobile */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-primary/10 -z-10 -translate-y-1/2 rounded-full" />

          {mobileDays.map((day) => (
            <NodeItem
              key={day.dayIndex}
              day={day}
              isMobile={true}
              onClick={() => handleNodePress(day)}
            />
          ))}
        </div>
      </div>

      {/* ================= DESKTOP VIEW (Vertical ZigZag) ================= */}
      <div
        className="hidden lg:block relative w-[300px]"
        style={{ height: sortedDays.length * CONFIG.desktopItemHeight + 100 }}
      >
        <SnakePathSVG days={sortedDays} />

        {sortedDays.map((day, index) => {
          const pos = getPosition(index); // Pega X e Y exatos
          return (
            <div
              key={day.dayIndex}
              className="absolute top-0 left-0 transition-all duration-500"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                marginLeft: -48,
                marginTop: -48,
              }}
            >
              <NodeItem
                day={day}
                isMobile={false}
                onClick={() => handleNodePress(day)}
              />
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );
}

// --- Lógica Matemática do Posicionamento ---
function getPosition(index: number) {
  const y = index * CONFIG.desktopItemHeight + 80;
  let x = CONFIG.desktopCenter;

  const cycle = index % 4;
  if (cycle === 1) x = CONFIG.desktopCenter - CONFIG.desktopAmplitude;
  if (cycle === 3) x = CONFIG.desktopCenter + CONFIG.desktopAmplitude;

  return { x, y };
}

// --- Componente da Linha Curva (SVG) ---
function SnakePathSVG({ days }: { days: DayNode[] }) {
  let pathD = "";

  days.forEach((_, index) => {
    if (index === days.length - 1) return;

    const current = getPosition(index);
    const next = getPosition(index + 1);

    if (index === 0) pathD += `M ${current.x} ${current.y} `;

    const midY = (current.y + next.y) / 2;
    pathD += `C ${current.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y} `;
  });

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="20 20"
        className="text-primary/10 dark:text-primary/5"
      />
    </svg>
  );
}

// --- Componente Visual do Botão (Node) ---
function NodeItem({
  day,
  isMobile,
  onClick,
}: {
  day: DayNode;
  isMobile: boolean;
  onClick: () => void;
}) {
  const isToday = day.status === "available";

  const renderIcon = () => {
    if (day.status === "completed") {
      return (
        <div className="relative">
          <Star size={isMobile ? 28 : 32} fill="currentColor" className="text-yellow-100" />
        </div>
      );
    }
    if (day.status === "locked") {
      return <Lock size={isMobile ? 24 : 28} />;
    }
    const Icon = getIconForMode(day.mode);
    return <Icon size={isMobile ? 28 : 32} strokeWidth={2.5} />;
  };

  return (
    <div className="flex flex-col items-center relative group z-10">
      <div
        onClick={onClick}
        className={
          day.status === "locked" ? "cursor-default" : "cursor-pointer"
        }
      >
        <motion.div
          whileHover={
            day.status !== "locked" ? { scale: 1.1, translateY: -5 } : {}
          }
          whileTap={day.status !== "locked" ? { scale: 0.95 } : {}}
          className={cn(
            "rounded-[35px] flex items-center justify-center shadow-lg transition-all relative border-b-[6px]",
            isMobile ? "w-20 h-20" : "w-24 h-24",

            day.status === "completed"
              ? "bg-yellow-400 border-yellow-600 text-white"
              : day.status === "available"
                ? "bg-primary border-primary/80 text-white ring-8 ring-primary/20"
                : "bg-muted border-muted-foreground/20 text-muted-foreground/40",
          )}
        >
          {renderIcon()}

          {/* Balão "HOJE" */}
          {isToday && (
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -10 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 0.8,
              }}
              className="absolute -top-12 bg-white dark:bg-slate-200 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border-2 border-primary/10 z-20 whitespace-nowrap"
            >
              HOJE
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-200 border-b-2 border-r-2 border-primary/10 rotate-45"></div>
            </motion.div>
          )}

          {/* Replay icon for completed days */}
          {day.status === "completed" && day.canReplay && (
            <span className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border border-border">
              <RotateCcw size={12} className="text-muted-foreground" />
            </span>
          )}
          
          {/* XP badge for completed days */}
          {day.status === "completed" && day.xpEarned !== undefined && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-full px-1.5 py-0.5 leading-tight border-2 border-white">
              +{day.xpEarned}
            </span>
          )}
        </motion.div>
      </div>

      <div
        className={cn(
          "mt-3 font-bold uppercase tracking-widest text-[10px]",
          isToday ? "text-primary" : "text-slate-500 dark:text-slate-600",
        )}
      >
        Dia {day.dayIndex}
      </div>
    </div>
  );
}

function getIconForMode(mode: PracticeMode) {
  switch (mode) {
    case "flashcard_visual": return ImageIcon;
    case "gap_fill_listening": return Headphones;
    case "sentence_unscramble": return Shuffle;
    case "flashcard_recall": return Brain;
    case "quiz_comprehensive": return FileQuestion;
    case "listening_choice": return Headphones;
    default: return FileQuestion;
  }
}
