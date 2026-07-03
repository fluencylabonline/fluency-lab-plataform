import { courseService } from "@/modules/course/course.service";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect, notFound } from "next/navigation";
import { CoursePlayerClient } from "../../../_components/CoursePlayerClient";

interface CoursePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function AdminCoursePlayerPage({ params }: CoursePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/signin");
  }

  const courseData = await courseService.getCourseDetails(user, id, user.id);
  const userCourses = await courseService.getUserCourses(user);
  const currentCourse = userCourses.find(c => c.id === id);

  if (!courseData || !currentCourse) {
    notFound();
  }

  // Ensure user is enrolled
  if (!currentCourse.isEnrolled) {
    redirect(`/hub/admin/my-courses`);
  }

  return (
    <CoursePlayerClient 
      courseData={courseData}
      enrollment={currentCourse.enrollment!}
      currentUser={user}
    />
  );
}
