"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Star,
  Lock,
  History as HistoryIcon,
  Image as ImageIcon,
  Ear,
  Shuffle,
  FileQuestion,
  Headphones,
  Play,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

import type { RoadmapLesson as Lesson, PracticeMode } from "@/modules/learning/learning.types";

interface LearningPathProps {
  lessons: Lesson[];
  /** Plano ativo: as práticas da semana abrem a sessão deste plano. */
  planId?: string | null;
}

// Configurações visuais do Snake Design
const CONFIG = {
  desktopItemHeight: 140, // Distância vertical entre bolinhas
  desktopAmplitude: 80, // O quanto ela vai para esquerda/direita (zigue-zague)
  desktopCenter: 150, // O centro do container (largura 300px / 2)
};

/** As 6 práticas de cada aula, na ordem dos dias (mesma ordem da tela de prática). */
const WEEKLY_MODES: Array<{ mode: PracticeMode; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { mode: "flashcard_visual", icon: ImageIcon },
  { mode: "gap_fill_listening", icon: Ear },
  { mode: "sentence_unscramble", icon: Shuffle },
  { mode: "flashcard_recall", icon: Brain },
  { mode: "quiz_comprehensive", icon: FileQuestion },
  { mode: "listening_choice", icon: Headphones },
];

/**
 * Cartão do meio do caderno: dois painéis lado a lado, como um baralho. Deslizar para o lado (ou tocar nos
 * pontos) alterna entre o PLANO (as aulas) e as PRÁTICAS DA SEMANA (os 6 exercícios da aula atual).
 */
