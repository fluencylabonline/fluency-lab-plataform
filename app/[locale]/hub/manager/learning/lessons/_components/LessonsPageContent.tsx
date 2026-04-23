"use client";

import { Header } from "@/components/layout/header";
import { useTranslations } from "next-intl";
import { useState } from "react";
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

    const headerActions = (
        <CreateLessonVault languages={languages} />
    );

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
                actionButton={headerActions}
            />

            <div className="container">
                <LessonsList
                    initialLessons={initialLessons}
                    languages={languages}
                    searchQuery={searchQuery}
                />
            </div>
        </>
    );
}
