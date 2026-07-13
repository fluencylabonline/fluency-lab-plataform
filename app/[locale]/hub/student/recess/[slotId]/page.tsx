import { getCurrentUser } from "@/lib/auth-server";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { userService } from "@/modules/user/user.service";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { RecessActivityClient } from "./_components/RecessActivityClient";

interface RecessPageProps {
  params: Promise<{ slotId: string; locale: string }>;
}

export default async function RecessActivityPage({ params }: RecessPageProps) {
  const { slotId, locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  // 1. Fetch slot details
  const slot = await schedulingService.getSlotById(user, slotId);
  if (!slot || slot.status !== "teacher-recess" || !slot.fallbackLessonId) {
    notFound();
  }

  // 2. Fetch lesson details
  const lesson = await curriculumService.findLessonById(slot.fallbackLessonId);
  if (!lesson) {
    notFound();
  }

  // 3. Fetch teacher details to display their name
  const teacher = await userService.getUserById(slot.teacherId);
  const teacherName = teacher?.name || "Professor";

  // Prep data for client
  const slotData = {
    id: slot.id,
    startAt: slot.startAt,
    notes: slot.notes,
    teacherName,
  };

  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    difficulty: lesson.difficulty,
    contentJson: lesson.contentJson,
    quizData: lesson.quizData,
  };

  return (
    <div>
      <Header
        title="Atividade de Recesso"
        subtitle={`Lição de fallback preparada especialmente para você.`}
        backHref="/hub/student/schedule"
        className="contents"
      />

      <main className="container py-6">
        <RecessActivityClient
          slot={slotData}
          lesson={lessonData}
          locale={locale}
        />
      </main>
    </div>
  );
}
