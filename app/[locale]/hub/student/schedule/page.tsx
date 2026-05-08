import { getCurrentUser } from "@/lib/auth-server";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { ScheduleCalendar } from "./_components/ScheduleCalendar";

export default async function StudentSchedulePage() {
    const user = await getCurrentUser();
    if (!user) return null;

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
        <ScheduleCalendar
            initialClasses={initialClasses}
            balance={balance}
            rescheduleStats={rescheduleStats}
        />
    );
}