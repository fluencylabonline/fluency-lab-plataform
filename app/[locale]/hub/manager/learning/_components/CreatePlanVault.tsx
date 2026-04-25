"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { createPlanTemplateAction } from "@/modules/learning/learning.actions";
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
    VaultTrigger
} from "@/components/ui/vault";
import { notify } from "@/components/ui/toaster";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/ui/use-device";

const createPlanSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    languageId: z.string().uuid({ message: "Please select a language" }),
    description: z.string().optional(),
});

type CreatePlanValues = z.infer<typeof createPlanSchema>;

interface CreatePlanVaultProps {
    languages: { id: string; name: string }[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreatePlanVault({ languages, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreatePlanVaultProps) {
    const t = useTranslations("Learning");
    const [internalOpen, setInternalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const isMobile = useIsMobile();

    const open = controlledOpen ?? internalOpen;
    const setOpen = controlledOnOpenChange ?? setInternalOpen;

    const form = useForm<CreatePlanValues>({
        resolver: zodResolver(createPlanSchema),
        defaultValues: {
            name: "",
            languageId: "",
            description: "",
        },
    });

    const onSubmit = (values: CreatePlanValues) => {
        startTransition(async () => {
            const result = await createPlanTemplateAction(values);
            if (result?.data?.success) {
                notify.success(t("plan_created_success") || "Plan created successfully!");
                setOpen(false);
                form.reset();
            } else {
                notify.error(result?.serverError || t("plan_created_error") || "Error creating plan");
            }
        });
    };

    const vaultContent = (
        <VaultContent>
            <VaultHeader>
                <VaultIcon type="document" />
                <VaultTitle>{t("new_template_plan") || "New Template Plan"}</VaultTitle>
                <VaultDescription>
                    {t("new_template_plan_desc") || "Define a new generic learning path for students."}
                </VaultDescription>
            </VaultHeader>

            <VaultBody>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="create-plan-form">
                    <VaultField
                        label={t("plan_name") || "Plan Name"}
                        required
                        error={form.formState.errors.name?.message}
                    >
                        <VaultInput
                            {...form.register("name")}
                            placeholder={t("plan_name_placeholder") || "Ex: General English - A1"}
                        />
                    </VaultField>

                    <VaultField
                        label={t("language") || "Language"}
                        required
                        error={form.formState.errors.languageId?.message}
                    >
                        <Select
                            onValueChange={(value) => form.setValue("languageId", value)}
                            defaultValue={form.getValues("languageId")}
                        >
                            <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
                                <SelectValue placeholder={t("select_language") || "Select language"} />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((lang) => (
                                    <SelectItem key={lang.id} value={lang.id}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </VaultField>

                    <VaultField
                        label={t("description") || "Description"}
                        error={form.formState.errors.description?.message}
                    >
                        <textarea
                            {...form.register("description")}
                            placeholder={t("plan_description_placeholder") || "A brief overview of this plan goals..."}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                        />
                    </VaultField>
                </form>
            </VaultBody>

            <VaultFooter>
                <VaultSecondaryButton onClick={() => setOpen(false)} disabled={isPending}>
                    {t("cancel") || "Cancel"}
                </VaultSecondaryButton>
                <VaultPrimaryButton
                    type="submit"
                    form="create-plan-form"
                    disabled={isPending}
                >
                    {isPending ? t("creating") || "Creating..." : t("create") || "Create"}
                </VaultPrimaryButton>
            </VaultFooter>
        </VaultContent>
    );

    if (controlledOpen !== undefined) {
        return (
            <Vault open={open} onOpenChange={setOpen}>
                {vaultContent}
            </Vault>
        );
    }

    return (
        <Vault open={open} onOpenChange={setOpen}>
            <VaultTrigger asChild>
                <Button variant={isMobile ? "ghost" : "outline"}>
                    <Plus className="w-5 h-5" />
                    {t("create_plan") || "Create Plan"}
                </Button>
            </VaultTrigger>
            {vaultContent}
        </Vault>
    );
}
