import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { StudentsList } from "./_components/StudentsList";
import { getTranslations } from "next-intl/server";

export default async function TeacherStudentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  if (user.role !== "teacher" && user.role !== "admin" && user.role !== "manager") {
    redirect("/hub");
  }

  const t = await getTranslations("MyStudentsPage");

  const students = await schedulingService.getTeacherStudents(user.id);

  const mappedStudents = students.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    photoUrl: s.photoUrl,
    nextClass: s.nextClass ? {
      startAt: s.nextClass.startAt,
      type: s.nextClass.type
    } : null
  }));

  return (
    <StudentsList
      initialData={mappedStudents}
      title={t("title")}
      subtitle={t("subheading")}
      user={{
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role
      }}
    />
  );
}
