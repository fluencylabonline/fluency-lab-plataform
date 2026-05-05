import { requireRole } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.TEACHER);

  return <>{children}</>;
}
