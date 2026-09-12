"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Locale } from "@/i18n/config";
import { format, type Locale as DateFnsLocale } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
  TrendingUp,
  History,
  DollarSign,
  Calendar,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  Equal,
  Info,
  GraduationCap
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
import { PayoutDetailsVault } from "@/modules/payout/_components/PayoutDetailsVault";
import { Vault, VaultContent, VaultHeader, VaultTitle, VaultBody } from "@/components/ui/vault";
import { Badge } from "@/components/ui/badge";

interface Payout {
  id: string;
  amount: number;
  month: number;
  year: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date | string;
  description: string | null;
  pixKey: string;
  pixKeyType: string;
  externalId: string;
  receiptUrl?: string | null;
  invoiceUrl?: string | null;
  classes?: Array<{
    id: string;
    startAt: Date | string;
    teacherHourlyRate: number | null;
    student?: {
      name: string | null;
    } | null;
  }>;
}

interface EarningsBreakdownItem {
  id: string;
  startAt: Date | string;
  studentName: string | null;
  amount: number;
}

interface EarningsBucket {
  amount: number;
  count: number;
  classes: EarningsBreakdownItem[];
}

interface PendingBucket extends EarningsBucket {
  currentMonthAmount: number;
  currentMonthCount: number;
  previousMonthsAmount: number;
  previousMonthsCount: number;
}

interface Projections {
  pending: PendingBucket;
  projected: EarningsBucket;
  total: number;
}

function groupClassesByMonth(classes: EarningsBreakdownItem[], dateLocale: DateFnsLocale) {
  const groups = new Map<string, { label: string; items: EarningsBreakdownItem[]; total: number }>();
  for (const cls of classes) {
    const date = new Date(cls.startAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!groups.has(key)) {
      groups.set(key, { label: format(date, "MMMM yyyy", { locale: dateLocale }), items: [], total: 0 });
    }
    const group = groups.get(key)!;
    group.items.push(cls);
    group.total += cls.amount;
  }
  return Array.from(groups.values());
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

function PayoutRow({ payout, teacherId, formatValue, months, t }: { payout: Payout; teacherId: string; formatValue: (val: number) => string; months: string[]; t: (key: string) => string }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <PayoutDetailsVault
      payout={payout}
      teacherId={teacherId}
      isAdmin={false}
      onSuccess={handleRefresh}
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <div
          onClick={() => setIsOpen(true)}
          className="item p-4 m-2 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2 rounded-full",
              payout.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
            )}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{formatValue(payout.amount)}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {months[payout.month]} / {payout.year} • {format(new Date(payout.createdAt), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {payout.status === "completed" && (
              <ResendReceiptButton payoutId={payout.id} />
            )}
            <Badge
              variant="secondary"
              className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 h-4 border-none",
                payout.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
              )}
            >
              {payout.status === "completed" ? t("paid") || "Pago" : t("pending") || "Pendente"}
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      }
    />
  );
}

