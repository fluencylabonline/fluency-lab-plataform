import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { MyCoursesClient } from "../../_components/MyCoursesClient";

export default async function AdminMyCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/signin");

  return (
    <MyCoursesClient currentUser={{
      name: user.name || "",
      email: user.email || "",
      photoUrl: user.photoUrl || undefined,
      role: user.role
    }} />
  );
}
