import { requireRole } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.MANAGER);

  return <>{children}</>;
}
