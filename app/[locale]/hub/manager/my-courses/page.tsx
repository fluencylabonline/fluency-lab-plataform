import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { MyCoursesClient } from "../../_components/MyCoursesClient";
import { pageTitle } from "@/lib/page-metadata";

export const generateMetadata = pageTitle("myCourses");

export default async function ManagerMyCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") redirect("/signin");

  return (
    <MyCoursesClient currentUser={{
      name: user.name || "",
      email: user.email || "",
      photoUrl: user.photoUrl || undefined,
      role: user.role
    }} />
  );
}
