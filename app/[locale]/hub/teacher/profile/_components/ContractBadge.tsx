"use client";

import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert, ShieldX, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ContractBadgeProps {
  contract: {
    status: "pending" | "signed" | "cancelled" | "expired";
    expiresAt: Date | null;
  } | null;
}

export function ContractBadge({ contract }: ContractBadgeProps) {
  const t = useTranslations("Profile.Contract");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  if (!contract) {
    return (
      <div className="card flex items-center gap-4 p-4">
        <div className="bg-muted p-3 rounded-full">
          <ShieldAlert className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h4 className="font-semibold">{t("noContract") || "Sem contrato ativo"}</h4>
          <p className="text-sm text-muted-foreground">
            {t("noContractDescription") || "Entre em contato com o suporte para regularizar sua situação."}
          </p>
        </div>
      </div>
    );
  }

  const isExpired = contract.status === "expired" || (contract.expiresAt && new Date(contract.expiresAt) < new Date());
  const isCancelled = contract.status === "cancelled";
  const isPending = contract.status === "pending";

  let statusIcon = <ShieldCheck className="w-6 h-6 text-white" />;
  let statusText = t("active") || "Contrato Ativo";
  let statusClass = "text-green-500";

  if (isExpired) {
    statusIcon = <ShieldX className="w-6 h-6 text-white" />;
    statusText = t("expired") || "Contrato Expirado";
    statusClass = "text-red-500";
  } else if (isCancelled) {
    statusIcon = <ShieldX className="w-6 h-6 text-white" />;
    statusText = t("cancelled") || "Contrato Cancelado";
    statusClass = "text-red-500";
  } else if (isPending) {
    statusIcon = <ShieldAlert className="w-6 h-6 text-white" />;
    statusText = t("pending") || "Assinatura Pendente";
    statusClass = "text-yellow-500";
  }

  return (
    <div className="card p-4 space-y-4">
      <Link href="/hub/teacher/contract">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full bg-opacity-10", statusClass.replace("text-", "bg-"))}>
              {statusIcon}
            </div>
            <div>
              <h4 className="font-semibold">{statusText}</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {t("status") || "Status do Contrato"}
              </p>
            </div>
          </div>
        </div>
      </Link>
      {contract.expiresAt && (
        <div className="item flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">{t("expiresAt") || "Expira em"}: </span>
            <span className="font-medium">
              {format(new Date(contract.expiresAt), "PPP", { locale: dateLocale })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
