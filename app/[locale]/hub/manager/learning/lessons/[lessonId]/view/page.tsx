import { curriculumRepository } from "@/modules/curriculum/curriculum.repository";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { LessonViewer } from "../_components/LessonViewer";
import type { LessonWithDetails } from "@/modules/curriculum/curriculum.types";

interface LessonViewPageProps {
    params: Promise<{
        lessonId: string;
        locale: string;
    }>;
}

export default async function LessonViewPage({ params }: LessonViewPageProps) {
    const { lessonId, locale } = await params;
    const lesson = await curriculumRepository.findLessonById(lessonId);

    if (!lesson) notFound();

    // Só lições prontas e de currículo regular têm visualização; as demais seguem no assistente.
    if (lesson.isRecessActivity || lesson.status !== "ready") {
        redirect(`/${locale}/hub/manager/learning/lessons/${lessonId}`);
    }

    return (
        <div>
            <Header
                title={lesson.title}
                backHref="/hub/manager/learning/lessons"
                showSubHeader={false}
                className="contents"
            />
            <LessonViewer lesson={lesson as unknown as LessonWithDetails} />
        </div>
    );
}
