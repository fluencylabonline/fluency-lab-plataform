import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { courseService } from "@/modules/course/course.service";
import { userService } from "@/modules/user/user.service";
import { CoursePlayerClient } from "../../../_components/CoursePlayerClient";

interface HolidayClassPageProps {
  params: Promise<{ id: string; locale: string }>;
}

/** Abre um pacote de aulas de recesso no player de cursos (com matrícula automática). */
export default async function StudentHolidayClassPage({ params }: HolidayClassPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const opened = await courseService.openHolidayRecessPackage(user, id);
  if (!opened) notFound();

  return (
    <CoursePlayerClient
      courseData={opened.courseData}
      enrollment={opened.enrollment}
      currentUser={userService.toSessionDTO(user)}
      backHref="/hub/student/holiday-classes"
    />
  );
}
