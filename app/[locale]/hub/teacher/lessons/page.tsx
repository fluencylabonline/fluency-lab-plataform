import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { LessonList } from "./_components/LessonList";

export default async function LessonsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const initialLessons = await curriculumService.getLessonsPaginated({ limit: 20, status: "ready" });
  const languages = await curriculumService.findAllLanguages();

  return (
    <LessonList
      initialData={initialLessons}
      languages={languages.map(l => ({ id: l.id, name: l.name }))}
    />
  );
}
