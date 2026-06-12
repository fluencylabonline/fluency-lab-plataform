import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { getCurrentUser } from "@/lib/auth-server";
import { TeacherScheduleClient } from "./_components/TeacherScheduleClient";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";
import { redirect } from "next/navigation";
import { CalendarEvent } from "@/components/ui/calendar-view";

export default async function TeacherSchedulePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/signin");
  }

  // Initial fetch for the current month and next 3 months
  const start = startOfMonth(new Date());
  const end = endOfMonth(addMonths(new Date(), 3));
  
  const classes = await schedulingService.getTeacherClasses(user.id, start, end);
  
  const events: CalendarEvent[] = classes.map(cls => ({
    id: cls.id,
    title: cls.student?.name || (cls.status === "available" ? "Disponível" : "Aula"),
    start: cls.startAt,
    end: cls.endAt,
    studentName: cls.student?.name || undefined,
    status: cls.status,
    type: cls.type,
    location: cls.lessonTitle || cls.planName || "",
    notes: cls.notes || "",
    studentId: cls.studentId || undefined,
    assignedPlanId: cls.planId || undefined,
    lessonId: cls.lessonId || undefined,
    isRecurring: !!cls.ruleId,
    ruleId: cls.ruleId,
    ruleStartDate: cls.rule?.startDate,
    ruleEndDate: cls.rule?.endDate,
    isActive: cls.student?.isActive ?? true,
  }));

  return (
    <TeacherScheduleClient 
      teacherId={user.id}
      initialEvents={events}
      user={user}
    />
  );
}
