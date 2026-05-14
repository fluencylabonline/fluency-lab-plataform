import { getCurrentUser } from "@/lib/auth-server";
import { learningService } from "@/modules/learning/learning.service";
import { userService } from "@/modules/user/user.service";
import { PracticeSession } from "./_components/PracticeSession";
import { PracticeErrorView } from "./_components/PracticeErrorView";
import type { DailyPracticeSession } from "@/modules/learning/learning.types";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface SessionPageProps {
  searchParams: Promise<{ day?: string; planId?: string; replay?: string }>;
}

export default async function PracticeSessionPage({ searchParams, params }: SessionPageProps & { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Practice" });
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await userService.getUser(sessionUser.id);
  if (!user) return <div>{t('userNotFound') || "Usuário não encontrado"}</div>;

  const sParams = await searchParams;
  let planId = sParams.planId;
  const dayIndex = sParams.day ? parseInt(sParams.day, 10) : undefined;
  const isReplay = sParams.replay === "true";

  if (!planId) {
    const roadmap = await learningService.getStudentRoadmap(user.id);
    if (roadmap) {
      planId = roadmap.id;
    }
  }

  if (!planId) {
    return <PracticeErrorView message={t('noActivePlanToPractice') || "Você não possui um plano de estudos ativo para praticar."} />;
  }

  let session: DailyPracticeSession;

  try {
    session = await learningService.getPracticeCycle(planId, dayIndex);
  } catch (error) {
    console.error("[PracticeSessionPage] Error fetching cycle:", error);
    return <PracticeErrorView message={t('noPracticeItemsFound') || "Não encontramos itens de prática para esta lição. Entre em contato com seu professor."} />;
  }

  if (session.items.length === 0) {
    return <PracticeErrorView message={session.error || t('noPracticeItemsForDay') || "Nenhum item de prática disponível para este dia."} />;
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


