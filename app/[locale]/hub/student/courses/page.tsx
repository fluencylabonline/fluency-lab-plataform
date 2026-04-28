import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { StudentCourseClient } from "./_components/StudentCourseClient";

export default async function StudentCoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <StudentCourseClient currentUser={{
      name: user.name || "",
      email: user.email || "",
      photoUrl: user.photoUrl || undefined,
      role: user.role
    }} />
  );
}
