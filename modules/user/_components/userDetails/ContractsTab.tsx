"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { FileText, Eye, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "./UserDetailsPrimitives";
import { Badge } from "@/components/ui/badge";

import { ContractWithTemplate } from "@/modules/contract/contract.types";

interface ContractsTabProps {
  contracts: ContractWithTemplate[];
  onViewContract: (id: string) => Promise<void>;
  onDownloadContract: (id: string) => Promise<void>;
  loadingContractId: string | null;
}

export function ContractsTab({
  contracts,
  onViewContract,
  onDownloadContract,
  loadingContractId,
}: ContractsTabProps) {
  const t = useTranslations("UserManagement");

  if (contracts.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-md py-16 flex flex-col items-center gap-3">
        <FileText className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
        <div className="text-center">
          <p className="font-bold text-sm">{t("noContracts")}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {t("noContractsDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>{t("userContracts")}</SectionLabel>
      <div className="border border-border rounded-md overflow-hidden divide-y divide-border">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-4 card"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-sm bg-muted shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm truncate">
                  {contract.type === "enrollment"
                    ? t("enrollmentContract")
                    : t("teacherServiceContract")}
                </p>
                <p className="font-black text-sm tracking-tight truncate">
                  {contract.title || t("contract")}
                </p>
                <div className="flex items-center gap-2.5 mt-1">
                  <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-widest bg-muted/30">
                    v{contract.version || "1.0"}
                  </Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {format(new Date(contract.createdAt), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {contract.status === "signed" && (
                <div className="flex items-center gap-2 mr-2">
                  {(!contract.expiresAt || new Date(contract.expiresAt) > new Date()) ? (
                    <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      {t("valid")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-widest bg-destructive/10 text-destructive border-destructive/20">
                      {t("expired")}
                    </Badge>
                  )}
                  {contract.expiresAt && (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                      {t("validUntil")} {format(new Date(contract.expiresAt), "dd/MM/yyyy")}
                    </span>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() => onViewContract(contract.id)}
                disabled={loadingContractId === contract.id}
              >
                {loadingContractId === contract.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    {t("view")}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() => onDownloadContract(contract.id)}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {t("download")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
