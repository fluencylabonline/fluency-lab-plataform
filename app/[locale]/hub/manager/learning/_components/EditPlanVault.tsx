"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { updatePlanTemplateAction } from "@/modules/learning/learning.actions";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultBody,
    VaultFooter,
    VaultIcon,
    VaultField,
    VaultInput,
    VaultPrimaryButton,
    VaultSecondaryButton,
} from "@/components/ui/vault";
import { notify } from "@/components/ui/toaster";

const editPlanSchema = z.object({
    name: z.string().trim().min(3, { message: "O nome precisa ter pelo menos 3 caracteres" }).max(255),
    description: z.string().max(2000).optional(),
});

type EditPlanValues = z.infer<typeof editPlanSchema>;

interface EditPlanVaultProps {
    plan: { id: string; name: string; description: string | null };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Edita o nome e a descrição de um template de plano. */
export function EditPlanVault({ plan, open, onOpenChange }: EditPlanVaultProps) {
    const t = useTranslations("Learning");
    const [isPending, startTransition] = useTransition();

    const form = useForm<EditPlanValues>({
        resolver: zodResolver(editPlanSchema),
        values: { name: plan.name, description: plan.description ?? "" },
    });

    const onSubmit = (values: EditPlanValues) => {
        startTransition(async () => {
            const result = await updatePlanTemplateAction({ planId: plan.id, ...values });
            if (result?.data?.success) {
                notify.success(t("template_updated_success"));
                onOpenChange(false);
            } else {
                notify.error(result?.serverError || "Erro ao atualizar o template");
            }
        });
    };

    return (
        <Vault open={open} onOpenChange={onOpenChange}>
            <VaultContent>
                <VaultHeader>
                    <VaultIcon type="document" />
                    <VaultTitle>{t("edit_template_title")}</VaultTitle>
                    <VaultDescription>{t("edit_template_desc")}</VaultDescription>
                </VaultHeader>

                <VaultBody>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id={`edit-plan-form-${plan.id}`}>
                        <VaultField label={t("plan_name")} required error={form.formState.errors.name?.message}>
                            <VaultInput {...form.register("name")} placeholder={t("plan_name_placeholder")} />
                        </VaultField>

                        <VaultField label={t("description")} error={form.formState.errors.description?.message}>
                            <textarea
                                {...form.register("description")}
                                placeholder={t("plan_description_placeholder")}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md min-h-[120px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                            />
                        </VaultField>
                    </form>
                </VaultBody>

                <VaultFooter>
                    <VaultSecondaryButton onClick={() => onOpenChange(false)} disabled={isPending}>
                        {t("cancel")}
                    </VaultSecondaryButton>
                    <VaultPrimaryButton type="submit" form={`edit-plan-form-${plan.id}`} disabled={isPending}>
                        {isPending ? t("saving") : t("save_changes")}
                    </VaultPrimaryButton>
                </VaultFooter>
            </VaultContent>
        </Vault>
    );
}
