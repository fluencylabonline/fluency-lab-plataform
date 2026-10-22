import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { LessonList } from "./_components/LessonList";
import { learningService } from "@/modules/learning/learning.service";

export default async function LessonsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  // Primeira página (tamanho de tela grande); o cliente refaz a busca se a janela pedir outro tamanho.
  const initialLessons = await curriculumService.getLessonsPage({ limit: 8, status: "ready" });
  const languages = await curriculumService.findAllLanguages();
  // Só templates publicados aparecem para o professor.
  const templates = (await learningService.getAssignableTemplates()).map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    languageId: template.languageId,
    languageName: template.language?.name ?? null,
    lessonsCount: template.lessons.length,
  }));

  return (
    <LessonList
      templates={templates}
      initialData={initialLessons}
      languages={languages.map(l => ({ id: l.id, name: l.name }))}
    />
  );
}
