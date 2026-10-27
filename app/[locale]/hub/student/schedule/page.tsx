import { endOfMonth, startOfDay, startOfMonth, addMonths } from "date-fns";
import { getCurrentUser } from "@/lib/auth-server";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { StudentSchedule } from "./_components/StudentSchedule";

/** Meses já carregados no servidor (o atual e os dois seguintes); o resto vem pelo botão "ver mais". */
const MONTHS_AHEAD = 3;

export default async function StudentSchedulePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();

  const [initialClasses, balance, rescheduleStats] = await Promise.all([
    schedulingService.getStudentClassesInRange(
      user.id,
      startOfDay(now),
      endOfMonth(addMonths(startOfMonth(now), MONTHS_AHEAD - 1))
    ),
    schedulingService.getStudentCreditBalance(user.id),
    schedulingService.getStudentRescheduleStats(user.id, now.getMonth(), now.getFullYear()),
  ]);

  return (
    <StudentSchedule
      studentId={user.id}
      initialClasses={initialClasses}
      balance={balance}
      rescheduleStats={rescheduleStats}
    />
  );
}
