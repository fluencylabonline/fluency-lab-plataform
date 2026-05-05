import { requireRole } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.STUDENT);

  return <>{children}</>;
}
