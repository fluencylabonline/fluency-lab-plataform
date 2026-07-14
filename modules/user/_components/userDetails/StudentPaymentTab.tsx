"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Clock, Edit2, AlertCircle, CheckCircle2, Copy, QrCode, ExternalLink, Send, RotateCw } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/toaster";
import { SectionLabel, StatBlock } from "./UserDetailsPrimitives";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultTrigger,
} from "@/components/ui/vault";
import { Badge } from "@/components/ui/badge";

import { SubscriptionWithPlan, Installment } from "@/modules/billing/billing.types";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface StudentPaymentTabProps {
  activeSubscription: SubscriptionWithPlan | null;
  installments: Installment[];
  subscriptions: SubscriptionWithPlan[];
  isAdmin: boolean;
  isUpdating: boolean;
  adminPassword: string;
  setAdminPassword: (p: string) => void;
  installmentForm: UseFormReturn<FieldValues>; // FieldValues is safer than any
  onUpdateInstallment: (id: string, data: { amount?: number }) => Promise<void>;
  onMarkAsPaid: (id: string) => Promise<void>;
  onGenerateInvoice?: (id: string, options?: { force?: boolean }) => Promise<void>;
  onResendReminder?: (id: string) => Promise<void>;
}


export function StudentPaymentTab({
  activeSubscription,
  installments,
  subscriptions,
  isAdmin,
  isUpdating,
  adminPassword,
  setAdminPassword,
  installmentForm,
  onUpdateInstallment,
  onMarkAsPaid,
  onGenerateInvoice,
  onResendReminder,
}: StudentPaymentTabProps) {
  const t = useTranslations("UserManagement");

  // Helper to format calendar dates in UTC to avoid local timezone offset shifting the day
  const formatUTCDate = (dateInput: Date | string) => {
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return "—";
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "—";
    }
  };

  // Find the next unpaid (pending or overdue) installment to display as the next due date
  const nextUnpaidInstallment = installments
    .filter((inst) => inst.status === "pending" || inst.status === "overdue")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  return (
    <div className="flex flex-col gap-8">
      {/* Subscription block */}
      {!activeSubscription ? (
        <div className="border border-dashed border-border rounded-md py-16 flex flex-col items-center gap-3">
          <CreditCard className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
          <div className="text-center">
            <p className="font-bold text-sm">{t("noActiveSubscription")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {t("noActiveSubscriptionDesc")}
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
              {t("currentPlan")}
            </p>
            <Badge variant="default" className="text-[9px] h-4 font-black">
              {t("activeBadge")}
            </Badge>
          </div>
          <div className="px-6 py-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-xl tracking-tight leading-none">{activeSubscription.plan?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                  {t("dueDayLabel")} {activeSubscription.dueDay}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
            <StatBlock
              label={t("startDate")}
              value={format(new Date(activeSubscription.startDate), "dd/MM/yyyy")}
            />
            <StatBlock
              label={t("nextDueDate")}
              value={nextUnpaidInstallment ? formatUTCDate(nextUnpaidInstallment.dueDate) : "—"}
            />
            <StatBlock
              label={t("monthlyFee")}
              value={((activeSubscription.plan?.price ?? 0) / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              accent
            />
          </div>
        </div>
      )}

      {/* Installments */}
      {installments.length > 0 && (
        <div>
          <SectionLabel>{t("installmentSchedule")}</SectionLabel>
          <div className="flex flex-col gap-2">
            {installments.map((inst) => (
              <div
                key={inst.id}
                className="item flex items-center justify-between px-6 py-4 group"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <span className="text-[11px] font-black text-muted-foreground/60 w-5 shrink-0 tabular-nums">
                    {String(inst.orderIndex).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-sm tracking-tight">
                      {(inst.amount / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                      <Clock className="w-3 h-3 shrink-0 opacity-60" />
                      {formatUTCDate(inst.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <Badge
                    variant={inst.status === "paid" ? "default" : inst.status === "overdue" ? "destructive" : "secondary"}
                    className="text-[9px] h-4 font-black px-2"
                  >
                    {inst.status}
                  </Badge>

                  {isAdmin && inst.status !== "paid" && (
                    <Vault>
                      <VaultTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md border-border/50 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </VaultTrigger>
                      <VaultContent>
                        <VaultHeader>
                          <VaultTitle>
                            {t("manageInstallment")} #{inst.orderIndex}
                          </VaultTitle>
                        </VaultHeader>
                        <div className="p-4 flex flex-col gap-5">
                          <div className="flex items-start gap-3 p-4 border border-dashed border-border rounded-md bg-muted/5">
                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {t("adminActionsDesc")}
                            </p>
                          </div>

                          {/* Seção de Detalhes do Pagamento / Gerar Cobrança */}
                          <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {t("paymentDetails") || "Detalhes do Pagamento"}
                            </Label>

                            {!inst.abacatePayBillingId && !inst.stripePaymentIntentId ? (
                              <div className="flex flex-col items-center gap-3 p-4 border border-dashed border-border rounded-md bg-muted/5 text-center">
                                <QrCode className="w-8 h-8 text-muted-foreground opacity-60" strokeWidth={1.5} />
                                <div>
                                  <p className="font-bold text-xs text-foreground">
                                    {t("noInvoiceGenerated") || "Nenhuma cobrança gerada"}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-1">
                                    {t("noInvoiceGeneratedDesc") || "O link ou código de pagamento ainda não foi criado para esta parcela."}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onGenerateInvoice?.(inst.id)}
                                  disabled={isUpdating}
                                  className="w-full gap-2 font-bold mt-2"
                                >
                                  <RotateCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                                  {t("generatePaymentCode") || "Gerar Código de Pagamento"}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-4 p-4 border border-border rounded-md bg-muted/5">
                                {activeSubscription?.plan?.currency === "USD" || inst.pixPayload?.startsWith("http") ? (
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="w-4 h-4 text-primary" />
                                      <p className="font-bold text-xs text-foreground">
                                        {t("stripePaymentLink") || "Link de Pagamento Stripe"}
                                      </p>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                      {t("stripeLinkDesc") || "Esta parcela é cobrada em USD via Stripe. Clique abaixo para abrir o checkout ou copiar o link."}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                      <a
                                        href={inst.pixPayload || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/95 gap-1.5"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        {t("goToPayment") || "Ir para Pagamento"}
                                      </a>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          if (inst.pixPayload) {
                                            try {
                                              await navigator.clipboard.writeText(inst.pixPayload);
                                              notify.success(t("pixCopySuccess") || "Link copiado!");
                                            } catch {
                                              notify.error(t("copyError") || "Erro ao copiar.");
                                            }
                                          }
                                        }}
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-3">
                                    {inst.pixImage && (
                                      <div className="flex justify-center bg-white p-2.5 rounded-md border border-border/80 self-center">
                                        <Image
                                          src={inst.pixImage}
                                          alt="QR Code PIX"
                                          width={110}
                                          height={110}
                                          className="mix-blend-multiply"
                                        />
                                      </div>
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                        {t("pixCode") || "Código Copia e Cola"}
                                      </Label>
                                      <div className="flex gap-2">
                                        <Input
                                          readOnly
                                          className="input text-xs font-mono select-all h-9 flex-1"
                                          value={inst.pixPayload || ""}
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={async () => {
                                            if (inst.pixPayload) {
                                              try {
                                                await navigator.clipboard.writeText(inst.pixPayload);
                                                notify.success(t("pixCopySuccess") || "Código copiado!");
                                              } catch {
                                                notify.error(t("copyError") || "Erro ao copiar.");
                                              }
                                            }
                                          }}
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Regenerate expired PIX — only for BRL overdue/cancelled */}
                                {(inst.status === "overdue" || inst.status === "cancelled") &&
                                  activeSubscription?.plan?.currency !== "USD" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onGenerateInvoice?.(inst.id, { force: true })}
                                      disabled={isUpdating}
                                      className="w-full gap-2 font-bold mt-2 border-amber-400/60 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                                    >
                                      <RotateCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                                      {t("regenerateInvoice") || "Gerar Novamente"}
                                    </Button>
                                )}

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => onResendReminder?.(inst.id)}
                                  disabled={isUpdating}
                                  className="w-full gap-2 font-bold mt-2"
                                >
                                  <Send className={`w-3.5 h-3.5 ${isUpdating ? "animate-pulse" : ""}`} />
                                  {t("resendReminderBtn") || "Reenviar Lembrete de Pagamento"}
                                </Button>
                              </div>
                            )}
                          </div>

                          <form
                            onSubmit={installmentForm.handleSubmit((d) =>
                              onUpdateInstallment(inst.id, { amount: d.amount })
                            )}
                            className="flex flex-col gap-4 pt-4 border-t border-border/50"
                          >
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("newAmount")}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                className="input"
                                defaultValue={inst.amount / 100}
                                {...installmentForm.register("amount", {
                                  valueAsNumber: true,
                                })}
                              />
                              <Button type="submit" disabled={isUpdating || !adminPassword} className="font-bold">
                                {t("update")}
                              </Button>
                            </div>
                          </form>

                          <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {t("securityConfirmation")}
                            </Label>
                            <Input
                              type="password"
                              className="input"
                              placeholder={t("adminPasswordPlaceholder")}
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                            />
                            <Button
                              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 font-black text-xs uppercase tracking-widest py-6"
                              onClick={() => onMarkAsPaid(inst.id)}
                              disabled={isUpdating || !adminPassword}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              {t("confirmAndMarkPaid")}
                            </Button>
                          </div>
                        </div>
                      </VaultContent>
                    </Vault>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan history */}
      {subscriptions.filter((s) => s.status !== "active").length > 0 && (
        <div>
          <SectionLabel>{t("planHistory")}</SectionLabel>
          <div className="flex flex-col gap-2">
            {subscriptions
              .filter((s) => s.status !== "active")
              .map((sub) => (
                <div
                  key={sub.id}
                  className="item flex items-center justify-between px-6 py-4 transition-all"
                >
                  <div>
                    <p className="text-sm font-black tracking-tight">{sub.plan?.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {format(new Date(sub.startDate), "MMM yyyy")} —{" "}
                      {sub.endDate
                        ? format(new Date(sub.endDate), "MMM yyyy")
                        : "ENCERRADO"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-widest opacity-60">
                    {sub.status}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
