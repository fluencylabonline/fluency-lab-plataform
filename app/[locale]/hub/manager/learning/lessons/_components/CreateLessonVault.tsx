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

interface CreateLessonVaultProps {
    languages: { id: string; name: string }[];
}

export function CreateLessonVault({ languages }: CreateLessonVaultProps) {
    const t = useTranslations("Learning");

    return (
        <Vault>
            <VaultTrigger asChild>
                <button className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-semibold shadow-sm">
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">{t("create_lesson") || "Create Lesson"}</span>
                </button>
            </VaultTrigger>
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
        </Vault>
    );
}
