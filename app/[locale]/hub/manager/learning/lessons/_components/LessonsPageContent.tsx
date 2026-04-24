"use client";

import { Header } from "@/components/layout/header";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Plus } from "lucide-react";
import { LessonsList } from "./LessonsList";
import { CreateLessonVault } from "./CreateLessonVault";
import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { User } from "@/modules/user/user.schema";

interface LessonsPageContentProps {
    user: User | null;
    initialLessons: LessonSummary[];
    languages: { id: string; name: string }[];
}

export function LessonsPageContent({ user, initialLessons, languages }: LessonsPageContentProps) {
    const t = useTranslations("Learning");
    const [searchQuery, setSearchQuery] = useState("");
    const [isVaultOpen, setIsVaultOpen] = useState(false);

    return (
        <>
            <Header
                title={t("manage_lessons") || "Lessons"}
                subtitle={t("lessons_list_subtitle") || "Manage your curriculum lessons and pipeline."}
                user={user ? {
                    name: user.name,
                    email: user.email,
                    photoUrl: user.photoUrl,
                    role: user.role
                } : undefined}
                backHref="/hub/manager/learning"
                onSearchChange={setSearchQuery}
                action={{
                    label: t("create_lesson") || "Create Lesson",
                    icon: <Plus className="w-5 h-5" />,
                    onClick: () => setIsVaultOpen(true)
                }}
                className="contents"
            />

            <CreateLessonVault 
                languages={languages} 
                open={isVaultOpen} 
                onOpenChange={setIsVaultOpen} 
            />

            <main className="container">
                <LessonsList
                    initialLessons={initialLessons}
                    languages={languages}
                    searchQuery={searchQuery}
                />
            </main>
        </>
    );
}
