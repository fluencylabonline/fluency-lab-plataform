"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface RecessActivitiesCardProps {
  count: number;
}

/** Atalho para as atividades de recesso. Só aparece quando o aluno recebeu alguma. */
export function RecessActivitiesCard({ count }: RecessActivitiesCardProps) {
  const t = useTranslations("StudentRecess.card");

  if (count <= 0) return null;

  return (
    <Link href="/hub/student/recess" className="block w-full outline-none group" data-tour="student-profile.recess">
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.99 }}
        className="relative flex items-center justify-between p-4 w-full rounded-md transition-all duration-300 card border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 group-hover:border-purple-200 dark:group-hover:border-purple-800"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-md flex items-center justify-center bg-purple-100/50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm md:text-base">
              {t("title")}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-0.5 text-purple-600 dark:text-purple-400">
              {t("subtitle", { count })}
            </span>
          </div>
        </div>
        <div className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-transform duration-300 group-hover:translate-x-1">
          <ChevronRight className="w-5 h-5" />
        </div>
      </motion.div>
    </Link>
  );
}
