import { requireRole } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.ADMIN);

  return <>{children}</>;
}
