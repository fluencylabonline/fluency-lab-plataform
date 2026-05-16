"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  Clock,
  CheckCircle2,
  CalendarDays,
  AlertTriangle,
  Plus
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";

import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultSecondaryButton,
  VaultPrimaryButton,
  VaultField,
  VaultInput,
  VaultIcon,
  VaultForm
} from "@/components/ui/vault";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { notify } from "@/components/ui/toaster";
import {
  getStudentCreditsAction,
  grantCreditAction
} from "@/modules/scheduling/scheduling.actions";
import { creditTypeEnum } from "@/modules/scheduling/scheduling.schema";
import { StudentCredit } from "@/modules/scheduling/scheduling.types";
import { Button } from "@/components/ui/button";

const grantFormSchema = z.object({
  type: z.enum(creditTypeEnum.enumValues),
  amount: z.coerce.number().int().positive().default(1),
  expiresAt: z.string(),
  reason: z.string().max(255).optional(),
});

type GrantFormValues = z.input<typeof grantFormSchema>;

interface ManageCreditsVaultProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
}

export function ManageCreditsVault({
  studentId,
  open,
  onOpenChange,
  isAdmin,
}: ManageCreditsVaultProps) {
  const [credits, setCredits] = useState<StudentCredit[]>([]);
  const [history, setHistory] = useState<StudentCredit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"list" | "grant" | "history">("list");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues
  } = useForm<GrantFormValues>({
    resolver: zodResolver(grantFormSchema),
    defaultValues: {
      type: "bonus",
      amount: 1,
      expiresAt: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      reason: "",
    },
  });

  const { execute, isPending } = useAction(grantCreditAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        notify.success("Crédito concedido com sucesso!");
        fetchCredits();
        setView("list");
        reset();
      } else {
        notify.error(data?.error || "Erro ao conceder crédito");
      }
    },
    onError: () => {
      notify.error("Erro ao processar solicitação");
    }
  });

  const fetchCredits = useCallback(async () => {
    setIsLoading(true);
    const [activeRes, historyRes] = await Promise.all([
      getStudentCreditsAction({ studentId, onlyActive: true }),
      getStudentCreditsAction({ studentId, onlyActive: false }),
    ]);

    if (activeRes?.data?.success) {
      setCredits(activeRes.data.data || []);
    }
    if (historyRes?.data?.success) {
      const all = historyRes.data.data || [];
      const historyOnly = all.filter((c: StudentCredit) => c.usedAt || (c.expiresAt && new Date(c.expiresAt) < new Date()));
      setHistory(historyOnly);
    }
    setIsLoading(false);
  }, [studentId]);

  useEffect(() => {
    const init = async () => {
      if (open) {
        await fetchCredits();
        setView("list");
        reset();
      }
    };
    init();
  }, [open, studentId, reset, fetchCredits]);

  const onGrantSubmit = (values: GrantFormValues) => {
    execute({
      studentId,
      type: values.type,
      amount: Number(values.amount),
      expiresAt: values.expiresAt,
      reason: values.reason,
    });
  };

  const getStatusBadge = (credit: StudentCredit) => {
    if (credit.usedAt) return <Badge variant="secondary">Usado</Badge>;
    if (credit.expiresAt && new Date(credit.expiresAt) < new Date()) return <Badge variant="destructive">Expirado</Badge>;
    return <Badge variant="default" className="bg-emerald-500">Ativo</Badge>;
  };

  const getCreditTypeLabel = (type: string) => {
    switch (type) {
      case "bonus": return "Bônus";
      case "late-students": return "Atraso de Aluno";
      case "teacher-cancellation": return "Cancelamento Professor";
      default: return type;
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent noPadding className="max-w-2xl">
        <VaultHeader className="px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <VaultTitle className="flex items-center gap-2">
              <VaultIcon type="confirm" className="mb-0" />
              Gestão de Créditos
            </VaultTitle>
            {view !== "list" && (
              <Button variant="ghost" size="sm" onClick={() => setView("list")}>
                Voltar
              </Button>
            )}
          </div>
          <VaultDescription>
            Créditos permitem que o aluno agende aulas de reposição ou bônus fora do contrato fixo.
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="max-h-[60vh] overflow-y-auto">
          {view === "list" && (
            <div className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-md flex flex-col gap-1 text-center">
                  <span className="text-2xl font-bold text-amber-600">{credits.length}</span>
                  <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Créditos Ativos</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-md flex flex-col gap-1 text-center">
                  <span className="text-2xl font-bold text-emerald-600">{history.filter(c => c.usedAt).length}</span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Créditos Usados</span>
                </div>
              </div>

              {isAdmin && (
                <Button className="w-full py-6 text-lg font-bold rounded-2xl" onClick={() => setView("grant")}>
                  <Plus className="mr-2 h-5 w-5" /> Conceder Novo Crédito
                </Button>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Créditos Disponíveis
                </h4>
                
                {isLoading ? (
                  <div className="py-8 text-center animate-pulse text-muted-foreground text-sm">Carregando créditos...</div>
                ) : credits.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-accent/10 border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-muted-foreground">Nenhum crédito disponível no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {credits.map((credit) => (
                      <div key={credit.id} className="p-4 border rounded-2xl bg-card hover:bg-accent/5 transition-colors border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-bold border-gray-200">{getCreditTypeLabel(credit.type)}</Badge>
                            <span className="text-sm font-bold">{credit.amount} Aula(s)</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                            <CalendarDays className="h-3 w-3" />
                            Expira em {format(new Date(credit.expiresAt), "dd/MM/yyyy")}
                          </span>
                        </div>
                        {credit.reason && (
                          <p className="text-xs text-muted-foreground italic mb-3">&quot;{credit.reason}&quot;</p>
                        )}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground font-medium">Concedido em {format(new Date(credit.grantedAt), "dd/MM/yy")}</span>
                          {getStatusBadge(credit)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button variant="link" className="w-full text-xs text-muted-foreground" onClick={() => setView("history")}>
                Ver histórico completo
              </Button>
            </div>
          )}

          {view === "grant" && (
            <div className="px-6 pb-6">
              <VaultForm onSubmit={handleSubmit(onGrantSubmit)} id="grant-credit-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VaultField label="Tipo de Crédito" error={errors.type?.message} required>
                    <Select onValueChange={(val) => setValue("type", val as GrantFormValues["type"])} defaultValue={getValues("type")}>
                      <SelectTrigger className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">Bônus</SelectItem>
                        <SelectItem value="late-students">Atraso Aluno</SelectItem>
                        <SelectItem value="teacher-cancellation">Cancelamento Professor</SelectItem>
                      </SelectContent>
                    </Select>
                  </VaultField>

                  <VaultField label="Quantidade de aulas" error={errors.amount?.message} required>
                    <VaultInput type="number" {...register("amount")} className="h-11" />
                  </VaultField>
                </div>

                <VaultField label="Data de Expiração" error={errors.expiresAt?.message} required>
                  <VaultInput type="date" {...register("expiresAt")} className="h-11" />
                </VaultField>

                <VaultField label="Motivo / Observação" error={errors.reason?.message}>
                  <VaultInput placeholder="Ex: Aula de reposição devido à queda de luz" {...register("reason")} className="h-11" />
                </VaultField>
              </VaultForm>
            </div>
          )}

          {view === "history" && (
            <div className="px-6 pb-6 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" /> Histórico de Créditos
              </h4>
              
              {history.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm bg-accent/5 rounded-2xl border-2 border-dashed">Nenhum histórico encontrado.</div>
              ) : (
                <div className="space-y-3">
                  {history.map((credit) => (
                    <div key={credit.id} className="p-4 border rounded-2xl bg-accent/5 opacity-80 border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">{getCreditTypeLabel(credit.type)} ({credit.amount})</span>
                        {getStatusBadge(credit)}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Concedido em {format(new Date(credit.grantedAt), "dd/MM/yy")}</span>
                        {credit.usedAt && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Usado em {format(new Date(credit.usedAt), "dd/MM/yy")}
                          </span>
                        )}
                        {!credit.usedAt && new Date(credit.expiresAt) < new Date() && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" /> Expirado em {format(new Date(credit.expiresAt), "dd/MM/yy")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </VaultBody>

        {view === "grant" && (
          <VaultFooter className="px-6 pb-6">
            <VaultSecondaryButton onClick={() => setView("list")} disabled={isPending}>
              Cancelar
            </VaultSecondaryButton>
            <VaultPrimaryButton type="submit" form="grant-credit-form" disabled={isPending}>
              {isPending ? "Concedendo..." : "Conceder Crédito"}
            </VaultPrimaryButton>
          </VaultFooter>
        )}
      </VaultContent>
    </Vault>
  );
}
