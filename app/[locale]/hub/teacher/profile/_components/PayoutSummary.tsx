"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Locale } from "@/i18n/config";
import { format, type Locale as DateFnsLocale } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
  History,
  DollarSign,
  ChevronRight,
  Loader2,
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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

function BreakdownRow({
  dotClassName,
  title,
  subtitle,
  badge,
  amount,
  count,
  info,
  onOpen,
}: {
  dotClassName: string;
  title: string;
  subtitle: string;
  badge?: string;
  amount: string;
  count: string;
  info: string;
  onOpen: () => void;
}) {
  return (
    <TooltipProvider>
    <div className="flex items-center gap-2 py-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-center gap-3 text-left min-w-0 group"
      >
        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotClassName)} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            {title}
            {badge && (
              <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-1.5 h-4 border-none">
                {badge}
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-black text-foreground">{amount}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{count}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </button>
      <Tooltip>
        <TooltipTrigger className="p-1 text-muted-foreground hover:text-foreground">
          <Info className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{info}</TooltipContent>
      </Tooltip>
    </div>
    </TooltipProvider>
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

  const pendingPct = projections.total > 0 ? (projections.pending.amount / projections.total) * 100 : 0;

  const periodLabel = filterMonth === -1 ? `${t("wholeYear")} ${filterYear}` : `${months[filterMonth]} ${filterYear}`;

  return (
    <div className="space-y-6">
      {/* Single summary card: total up front, the two parts below it */}
      <div className={cn("card p-5 transition-all duration-300", isLoadingProjections && "opacity-60")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("toReceive")}</p>
            <p className="text-4xl font-black text-foreground mt-1">{formatValue(projections.total)}</p>
          </div>
          <div className="flex items-center gap-1">
            <Select value={filterMonth.toString()} onValueChange={(v) => setFilterMonth(parseInt(v))}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">{t("allMonths")}</SelectItem>
                {months.map((m, i) => (
                  <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear.toString()} onValueChange={(v) => setFilterYear(parseInt(v))}>
              <SelectTrigger className="w-[90px] h-8">
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

        {/* Proportion between what is already taught and what is still scheduled */}
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted mt-4">
          <div className="bg-blue-500 transition-all" style={{ width: `${pendingPct}%` }} />
          <div className="bg-purple-500 transition-all" style={{ width: `${100 - pendingPct}%` }} />
        </div>

        <div className="mt-4 divide-y divide-border/50">
          <BreakdownRow
            dotClassName="bg-blue-500"
            title={t("taughtLabel")}
            subtitle={t("taughtSubtitle")}
            badge={t("accumulatedBadge")}
            amount={formatValue(projections.pending.amount)}
            count={t("classesCount", { count: projections.pending.count })}
            info={`${t("pendingDescription")} ${t("pendingNotAffectedByFilter")}`}
            onOpen={() => setOpenBreakdown("pending")}
          />
          <BreakdownRow
            dotClassName="bg-purple-500"
            title={t("scheduledLabel")}
            subtitle={t("scheduledSubtitle", { period: periodLabel })}
            amount={formatValue(projections.projected.amount)}
            count={t("classesCount", { count: projections.projected.count })}
            info={t("projectedDescription")}
            onOpen={() => setOpenBreakdown("projected")}
          />
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

          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{periodLabel}</span>
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
