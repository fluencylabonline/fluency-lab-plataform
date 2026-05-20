import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { UsersPageClient } from "../../../../../modules/user/_components/UsersPageClient";
import { userService } from "@/modules/user/user.service";

export default async function ManagerUsersPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    redirect("/signin");
  }

  const rawUsers = await userService.getAllUsers();
  const users = rawUsers.map((u) => userService.sanitizeUserForAdmin(u));

  return (
    <UsersPageClient initialData={users} currentUser={user} basePath="/hub/manager/users" />
  );
}
