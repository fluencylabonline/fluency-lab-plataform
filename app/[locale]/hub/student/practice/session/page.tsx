import { getCurrentUser } from "@/lib/auth-server";
import { learningService } from "@/modules/learning/learning.service";
import { userService } from "@/modules/user/user.service";
import { PracticeSession } from "./_components/PracticeSession";
import { PracticeErrorView } from "./_components/PracticeErrorView";
import type { DailyPracticeSession } from "@/modules/learning/learning.types";
import { redirect } from "next/navigation";

interface SessionPageProps {
  searchParams: Promise<{ day?: string; planId?: string; replay?: string }>;
}

export default async function PracticeSessionPage({ searchParams }: SessionPageProps) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await userService.getUser(sessionUser.id);
  if (!user) return <div>Usuário não encontrado</div>;

  const params = await searchParams;
  let planId = params.planId;
  const dayOverride = params.day ? parseInt(params.day, 10) : undefined;
  const isReplay = params.replay === "true";

  // If no planId provided, try to find the active roadmap
  if (!planId) {
    const roadmap = await learningService.getStudentRoadmap(user.id);
    if (roadmap) {
      planId = roadmap.id;
    }
  }

  if (!planId) {
    return <PracticeErrorView message="Você não possui um plano de estudos ativo para praticar." />;
  }

  let session: DailyPracticeSession;
  try {
    session = await learningService.getPracticeCycle(planId, dayOverride);
  } catch (error) {
    console.error("[PracticeSessionPage] Error fetching cycle:", error);
    return <PracticeErrorView message="Não encontramos itens de prática para esta lição. Entre em contato com seu professor." />;
  }

  if (session.items.length === 0) {
    return <PracticeErrorView message={session.error || "Nenhum item de prática disponível para este dia."} />;
  }

  const currentStreak = user.streakCount || 0;

  return (
    <PracticeSession
      session={session}
      planId={planId}
      currentStreak={currentStreak}
      isReplay={isReplay}
    />
  );
}
