import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { LessonsPageContent } from "./_components/LessonsPageContent";

export default async function LessonsListPage() {
    const user = await getCurrentUser();
    const locale = await getLocale();

    if (!user) redirect(`/${locale}/signin`);
    if (user.role !== "manager" && user.role !== "admin") redirect(`/${locale}/hub`);

    const [lessons, languages] = await Promise.all([
        curriculumService.getAllLessons(),
        curriculumService.findAllLanguages(),
    ]);

    return (
        <LessonsPageContent
            user={user}
            initialLessons={lessons}
            languages={languages}
        />
    );
}