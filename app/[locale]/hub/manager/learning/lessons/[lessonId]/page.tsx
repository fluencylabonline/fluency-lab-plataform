import { curriculumRepository } from "@/modules/curriculum/curriculum.repository";
import { notFound } from "next/navigation";
import { LessonEditor } from "./_components/LessonEditor";
import { Header } from "@/components/layout/header";

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

    return (
        <div>
            <Header
                title={lesson.title}
                backHref="/hub/manager/learning/lessons"
                showSubHeader={false}
            />
            <LessonEditor lesson={lesson} />
        </div>
    );
}
