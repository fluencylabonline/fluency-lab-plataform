import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "@/modules/user/user.service";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { contractService } from "@/modules/contract/contract.service";
import { learningService } from "@/modules/learning/learning.service";
import { courseService } from "@/modules/course/course.service";
import { redirect } from "next/navigation";
import { placementRepository } from "@/modules/placement/placement.repository";
import { getStudentProficiencies } from "@/utils/proficiency";
import { type OnboardingVariant } from "./_components/OnboardingStatusCard";
import { type PlacementTest } from "@/modules/placement/placement.schema";
import { StudentProfileClient } from "./_components/StudentProfileClient";
import { holidayRecessDates, isHolidayRecessPeriod } from "@/lib/holiday-recess";
import { recessNoticeCount } from "@/modules/scheduling/recess-notice";

/** Course ID that exists only in production — kept server-side to avoid leaking in the client bundle. */
const WELCOME_COURSE_ID = "0ece3db9-ccb1-4e8f-bd46-6f649d010762";

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) redirect("/signin");
    if (!user.onboarded) redirect("/onboarding");

    const [, nextClass, activeContract, curriculumStats, activePayment, learningStats, placementHistory, courseStatus, recessActivities] = await Promise.all([
        userService.getLevelInfo(user.currentEloScore),
        schedulingService.findNextClassForStudent(user.id),
        contractService.getActiveContract(user.id),
        learningService.getStudentCurriculumGap(user.id),
        import("@/modules/billing/billing.service").then(m => m.billingService.getStudentPaymentStatus(user.id)),
        learningService.getStudentLearningStats(user.id),
        placementRepository.getTestHistory(user.id),
        courseService.getStudentCourseStatus(user.id, WELCOME_COURSE_ID),
        schedulingService.getStudentRecessActivities(user),
    ]);

    // No recesso de fim de ano não há aula ao vivo: o cartão de próxima aula vira
    // o atalho para as aulas gravadas (se houver algum pacote publicado).
    const holidayPackageCount = isHolidayRecessPeriod() ? await courseService.countPublishedHolidayRecessPackages() : 0;
    const holidayClasses = holidayPackageCount > 0
        ? { packageCount: holidayPackageCount, returnDay: holidayRecessDates().returnDay }
        : null;

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
        },
        course: {
            status: courseStatus as OnboardingVariant,
            label: courseStatus === "success" ? "course_completed" : courseStatus === "warning" ? "course_in_progress" : "course_pending",
            link: `/hub/student/courses/${WELCOME_COURSE_ID}`,
        },
    };

    const proficiencies = getStudentProficiencies(user, placementHistory as (PlacementTest & { language: { code: string } })[]);

    return (
        <StudentProfileClient
            user={{ ...userService.toSessionDTO(user), streakCount: user.streakCount }}
            subscriptionData={subscriptionData}
            nextClassMapped={nextClassMapped}
            onboardingData={onboardingData}
            proficiencies={proficiencies}
            retentionRate={retentionRate}
            vocabularyLevel={vocabularyLevel}
            curriculumStats={curriculumStats}
            practiceStatus={practiceStatus}
            recessActivitiesCount={recessNoticeCount(recessActivities)}
            holidayClasses={holidayClasses}
        />
    );
}