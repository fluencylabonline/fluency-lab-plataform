import { learningService } from "@/modules/learning/learning.service";
import { getCurrentUser } from "@/lib/auth-server";
import { StudentNotebookClient } from "./_components/StudentNotebookClient";
import { redirect } from "next/navigation";
import { notebookService } from "@/modules/notebook/notebook.service";
import { curriculumService } from "@/modules/curriculum/curriculum.service";

export default async function NotebookPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const [stats, learnedItems, reviewedItems, roadmap, notebooks, wordOfTheDay] = await Promise.all([
    learningService.getStudentLearningStats(user.id),
    learningService.getLearnedItemsDetails(user.id),
    learningService.getReviewedItemsDetails(user.id),
    learningService.getStudentRoadmap(user.id),
    notebookService.getNotebooksForStudent(user.id, user.role, user.id),
    curriculumService.getWordOfTheDay(user.id)
  ]);

  return (
    <StudentNotebookClient
      stats={stats}
      learnedItems={learnedItems}
      reviewedItems={reviewedItems}
      roadmap={roadmap}
      initialNotebooks={notebooks}
      wordOfTheDay={wordOfTheDay}
      user={{
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role
      }}
    />
  );
}
