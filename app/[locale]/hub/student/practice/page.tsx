import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "@/modules/user/user.service";
import { learningService } from "@/modules/learning/learning.service";
import { LearningPath } from "./_components/LearningPath";
import { RoadmapTimeline } from "./_components/RoadmapTimeline";
import { HistoryAccordion } from "./_components/HistoryAccordion";
import { XPHeader } from "./_components/XPHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyResults } from "@/components/ui/empty";
import type { PracticeMode } from "@/modules/learning/learning.types";

// Metadata
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Practice" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

const DAY_MODES: Record<number, PracticeMode> = {
  1: "flashcard_visual",
  2: "gap_fill_listening",
  3: "sentence_unscramble",
  4: "flashcard_recall",
  5: "quiz_comprehensive",
  6: "listening_choice",
};

export default async function PracticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Practice" });
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await userService.getUser(sessionUser.id);
  
  if (!user) return <div>{t('userNotFound')}</div>;

  const roadmap = await learningService.getStudentRoadmap(user.id);
  const archivedPlans = await learningService.getArchivedPlans(user.id);

  // Calculate current practice session info
  const activePlan = roadmap; // Active plan is returned by getStudentRoadmap
  const currentLesson = activePlan?.lessons.find(l => l.status === "current") || activePlan?.lessons[0];
  const todayDay = (currentLesson?.completedPracticeDays || 0) + 1;
  const clampedDay = Math.min(6, todayDay);

  const days = Array.from({ length: 6 }, (_, i) => {
    const dayIndex = i + 1;
    const isCompleted = dayIndex < clampedDay;
    const isAvailable = dayIndex === clampedDay;

    return {
      dayIndex,
      mode: DAY_MODES[dayIndex],
      status: isCompleted ? ("completed" as const) : isAvailable ? ("available" as const) : ("locked" as const),
      xpEarned: isCompleted ? 60 : undefined,
      accuracy: isCompleted ? 100 : undefined,
      canReplay: isCompleted,
    };
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Profile Header */}
        <XPHeader 
          user={{
            name: user.name,
            photoUrl: user.photoUrl,
            currentXP: user.currentXP || 0,
            streakCount: user.streakCount || 0,
            pushNotificationsEnabled: user.pushNotificationsEnabled
          }}
        />

        <Tabs defaultValue="practice" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="practice" className="rounded-lg font-bold text-xs">{t('practiceTab')}</TabsTrigger>
            <TabsTrigger value="roadmap" className="rounded-lg font-bold text-xs">{t('roadmapTab')}</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg font-bold text-xs">{t('historyTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black">{t('myPath')}</h2>
                {activePlan ? (
                  <p className="text-sm text-muted-foreground">{t('dayOfPlan', { day: clampedDay, total: 6, plan: activePlan.name })}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('noActivePlan')}</p>
                )}
              </div>
              
              {activePlan ? (
                <LearningPath
                  planId={activePlan.id}
                  days={days}
                  todayDay={clampedDay}
                  userXP={user.currentXP || 0}
                />
              ) : (
                <div className="w-full py-12">
                  <EmptyResults
                    title={t('noActivePlanTitle')}
                    description={t('noActivePlanDesc')}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="roadmap" className="pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-black">{t('roadmapTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('roadmapDesc')}</p>
            </div>
            {roadmap ? (
              <RoadmapTimeline lessons={roadmap.lessons} />
            ) : (
              <div className="w-full py-12">
                <EmptyResults
                  title={t('emptyRoadmapTitle')}
                  description={t('emptyRoadmapDesc')}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-black">{t('completedTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('completedDesc')}</p>
            </div>
            <HistoryAccordion plans={archivedPlans} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
