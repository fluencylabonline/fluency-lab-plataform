import { curriculumRepository } from "@/modules/curriculum/curriculum.repository";
import { notFound } from "next/navigation";
import { LessonEditor } from "./_components/LessonEditor";
import { Header } from "@/components/layout/header";
import { RecessActivityEditorClient } from "@/app/[locale]/hub/teacher/recess/_components/RecessActivityEditorClient";

interface LessonPageProps {
    params: Promise<{
        lessonId: string;
        locale: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
    const { lessonId } = await params;
    const lesson = await curriculumRepository.findLessonById(lessonId);

    if (!lesson) notFound();

    if (lesson.isRecessActivity) {
        const languages = await curriculumRepository.findAllLanguages();
        return (
            <RecessActivityEditorClient
                initialActivity={lesson}
                languages={languages}
                backHref="/hub/manager/learning/lessons"
                onSaveRedirect="/hub/manager/learning/lessons"
            />
        );
    }

    return (
        <div>
            <Header
                title={lesson.title}
                backHref="/hub/manager/learning/lessons"
                showSubHeader={false}
                className="contents"
            />
            <LessonEditor lesson={lesson} />
        </div>
    );
}
