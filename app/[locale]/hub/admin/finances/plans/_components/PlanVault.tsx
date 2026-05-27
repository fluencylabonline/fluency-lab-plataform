"use client";

import { useForm, SubmitHandler } from "react-hook-form";
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
import {
  createPlanSchema,
  Plan
} from "@/modules/billing/billing.schema";
import {
  createPlanAction,
  updatePlanAction
} from "@/modules/billing/billing.actions";
import { notify } from "@/components/ui/toaster";
import { useEffect } from "react";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface PlanVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan;
  onSuccess?: (plan: Plan) => void;
  languages: { id: string; name: string }[];
}

const clientPlanSchema = createPlanSchema.extend({
  price: z.number().positive({ message: "O preço deve ser maior que zero" }),
});

type PlanFormValues = z.infer<typeof clientPlanSchema>;

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
    },
  });

  const { formState: { errors, isSubmitting }, handleSubmit, reset, register, setValue, getValues } = form;

  useEffect(() => {
    if (plan && open) {
      reset({
        name: plan.name,
        price: plan.price / 100, // Convert from cents to Reais
        durationMonths: plan.durationMonths,
        language: plan.language || "",
        classesPerWeek: plan.classesPerWeek || 2,
        description: plan.description || "",
      });
    } else if (!plan && open) {
      reset({
        name: "",
        price: undefined,
        durationMonths: 12,
        language: "",
        classesPerWeek: 2,
        description: "",
      });
    }
  }, [plan, reset, open]);

  const onSubmit: SubmitHandler<PlanFormValues> = async (values) => {
    let result;

    // Convert from Reais back to cents
    const apiValues = {
      ...values,
      price: Math.round(values.price * 100),
    };

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

  return (
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
                label={t("monthlyPrice") || "Mensalidade"}
                required
                error={errors.price?.message}
              >
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">R$</span>
                  <VaultInput
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9 h-10"
                    {...register("price", { valueAsNumber: true })}
                  />
                </div>
              </VaultField>
            </div>

            <VaultField
              label={t("description") || "Descrição (Opcional)"}
              error={errors.description?.message}
            >
              <VaultInput {...register("description")} />
            </VaultField>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (t("saving") || "Salvando...") : (t("save") || "Salvar Plano")}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultForm>
      </VaultContent>
    </Vault>
  );
}
