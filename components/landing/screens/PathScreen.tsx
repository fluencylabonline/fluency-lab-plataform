import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/modules/user/user.schema";
import { motion } from "framer-motion";
import { Bell, BookOpen, Star, Trophy } from "lucide-react";
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
    { id: 1, status: "completed", icon: Star, color: "bg-yellow-400" },
    { id: 2, status: "completed", icon: BookOpen, color: "bg-green-500" },
    { id: 3, status: "current", icon: Star, color: "bg-blue-500" },
    {
      id: 4,
      status: "locked",
      icon: Lock,
      color: "bg-gray-200 dark:bg-gray-800",
    },
    {
      id: 5,
      status: "locked",
      icon: Trophy,
      color: "bg-gray-200 dark:bg-gray-800",
    },
    {
      id: 6,
      status: "locked",
      icon: Trophy,
      color: "bg-gray-200 dark:bg-gray-800",
    },
  ];

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
        {/* Linha de fundo do Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5 dark:opacity-10">
          <path
            d="M 50 0 Q 80 150, 50 300 T 50 600"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-900 dark:text-white"
          />
        </svg>

        <div className="flex flex-col items-center gap-10 relative z-10">
          {levels.map((level, index) => {
            const isLeft = index % 2 !== 0;
            return (
              <motion.div
                key={level.id}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                style={{ x: isLeft ? -45 : 45 }}
              >
                <div className="relative group">
                  {level.status === "current" && (
                    <div className="absolute -inset-4 rounded-full bg-blue-500/10 animate-ping" />
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`
                      w-22 h-22 rounded-[2rem] flex items-center justify-center
                      shadow-[0_6px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1
                      transition-all border-4 border-white dark:border-gray-900
                      ${level.color} ${level.status === "locked" ? "text-gray-400" : "text-white"}
                    `}
                  >
                    <svg className="w-7 h-7" strokeWidth={2.5} />
                  </motion.button>

                  {level.status === "current" && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-lg shadow-xl">
                      {(t("heroCard.lessonLabel") || "Lesson").toUpperCase()}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
