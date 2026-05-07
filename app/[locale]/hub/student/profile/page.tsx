import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "@/modules/user/user.service";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { contractService } from "@/modules/contract/contract.service";
import { learningService } from "@/modules/learning/learning.service";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { ProfileCard } from "@/modules/user/_components/ProfileCard";
import { Badges } from "./_components/Badges";
import { NextClassCard } from "./_components/NextClassCard";
import { StudentPaymentStatusCard } from "./_components/StudentPaymentStatusCard";
import { ProgressStatusCard } from "./_components/ProgressStatusCard";
import { OnboardingStatusCard } from "./_components/OnboardingStatusCard";
import { StreakWidget } from "./_components/StreakWidget";
import { PracticeStatusWidget } from "./_components/PracticeStatusWidget";
import { placementRepository } from "@/modules/placement/placement.repository";
import { getStudentProficiencies } from "@/utils/proficiency";
import { type OnboardingVariant } from "./_components/OnboardingStatusCard";
import { type PlacementTest } from "@/modules/placement/placement.schema";


export default async function ProfilePage() {
    const t = await getTranslations("Hub.Profile");
    const user = await getCurrentUser();

    if (!user) redirect("/signin");
    if (!user.onboarded) redirect("/onboarding");

    const [, nextClass, activeContract, curriculumStats, activePayment, learningStats, placementHistory] = await Promise.all([
        userService.getLevelInfo(user.currentEloScore),
        schedulingService.findNextClassForStudent(user.id),
        contractService.getActiveContract(user.id),
        learningService.getStudentCurriculumGap(user.id),
        import("@/modules/billing/billing.service").then(m => m.billingService.getStudentPaymentStatus(user.id)),
        learningService.getStudentLearningStats(user.id),
        placementRepository.getTestHistory(user.id)
    ]);

    const subscriptionData = activePayment;

    const nextClassMapped = nextClass ? {
        id: nextClass.id,
        startsAt: nextClass.startAt,
        endsAt: nextClass.endAt,
        teacherName: nextClass.teacher?.name || "Professor",
        teacherPhoto: nextClass.teacher?.photoUrl || null,
        topic: nextClass.lessonTitle || null
    } : null;

    const { differenceInCalendarDays, isToday } = await import("date-fns");

    const vocabularyLevel = Math.max(1, Math.min(10, Math.floor((user.currentEloScore - 600) / 100) + 1));

    const retentionRate = learningStats.totalLearned > 0
        ? Math.min(98, Math.round(85 + (user.streakCount * 0.5)))
        : 0;

    const lastPractice = user.lastPracticeDate ? new Date(user.lastPracticeDate) : null;
    const hasActivePlan = !!curriculumStats.activePlanId;

    let practiceStatus: { status: "up_to_date" | "late" | "free"; daysLate?: number } = {
        status: "free"
    };

    if (!hasActivePlan) {
        practiceStatus = { status: "free" };
    } else if (lastPractice && isToday(lastPractice)) {
        practiceStatus = { status: "up_to_date" };
    } else {
        const today = new Date();
        const daysLate = lastPractice ? differenceInCalendarDays(today, lastPractice) : 1;

        practiceStatus = {
            status: "late",
            daysLate: Math.max(1, daysLate)
        };
    }

    const onboardingData = {
        contract: {
            status: (activeContract?.status === "signed" ? "success" : "pending") as OnboardingVariant,
            label: activeContract?.status === "signed" ? "contract_signed" : "contract_pending"
        },
        placement: {
            status: (user.lastPlacementTestDate ? "success" : (placementHistory.some(t => t.status === "in_progress") ? "warning" : "pending")) as OnboardingVariant,
            label: user.lastPlacementTestDate ? "placement_done" : (placementHistory.some(t => t.status === "in_progress") ? "placement_progress" : "placement_pending")
        }
    };

    const proficiencies = getStudentProficiencies(user, placementHistory as (PlacementTest & { language: { code: string } })[]);

    return (
        <div className="flex flex-col min-h-screen">
            <Header title={t("title")} user={user} showSubHeader={false} className="contents" />

            <main className="container">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">

                    {/* Column 1: Identity & Onboarding */}
                    <div className="flex flex-col gap-3">
                        <ProfileCard user={user} />
                        <OnboardingStatusCard
                            contract={onboardingData.contract}
                            placement={onboardingData.placement}
                        />
                        <Badges proficiencies={proficiencies} />
                    </div>

                    {/* Column 2: Performance & Achievements */}
                    <div className="flex flex-col gap-3">
                        <ProgressStatusCard
                            retentionRate={retentionRate}
                            vocabularyLevel={vocabularyLevel}
                            totalClasses={curriculumStats.totalClasses}
                            completedClasses={curriculumStats.completedClasses}
                        />
                        <StreakWidget streak={user.streakCount} />
                        <PracticeStatusWidget
                            status={practiceStatus.status}
                            daysLate={practiceStatus.daysLate}
                        />
                    </div>

                    {/* Column 3: Financial & Scheduling */}
                    <div className="flex flex-col gap-3">
                        <StudentPaymentStatusCard subscription={subscriptionData} />
                        <NextClassCard nextClass={nextClassMapped} />
                    </div>

                </div>
            </main>
        </div>
    );
}