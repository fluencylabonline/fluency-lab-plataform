import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { courseService } from "@/modules/course/course.service";
import { CoursePageClient } from "./_components/CoursePageClient";
import { userService } from "@/modules/user/user.service";

export default async function AdminCoursesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "course.manage")) {
    redirect("/signin");
  }

  const courses = await courseService.getAllCourses(user);

  return (
    <CoursePageClient initialData={courses} currentUser={userService.toSessionDTO(user)} />
  );
}
