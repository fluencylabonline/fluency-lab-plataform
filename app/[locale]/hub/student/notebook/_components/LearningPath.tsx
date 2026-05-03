"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Star,
  Lock,
  History as HistoryIcon,
  ImageIcon,
  Ear,
  Shuffle,
  FileQuestion,
  Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

// --- Interfaces ---
interface Lesson {
  id: string;
  title: string;
  isCompleted: boolean;
  status: "completed" | "current" | "future";
  order: number;
}

interface LearningPathProps {
  lessons: Lesson[];
}

// Configurações visuais do Snake Design
const CONFIG = {
  desktopItemHeight: 140, // Distância vertical entre bolinhas
  desktopAmplitude: 80, // O quanto ela vai para esquerda/direita (zigue-zague)
  desktopCenter: 150, // O centro do container (largura 300px / 2)
};

export function LearningPath({ lessons }: LearningPathProps) {
  const t = useTranslations("LearningPath");
  const router = useRouter();

  // Mock data as fallback if empty
  const mockLessons: Lesson[] = [
    { id: "1", title: "Introdução ao Idioma", isCompleted: true, status: "completed", order: 1 },
    { id: "2", title: "Verbos no Presente", isCompleted: true, status: "completed", order: 2 },
    { id: "3", title: "Conversação Básica", isCompleted: false, status: "current", order: 3 },
    { id: "4", title: "Vocabulário de Viagem", isCompleted: false, status: "future", order: 4 },
    { id: "5", title: "Expressões Idiomáticas", isCompleted: false, status: "future", order: 5 },
    { id: "6", title: "Revisão Geral", isCompleted: false, status: "future", order: 6 },
  ];

  const displayLessons = lessons.length > 0 ? lessons : mockLessons;
  const sortedLessons = [...displayLessons].sort((a, b) => a.order - b.order);

  // Busca o índice da lição atual
  const currentIndex = sortedLessons.findIndex(l => l.status === "current");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current && currentIndex !== -1) {
      const container = scrollContainerRef.current;
      const nodes = container.querySelectorAll(".snap-center");
      const currentNode = nodes[currentIndex] as HTMLElement;
      if (currentNode) {
        container.scrollTo({
          left: currentNode.offsetLeft - container.offsetWidth / 2 + currentNode.offsetWidth / 2,
          behavior: "smooth"
        });
      }
    }
  }, [currentIndex]);

  const handleLessonClick = (lesson: Lesson) => {
    // If it's locked, do nothing
    if (lesson.status === "future") return;

    // Navigate to practice (example route)
    router.push(`/hub/student/practice/${lesson.id}`);
  };

  if (displayLessons.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-2">
          <Brain size={48} className="text-primary" />
        </div>
        <h3 className="text-xl font-bold">{t("noLessonsTitle") || "Nenhum Plano Ativo"}</h3>
        <p className="text-muted-foreground max-w-[250px]">
          {t("noLessonsMessage") || "Você ainda não possui lições agendadas."}
        </p>
      </div>
    );
  }

  return (
    <div className="card w-full flex flex-col lg:h-[calc(100vh-10rem)] overflow-hidden">
      <div className="flex flex-row justify-between items-center py-2 px-6 sticky top-0 z-30">
        <div className="w-8" />
        <span className="text-md font-black uppercase tracking-widest text-primary">Plano</span>
        <Link
          className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
          href="/hub/student/practice"
        >
          <HistoryIcon size={20} />
        </Link>
      </div>

      <div className="w-full relative flex-1 overflow-y-auto no-scrollbar flex justify-center items-start">

        {/* ================= MOBILE VIEW (Horizontal Scrollable) ================= */}
        <div
          ref={scrollContainerRef}
          className="flex lg:hidden w-full h-full py-22 overflow-x-auto no-scrollbar snap-x snap-mandatory"
        >
          <div
            className="relative flex items-center gap-8 min-w-max px-[calc(50%-40px)]"
          >
            {/* Linha de Fundo Mobile (Estendida) */}
            <div className="absolute top-[40px] left-0 right-0 h-1 bg-primary/10 -z-10 rounded-full" />

            {sortedLessons.map((lesson) => (
              <div key={lesson.id} className="snap-center">
                <NodeItem
                  lesson={lesson}
                  isMobile={true}
                  onClick={() => handleLessonClick(lesson)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ================= DESKTOP VIEW (Vertical ZigZag) ================= */}
        <div
          className="hidden lg:block relative w-[300px]"
          style={{ height: sortedLessons.length * CONFIG.desktopItemHeight + 100 }}
        >
          <SnakePathSVG lessons={sortedLessons} />

          {sortedLessons.map((lesson, index) => {
            const pos = getPosition(index); // Pega X e Y exatos
            return (
              <div
                key={lesson.id}
                className="absolute top-0 left-0 transition-all duration-500"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  marginLeft: -48,
                  marginTop: -48,
                }}
              >
                <NodeItem
                  lesson={lesson}
                  isMobile={false}
                  onClick={() => handleLessonClick(lesson)}
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
// Retorna {x, y} do centro de cada bolinha
function getPosition(index: number) {
  const y = index * CONFIG.desktopItemHeight + 80; // +80 para dar margem no topo

  // Padrão de Zigue-Zague: Centro -> Esquerda -> Centro -> Direita
  // Index % 4 define o ciclo: 0(Meio), 1(Esq), 2(Meio), 3(Dir)
  let x = CONFIG.desktopCenter;

  const cycle = index % 4;
  if (cycle === 1) x = CONFIG.desktopCenter - CONFIG.desktopAmplitude; // Esquerda
  if (cycle === 3) x = CONFIG.desktopCenter + CONFIG.desktopAmplitude; // Direita

  return { x, y };
}

// --- Componente da Linha Curva (SVG) ---
function SnakePathSVG({ lessons }: { lessons: Lesson[] }) {
  // Constrói o "path" do SVG conectando os pontos
  let pathD = "";

  lessons.forEach((_, index) => {
    if (index === lessons.length - 1) return; // Não desenha linha a partir do último

    const current = getPosition(index);
    const next = getPosition(index + 1);

    // Ponto Inicial
    if (index === 0) pathD += `M ${current.x} ${current.y} `;

    // Lógica da Curva de Bézier (C)
    // Control Point 1: Sai verticalmente para baixo (Y + metade do caminho)
    // Control Point 2: Chega verticalmente de cima (Y - metade do caminho)
    const midY = (current.y + next.y) / 2;

    pathD += `C ${current.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y} `;
  });

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
      {/* Linha de Fundo (Tracejada) */}
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
function NodeItem({
  lesson,
  isMobile,
  onClick,
}: {
  lesson: Lesson;
  isMobile: boolean;
  onClick: () => void;
}) {
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
    const Icon = getIconForOrder(lesson.order);
    return <Icon size={32} strokeWidth={2.5} />;
  };

  return (
    <div className="flex flex-col items-center relative group z-10">
      <div
        onClick={onClick}
        className={
          lesson.status === "future" ? "cursor-default" : "cursor-pointer"
        }
      >
        <motion.div
          whileHover={
            lesson.status !== "future" ? { scale: 1.1, translateY: -5 } : {}
          }
          whileTap={lesson.status !== "future" ? { scale: 0.95 } : {}}
          className={cn(
            "rounded-[35px] flex items-center justify-center shadow-lg transition-all relative border-b-[6px]",
            isMobile ? "w-20 h-20" : "w-24 h-24", // Botões grandes e clicáveis

            // Cores baseadas no status
            lesson.status === "completed"
              ? "bg-yellow-400 border-yellow-600 text-white"
              : lesson.status === "current"
                ? "bg-primary border-primary/80 text-white ring-8 ring-primary/20"
                : "bg-muted border-muted-foreground/20 text-muted-foreground/40",
          )}
        >
          {renderIcon()}

          {/* Balão "START" */}
          {isCurrent && (
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
              START
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-200 border-b-2 border-r-2 border-primary/10 rotate-45"></div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Texto da Lição */}
      <div
        className={cn(
          "mt-3 font-bold uppercase tracking-widest text-[10px]",
          isCurrent ? "text-primary" : "text-slate-500 dark:text-slate-600",
        )}
      >
        Day {lesson.order}
      </div>
      <div className="text-[11px] font-medium opacity-40 text-center max-w-[120px] truncate">
        {lesson.title}
      </div>
    </div>
  );
}

function getIconForOrder(order: number) {
  const icons = [ImageIcon, Ear, Shuffle, Brain, FileQuestion, Headphones];
  return icons[(order - 1) % icons.length];
}
