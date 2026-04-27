import { useTranslations, useFormatter } from "next-intl";
import { TrendingUp, Calendar, ArrowRight, Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface ForecastCardsProps {
  forecast: {
    installments: number;
    pendingExpenses: number;
  };
  month: number | "all";
  year: number;
}

export function ForecastCards({ forecast, month, year }: ForecastCardsProps) {
  const t = useTranslations("AdminFinances.forecast");
  const format = useFormatter();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 relative">
          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium uppercase">{t("pendingRevenue")}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={12} className="text-muted-foreground opacity-50 hover:opacity-100 transition-opacity cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px] text-xs font-normal normal-case">{t("forecastDisclaimer")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-xl font-bold">{format.number(forecast.installments / 100, { style: 'currency', currency: 'BRL' })}</span>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar size={12} />
              {t("basedOnInstallments")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="p-2 rounded-md bg-rose-500/10 text-rose-600">
            <TrendingUp size={20} className="rotate-180" />
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium uppercase">{t("pendingExpenses")}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={12} className="text-muted-foreground opacity-50 hover:opacity-100 transition-opacity cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px] text-xs font-normal normal-case">{t("forecastDisclaimer")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-xl font-bold">{format.number(forecast.pendingExpenses / 100, { style: 'currency', currency: 'BRL' })}</span>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar size={12} />
              {t("basedOnPendingTransactions")}
            </p>
          </div>
        </div>
      </div>

      <Link
        href={`/hub/admin/finances/forecast?year=${year}&month=${month}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full h-9 rounded-xl text-xs gap-2"
        )}
      >
        {t("viewDetails")}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
