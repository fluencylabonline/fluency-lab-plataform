import { startPlacementTestAction } from "@/modules/placement/placement.actions";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { redirect } from "next/navigation";
import { TestEngine } from "../_components/TestEngine";

interface TestPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ languageId?: string }>;
}

export default async function PlacementTestPage({ searchParams }: TestPageProps) {
  const { languageId } = await searchParams;

  if (!languageId) {
    redirect("/hub/student/placement");
  }

  const result = await startPlacementTestAction({ languageId });

  if (!result?.data) {
    redirect("/hub/student/placement");
  }

  const { testId, answeredCount, nextQuestion } = result.data;

  if (!nextQuestion) {
    redirect("/hub/student/placement");
  }

  const language = await curriculumService.findLanguageById(languageId);

  return (
    <div className="fixed inset-0 bg-background z-[40] flex flex-col overflow-y-auto">
      <TestEngine
        initialQuestion={nextQuestion}
        testId={testId}
        initialAnsweredCount={answeredCount}
        languageName={language?.name || "..."}
      />
    </div>
  );
}
