import { courseService } from "@/modules/course/course.service";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect, notFound } from "next/navigation";
import { StudentPlayerClient } from "./_components/StudentPlayerClient";

interface CoursePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function StudentCoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const courseData = await courseService.getCourseDetails(user, id, user.id);
  const studentCourses = await courseService.getStudentCourses(user);
  const currentCourse = studentCourses.find(c => c.id === id);

  if (!courseData || !currentCourse) {
    notFound();
  }

  // Ensure user is enrolled
  if (!currentCourse.isEnrolled) {
    redirect(`/hub/student/courses`);
  }

  return (
    <StudentPlayerClient 
      courseData={courseData}
      enrollment={currentCourse.enrollment!}
      currentUser={user}
    />
  );
}
