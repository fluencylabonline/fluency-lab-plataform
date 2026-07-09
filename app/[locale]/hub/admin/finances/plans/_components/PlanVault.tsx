"use client";

import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  Vault,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultFooter,
  VaultContent,
  VaultForm,
  VaultBody,
  VaultField,
  VaultInput,
  VaultPrimaryButton,
  VaultSecondaryButton
} from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  createPlanSchema,
  Plan
} from "@/modules/billing/billing.schema";
import {
  createPlanAction,
  updatePlanAction,
  getAffectedStudentsAction
} from "@/modules/billing/billing.actions";
import { notify } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PlanVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan;
  onSuccess?: (plan: Plan) => void;
  languages: { id: string; name: string }[];
}

const clientPlanSchema = createPlanSchema.extend({
  price: z.number().positive({ message: "O preço deve ser maior que zero" }),
  effectiveDate: z.string().optional().nullable(),
});

type PlanFormValues = z.input<typeof clientPlanSchema>;

interface AffectedStudent {
  studentId: string;
  name: string;
  email: string;
  startDate: Date | string;
  endDate: Date | string | null;
}

type ApiPlanValues = Omit<PlanFormValues, "price"> & { price: number };


export function PlanVault({ open, onOpenChange, plan, onSuccess, languages }: PlanVaultProps) {
  const t = useTranslations("Billing");
  const isEditing = !!plan;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(clientPlanSchema),
    defaultValues: {
      name: "",
      price: undefined,
      durationMonths: 12,
      language: "",
      classesPerWeek: 2,
      description: "",
      effectiveDate: "",
      currency: "BRL",
    },
  });

  const { formState: { errors, isSubmitting }, handleSubmit, reset, register, setValue, getValues } = form;

  const selectedCurrency = useWatch({
    control: form.control,
    name: "currency",
    defaultValue: "BRL",
  });

  const watchedPrice = useWatch({
    control: form.control,
    name: "price",
  });

  useEffect(() => {
    if (plan && open) {
      reset({
        name: plan.name,
        price: plan.price / 100, // Convert from cents to Reais/Dollars
        durationMonths: plan.durationMonths,
        language: plan.language || "",
        classesPerWeek: plan.classesPerWeek || 2,
        description: plan.description || "",
        effectiveDate: "",
        currency: (plan.currency as "BRL" | "USD") || "BRL",
      });
    } else if (!plan && open) {
      reset({
        name: "",
        price: undefined,
        durationMonths: 12,
        language: "",
        classesPerWeek: 2,
        description: "",
        effectiveDate: "",
        currency: "BRL",
      });
    }
  }, [plan, reset, open]);

  const [affectedStudentsInline, setAffectedStudentsInline] = useState<AffectedStudent[] | null>(null);
  const [isLoadingAffected, setIsLoadingAffected] = useState(false);

  useEffect(() => {
    if (!open || !isEditing || !plan) {
      setAffectedStudentsInline(null);
      return;
    }

    const priceCents = watchedPrice && !isNaN(Number(watchedPrice)) ? Math.round(Number(watchedPrice) * 100) : 0;
    if (priceCents === plan.price || !priceCents) {
      setAffectedStudentsInline(null);
      return;
    }

    const fetchAffected = async () => {
      setIsLoadingAffected(true);
      try {
        const affected = await getAffectedStudentsAction({ planId: plan.id });
        if (affected?.data?.success && affected.data.students) {
          setAffectedStudentsInline(affected.data.students);
        }
      } catch (error) {
        console.error("Error checking affected students:", error);
      } finally {
        setIsLoadingAffected(false);
      }
    };

    const timer = setTimeout(fetchAffected, 300);
    return () => clearTimeout(timer);
  }, [watchedPrice, plan, isEditing, open]);

  const executeSubmit = async (apiValues: ApiPlanValues) => {
    let result;
    if (isEditing && plan) {
      result = await updatePlanAction({
        id: plan.id,
        ...apiValues,
      });
    } else {
      result = await createPlanAction(apiValues);
    }

    if (result?.data?.success && result.data.plan) {
      notify.success(isEditing ? t("planUpdated") || "Plano atualizado!" : t("planCreated") || "Plano criado!");
      onSuccess?.(result.data.plan as Plan);
      onOpenChange(false);
      reset();
    } else {
      const errorMessage = result?.data?.error || result?.serverError || (t("defaultError") || "Ocorreu um erro");
      notify.error(errorMessage);
    }
  };

  const downloadCSVReport = (students: AffectedStudent[], apiValues?: ApiPlanValues) => {
    if (!plan) return;
    
    const targetValues = apiValues || { 
      price: watchedPrice && !isNaN(Number(watchedPrice)) ? Math.round(Number(watchedPrice) * 100) : plan.price, 
      currency: getValues("currency") || "BRL" 
    };
    
    const oldPriceFormatted = (plan.price / 100).toFixed(2);
    const newPriceFormatted = (targetValues.price / 100).toFixed(2);
    const currencySymbol = targetValues.currency === "USD" ? "USD" : "BRL";

    // CSV Headers
    let csvContent = "\uFEFF"; // Add BOM for Excel UTF-8 compatibility
    csvContent += "Nome do Aluno,E-mail,Valor Anterior,Novo Valor,Inicio do Contrato,Fim do Contrato\n";

    students.forEach((student) => {
      const startDateStr = student.startDate ? new Date(student.startDate).toLocaleDateString("pt-BR") : "-";
      const endDateStr = student.endDate ? new Date(student.endDate).toLocaleDateString("pt-BR") : "-";
      csvContent += `"${student.name}","${student.email}","${currencySymbol} ${oldPriceFormatted}","${currencySymbol} ${newPriceFormatted}","${startDateStr}","${endDateStr}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_reajuste_plano_${plan.name.toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit: SubmitHandler<PlanFormValues> = async (values) => {
    // Convert from currency units back to cents
    const apiValues = {
      ...values,
      price: Math.round(values.price * 100),
    };

    if (isEditing && plan && apiValues.price !== plan.price && affectedStudentsInline && affectedStudentsInline.length > 0) {
      // Trigger CSV download automatically on submit
      downloadCSVReport(affectedStudentsInline, apiValues);
    }

    await executeSubmit(apiValues);
  };

  return (
    <>
      <Vault open={open} onOpenChange={onOpenChange}>
        <VaultContent>
          <VaultHeader>
            <VaultTitle>
              {isEditing ? (t("editPlan") || "Editar Plano") : (t("createPlan") || "Criar Novo Plano")}
            </VaultTitle>
            <VaultDescription>
              {t("planVaultDescription") || "Preencha as informações do plano de aulas."}
            </VaultDescription>
          </VaultHeader>

          <VaultForm onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)(e);
          }}>
            <VaultBody>
              <VaultField
                label={t("name") || "Nome do Plano"}
                required
                error={errors.name?.message}
              >
                <VaultInput
                  {...register("name")}
                  placeholder={t("namePlaceholder") || "Ex: Plano Mensal Inglês"}
                />
              </VaultField>

              <div className="grid grid-cols-2 gap-4">
                <VaultField
                  label={t("language") || "Idioma"}
                  required
                  error={errors.language?.message}
                >
                  <Select
                    key={plan?.id || "new"}
                    onValueChange={(value) => setValue("language", value, { shouldValidate: true })}
                    defaultValue={getValues("language")}
                  >
                    <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                      <SelectValue placeholder={t("languagePlaceholder") || "Ex: Inglês"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(languages || []).map((lang) => (
                        <SelectItem key={lang.id} value={lang.name}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </VaultField>
                <VaultField
                  label={t("classesPerWeek") || "Aulas por Semana"}
                  required
                  error={errors.classesPerWeek?.message}
                >
                  <VaultInput
                    type="number"
                    {...register("classesPerWeek", { valueAsNumber: true })}
                  />
                </VaultField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <VaultField
                  label={t("durationMonths") || "Duração (Meses)"}
                  required
                  error={errors.durationMonths?.message}
                >
                  <VaultInput
                    type="number"
                    {...register("durationMonths", { valueAsNumber: true })}
                  />
                </VaultField>
                <VaultField
                  label="Moeda"
                  required
                  error={errors.currency?.message}
                >
                  <Select
                    key={plan?.id ? `${plan.id}-currency` : "new-currency"}
                    onValueChange={(value) => setValue("currency", value as "BRL" | "USD", { shouldValidate: true })}
                    defaultValue={getValues("currency") || "BRL"}
                  >
                    <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                      <SelectValue placeholder="Moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </VaultField>
              </div>

              <VaultField
                label={t("monthlyPrice") || "Mensalidade"}
                required
                error={errors.price?.message}
              >
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">
                    {selectedCurrency === "USD" ? "US$" : "R$"}
                  </span>
                  <VaultInput
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={cn("h-10", selectedCurrency === "USD" ? "pl-11" : "pl-9")}
                    {...register("price", { valueAsNumber: true })}
                  />
                </div>
              </VaultField>

              <VaultField
                label={t("description") || "Descrição (Opcional)"}
                error={errors.description?.message}
              >
                <VaultInput {...register("description")} />
              </VaultField>

              {isEditing && watchedPrice !== undefined && !isNaN(Number(watchedPrice)) && Math.round(Number(watchedPrice) * 100) !== plan.price && (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="card p-4 border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300 text-xs rounded-md leading-relaxed flex flex-col gap-2">
                    <p className="font-semibold flex items-center gap-1.5 text-sm text-amber-900 dark:text-amber-200">
                      ⚠️ Aviso de Faturamento Global
                    </p>
                    <p>
                      Alterar o preço mensal deste plano irá reajustar automaticamente todas as parcelas futuras pendentes de todos os alunos associados a ele. As parcelas passadas que já foram pagas continuarão intactas para fins contábeis e de auditoria. Um e-mail de aviso previsto em contrato será enviado aos alunos afetados.
                    </p>

                    {isLoadingAffected ? (
                      <div className="flex items-center gap-2 text-xs text-amber-800/80 dark:text-amber-300/80 mt-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Buscando alunos afetados...</span>
                      </div>
                    ) : affectedStudentsInline && affectedStudentsInline.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex justify-between items-center">
                          <span>Alunos afetados ({affectedStudentsInline.length}):</span>
                          <Button 
                            type="button" 
                            variant="link" 
                            className="h-auto p-0 text-[10px] uppercase font-bold text-primary hover:text-primary/80"
                            onClick={() => downloadCSVReport(affectedStudentsInline)}
                          >
                            Baixar CSV
                          </Button>
                        </div>
                        <div className="max-h-32 overflow-y-auto divide-y divide-amber-200/50 dark:divide-amber-900/30 border border-amber-200 dark:border-amber-900/30 rounded-lg bg-background/50">
                          {affectedStudentsInline.map((student) => (
                            <div key={student.studentId} className="p-2 flex justify-between items-center text-[11px] text-amber-900 dark:text-amber-200">
                              <div>
                                <span className="font-bold">{student.name}</span>
                                <span className="text-muted-foreground ml-1">({student.email})</span>
                              </div>
                              <div className="text-right text-[10px] text-muted-foreground">
                                {student.startDate ? new Date(student.startDate).toLocaleDateString("pt-BR") : "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : affectedStudentsInline && affectedStudentsInline.length === 0 ? (
                      <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">Nenhum aluno ativo será afetado por esta alteração.</p>
                    ) : null}
                  </div>

                  <VaultField
                    label="A partir de quando o novo valor deve começar a valer?"
                    error={errors.effectiveDate?.message}
                  >
                    <VaultInput
                      type="date"
                      {...register("effectiveDate")}
                      placeholder="Selecione a data de vigência do novo valor"
                    />
                  </VaultField>
                </div>
              )}
            </VaultBody>

            <VaultFooter>
              <VaultSecondaryButton
                type="button"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel") || "Cancelar"}
              </VaultSecondaryButton>
              <VaultPrimaryButton
                type="submit"
                disabled={isSubmitting || isLoadingAffected}
              >
                {isSubmitting ? (t("saving") || "Salvando...") : (t("save") || "Salvar Plano")}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultContent>
      </Vault>
    </>
  );
}

