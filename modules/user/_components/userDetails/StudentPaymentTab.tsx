"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Clock, Edit2, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}: StudentPaymentTabProps) {
  const t = useTranslations("UserManagement");

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
              value={format(endOfMonth(new Date()), "dd/MM/yyyy")}
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
                      {format(new Date(inst.dueDate), "dd/MM/yyyy")}
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
