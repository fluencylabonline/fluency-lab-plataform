import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { LearningItemsClient } from "./_components/LearningItemsClient";
import { Header } from "@/components/layout/header";

export default async function LearningItemsPage() {
    const user = await getCurrentUser();
    const locale = await getLocale();
    const t = await getTranslations("Learning");

    if (!user) redirect(`/${locale}/signin`);
    if (user.role !== "manager" && user.role !== "admin") redirect(`/${locale}/hub`);

    const languages = await curriculumService.findAllLanguages();

    return (
        <div>
            <Header 
                title={t("learning_items") || "Learning Items"}
                subtitle={t("learning_items_desc") || "Manage and browse all vocabulary and grammar structures."}
                backHref="/hub/manager/learning"
                />

            <main className="container">
                <LearningItemsClient 
                    initialLanguages={languages}
                />
            </main>
        </div>
    );
}
