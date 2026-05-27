"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  HelpCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  CheckCircle,
  Loader2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getPlansAction, changeStudentPlanAction } from "@/modules/billing/billing.actions";
import type { SubscriptionWithPlan } from "@/modules/billing/billing.types";
import type { User } from "@/modules/user/user.schema";

interface StudentPlanTabProps {
  user: User;
  activeSubscription?: SubscriptionWithPlan | null;
  isAdmin: boolean;
}

const changePlanSchema = z.object({
  planId: z.string().uuid("Selecione um plano comercial válido"),
});

type ChangePlanValues = z.infer<typeof changePlanSchema>;

export function StudentPlanTab({ user, activeSubscription, isAdmin }: StudentPlanTabProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<{ id: string; name: string; price: number; classesPerWeek: number | null; durationMonths: number; language?: string | null }[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const form = useForm<ChangePlanValues>({
    resolver: zodResolver(changePlanSchema),
    defaultValues: {
      planId: activeSubscription?.planId || "",
    },
  });

  const { formState: { errors, isSubmitting }, handleSubmit, setValue, control } = form;
  const selectedPlanId = useWatch({ control, name: "planId" });

  useEffect(() => {
    getPlansAction()
      .then((result) => {
        if (result?.data?.success && result.data.data) {
          setPlans(result.data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load plans:", err);
        notify.error("Erro ao carregar os planos ativos");
      })
      .finally(() => {
        setIsLoadingPlans(false);
      });
  }, []);

  // Update default value once subscription loads
  useEffect(() => {
    if (activeSubscription?.planId) {
      setValue("planId", activeSubscription.planId);
    }
  }, [activeSubscription, setValue]);

  const onSubmit: SubmitHandler<ChangePlanValues> = async (data) => {
    if (data.planId === activeSubscription?.planId) {
      notify.error("Selecione um plano diferente do atual para transferir.");
      return;
    }

    const toastId = "change-student-plan";
    notify.loading("Processando transferência de plano...", undefined, toastId);

    try {
      const result = await changeStudentPlanAction({
        studentId: user.id,
        planId: data.planId,
      });

      if (result?.data?.success) {
        notify.success(
          "Plano alterado com sucesso!",
          "As parcelas futuras do aluno foram reajustadas e o e-mail de aviso foi enviado.",
          toastId
        );
        router.refresh();
      } else {
        const errorMsg = result?.data?.error || "Erro desconhecido";
        notify.error("Falha ao alterar o plano", errorMsg, toastId);
      }
    } catch (err) {
      console.error("[changeStudentPlan] Error:", err);
      notify.error("Erro ao processar alteração", undefined, toastId);
    }
  };

  const currentPlan = activeSubscription?.plan;
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const formattedCurrentPrice = currentPlan
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(currentPlan.price / 100)
    : "—";

  const formattedSelectedPrice = selectedPlan
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedPlan.price / 100)
    : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Coluna 1 & 2: Gerenciamento do Plano */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Informações do Plano Ativo */}
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <BookOpen className="w-5 h-5 text-violet-500" />
            <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-100">
              Plano de Estudos Atual
            </h3>
          </div>

          {activeSubscription ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Plano Comercial</span>
                <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                  {currentPlan?.name || "Plano Ativo"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Aulas Semanais</span>
                <span className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                  {currentPlan?.classesPerWeek ? `${currentPlan.classesPerWeek}x por semana` : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Mensalidade</span>
                <span className="text-base font-bold text-primary">
                  {formattedCurrentPrice}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Ciclo do Contrato</span>
                <span className="text-base font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  {activeSubscription.endDate 
                    ? `Até ${new Date(activeSubscription.endDate).toLocaleDateString("pt-BR")}`
                    : "Sem data de expiração"
                  }
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-400">
              <HelpCircle className="w-10 h-10 mb-2 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm">O estudante não possui uma assinatura de plano ativa no momento.</p>
            </div>
          )}
        </div>

        {/* Formulário de Transferência de Plano */}
        {activeSubscription && isAdmin && (
          <form onSubmit={handleSubmit(onSubmit)} className="card p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-100">
                Transferir para Outro Plano Comercial
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Selecione o Novo Plano Padrão da Escola:
              </label>

              {isLoadingPlans ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <Select
                  value={selectedPlanId}
                  onValueChange={(val) => setValue("planId", val, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-md">
                    <SelectValue placeholder="Selecione o plano de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — R$ {(p.price / 100).toFixed(2)}/mês ({p.classesPerWeek}x/sem)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.planId && (
                <span className="text-xs text-rose-500 font-medium">{errors.planId.message}</span>
              )}
            </div>

            {/* Comparativo de Alteração */}
            {selectedPlan && selectedPlan.id !== activeSubscription.planId && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-100 dark:border-zinc-800 rounded-md flex flex-col gap-3 text-sm"
              >
                <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                  Comparativo de Mudança:
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-400 font-medium">Aulas Semanais</span>
                    <span className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
                      {currentPlan?.classesPerWeek}x 
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" /> 
                      <strong className="text-violet-600 dark:text-violet-400">{selectedPlan.classesPerWeek}x</strong>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-400 font-medium">Mensalidade</span>
                    <span className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
                      {formattedCurrentPrice} 
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" /> 
                      <strong className="text-teal-600 dark:text-teal-400">{formattedSelectedPrice}</strong>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Caixa Informativa de Impacto */}
            <div className="card p-4 border border-violet-100 dark:border-violet-950 bg-violet-50/20 dark:bg-violet-950/10 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed flex flex-col gap-2">
              <p className="font-semibold flex items-center gap-1.5 text-violet-800 dark:text-violet-300">
                <CheckCircle className="w-4 h-4 text-violet-500" />
                Impacto da Transferência Financeira
              </p>
              <p>
                Ao transferir o aluno, o valor de <strong>todas as faturas futuras pendentes</strong> no sistema será reajustado proporcionalmente para a mensalidade do plano selecionado. A data final original de expiração do contrato e o número de parcelas restantes são mantidos integralmente.
              </p>
              <p>
                <strong>Notificação:</strong> O estudante receberá um e-mail informando que seu plano de estudos foi atualizado e que essas novas condições serão válidas até o final do contrato e mantidas em sua renovação automática.
              </p>
            </div>

            <Button
              type="submit"
              variant="default"
              className="h-11 w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all"
              isLoading={isSubmitting}
              disabled={isSubmitting || selectedPlanId === activeSubscription.planId}
            >
              {isSubmitting ? "Alterando Plano..." : "Salvar Alterações de Plano"}
            </Button>
          </form>
        )}
      </div>

      {/* Coluna 3: Regras Comerciais & Auditoria */}
      <div className="flex flex-col gap-6">
        <div className="card p-6 flex flex-col gap-4 text-sm leading-relaxed">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Regras de Migração
          </div>

          <ul className="space-y-3 text-zinc-500 dark:text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0 mt-2" />
              <span><strong>Faturamento Passado:</strong> Faturas que já constam como &quot;Pagas&quot; mantêm os valores originais por questões de integridade fiscal e de histórico.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0 mt-2" />
              <span><strong>Reajustes Futuros:</strong> Ao manter o aluno vinculado a um plano comercial global padrão, caso o preço global desse plano sofra um reajuste de reajuste anual posterior no painel administrativo, a mudança será aplicada nas faturas do aluno automaticamente.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0 mt-2" />
              <span><strong>Assinatura Integrada:</strong> Na expiração do contrato atual, ao clicar em &quot;Renovar&quot;, a nova assinatura e as novas faturas serão geradas baseadas exatamente nas condições do novo plano.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
