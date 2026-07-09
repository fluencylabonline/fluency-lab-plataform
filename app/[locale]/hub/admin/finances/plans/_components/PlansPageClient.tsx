"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Plus, Edit2, Calendar, Clock, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plan } from "@/modules/billing/billing.schema";
import { formatCurrency } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { PlanVault } from "./PlanVault";

import { togglePlanStatusAction, deletePlanAction } from "@/modules/billing/billing.actions";
import { notify } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultFooter,
  VaultIcon,
  VaultPrimaryButton,
  VaultSecondaryButton,
} from "@/components/ui/vault";

interface PlansPageClientProps {
  initialPlans: Plan[];
  languages: { id: string; name: string }[];
  user: {
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
}

export function PlansPageClient({ initialPlans, languages, user }: PlansPageClientProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = useTranslations("Billing");

  const handleSuccess = (updatedPlan: Plan) => {
    setPlans((currentPlans) => {
      const exists = currentPlans.some((p) => p.id === updatedPlan.id);
      if (exists) {
        return currentPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
      }
      return [updatedPlan, ...currentPlans];
    });
  };

  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    setTogglingId(planId);
    try {
      const result = await togglePlanStatusAction({ id: planId, isActive: !currentStatus });
      if (result?.data?.success && result.data.plan) {
        handleSuccess(result.data.plan as Plan);
        notify.success(t("statusUpdated") || "Status atualizado!");
      } else {
        notify.error(result?.data?.error || t("statusUpdateError") || "Erro ao atualizar status");
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deletePlanAction({ id: planToDelete.id });
      if (result?.data?.success) {
        setPlans((currentPlans) => currentPlans.filter((p) => p.id !== planToDelete.id));
        notify.success(t("planDeleted") || "Plano excluído com sucesso!");
        setPlanToDelete(null);
      } else {
        notify.error(result?.data?.error || t("planDeleteError") || "Não é possível excluir o plano pois possui matrículas associadas.");
      }
    } catch (error) {
      console.error(error);
      notify.error(t("planDeleteError") || "Ocorreu um erro ao excluir o plano.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = () => {
    setSelectedPlan(undefined);
    setIsVaultOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsVaultOpen(true);
  };

  return (
    <div>
      <Header
        title={t("plansTitle") || "Gestão de Planos"}
        subtitle={t("plansSubtitle") || "Configure os pacotes de aulas e mensalidades"}
        user={user}
        actions={[{
          label: t("newPlan") || "Novo Plano",
          icon: <Plus className="w-4 h-4" />,
          onClick: handleCreate
        }]}
        backHref="/hub/admin/finances"
        className="contents"
      />

      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plans.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl border-border bg-card/50 text-muted-foreground animate-in fade-in zoom-in duration-300">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Plus className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-bold text-foreground">{t("noPlansRegistered") || "Nenhum plano cadastrado"}</h3>
              <p className="text-sm max-w-xs text-center mt-1">{t("noPlansDesc") || "Comece criando um plano para associar aos seus alunos."}</p>
              <Button variant="default" className="mt-6 rounded-md font-bold" onClick={handleCreate}>
                {t("createFirstPlan") || "Criar Primeiro Plano"}
              </Button>
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className={`card p-5 flex flex-col justify-between ${!plan.isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg leading-tight group-hover:text-primary transition-colors truncate">
                          {plan.name}
                        </h3>
                        {!plan.isActive && (
                          <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4 border-muted-foreground/30 text-muted-foreground">
                            {t("inactive") || "Inativo"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] uppercase font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary border-none">
                          {plan.language}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-full transition-all ${plan.isActive ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={() => handleToggleStatus(plan.id, plan.isActive)}
                        disabled={togglingId === plan.id}
                      >
                        {togglingId === plan.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${plan.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-muted-foreground/30'}`} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-foreground"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                        onClick={() => setPlanToDelete(plan)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center gap-2.5 p-2 bg-muted/30 rounded-md border border-border/50">
                      <div className="p-1.5 bg-background rounded-lg shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground leading-none">{t("frequency") || "Frequência"}</span>
                        <span className="text-xs font-black text-foreground">{t("classesPerWeekLabel", { count: plan.classesPerWeek || 0 }) || `${plan.classesPerWeek}x / sem`}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 bg-muted/30 rounded-md border border-border/50">
                      <div className="p-1.5 bg-background rounded-lg shadow-sm">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground leading-none">{t("contract") || "Contrato"}</span>
                        <span className="text-xs font-black text-foreground">{t("monthsCount", { count: plan.durationMonths || 0 }) || `${plan.durationMonths} meses`}</span>
                      </div>
                    </div>
                  </div>

                  {plan.description && (
                    <div className="bg-muted/20 p-2.5 rounded-lg border border-dashed border-border/50">
                      <p className="text-[11px] text-muted-foreground line-clamp-2 italic leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-muted-foreground/60">{t("monthlyInvestment") || "Investimento Mensal"}</span>
                    <span className="text-2xl font-black tracking-tighter text-primary">
                      {formatCurrency(plan.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <PlanVault
        open={isVaultOpen}
        onOpenChange={setIsVaultOpen}
        plan={selectedPlan}
        onSuccess={handleSuccess}
        languages={languages}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Vault open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="delete" />
            <VaultTitle>{t("deletePlan") || "Excluir Plano"}</VaultTitle>
            <VaultDescription>
              {t("deletePlanWarning") || "Tem certeza que deseja excluir o plano"} &quot;<strong>{planToDelete?.name}</strong>&quot;? {t("deletePlanWarningDetail") || "Esta ação não poderá ser desfeita e só funcionará se o plano não estiver associado a nenhum aluno."}
            </VaultDescription>
          </VaultHeader>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setPlanToDelete(null)}>
              {t("cancel") || "Cancelar"}
            </VaultSecondaryButton>
            <VaultPrimaryButton
              variant="destructive"
              onClick={handleDeletePlan}
              disabled={isDeleting}
            >
              {isDeleting ? (t("deleting") || "Excluindo...") : (t("delete") || "Excluir")}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
