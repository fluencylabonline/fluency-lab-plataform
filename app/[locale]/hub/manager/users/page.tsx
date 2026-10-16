import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { UsersPageClient } from "../../../../../modules/user/_components/UsersPageClient";
import { userService } from "@/modules/user/user.service";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { contractService } from "@/modules/contract/contract.service";
import { billingService } from "@/modules/billing/billing.service";

export default async function ManagerUsersPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    redirect("/signin");
  }

  // Tudo independente entre si: um único round-trip em paralelo.
  const [rawUsers, studentTeachersIdsMap, studentContractsMap, studentPaymentsMap, studentNextClassesMap] =
    await Promise.all([
      userService.getAllUsers(),
      schedulingService.getStudentTeachersMap(),
      contractService.getActiveContractsMap(),
      billingService.getCurrentMonthPaymentStatusMap(),
      schedulingService.getAllStudentsNextClassMap(),
    ]);
  const users = rawUsers.map((u) => userService.sanitizeUserForAdmin(u));

  // Resolve student teacher names from the map of student teacher IDs
  const userNamesMap = new Map(rawUsers.map((u) => [u.id, u.name]));
  const studentTeachersMap: Record<string, string[]> = {};
  for (const [studentId, teacherIds] of Object.entries(studentTeachersIdsMap) as [string, string[]][]) {
    studentTeachersMap[studentId] = teacherIds
      .map((id: string) => userNamesMap.get(id))
      .filter((name): name is string => !!name);
  }

  return (
    <UsersPageClient
      initialData={users}
      currentUser={userService.toSessionDTO(user)}
      basePath="/hub/manager/users"
      studentTeachersMap={studentTeachersMap}
      studentContractsMap={studentContractsMap}
      studentPaymentsMap={studentPaymentsMap}
      studentNextClassesMap={studentNextClassesMap}
    />
  );
}
