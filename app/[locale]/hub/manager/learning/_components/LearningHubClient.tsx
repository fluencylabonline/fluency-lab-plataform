"use client";

import { Header } from "@/components/layout/header";
import { CreatePlanVault } from "./CreatePlanVault";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface LearningHubClientProps {
    user: {
        name: string | null;
        email: string | null;
        photoUrl?: string | null;
        role?: string;
    };
    languages: { id: string; name: string }[];
}

export function LearningHubClient({ user, languages }: LearningHubClientProps) {
    const t = useTranslations("Learning");
    const [isVaultOpen, setIsVaultOpen] = useState(false);

    return (
        <>
            <Header
                title={t("learning_hub") || "Learning Hub"}
                subtitle={t("learning_hub_desc") || "Manage path templates and curriculum materials."}
                user={user}
                actions={[{
                    label: t("create_plan") || "Create Plan",
                    icon: <Plus className="w-5 h-5" />,
                    onClick: () => setIsVaultOpen(true)
                }]}
                className="contents"
            />
            <CreatePlanVault 
                languages={languages} 
                open={isVaultOpen} 
                onOpenChange={setIsVaultOpen} 
            />
        </>
    );
}
