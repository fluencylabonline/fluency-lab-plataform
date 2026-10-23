import { requireRole } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";
import {
  schedulingService,
  OVERDUE_BLOCK_THRESHOLD,
} from "@/modules/scheduling/scheduling.service";
import { OverdueClassesBanner } from "./_components/OverdueClassesBanner";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(UserRoles.TEACHER);
  const overdueCount = await schedulingService.getTeacherOverdueCount(user.id);

  // Sem aulas atrasadas o layout não muda nada para as páginas do professor.
  if (overdueCount === 0) return <>{children}</>;

  return (
    <div className="flex flex-col h-full w-full">
      <OverdueClassesBanner count={overdueCount} blockThreshold={OVERDUE_BLOCK_THRESHOLD} />
      <div className="flex-1 min-h-0 w-full overflow-y-auto">{children}</div>
    </div>
  );
}
