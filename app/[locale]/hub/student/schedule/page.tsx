import { getCurrentUser } from "@/lib/auth-server";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { Header } from "@/components/layout/header";
import { ScheduleCalendar } from "./_components/ScheduleCalendar";
import { getTranslations } from "next-intl/server";

export default async function StudentSchedulePage() {
    const user = await getCurrentUser();
    if (!user) return null;
    const t = await getTranslations("Schedule");

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Fetch initial data in parallel
    const [initialClasses, balance, rescheduleStats] = await Promise.all([
        schedulingService.getStudentClassesInRange(
            user.id,
            new Date(currentYear, currentMonth, 1),
            new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
        ),
        schedulingService.getStudentCreditBalance(user.id),
        schedulingService.getStudentRescheduleStats(user.id, currentMonth, currentYear),
    ]);

    return (
        <div>
            <Header
                title={t("title")}
                subtitle={t("description")}
            />

            <main className="container">
                <ScheduleCalendar
                    initialClasses={initialClasses}
                    balance={balance}
                    rescheduleStats={rescheduleStats}
                />
            </main>
        </div>
    );
}