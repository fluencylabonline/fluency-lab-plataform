"use client";

import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultBody,
    VaultTrigger,
} from "@/components/ui/vault";
import { CreateLessonForm } from "./CreateLessonForm";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateLessonVaultProps {
    languages: { id: string; name: string }[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreateLessonVault({ languages, open, onOpenChange }: CreateLessonVaultProps) {
    const t = useTranslations("Learning");

    const vaultContent = (
        <VaultContent>
            <VaultHeader>
                <VaultTitle>{t("create_lesson") || "Create Lesson"}</VaultTitle>
                <VaultDescription>
                    {t("steps.1.desc") || "Start by giving your lesson a title and selecting the target language and difficulty."}
                </VaultDescription>
            </VaultHeader>
            <VaultBody>
                <CreateLessonForm languages={languages} />
            </VaultBody>
        </VaultContent>
    );

    if (open !== undefined && onOpenChange !== undefined) {
        return (
            <Vault open={open} onOpenChange={onOpenChange}>
                {vaultContent}
            </Vault>
        );
    }

    return (
        <Vault>
            <VaultTrigger asChild>
                <Button leftIcon={<Plus />}>
                    <span className="hidden sm:inline">{t("create_lesson") || "Create Lesson"}</span>
                </Button>
            </VaultTrigger>
            {vaultContent}
        </Vault>
    );
}