function EarningsBreakdownVault({
  open,
  onOpenChange,
  title,
  description,
  bucket,
  formatValue,
  emptyLabel,
  dateLocale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  bucket: EarningsBucket;
  formatValue: (val: number) => string;
  emptyLabel: string;
  dateLocale: DateFnsLocale;
}) {
  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-lg sm:max-w-lg">
        <VaultHeader>
          <VaultTitle>{title}</VaultTitle>
        </VaultHeader>
        <VaultBody className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

          {bucket.classes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-20" strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">{emptyLabel}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
              {groupClassesByMonth(bucket.classes, dateLocale).map((group) => (
                <div key={group.label} className="card p-0 overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30 flex items-center justify-between border-b border-border/50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground capitalize">{group.label}</span>
                    <span className="text-xs font-bold text-foreground">{formatValue(group.total)}</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {group.items.map((cls) => (
                      <div key={cls.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{cls.studentName || "—"}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            {format(new Date(cls.startAt), "dd MMM, HH:mm", { locale: dateLocale })}
                          </p>
                        </div>
                        <p className="text-sm font-black text-foreground shrink-0">{formatValue(cls.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</span>
            <span className="text-lg font-black text-foreground">{formatValue(bucket.amount)}</span>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

export function PayoutSummary({ history, projections: initialProjections, teacherId }: PayoutSummaryProps) {
  const t = useTranslations("Profile.Payouts");
  const tm = useTranslations("Months");
  const locale = useLocale() as Locale;
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [projections, setProjections] = useState(initialProjections);
  const [isLoadingProjections, setIsLoadingProjections] = useState(false);
  const [openBreakdown, setOpenBreakdown] = useState<"pending" | "projected" | null>(null);

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

  const periodLabel = filterMonth === -1 ? `${t("wholeYear")} ${filterYear}` : `${months[filterMonth]} ${filterYear}`;

  return (
    <div className="space-y-6">
      {/* Projections Dashboard */}
      <div className={cn("transition-all duration-300", isLoadingProjections && "opacity-60")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending: always the full backlog, independent of the period filter */}
          <button
            type="button"
            onClick={() => setOpenBreakdown("pending")}
            className="card p-4 border-l-4 border-l-blue-500 text-left hover:bg-muted/20 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <History className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t("pendingPayout")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-2xl font-bold">{formatValue(projections.pending.amount)}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 h-4 border-none bg-blue-500/10 text-blue-600">
                {t("classesCount", { count: projections.pending.count })}
              </Badge>
            </div>

            {/* Split the running balance so a growing backlog doesn't hide inside one lump sum */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("thisMonth")}</span>
                <span className="text-xs font-black text-foreground">{formatValue(projections.pending.currentMonthAmount)}</span>
              </div>
              {projections.pending.previousMonthsAmount > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600">{t("previousMonths")}</span>
                  <span className="text-xs font-black text-amber-700">{formatValue(projections.pending.previousMonthsAmount)}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t("pendingDescription")}
            </p>
            {projections.pending.previousMonthsAmount > 0 && (
              <p className="text-[10px] text-amber-600/90 mt-1.5 flex items-start gap-1 leading-relaxed font-medium">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                {t("pendingBacklogNote")}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-start gap-1 leading-relaxed">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              {t("pendingNotAffectedByFilter")}
            </p>
          </button>

          {/* Projected: scheduled classes within the selected period */}
          <button
            type="button"
            onClick={() => setOpenBreakdown("projected")}
            className="card p-4 border-l-4 border-l-purple-500 text-left hover:bg-muted/20 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t("projectedEarnings")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-2xl font-bold">{formatValue(projections.projected.amount)}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 h-4 border-none bg-purple-500/10 text-purple-600">
                {t("classesCount", { count: projections.projected.count })}
              </Badge>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{periodLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t("projectedDescription")}
            </p>
          </button>
        </div>

        {/* Total: explicit sum, so the relationship between the two cards above is obvious */}
        <div className="card p-4 mt-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t("totalExpected")}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm font-bold">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600">{formatValue(projections.pending.amount)}</span>
            <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600">{formatValue(projections.projected.amount)}</span>
            <Equal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-2xl font-black text-green-700">{formatValue(projections.total)}</span>
          </div>
          <p className="text-xs text-green-600/80 mt-2 font-medium">
            {t("totalDescription", { period: periodLabel })}
          </p>
        </div>
      </div>

      <EarningsBreakdownVault
        open={openBreakdown === "pending"}
        onOpenChange={(open) => setOpenBreakdown(open ? "pending" : null)}
        title={t("pendingPayout")}
        description={t("pendingBreakdownDescription")}
        bucket={projections.pending}
        formatValue={formatValue}
        emptyLabel={t("noClassesInBreakdown")}
        dateLocale={dateLocale}
      />
      <EarningsBreakdownVault
        open={openBreakdown === "projected"}
        onOpenChange={(open) => setOpenBreakdown(open ? "projected" : null)}
        title={t("projectedEarnings")}
        description={t("projectedBreakdownDescription", { period: periodLabel })}
        bucket={projections.projected}
        formatValue={formatValue}
        emptyLabel={t("noClassesInBreakdown")}
        dateLocale={dateLocale}
      />

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
              <PayoutRow
                key={payout.id}
                payout={payout}
                teacherId={teacherId}
                formatValue={formatValue}
                months={months}
                t={t}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
