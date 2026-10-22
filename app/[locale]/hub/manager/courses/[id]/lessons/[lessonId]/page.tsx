import { getCurrentUser } from "@/lib/auth-server";
import { courseService } from "@/modules/course/course.service";
import { notFound, redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { LessonEditorClient } from "@/modules/course/_components/LessonEditorClient";

interface LessonPageProps {
  params: Promise<{
    id: string;
    lessonId: string;
    locale: string;
  }>;
}

export default async function LessonEditorPage({ params }: LessonPageProps) {
  const { id: courseId, lessonId } = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "course.manage")) {
    redirect("/signin");
  }

  const lesson = await courseService.getLessonDetails(user, lessonId);
  if (!lesson) notFound();

  const quizzes = await courseService.getQuizzesByCourse(user, courseId);

  return (
    <LessonEditorClient 
      initialLesson={lesson} 
      courseId={courseId} 
      availableQuizzes={quizzes}
      basePath="/hub/manager/courses"
    />
  );
}
