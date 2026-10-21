import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { courseService } from "@/modules/course/course.service";
import { CoursePageClient } from "@/modules/course/_components/CoursePageClient";
import { userService } from "@/modules/user/user.service";

/** Pacotes de aulas de recesso gravadas (recesso de fim de ano). */
export default async function HolidayClassesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "course.manage")) {
    redirect("/signin");
  }

  const packages = await courseService.getAllCourses(user, "holiday_recess");

  return (
    <CoursePageClient
      initialData={packages}
      currentUser={userService.toSessionDTO(user)}
      kind="holiday_recess"
      basePath="/hub/manager/holiday-classes"
    />
  );
}
