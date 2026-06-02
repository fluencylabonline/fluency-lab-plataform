import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/modules/user/user.schema";
import { motion } from "framer-motion";
import { Bell, BookOpen, Lock, Star, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function PathScreen({ user }: { user: User | null }) {
  const t = useTranslations("LandingPage");
  const tPath = useTranslations("PathScreen");
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hours = now.getHours();
      if (hours >= 5 && hours < 12) setGreeting("morning");
      else if (hours >= 12 && hours < 18) setGreeting("afternoon");
      else setGreeting("night");
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const levels = [
    { id: 1, status: "completed", icon: Star, type: "gold" },
    { id: 2, status: "completed", icon: BookOpen, type: "green" },
    { id: 3, status: "current", icon: Star, type: "blue" },
    { id: 4, status: "locked", icon: Lock, type: "locked" },
    { id: 5, status: "locked", icon: Trophy, type: "locked" },
    { id: 6, status: "locked", icon: Trophy, type: "locked" },
  ];

  const getButtonStyles = (status: string, type: string) => {
    if (status === "locked") {
      return "bg-[#e5e5e5] dark:bg-[#202f36] border-[#e5e5e5] dark:border-[#202f36] border-b-[#afafaf] dark:border-b-[#152025] text-[#afafaf] dark:text-[#526570] cursor-not-allowed";
    }
    switch (type) {
      case "gold":
        return "bg-[#ffc800] border-[#ffc800] border-b-[#e6b400] text-white hover:bg-[#ffd426]";
      case "green":
        return "bg-[#58cc02] border-[#58cc02] border-b-[#46a302] text-white hover:bg-[#61e002]";
      case "blue":
        return "bg-[#1899f8] border-[#1899f8] border-b-[#1878d8] text-white hover:bg-[#24bfff]";
      default:
        return "bg-[#58cc02] border-[#58cc02] border-b-[#46a302] text-white hover:bg-[#61e002]";
    }
  };

  // Generate smooth zigzag pattern coordinates
  // X is in percentage (0-100) of container width, Y is in pixels
  const points = levels.map((_, index) => {
    const xPattern = [50, 32, 18, 35, 68, 50];
    const x = xPattern[index % xPattern.length];
    const y = 40 + index * 90;
    return { x, y };
  });

  const containerHeight = 80 + (levels.length - 1) * 90;

  return (
    <div className="flex flex-col h-full relative bg-gray-100 dark:bg-gray-950">
      {/* Header Dinâmico */}
      <header className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-950/95 backdrop-blur-md pt-12 pb-4 px-6 border-b border-gray-100 dark:border-gray-800 rounded-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.photoUrl || undefined} />
              <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                {greeting
                  ? (t(`heroCard.greeting.${greeting}`) || "Hello,")
                  : (t("heroCard.greeting.morning") || "Good morning,")}
              </p>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                {user?.name
                  ? user.name.split(" ")[0]
                  : (t("heroCard.defaultName") || "Student")}
              </h3>
            </div>
          </div>
          <button className="relative p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white dark:border-gray-950" />
          </button>
        </div>

        {/* Status da Unidade */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 px-2">
            <span className="text-lg">🇺🇸</span>
            <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase">
              {tPath("unit") || "Unit"}
            </span>
          </div>
          <div className="flex items-center gap-4 pr-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-black text-yellow-700 dark:text-yellow-500">
                142
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-black text-indigo-600">#4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Trilha (Path) */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-10 px-4 relative">
        <div 
          className="relative w-full max-w-[280px] mx-auto"
          style={{ height: `${containerHeight}px` }}
        >
          {/* Linha de fundo do Path (SVG) */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 100 ${containerHeight}`}
            preserveAspectRatio="none"
          >
            {levels.slice(0, -1).map((level, index) => {
              const nextLevel = levels[index + 1];
              const isCompletedSegment = 
                level.status === "completed" && 
                (nextLevel.status === "completed" || nextLevel.status === "current");
                
              const p0 = points[index];
              const p1 = points[index + 1];
              const dy = (p1.y - p0.y) / 2;
              const pathD = `M ${p0.x} ${p0.y} C ${p0.x} ${p0.y + dy}, ${p1.x} ${p1.y - dy}, ${p1.x} ${p1.y}`;
              
              return (
                <g key={index}>
                  {/* 3D shadow line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isCompletedSegment ? "#46a302" : "currentColor"}
                    strokeWidth={8}
                    strokeLinecap="round"
                    transform="translate(0, 3)"
                    className={isCompletedSegment ? "" : "text-gray-300 dark:text-gray-900 opacity-20 dark:opacity-40"}
                  />
                  {/* Foreground path line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isCompletedSegment ? "#58cc02" : "currentColor"}
                    strokeWidth={8}
                    strokeLinecap="round"
                    className={isCompletedSegment ? "" : "text-gray-200 dark:text-gray-800"}
                  />
                </g>
              );
            })}
          </svg>

          {/* Níveis / Stepping Stones */}
          {levels.map((level, index) => {
            const p = points[index];
            const Icon = level.icon;
            const isCurrent = level.status === "current";
            const isLocked = level.status === "locked";
            const isCompleted = level.status === "completed";
            
            return (
              <div
                key={level.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${p.x}%`, top: `${p.y}px` }}
              >
                <div className="relative group flex flex-col items-center">
                  {isCurrent && (
                    <>
                      {/* Pulsing ring */}
                      <div className="absolute -inset-3 rounded-full bg-blue-500/20 animate-pulse" />
                      <div className="absolute -inset-1.5 rounded-full bg-blue-500/10 animate-ping" />
                    </>
                  )}

                  <motion.button
                    whileHover={!isLocked ? { scale: 1.05 } : {}}
                    whileTap={!isLocked ? { scale: 0.95 } : {}}
                    disabled={isLocked}
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      transition-all border-x-2 border-t-2 border-b-[8px]
                      ${getButtonStyles(level.status, level.type)}
                    `}
                  >
                    <Icon 
                      className={`w-6 h-6 stroke-[2.5px] ${
                        (isCompleted || isCurrent) && level.type !== "locked" ? "fill-current" : ""
                      }`} 
                    />
                  </motion.button>

                  {isCurrent && (
                    <div className="absolute -top-12 bg-[#1899f8] text-white text-[9px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap animate-bounce border border-[#1878d8]">
                      {(t("heroCard.lessonLabel") || "START").toUpperCase()}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1899f8] rotate-45 border-r border-b border-[#1878d8]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
