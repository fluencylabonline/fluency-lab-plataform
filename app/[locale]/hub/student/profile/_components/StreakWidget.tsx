"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface StreakWidgetProps {
  streak: number;
}

const BADGES = [
  [0, "streak_badge_0"],
  [1, "streak_badge_1"],
  [3, "streak_badge_3"],
  [7, "streak_badge_7"],
  [14, "streak_badge_14"],
  [30, "streak_badge_30"],
] as const;

function getBadgeLabel(streak: number) {
  let label: (typeof BADGES)[number][1] = BADGES[0][1];
  for (const [min, name] of BADGES) {
    if (streak >= min) label = name;
  }
  return label;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
  const t = useTranslations("Hub.StudentProfile.ProgressHero");
  const badgeKey = getBadgeLabel(streak);

  return (
    <div className="card relative overflow-hidden rounded-md border border-orange-200 dark:border-orange-900 px-6 py-5 flex items-center gap-5">
      {/* Flame Button */}
      <motion.div
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex-shrink-0 w-16 h-16 rounded-md bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 flex items-center justify-center"
      >
        <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
          <path
            d="M22 4C22 4 28 12 28 18C28 21.3 25.3 24 22 24C18.7 24 16 21.3 16 18C16 14 19 10 19 10C19 10 14 15 14 22C14 29.7 17.6 36 22 36C26.4 36 30 29.7 30 22C30 15.5 24 9 24 9"
            fill="#f97316"
          />
          <path
            d="M22 28C22 28 19 25 19 22C19 19.8 20.8 18 23 18C23 18 22 20 22 22C22 24 24 26 24 28C24 30.2 23.1 32 22 32C20.9 32 20 30.2 20 28"
            fill="#fbbf24"
          />
        </svg>

        {streak > 0 && (
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border border-white dark:border-stone-900 flex items-center justify-center"
          >
            <svg width="8" height="8" viewBox="0 0 12 12" fill="#fff">
              <path d="M6 0l1.2 4.8L12 6l-4.8 1.2L6 12 4.8 7.2 0 6l4.8-1.2z" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Text Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="inline-block text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950 text-orange-500 dark:text-orange-400 border border-orange-200 dark:border-orange-800 mb-1.5 w-fit">
          {t(badgeKey)}
        </span>
        <div className="flex items-baseline gap-2">
          <motion.span
            key={streak}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black leading-none text-stone-900 dark:text-stone-50"
          >
            {streak}
          </motion.span>
          <span className="text-lg font-extrabold text-stone-400 dark:text-stone-500">
            {streak === 1 ? t("day") : t("days")}
          </span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-1">
          {t("streak")}
        </p>
      </div>
    </div>
  );
}