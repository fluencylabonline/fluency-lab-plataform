import { learningService } from "@/modules/learning/learning.service";
import { getCurrentUser } from "@/lib/auth-server";
import { StudentNotebookClient } from "./_components/StudentNotebookClient";
import { redirect } from "next/navigation";

export default async function NotebookPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch all required data in parallel using the service layer
  const [stats, learnedItems, reviewedItems, roadmap] = await Promise.all([
    learningService.getStudentLearningStats(user.id),
    learningService.getLearnedItemsDetails(user.id),
    learningService.getReviewedItemsDetails(user.id),
    learningService.getStudentRoadmap(user.id)
  ]);

  return (
    <StudentNotebookClient
      stats={stats}
      learnedItems={learnedItems}
      reviewedItems={reviewedItems}
      roadmap={roadmap}
      user={{
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role
      }}
    />
  );
}
