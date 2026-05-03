"use client";

import { StudentLearningStats, LearningItemDetail } from "@/modules/learning/learning.types";
import { BookOpen, Calendar, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { LearnedItemsVault } from "./LearnedItemsVault";
import { ReviewedItemsVault } from "./ReviewedItemsVault";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface StatsDashboardProps {
  stats: StudentLearningStats;
  learnedItems: LearningItemDetail[];
  reviewedItems: LearningItemDetail[];
  variant?: "grid" | "vertical" | "horizontal";
}

export function StatsDashboard({
  stats,
  learnedItems,
  reviewedItems,
  variant = "grid"
}: StatsDashboardProps) {
  const t = useTranslations("StatsDashboard");
  const items = [
    {
      label: t("reviewedToday"),
      value: stats.reviewedToday,
      icon: CheckCircle,
      color: "text-white",
      bgColor: "bg-green-500",
      vault: (trigger: React.ReactNode) => (
        <ReviewedItemsVault items={reviewedItems} trigger={trigger} />
      ),
    },
    {
      label: t("dueToday"),
      value: stats.dueToday,
      icon: Clock,
      color: "text-white",
      bgColor: "bg-amber-500",
    },
    {
      label: t("totalLearned"),
      value: stats.totalLearned,
      icon: BookOpen,
      color: "text-white",
      bgColor: "bg-blue-600",
      vault: (trigger: React.ReactNode) => (
        <LearnedItemsVault items={learnedItems} trigger={trigger} />
      ),
    },
    {
      label: t("practiceDay"),
      value: stats.currentDay,
      icon: Calendar,
      color: "text-white",
      bgColor: "bg-purple-600",
    },
  ];

  const containerClasses = {
    grid: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8",
    vertical: "flex flex-col gap-4 h-full",
    horizontal: "flex flex-row gap-4 overflow-x-auto no-scrollbar pb-2",
  }[variant];

  return (
    <div className={containerClasses}>
      {items.map((item, idx) => {
        const content = (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`
              relative overflow-hidden
              ${item.bgColor} p-4 rounded-md flex flex-col items-center justify-center text-center space-y-2 
              transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer h-full
              ${variant === "horizontal" ? "min-w-[120px] flex-shrink-0" : "w-full"}
            `}
          >
            {/* Background Icon Decoration */}
            <item.icon 
              className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 -rotate-12 pointer-events-none text-white" 
            />
            
            <item.icon className={`${item.color} w-5 h-5 opacity-80 relative z-10`} />
            <div className="relative z-10">
              <p className={`text-2xl font-bold tracking-tight ${item.color}`}>{item.value}</p>
              <p className={`text-[9px] uppercase tracking-widest font-black opacity-70 ${item.color}`}>
                {item.label}
              </p>
            </div>
          </motion.div>
        );

        const wrapperClasses = cn(
          variant === "horizontal" ? "flex-shrink-0" : "w-full",
          variant === "vertical" ? "flex-1" : ""
        );

        if (item.vault) {
          return <div key={item.label} className={wrapperClasses}>{item.vault(content)}</div>;
        }

        return <div key={item.label} className={wrapperClasses}>{content}</div>;
      })}
    </div>
  );
}
