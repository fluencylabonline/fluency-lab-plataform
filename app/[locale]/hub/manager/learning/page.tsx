import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { learningService } from "@/modules/learning/learning.service";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { CreatePlanVault } from "./_components/CreatePlanVault";
import { PlanCard } from "./_components/PlanCard";
import { Badge } from "@/components/ui/badge";
import {
    Library,
    BookPlus,
    PlayCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LanguagesVault } from "./_components/LanguagesVault";
import { MediaLibraryVault } from "./_components/MediaLibraryVault";


export default async function LearningPage() {
    const user = await getCurrentUser();
    const locale = await getLocale();
    const t = await getTranslations("Learning");

    if (!user) redirect(`/${locale}/signin`);
    if (user.role !== "manager" && user.role !== "admin") redirect(`/${locale}/hub`);

    const [templates, languages] = await Promise.all([
        learningService.getTemplatesForHub(),
        curriculumService.findAllLanguages(),
    ]);

    const headerActions = (
        <div className="flex items-center gap-2">
            <CreatePlanVault languages={languages} />
        </div>
    );

    return (
        <main>
            <Header
                title={t("learning_hub") || "Learning Hub"}
                subtitle={t("learning_hub_desc") || "Manage path templates and curriculum materials."}
                user={user}
                actionButton={headerActions}
            />

            <div className="container">
                {/* Manager Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <LanguagesVault initialData={languages} />

                    <Link href={`/hub/manager/learning/lessons`} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md hover:border-primary/50 transition-all group">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                            <BookPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm font-semibold">{t("manage_lessons") || "Lessons"}</span>
                    </Link>

                    <MediaLibraryVault />

                    <Link href={`/hub/manager/learning/analytics`} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md hover:border-primary/50 transition-all group">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                            <PlayCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm font-semibold">{t("analytics") || "Analytics"}</span>
                    </Link>

                    <Link href={`/hub/manager/learning/placement`} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md hover:border-primary/50 transition-all group">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                            <BookPlus className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm font-semibold">Placement</span>
                    </Link>
                </div>

                {/* Templates Section */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        <h2 className="text-xl font-bold">{t("path_templates") || "Path Templates"}</h2>
                        <Badge variant="secondary" className="ml-2">
                            {templates.length}
                        </Badge>
                    </div>
                </div>

                {templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-800 rounded-md">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
                            <Library className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{t("empty_templates_title") || "No templates yet"}</h3>
                        <p className="text-muted-foreground text-center max-w-xs mb-6">
                            {t("empty_templates_desc") || "Start by creating a generic learning path that can be assigned to multiple students."}
                        </p>
                        <CreatePlanVault languages={languages} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <PlanCard
                                key={template.id}
                                plan={{
                                    ...template,
                                    language: template.language || null,
                                    lessonsCount: template.lessons?.length || 0
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}