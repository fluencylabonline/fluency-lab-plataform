"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type OnboardingVariant = "success" | "pending" | "warning" | "neutral";

interface StatusUIProps {
  text: string;
  variant: OnboardingVariant;
  link: string;
  icon?: React.ReactNode;
}

const STATUS_CONFIG = {
  success: {
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100/50 dark:bg-teal-900/20",
    border: "group-hover:border-teal-200 dark:group-hover:border-teal-800",
    icon: CheckCircle2,
  },
  pending: {
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100/50 dark:bg-rose-900/20",
    border: "group-hover:border-rose-200 dark:group-hover:border-rose-800",
    icon: XCircle,
  },
  warning: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100/50 dark:bg-amber-900/20",
    border: "group-hover:border-amber-200 dark:group-hover:border-amber-800",
    icon: AlertCircle,
  },
  neutral: {
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100/50 dark:bg-slate-800/50",
    border: "group-hover:border-slate-200 dark:group-hover:border-slate-700",
    icon: Clock,
  },
};

const StatusItem: React.FC<StatusUIProps> = ({
  text,
  variant,
  link,
  icon: CustomIcon,
}) => {
  const t = useTranslations("Hub.StudentProfile.Onboarding");
  const config = STATUS_CONFIG[variant] || STATUS_CONFIG.neutral;
  const StatusIcon = config.icon;

  return (
    <Link href={link} className="block w-full outline-none group">
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "relative flex items-center justify-between p-4 w-full rounded-md transition-all duration-300",
          "card border border-zinc-200 dark:border-zinc-800",
          "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50",
          config.border,
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-2.5 rounded-md flex items-center justify-center transition-colors",
              config.bg,
              config.color,
            )}
          >
            {CustomIcon ? (
              <span className="w-5 h-5">{CustomIcon}</span>
            ) : (
              <StatusIcon className="w-5 h-5" />
            )}
          </div>

          <div className="flex flex-col text-left">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm md:text-base">
              {t(text)}
            </span>
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-widest mt-0.5",
                config.color,
              )}
            >
              {t("status_" + variant)}
            </span>
          </div>
        </div>

        <div className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-transform duration-300 group-hover:translate-x-1">
          <ChevronRight className="w-5 h-5" />
        </div>
      </motion.div>
    </Link>
  );
};

interface OnboardingStatusCardProps {
  contract: {
    status: OnboardingVariant;
    label: string;
  };
  placement: {
    status: OnboardingVariant;
    label: string;
  };
}

export function OnboardingStatusCard({ contract, placement }: OnboardingStatusCardProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      <StatusItem
        variant={contract.status}
        text={contract.label}
        link="/hub/student/contract"
      />
      <StatusItem
        variant={placement.status}
        text={placement.label}
        link="/hub/student/placement"
      />
    </div>
  );
}
