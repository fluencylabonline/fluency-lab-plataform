"use client";

import { useState } from "react";
import {
  Vault, VaultContent, VaultHeader, VaultTitle, VaultDescription,
  VaultBody, VaultIcon,
  VaultTrigger
} from "@/components/ui/vault";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getTeacherRecessesAction } from "@/modules/scheduling/scheduling.actions";
import { Calendar, ChevronRight, Info, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { RecessRequest } from "@/modules/scheduling/scheduling.types";
import { Shimmer } from "@shimmer-from-structure/react";
import { useTranslations } from "next-intl";

interface CheckRecessVaultProps {
  teacherId: string;
  iconOnly?: boolean;
}

const MOCK_RECESSES: RecessRequest[] = [
  {
    id: "mock-1",
    teacherId: "mock",
    startDate: new Date(),
    endDate: new Date(),
    isValidated: false,
    fallbackConfig: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mock-2",
    teacherId: "mock",
    startDate: new Date(),
    endDate: new Date(),
    isValidated: true,
    fallbackConfig: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

function RecessList({ recesses }: { recesses: RecessRequest[] }) {
  const t = useTranslations("Recess");
  if (recesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center" data-shimmer-ignore>
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Info className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-bold">{t('noRecessFound') || "Nenhum recesso encontrado"}</p>
          <p className="text-xs text-muted-foreground px-8">
            {t('noRecessFoundDesc') || "Você ainda não agendou nenhum período de recesso."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {recesses.map((recess) => (
        <div key={recess.id} className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={recess.isValidated ? "default" : "secondary"} className="text-[9px] uppercase h-5">
                  {recess.isValidated ? (t('approved') || "Aprovado") : (t('underReview') || "Em Revisão")}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {t('requestedOn', { date: format(new Date(recess.createdAt), "dd/MM/yyyy") }) || `Solicitado em ${format(new Date(recess.createdAt), "dd/MM/yyyy")}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 bg-background rounded-md border border-border/30">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{t('start') || "Início"}</span>
              <span className="text-sm font-bold">{format(new Date(recess.startDate), "dd 'de' MMM", { locale: ptBR })}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{t('end') || "Fim"}</span>
              <span className="text-sm font-bold">{format(new Date(recess.endDate), "dd 'de' MMM", { locale: ptBR })}</span>
            </div>
          </div>

          {!recess.isValidated && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10" data-shimmer-ignore>
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-medium">{t('waitingManualApproval') || "Aguardando aprovação manual dos managers"}</span>
            </div>
          )}
          {recess.isValidated && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10" data-shimmer-ignore>
              <CheckCircle2 className="w-3 h-3" />
              <span className="text-[10px] font-medium">{t('autoValidatedSLA') || "Validado automaticamente conforme o SLA"}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CheckRecessVault({ teacherId, iconOnly }: CheckRecessVaultProps) {
  const t = useTranslations("Recess");
  const [isOpen, setIsOpen] = useState(false);

  const { data: recesses, isLoading } = useSWR(
    isOpen ? ["teacher-recesses", teacherId] : null,
    () => getTeacherRecessesAction({ teacherId }).then(res => res?.data?.data || [])
  );

  return (
    <Vault open={isOpen} onOpenChange={setIsOpen}>
      <VaultTrigger asChild>
        {iconOnly ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <Calendar className="w-5 h-5 text-primary" />
            <span className="sr-only">{t('checkRecesses') || "Conferir Recessos"}</span>
          </Button>
        ) : (
          <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            {t('checkRecesses') || "Conferir Recessos"}
          </Button>
        )}
      </VaultTrigger>

      <VaultContent className="sm:max-w-lg">
        <VaultHeader>
          <VaultIcon type="calendar" />
          <VaultTitle>{t('yourRecesses') || "Seus Recessos"}</VaultTitle>
          <VaultDescription>
            {t('recessHistoryDesc') || "Histórico de recessos agendados e status de aprovação."}
          </VaultDescription>
        </VaultHeader>

        <VaultBody>
          <Shimmer loading={isLoading} templateProps={{ recesses: MOCK_RECESSES }}>
            <RecessList recesses={recesses || []} />
          </Shimmer>
        </VaultBody>

      </VaultContent>
    </Vault>
  );
}
