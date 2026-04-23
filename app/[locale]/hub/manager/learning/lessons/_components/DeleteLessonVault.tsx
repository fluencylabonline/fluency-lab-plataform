"use client";

import { useTranslations } from "next-intl";
import { deleteLessonAction } from "@/modules/curriculum/curriculum.actions";
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
import { notify } from "@/components/ui/toaster";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

interface DeleteLessonVaultProps {
    lessonId: string;
    lessonTitle: string;
    trigger?: React.ReactNode;
}

export function DeleteLessonVault({ lessonId, lessonTitle, trigger }: DeleteLessonVaultProps) {
    const t = useTranslations("Learning");
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteLessonAction({ lessonId });

            if (result?.data?.success) {
                notify.success(t("lesson_deleted_success") || "Lesson deleted successfully");
                setOpen(false);
            } else {
                notify.error(result?.serverError || "Error deleting lesson");
            }
        });
    };

    return (
        <Vault open={open} onOpenChange={setOpen}>
            <VaultTrigger asChild>
                {trigger || (
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full">
                        <Trash2 className="w-4 h-4" />
                        {t("delete_lesson") || "Delete Lesson"}
                    </button>
                )}
            </VaultTrigger>
            <VaultContent>
                <VaultHeader>
                    <VaultIcon type="warning" />
                    <VaultTitle>{t("delete_lesson") || "Delete Lesson"}</VaultTitle>
                    <VaultDescription>
                        {t("delete_lesson_confirm") || "Are you sure you want to delete this lesson?"}
                        <br />
                        <span className="font-semibold text-foreground">{lessonTitle}</span>
                    </VaultDescription>
                </VaultHeader>

                <VaultBody>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t("delete_lesson_warning") || "This action will perform a soft-delete. The lesson will no longer be available for new study plans, but existing assignments will remain active."}
                    </p>
                </VaultBody>

                <VaultFooter>
                    <VaultSecondaryButton onClick={() => setOpen(false)} disabled={isPending}>
                        {t("cancel") || "Cancel"}
                    </VaultSecondaryButton>
                    <VaultPrimaryButton
                        onClick={handleDelete}
                        disabled={isPending}
                        variant="destructive"
                    >
                        {isPending ? t("deleting") || "Deleting..." : t("delete_lesson") || "Delete"}
                    </VaultPrimaryButton>
                </VaultFooter>
            </VaultContent>
        </Vault>
    );
}
