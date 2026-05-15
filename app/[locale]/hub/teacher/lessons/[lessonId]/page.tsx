import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { getCurrentUser } from "@/lib/auth-server";
import { notFound, redirect } from "next/navigation";
import { LessonDetailView } from "../_components/LessonDetailView";

interface LessonPageProps {
  params: Promise<{
    lessonId: string;
    locale: string;
  }>;
}

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const lesson = await curriculumService.findLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <LessonDetailView lesson={lesson} />
  );
}
