import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { UsersPageClient } from "../../../../../modules/user/_components/UsersPageClient";
import { hasPermission } from "@/lib/rbac";
import { userService } from "@/modules/user/user.service";
import { schedulingService } from "@/modules/scheduling/scheduling.service";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "class.view.all")) {
    redirect("/signin");
  }

  const rawUsers = await userService.getAllUsers();
  const users = rawUsers.map((u) => userService.sanitizeUserForAdmin(u));

  // Resolve student teacher names from the map of student teacher IDs
  const userNamesMap = new Map(rawUsers.map((u) => [u.id, u.name]));
  const studentTeachersIdsMap = await schedulingService.getStudentTeachersMap();
  const studentTeachersMap: Record<string, string[]> = {};
  for (const [studentId, teacherIds] of Object.entries(studentTeachersIdsMap) as [string, string[]][]) {
    studentTeachersMap[studentId] = teacherIds
      .map((id: string) => userNamesMap.get(id))
      .filter((name): name is string => !!name);
  }

  return (
    <UsersPageClient
      initialData={users}
      currentUser={user}
      basePath="/hub/admin/users"
      studentTeachersMap={studentTeachersMap}
    />
  );
}
