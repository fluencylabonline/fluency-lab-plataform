"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Locale } from "@/i18n/config";
import { format } from "date-fns";
import {
  TrendingUp,
  History,
  DollarSign,
  Calendar,
  ChevronRight,
  Filter,
  Loader2
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
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { resendTeacherPayoutEmailAction, getTeacherProjectionsAction } from "@/modules/payout/payout.actions";

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
  teacherId: string;
}

function ResendReceiptButton({ payoutId }: { payoutId: string }) {
  const [isSending, setIsSending] = useState(false);
  const t = useTranslations("Profile.Payouts");

  const handleResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSending(true);
    try {
      const result = await resendTeacherPayoutEmailAction({ payoutId });
      if (result?.data?.success) {
        notify.success(t("receiptSentSuccess"));
      } else {
        notify.error(result?.data?.error || t("receiptSentError"));
      }
    } catch {
      notify.error(t("receiptSentError"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-[10px] font-bold gap-1.5 px-2.5 border-border/50 hover:bg-primary/5 hover:text-primary transition-all rounded-md"
      onClick={handleResend}
      disabled={isSending}
    >
      {isSending ? (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      ) : null}
      {t("sendReceipt")}
    </Button>
  );
}

export function PayoutSummary({ history, projections: initialProjections, teacherId }: PayoutSummaryProps) {
  const t = useTranslations("Profile.Payouts");
  const tm = useTranslations("Months");
  const locale = useLocale() as Locale;

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [projections, setProjections] = useState(initialProjections);
  const [isLoadingProjections, setIsLoadingProjections] = useState(false);

  useEffect(() => {
    const fetchProjections = async () => {
      setIsLoadingProjections(true);
      try {
        const result = await getTeacherProjectionsAction({
          teacherId,
          month: filterMonth,
          year: filterYear
        });
        if (result?.data?.success && result.data.data) {
          setProjections(result.data.data);
        }
      } catch (err) {
        console.error("Error fetching projections:", err);
      } finally {
        setIsLoadingProjections(false);
      }
    };

    fetchProjections();
  }, [filterMonth, filterYear, teacherId]);

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
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300", isLoadingProjections && "opacity-60")}>
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
            {filterMonth === -1 ? `Ano ${filterYear}` : `${months[filterMonth]} ${filterYear}`}
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
                  {payout.status === "completed" && (
                    <ResendReceiptButton payoutId={payout.id} />
                  )}
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
