import { Header } from "@/components/layout/header";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-server";
import { learningService } from "@/modules/learning/learning.service";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { PathEditor } from "./_components/PathEditor";

interface PlanEditorPageProps {
    params: Promise<{ id: string, locale: string }>;
}

export default async function PlanEditorPage({ params }: PlanEditorPageProps) {
    const { id: planId } = await params;
    const user = await getCurrentUser();
    const locale = await getLocale();
    const t = await getTranslations("Learning");

    if (!user) redirect(`/${locale}/signin`);

    const plan = await learningService.getPlanById(planId);
    if (!plan) notFound();
    const availableLessons = await curriculumService.getReadyLessons(plan.languageId);

    return (
        <main>
            <Header
                title={plan.name}
                subtitle={plan.description || t("path_editor_subtitle") || "Organize the sequence of lessons for this plan."}
                user={user}
                backHref={`/hub/manager/learning`}
                className="contents"
            />

            <div className="container">
                <PathEditor
                    plan={JSON.parse(JSON.stringify(plan))}
                    availableLessons={availableLessons.map(l => ({
                        id: l.id,
                        title: l.title,
                        difficulty: l.difficulty
                    }))}
                />
            </div>
        </main>
    );
}
