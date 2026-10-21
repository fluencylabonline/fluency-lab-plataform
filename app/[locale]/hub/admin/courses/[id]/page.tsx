import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { courseService } from "@/modules/course/course.service";
import { CourseDetailClient } from "@/modules/course/_components/CourseDetailClient";
import { userService } from "@/modules/user/user.service";

export default async function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "course.manage")) {
    redirect("/signin");
  }

  const courseData = await courseService.getCourseDetails(user, id);
  if (!courseData) {
    redirect("/hub/admin/courses");
  }

  return (
    <CourseDetailClient
      courseData={courseData}
      currentUser={userService.toSessionDTO(user)}
    />
  );
}
