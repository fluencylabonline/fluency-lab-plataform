import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import {
  schedulingService,
  OVERDUE_BLOCK_THRESHOLD,
} from "@/modules/scheduling/scheduling.service";
import { OverdueClassesContent } from "./_components/OverdueClassesContent";

// Professor com aulas demais sem status só enxerga esta página (o redirect vem
// do layout do hub). Fica fora de /hub, sem sidebar nem navegação.
export default async function OverdueClassesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "teacher") redirect("/hub");

  const overdue = await schedulingService.getTeacherOverdueSlots(user.id);
  if (overdue.length === 0) redirect("/hub");

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <OverdueClassesContent
        classes={overdue.map((c) => ({
          id: c.id,
          startAt: c.startAt.toISOString(),
          studentName: c.student?.name ?? "Aluno",
        }))}
        blockThreshold={OVERDUE_BLOCK_THRESHOLD}
      />
    </main>
  );
}