export function LearningPath({ lessons, planId }: LearningPathProps) {
  const t = useTranslations("LearningPath");
  const [activePane, setActivePane] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    setActivePane(Math.round(scroller.scrollLeft / scroller.clientWidth));
  };

  const goTo = (index: number) => {
    const scroller = scrollerRef.current;
    scroller?.scrollTo({ left: index * scroller.clientWidth, behavior: "smooth" });
  };

  if (lessons.length === 0) {
    return (
      <div className="card w-full min-h-full flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-2">
          <Brain size={48} className="text-primary" />
        </div>
        <h3 className="text-xl font-bold">{t("noLessonsTitle")}</h3>
        <p className="text-muted-foreground max-w-[250px]">{t("noLessonsMessage")}</p>
      </div>
    );
  }

  const panes = [t("roadmapLabel"), t("weeklyLabel")];

  return (
    <div className="card w-full flex flex-col h-[calc(100dvh-14rem)] min-h-[28rem] lg:h-[calc(100vh-10rem)] overflow-hidden">
      <div className="flex flex-row justify-between items-center py-2 px-6 sticky top-0 z-30">
        {/* Pontos: mostram em qual painel você está e levam ao outro (também dá para deslizar) */}
        <div className="flex items-center gap-1.5 w-8" data-tour="student-notebook.weekly" role="tablist">
          {panes.map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={activePane === index}
              aria-label={label}
              onClick={() => goTo(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                activePane === index ? "w-5 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/50"
              )}
            />
          ))}
        </div>
        <span className="text-md font-black uppercase tracking-widest text-primary">{panes[activePane] ?? panes[0]}</span>
        <Link
          className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
          href="/hub/student/practice"
        >
          <HistoryIcon size={20} />
        </Link>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex flex-1 min-h-0 overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        <PlanPane lessons={sortedLessons} />
        <WeeklyPane lessons={sortedLessons} planId={planId} onShowPlan={() => goTo(0)} />
      </div>

      {/* Dica de que existe outro painel ao lado */}
      {activePane === 0 && (
        <button
          type="button"
          onClick={() => goTo(1)}
          className="flex items-center justify-center gap-1 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          {t("swipeHint")} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

// ======================= PAINEL 1: PLANO (aulas) =======================

function PlanPane({ lessons }: { lessons: Lesson[] }) {
  const router = useRouter();
  const paneRef = useRef<HTMLDivElement>(null);
  const currentIndex = lessons.findIndex((l) => l.status === "current");

  // Leva a aula atual para o meio do painel
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane || currentIndex === -1) return;
    pane.scrollTo({ top: getPosition(currentIndex).y - pane.clientHeight / 2, behavior: "smooth" });
  }, [currentIndex]);

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.status === "future") return;
    router.push(`/hub/student/practice/session`);
  };

  return (
    <div ref={paneRef} className="w-full shrink-0 snap-center overflow-y-auto no-scrollbar">
      <div className="relative mx-auto w-[300px]" style={{ height: lessons.length * CONFIG.desktopItemHeight + 100 }}>
        <SnakePathSVG lessons={lessons} />

        {lessons.map((lesson, index) => {
          const pos = getPosition(index);
          return (
            <div
              key={lesson.id}
              className="absolute top-0 left-0 transition-all duration-500"
              style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, marginLeft: -48, marginTop: -48 }}
            >
              <NodeItem lesson={lesson} position={index + 1} onClick={() => handleLessonClick(lesson)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================= PAINEL 2: PRÁTICAS DA SEMANA =======================

function WeeklyPane({
  lessons,
  planId,
  onShowPlan,
}: {
  lessons: Lesson[];
  planId?: string | null;
  onShowPlan: () => void;
}) {
  const t = useTranslations("LearningPath");
  const router = useRouter();

  // Aula em andamento (ou a última, se o plano já terminou) e quantas das 6 práticas já foram feitas
  const currentIndex = Math.max(
    0,
    lessons.findIndex((l) => l.status === "current")
  );
  const lesson = lessons[currentIndex] ?? lessons[lessons.length - 1];
  const doneDays = Math.min(6, Math.max(0, lesson?.completedPracticeDays ?? 0));

  return (
    <div className="w-full shrink-0 snap-center overflow-y-auto no-scrollbar px-4 pb-6">
      <div className="mx-auto w-full max-w-sm space-y-3">
        <div className="text-center space-y-1 pt-2 pb-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
            {t("classLabel", { order: currentIndex + 1 })}
          </p>
          <p className="text-sm font-bold leading-snug line-clamp-2">{lesson?.title}</p>
          <p className="text-[11px] font-semibold text-muted-foreground">{t("practicesDone", { done: doneDays })}</p>
          <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneDays / 6) * 100}%` }} />
          </div>
        </div>

        {WEEKLY_MODES.map(({ mode, icon: Icon }, index) => {
          const day = index + 1;
          const status = index < doneDays ? "completed" : index === doneDays ? "available" : "locked";
          const open = () => {
            if (status === "available" && planId) router.push(`/hub/student/practice/session?planId=${planId}&day=${day}`);
            else if (status === "completed") router.push("/hub/student/practice");
          };

          return (
            <button
              key={mode}
              type="button"
              onClick={open}
              disabled={status === "locked"}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                status === "available" && "border-primary/40 bg-primary/5 shadow-sm hover:bg-primary/10",
                status === "completed" && "border-yellow-500/30 bg-yellow-400/5 hover:bg-yellow-400/10",
                status === "locked" && "cursor-default border-border/50 opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-b-4",
                  status === "completed" && "border-yellow-600 bg-yellow-400 text-white",
                  status === "available" && "border-primary/80 bg-primary text-white",
                  status === "locked" && "border-muted-foreground/20 bg-muted text-muted-foreground/50"
                )}
              >
                {status === "completed" ? (
                  <Star size={20} fill="currentColor" className="text-yellow-100" />
                ) : status === "locked" ? (
                  <Lock size={18} />
                ) : (
                  <Icon size={20} strokeWidth={2.5} />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("dayLabel", { order: day })}
                </span>
                <span className="block truncate text-sm font-bold">{t(`mode_${mode}`)}</span>
              </span>

              {status === "available" && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
                  <Play size={10} fill="currentColor" />
                  {t("practiceNow")}
                </span>
              )}
              {status === "completed" && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-yellow-700 dark:text-yellow-400">
                  {t("practiceDoneLabel")}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onShowPlan}
          className="mx-auto flex items-center gap-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          {t("backToPlan")}
        </button>
      </div>
    </div>
  );
}

// --- Lógica Matemática do Posicionamento ---
// Retorna {x, y} do centro de cada bolinha
function getPosition(index: number) {
  const y = index * CONFIG.desktopItemHeight + 80; // +80 para dar margem no topo

  // Padrão de Zigue-Zague: Centro -> Esquerda -> Centro -> Direita
  let x = CONFIG.desktopCenter;

  const cycle = index % 4;
  if (cycle === 1) x = CONFIG.desktopCenter - CONFIG.desktopAmplitude; // Esquerda
  if (cycle === 3) x = CONFIG.desktopCenter + CONFIG.desktopAmplitude; // Direita

  return { x, y };
}

// --- Componente da Linha Curva (SVG) ---
function SnakePathSVG({ lessons }: { lessons: Lesson[] }) {
  let pathD = "";

  lessons.forEach((_, index) => {
    if (index === lessons.length - 1) return; // Não desenha linha a partir do último

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
        className="text-primary/10 dark:text-white/10"
      />
    </svg>
  );
}

// --- Componente Visual do Botão (Node) ---
function NodeItem({ lesson, position, onClick }: { lesson: Lesson; position: number; onClick: () => void }) {
  const t = useTranslations("LearningPath");
  const isCurrent = lesson.status === "current";

  const renderIcon = () => {
    if (lesson.status === "completed") {
      return (
        <div className="relative">
          <Star size={32} fill="currentColor" className="text-yellow-100" />
        </div>
      );
    }
    if (lesson.status === "future") {
      return <Lock size={28} />;
    }
    const Icon = getIconForOrder(position);
    return <Icon size={32} />;
  };

  return (
    <div className="flex flex-col items-center relative group z-10">
      <div onClick={onClick} className={lesson.status === "future" ? "cursor-default" : "cursor-pointer"}>
        <motion.div
          whileHover={lesson.status !== "future" ? { scale: 1.1, translateY: -5 } : {}}
          whileTap={lesson.status !== "future" ? { scale: 0.95 } : {}}
          className={cn(
            "rounded-[35px] flex items-center justify-center shadow-lg transition-all relative border-b-[6px] w-24 h-24",
            lesson.status === "completed"
              ? "bg-yellow-400 border-yellow-600 text-white"
              : lesson.status === "current"
                ? "bg-primary border-primary/80 text-white ring-8 ring-primary/20"
                : "bg-muted border-muted-foreground/20 text-muted-foreground/40"
          )}
        >
          {/* Balão "START" */}
          {isCurrent && (
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -10 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
              className="absolute -top-4 bg-white dark:bg-slate-200 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border-2 border-primary/10 z-20 whitespace-nowrap"
            >
              {t("startBalloon")}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-200 border-b-2 border-r-2 border-primary/10 rotate-45"></div>
            </motion.div>
          )}
          {renderIcon()}
        </motion.div>
      </div>

      {/* Texto da aula: "Aula 3" + título */}
      <div
        className={cn(
          "mt-3 font-bold uppercase tracking-widest text-[10px]",
          isCurrent ? "text-primary" : "text-slate-500 dark:text-slate-600"
        )}
      >
        {t("classLabel", { order: position })}
      </div>
      <div className="text-[11px] font-medium opacity-40 text-center max-w-[120px] truncate">{lesson.title}</div>
    </div>
  );
}

function getIconForOrder(order: number) {
  const icons = [ImageIcon, Ear, Shuffle, Brain, FileQuestion, Headphones];
  const safeIndex = Math.max(0, order - 1) % icons.length;
  return icons[safeIndex];
}
