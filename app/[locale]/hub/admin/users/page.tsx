import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { UsersPageClient } from "../../../../../modules/user/_components/UsersPageClient";
import { hasPermission } from "@/lib/rbac";
import { userService } from "@/modules/user/user.service";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "class.view.all")) {
    redirect("/signin");
  }

  const rawUsers = await userService.getAllUsers();
  const users = rawUsers.map((u) => userService.sanitizeUserForAdmin(u));

  return (
    <UsersPageClient initialData={users} currentUser={user} basePath="/hub/admin/users" />
  );
}
