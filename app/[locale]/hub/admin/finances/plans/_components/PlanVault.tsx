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
  VaultSecondaryButton,
  VaultIcon
} from "@/components/ui/vault";
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

  const [affectedStudents, setAffectedStudents] = useState<AffectedStudent[] | null>(null);
  const [pendingValues, setPendingValues] = useState<ApiPlanValues | null>(null);
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);

  useEffect(() => {
    if (!open) {
      setAffectedStudents(null);
      setPendingValues(null);
    }
  }, [open]);

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

  const onSubmit: SubmitHandler<PlanFormValues> = async (values) => {
    // Convert from currency units back to cents
    const apiValues = {
      ...values,
      price: Math.round(values.price * 100),
    };

    if (isEditing && plan && apiValues.price !== plan.price) {
      setIsCheckingPrice(true);
      try {
        const affected = await getAffectedStudentsAction({ planId: plan.id });
        if (affected?.data?.success && affected.data.students && affected.data.students.length > 0) {
          setAffectedStudents(affected.data.students);
          setPendingValues(apiValues);
          return;
        }
      } catch (error) {
        console.error("Error checking affected students:", error);
      } finally {
        setIsCheckingPrice(false);
      }
    }

    await executeSubmit(apiValues);
  };

  const handleConfirmPriceChange = async () => {
    if (!pendingValues || !plan) return;
    
    // Trigger CSV download
    downloadCSVReport(affectedStudents || []);

    await executeSubmit(pendingValues);
    setAffectedStudents(null);
    setPendingValues(null);
  };

  const downloadCSVReport = (students: AffectedStudent[]) => {
    if (!plan || !pendingValues) return;
    
    const oldPriceFormatted = (plan.price / 100).toFixed(2);
    const newPriceFormatted = (pendingValues.price / 100).toFixed(2);
    const currencySymbol = pendingValues.currency === "USD" ? "USD" : "BRL";

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

              {isEditing && (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="card p-4 border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300 text-xs rounded-md leading-relaxed flex flex-col gap-2">
                    <p className="font-semibold flex items-center gap-1.5 text-sm text-amber-900 dark:text-amber-200">
                      ⚠️ Aviso de Faturamento Global
                    </p>
                    <p>
                      Alterar o preço mensal deste plano irá reajustar automaticamente todas as parcelas futuras pendentes de todos os alunos associados a ele. As parcelas passadas que já foram pagas continuarão intactas para fins contábeis e de auditoria. Um e-mail de aviso previsto em contrato será enviado aos alunos afetados.
                    </p>
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
                disabled={isSubmitting || isCheckingPrice}
              >
                {isSubmitting || isCheckingPrice ? (t("saving") || "Salvando...") : (t("save") || "Salvar Plano")}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultContent>
      </Vault>

      {/* Modal de Confirmação de Reajuste */}
      <Vault open={!!affectedStudents} onOpenChange={(open) => !open && setAffectedStudents(null)}>
        <VaultContent className="max-w-2xl">
          <VaultHeader>
            <VaultIcon type="info" />
            <VaultTitle>Confirmar Reajuste de Mensalidade</VaultTitle>
            <VaultDescription>
              A alteração do preço mensal do plano de <strong>{selectedCurrency === "USD" ? "US$" : "R$"} {(plan?.price || 0) / 100}</strong> para <strong>{selectedCurrency === "USD" ? "US$" : "R$"} {(pendingValues?.price || 0) / 100}</strong> afetará {affectedStudents?.length} alunos ativos.
            </VaultDescription>
          </VaultHeader>
          <VaultBody>
            <div className="text-sm font-semibold mb-3">Estudantes Afetados:</div>
            <div className="max-h-60 overflow-y-auto divide-y divide-border border border-border rounded-xl bg-muted/20">
              {affectedStudents?.map((student) => (
                <div key={student.studentId} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-foreground">{student.name}</div>
                    <div className="text-muted-foreground">{student.email}</div>
                  </div>
                  <div className="text-right flex flex-col md:items-end">
                    <div>
                      Contrato: <span className="font-semibold text-foreground">
                        {student.startDate ? new Date(student.startDate).toLocaleDateString("pt-BR") : "-"}
                      </span> até <span className="font-semibold text-foreground">
                        {student.endDate ? new Date(student.endDate).toLocaleDateString("pt-BR") : "-"}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px]">
                      Mensalidade: <span className="text-muted-foreground line-through">{selectedCurrency === "USD" ? "US$" : "R$"} {(plan?.price || 0) / 100}</span> &rarr; <span className="font-bold text-primary">{selectedCurrency === "USD" ? "US$" : "R$"} {(pendingValues?.price || 0) / 100}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300">
              Ao confirmar, o preço do plano será atualizado e o sistema reajustará automaticamente todas as faturas futuras pendentes destes alunos. Um relatório CSV contendo a lista dos alunos afetados e seus dados de contrato será baixado automaticamente.
            </p>
          </VaultBody>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setAffectedStudents(null)}>
              Cancelar
            </VaultSecondaryButton>
            <VaultPrimaryButton onClick={handleConfirmPriceChange} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Confirmar e Baixar Relatório"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </>
  );
}

