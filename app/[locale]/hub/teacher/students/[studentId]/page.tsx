import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "@/modules/user/user.service";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { notebookService } from "@/modules/notebook/notebook.service";
import { learningService } from "@/modules/learning/learning.service";
import { StudentDetailsClient } from "./_components/StudentDetailsClient";
import { startOfMonth, endOfMonth } from "date-fns";

interface StudentDetailsPageProps {
  params: Promise<{
    studentId: string;
    locale: string;
  }>;
}

export default async function StudentDetailsPage({ params }: StudentDetailsPageProps) {
  const { studentId } = await params;
  const user = await getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "admin" && user.role !== "manager")) {
    redirect("/login");
  }

  const student = await userService.getUserById(studentId);
  if (!student) {
    redirect("/hub/teacher/students");
  }

  const now = new Date();
  const [initialClasses, initialNotebooks, initialRoadmap] = await Promise.all([
    schedulingService.getStudentClassesByTeacher(
      user,
      studentId,
      startOfMonth(now),
      endOfMonth(now)
    ),
    notebookService.getNotebooksForStudent(user.id, user.role, studentId),
    learningService.getStudentRoadmap(studentId),
  ]);

  return (
    <StudentDetailsClient 
      studentId={studentId}
      studentName={student.name}
      initialClasses={initialClasses}
      initialNotebooks={initialNotebooks}
      initialRoadmap={initialRoadmap}
    />
  );
}
