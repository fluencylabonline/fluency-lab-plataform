import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { Header } from "@/components/layout/header";
import { StudentsList } from "./_components/StudentsList";
import { getTranslations } from "next-intl/server";

export default async function TeacherStudentsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // RBAC check (extra safety before service call)
  if (user.role !== "teacher" && user.role !== "admin" && user.role !== "manager") {
    redirect("/hub");
  }

  const t = await getTranslations("MyStudentsPage");
  
  // Fetch data on the server
  const students = await schedulingService.getTeacherStudents(user.id);

  // Map the internal type to the one expected by the component
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
    <div className="flex flex-col w-full h-full bg-background/50">
      <Header 
        title={t("title")} 
        subtitle={t("subheading")}
        user={{
          name: user.name,
          email: user.email,
          photoUrl: user.photoUrl,
          role: user.role
        }}
      />
      
      <main className="flex-1 px-4 md:px-6 py-6 overflow-y-auto scrollbar-hide">
        <StudentsList initialData={mappedStudents} />
      </main>
    </div>
  );
}
