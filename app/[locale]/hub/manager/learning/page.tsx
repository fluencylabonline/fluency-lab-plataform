import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { learningService } from "@/modules/learning/learning.service";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { LearningHubClient } from "./_components/LearningHubClient";
import { LanguageWithLessons } from "@/modules/curriculum/curriculum.types";
import { PlanCard } from "./_components/PlanCard";
import { Badge } from "@/components/ui/badge";
import {
    Library,
    BookPlus,
    BarChart3,
    Languages,
    ImagePlay,
    ClipboardList,
    List,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LanguagesVault } from "./_components/LanguagesVault";
import { MediaLibraryVault } from "./_components/MediaLibraryVault";
import { CreatePlanVault } from "./_components/CreatePlanVault";


const quickActions = (languages: LanguageWithLessons[], t: (key: string) => string) => [
    {
        key: "languages",
        component: <LanguagesVault initialData={languages} />,
        icon: <Languages className="w-5 h-5" />,
        label: "Languages",
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        isVault: true,
    },
    {
        key: "lessons",
        href: `/hub/manager/learning/lessons`,
        icon: <BookPlus className="w-5 h-5" />,
        label: t("manage_lessons") || "Lessons",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
        key: "media",
        component: <MediaLibraryVault />,
        icon: <ImagePlay className="w-5 h-5" />,
        label: "Media Library",
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 dark:bg-sky-900/20",
        isVault: true,
    },
    {
        key: "analytics",
        href: `/hub/manager/learning/analytics`,
        icon: <BarChart3 className="w-5 h-5" />,
        label: t("analytics") || "Analytics",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
        key: "placement",
        href: `/hub/manager/learning/placement`,
        icon: <ClipboardList className="w-5 h-5" />,
        label: "Placement",
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-900/20",
    },
    {
        key: "itens",
        href: `/hub/manager/learning/learning-items`,
        icon: <List className="w-5 h-5" />,
        label: "Items",
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-900/20",
    },
];

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

    const actions = quickActions(languages, t);

    return (
        <main>
            <LearningHubClient user={user} languages={languages} />

            <div className="container">

                <section>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
                        Quick Access
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {actions.map((action) => {
                            const inner = (
                                <div className="group flex flex-col items-center justify-center gap-3 p-5 card">
                                    <div className={`w-11 h-11 rounded-md flex items-center justify-center ${action.bg} group-hover:scale-110 transition-transform duration-200`}>
                                        <span className={action.color}>{action.icon}</span>
                                    </div>
                                    <span className="text-[13px] font-semibold text-center leading-tight">
                                        {action.label}
                                    </span>
                                </div>
                            );

                            if (action.isVault) {
                                return <div key={action.key}>{action.component}</div>;
                            }

                            return (
                                <Link key={action.key} href={action.href!} className="h-full">
                                    {inner}
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <div className="h-px bg-border/60 my-10" />

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                                {t("path_templates") || "Path Templates"}
                            </p>
                            <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-2 rounded-full font-semibold"
                            >
                                {templates.length}
                            </Badge>
                        </div>
                    </div>

                    {templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 rounded-md border-2 border-dashed border-border bg-muted/20">
                            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                                <Library className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-base font-semibold mb-1">
                                {t("empty_templates_title") || "No templates yet"}
                            </h3>
                            <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
                                {t("empty_templates_desc") || "Start by creating a generic learning path that can be assigned to multiple students."}
                            </p>
                            <CreatePlanVault languages={languages} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {templates.map((template) => (
                                <PlanCard
                                    key={template.id}
                                    plan={{
                                        ...template,
                                        language: template.language || null,
                                        lessonsCount: template.lessons?.length || 0,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}