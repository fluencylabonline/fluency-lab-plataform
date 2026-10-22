"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { deletePlanTemplateAction } from "@/modules/learning/learning.actions";
import { notify } from "@/components/ui/toaster";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultBody,
    VaultFooter,
    VaultIcon,
    VaultPrimaryButton,
    VaultSecondaryButton,
    VaultTrigger
} from "@/components/ui/vault";

interface DeletePlanVaultProps {
    planId: string;
    planName: string;
}

/** Exclui um template de plano. As lições e os planos já atribuídos a alunos não são afetados. */
export function DeletePlanVault({ planId, planName }: DeletePlanVaultProps) {
    const t = useTranslations("Learning");
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deletePlanTemplateAction({ planId });

            if (result?.data?.success) {
                notify.success(t("template_deleted_success"));
                setOpen(false);
            } else {
                notify.error(result?.serverError || "Erro ao excluir template");
            }
        });
    };

    return (
        <Vault open={open} onOpenChange={setOpen}>
            <VaultTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full">
                    <Trash2 className="w-4 h-4" />
                    {t("delete_template")}
                </button>
            </VaultTrigger>
            <VaultContent>
                <VaultHeader>
                    <VaultIcon type="warning" />
                    <VaultTitle>{t("delete_template")}</VaultTitle>
                    <VaultDescription>
                        {t("delete_template_confirm")}
                        <br />
                        <span className="font-semibold text-foreground">{planName}</span>
                    </VaultDescription>
                </VaultHeader>

                <VaultBody>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t("delete_template_warning")}</p>
                </VaultBody>

                <VaultFooter>
                    <VaultSecondaryButton onClick={() => setOpen(false)} disabled={isPending}>
                        {t("cancel")}
                    </VaultSecondaryButton>
                    <VaultPrimaryButton onClick={handleDelete} disabled={isPending} variant="destructive">
                        {isPending ? t("deleting") : t("delete_template")}
                    </VaultPrimaryButton>
                </VaultFooter>
            </VaultContent>
        </Vault>
    );
}
