import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/modules/user/user.schema";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function HomeScreen({ user }: { user: User | null }) {
  const t = useTranslations("LandingPage");
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours >= 5 && hours < 12) {
        setGreeting("morning");
      } else if (hours >= 12 && hours < 18) {
        setGreeting("afternoon");
      } else {
        setGreeting("night");
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full bg-gray-100 dark:bg-gray-950">
      {/* Header App */}
      <header className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-950/95 backdrop-blur-md pt-12 pb-4 px-6 border-b border-gray-100 dark:border-gray-800 rounded-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.photoUrl || undefined} />
              <AvatarFallback name={user?.name || "U"}>{user?.name?.[0] || "U"}</AvatarFallback>
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
      </header>

      {/* Card 1: Aula Atual */}
      <div className="mx-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-20 h-20 bg-orange-100 dark:bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
        <div className="relative z-10">
          <span className="inline-block px-2 py-1 bg-amber-100 dark:bg-amber-500 text-orange-700 dark:text-white text-[10px] font-bold rounded-md mb-2">
            {t("heroCard.lessonLabel") || "Lesson"}
          </span>
          <h4 className="font-bold text-gray-800 dark:text-white text-lg leading-tight mb-1">
            {t("heroCard.lessonTitle") || "Current Lesson"}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t("heroCard.lessonSubtitle") || "Short subtitle"}
          </p>
          <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card 2: Lista de Revisão */}
      <div className="mx-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">
            {t("heroCard.reviewTitle") || "Revision"}
          </h4>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {t("heroCard.reviewCount") || "0 words"}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
              W
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                {t("heroCard.words.water") || "Water"}
              </p>
              <p className="text-[10px] text-gray-400">
                {t("heroCard.words.waterTrans") || "Água"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
              B
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                {t("heroCard.words.bread") || "Bread"}
              </p>
              <p className="text-[10px] text-gray-400">
                {t("heroCard.words.breadTrans") || "Pão"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Progresso */}
      <div className="mx-4 mt-auto bg-gray-900 rounded-3xl p-5 text-white relative overflow-hidden shadow-lg mb-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <p className="text-gray-400 text-xs font-medium mb-1">
              {t("heroCard.progressTitle") || "Weekly Progress"}
            </p>
            <div className="text-3xl font-bold tracking-tight">42%</div>
            <div className="text-[10px] text-green-400 font-medium mt-1 flex items-center gap-1">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
              {t("heroCard.progressGrowth") || "+12% faster"}
            </div>
          </div>
          <div className="h-10 w-16">
            <svg
              viewBox="0 0 64 32"
              className="w-full h-full text-green-500 overflow-visible"
            >
              <path
                d="M0 32 L10 25 L20 28 L30 15 L40 20 L50 10 L64 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="64" cy="5" r="3" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
