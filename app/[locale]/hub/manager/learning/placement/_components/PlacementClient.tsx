"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { QuestionsBank } from "./QuestionsBank";
import { PlacementWizardVault } from "./PlacementWizardVault";
import { User } from "@/modules/user/user.schema";
import { Language } from "@/modules/curriculum/curriculum.types";

interface PlacementStats {
    byStatus: Array<{ status: string; count: number }>;
    byLevel: Array<{ cefrLevel: string; count: number }>;
}

interface PlacementClientProps {
    user: User;
    languages: Language[];
    initialStats: PlacementStats;
}

export function PlacementClient({ user, languages, initialStats }: PlacementClientProps) {
    const t = useTranslations("Placement");
    const [selectedLanguage, setSelectedLanguage] = useState(languages[0]?.id || "");
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    return (
        <main className="h-full overflow-y-auto custom-scrollbar no-scrollbar">
            <Header
                title={t("manager_title") || "Placement Management"}
                subtitle={t("manager_desc") || "Manage adaptive diagnostic questions and audio-based challenges."}
                user={user}
                action={{
                    label: t("generate_questions") || "Generate Questions",
                    icon: <Plus className="w-5 h-5" />,
                    onClick: () => setIsWizardOpen(true)
                }}
                className="contents"
            />

            <div className="container">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase">{t("language") || "Language"}</span>
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang.id} value={lang.id}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold">{initialStats?.byStatus?.find((s) => s.status === "active")?.count || 0}</span>
                            <span className="text-xs text-muted-foreground uppercase">{t("active_questions") || "Active Questions"}</span>
                        </div>
                        <div className="w-px h-10 bg-border" />
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold">{initialStats?.byStatus?.find((s) => s.status === "draft")?.count || 0}</span>
                            <span className="text-xs text-muted-foreground uppercase">{t("drafts") || "Drafts"}</span>
                        </div>
                    </div>
                </div>

                <QuestionsBank languageId={selectedLanguage} />

                <PlacementWizardVault
                    isOpen={isWizardOpen}
                    onOpenChange={setIsWizardOpen}
                    languageId={selectedLanguage}
                />
            </div>
        </main>
    );
}
