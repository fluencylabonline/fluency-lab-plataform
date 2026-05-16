"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Coffee, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PracticeStatusWidgetProps {
  status: "up_to_date" | "late" | "free";
  daysLate?: number;
}

export function PracticeStatusWidget({ status, daysLate }: PracticeStatusWidgetProps) {
  const t = useTranslations("Hub.StudentProfile.ProgressHero");

  const config = {
    up_to_date: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      borderColor: "border-emerald-200 dark:border-emerald-900",
      iconBg: "bg-emerald-50 dark:bg-emerald-950",
      iconBorder: "border-emerald-200 dark:border-emerald-800",
      title: t("status_up_to_date"),
      desc: t("status_up_to_date_desc"),
      badge: t("status_up_to_date_badge"),
      animation: {
        scale: [1, 1.05, 1],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
      }
    },
    late: {
      icon: AlertCircle,
      color: "text-rose-500",
      borderColor: "border-rose-200 dark:border-rose-900",
      iconBg: "bg-rose-50 dark:bg-rose-950",
      iconBorder: "border-rose-200 dark:border-rose-800",
      title: t("status_late"),
      desc: daysLate === 1
        ? t("status_late_desc_single")
        : t("status_late_desc_plural", { daysLate: daysLate || 1 }),
      badge: t("status_late_badge"),
      animation: {
        y: [0, -3, 0],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
      }
    },
    free: {
      icon: Coffee,
      color: "text-indigo-500",
      borderColor: "border-indigo-200 dark:border-indigo-900",
      iconBg: "bg-indigo-50 dark:bg-indigo-950",
      iconBorder: "border-indigo-200 dark:border-indigo-800",
      title: t("status_free"),
      desc: t("status_free_desc"),
      badge: t("status_free_badge"),
      animation: {}
    }
  };

  const active = config[status];
  const Icon = active.icon;

  return (
    <div className={cn(
      "card relative overflow-hidden rounded-md border px-6 py-5 flex items-center gap-5",
      active.borderColor
    )}>
      {/* Icon Container */}
      <motion.div
        animate={active.animation}
        className={cn(
          "relative flex-shrink-0 w-16 h-16 rounded-md border flex items-center justify-center",
          active.iconBg,
          active.iconBorder,
          active.color
        )}
      >
        <Icon className="w-8 h-8 drop-shadow-md" />

        {status === "up_to_date" && (
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1, 0.9] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 border border-white dark:border-stone-900 flex items-center justify-center"
          >
            <Sparkles className="w-3 h-3 text-white fill-current" />
          </motion.div>
        )}
      </motion.div>

      {/* Text Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className={cn(
          "inline-block text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md border mb-1.5 w-fit",
          active.iconBg,
          active.color,
          active.iconBorder
        )}>
          {active.badge}
        </span>

        <h4 className="text-xl font-black text-stone-900 dark:text-stone-50 leading-none mb-1 truncate">
          {active.title}
        </h4>

        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-1">
          {active.desc}
        </p>
      </div>
    </div>
  );
}
