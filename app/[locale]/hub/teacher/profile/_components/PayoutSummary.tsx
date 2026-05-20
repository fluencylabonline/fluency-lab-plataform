"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Locale } from "@/i18n/config";
import { format } from "date-fns";
import {
  TrendingUp,
  History,
  DollarSign,
  Calendar,
  ChevronRight,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Payout {
  id: string;
  amount: number;
  month: number;
  year: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
  description: string | null;
}

interface Projections {
  pendingAmount: number;
  projectedAmount: number;
  totalMonth: number;
}

interface PayoutSummaryProps {
  history: Payout[];
  projections: Projections;
}

export function PayoutSummary({ history, projections }: PayoutSummaryProps) {
  const t = useTranslations("Profile.Payouts");
  const tm = useTranslations("Months");
  const locale = useLocale() as Locale;

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const formatValue = (amount: number) => formatCurrency(amount, locale);

  const monthKeys = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ] as const;

  const months = monthKeys.map(key => tm(key));

  const filteredHistory = history.filter(p =>
    (filterMonth === -1 || p.month === filterMonth) &&
    p.year === filterYear
  );

  return (
    <div className="space-y-6">
      {/* Projections Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t("pendingPayout") || "A Receber"}</span>
          </div>
          <p className="text-2xl font-bold">{formatValue(projections.pendingAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("pendingDescription") || "Aulas concluídas ainda não pagas"}
          </p>
        </div>

        <div className="card p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t("projectedEarnings") || "Projeção do Mês"}</span>
          </div>
          <p className="text-2xl font-bold">{formatValue(projections.projectedAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("projectedDescription") || "Estimativa baseada em aulas agendadas"}
          </p>
        </div>

        <div className="card p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t("totalExpected") || "Total Esperado"}</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatValue(projections.totalMonth)}</p>
          <p className="text-xs text-green-600/80 mt-1 font-medium">
            {months[new Date().getMonth()]} {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{t("historyTitle") || "Histórico de Pagamentos"}</h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={filterMonth.toString()}
              onValueChange={(v) => setFilterMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[140px] h-8 border-none bg-transparent hover:bg-muted/50 transition-colors">
                <SelectValue placeholder={t("allMonths") || "Todos os meses"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">{t("allMonths") || "Todos os meses"}</SelectItem>
                {months.map((m, i) => (
                  <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterYear.toString()}
              onValueChange={(v) => setFilterYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px] h-8 border-none bg-transparent hover:bg-muted/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="divide-y">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>{t("noPayouts") || "Nenhum pagamento encontrado para este período."}</p>
            </div>
          ) : (
            filteredHistory.map((payout) => (
              <div key={payout.id} className="item p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-full",
                    payout.status === "completed" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                  )}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{formatValue(payout.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {months[payout.month]} / {payout.year} • {format(new Date(payout.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                    payout.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {payout.status === "completed" ? t("paid") || "Pago" : t("pending") || "Pendente"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
