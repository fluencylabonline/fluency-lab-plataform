"use client";

import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PaymentOverdueBanner() {
  const t = useTranslations("Hub.StudentProfile.Payment");
  const locale = useLocale();

  return (
    <div className="bg-red-600 dark:bg-red-950 text-white px-4 py-3 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-in slide-in-from-top duration-300 relative z-40 border-b border-red-700 dark:border-red-900/50 shadow-sm w-full">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
        <div className="bg-red-700/40 dark:bg-red-900/50 p-1.5 rounded-full animate-pulse shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-100" />
        </div>
        <p className="text-sm font-medium leading-normal tracking-wide">
          {t("overdueBanner") || "Seu pagamento está vencido. Regularize seu débito para manter seus benefícios ativos."}
        </p>
      </div>
      <Link href={`/${locale}/hub/student/payments`} passHref legacyBehavior>
        <Button 
          size="sm" 
          className="bg-white hover:bg-zinc-100 text-red-700 dark:bg-zinc-100 dark:text-red-950 font-bold shadow-md rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] gap-1 shrink-0 w-full sm:w-auto"
        >
          {t("payNowBanner") || "Pagar Agora"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
