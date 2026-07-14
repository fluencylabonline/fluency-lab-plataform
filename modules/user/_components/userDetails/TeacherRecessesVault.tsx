"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, Smile } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultIcon,
} from "@/components/ui/vault";
import { Badge } from "@/components/ui/badge";
import { getTeacherRecessesAction } from "@/modules/scheduling/scheduling.actions";

interface RecessRequest {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  isValidated: boolean;
  fallbackConfig: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface TeacherRecessesVaultProps {
  teacherId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherRecessesVault({
  teacherId,
  open,
  onOpenChange,
}: TeacherRecessesVaultProps) {
  const [recesses, setRecesses] = useState<RecessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const fetchRecesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getTeacherRecessesAction({ teacherId });
      if (response?.data?.success && response.data.data) {
        setRecesses(response.data.data as RecessRequest[]);
      }
    } catch (error) {
      console.error("Error fetching recesses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (open) {
      fetchRecesses();
    }
  }, [open, fetchRecesses]);

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent noPadding className="max-w-md">
        <VaultHeader className="px-6 pt-6">
          <VaultTitle className="flex items-center gap-2">
            <VaultIcon type="calendar" className="mb-0" />
            Recessos Cadastrados
          </VaultTitle>
          <VaultDescription>
            Períodos de recesso e folga do professor registrados no sistema.
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center animate-pulse text-muted-foreground text-sm">
              Carregando recessos...
            </div>
          ) : recesses.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-md bg-muted/10 border-border flex flex-col items-center gap-2">
              <Smile className="w-8 h-8 text-muted-foreground opacity-60" />
              <p className="text-sm text-muted-foreground">Nenhum período de recesso cadastrado.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recesses.map((recess) => {
                const start = new Date(recess.startDate);
                const end = new Date(recess.endDate);
                const isPast = end < new Date();
                
                return (
                  <div
                    key={recess.id}
                    className="p-4 border rounded-md bg-card hover:bg-accent/5 transition-colors border-border/50 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Cadastrado em {format(new Date(recess.createdAt), "dd/MM/yyyy")}
                      </span>
                      <Badge variant={isPast ? "secondary" : "default"} className="text-[9px] uppercase font-black px-2">
                        {isPast ? "Passado" : "Agendado"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm font-bold text-foreground">
                      <span>De {format(start, "dd 'de' MMM", { locale: dateLocale })}</span>
                      <span>Até {format(end, "dd 'de' MMM", { locale: dateLocale })}</span>
                    </div>

                    {recess.fallbackConfig && Object.keys(recess.fallbackConfig).length > 0 && (
                      <div className="text-[10px] text-muted-foreground font-medium pt-1.5 border-t border-white/5">
                        {Object.keys(recess.fallbackConfig).length} aula(s) com atividades alternativas definidas.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
