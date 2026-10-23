import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import {
  schedulingService,
  OVERDUE_BLOCK_THRESHOLD,
} from "@/modules/scheduling/scheduling.service";
import { OverdueClassesPanel } from "@/modules/scheduling/_components/OverdueClassesPanel";

// Professor com aulas demais sem status só enxerga esta página (o redirect vem
// do layout do hub). Fica fora de /hub, sem sidebar nem navegação.
export default async function OverdueClassesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "teacher") redirect("/hub");

  const overdue = await schedulingService.getTeacherOverdueSlots(user.id);
  if (overdue.length === 0) redirect("/hub");

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <OverdueClassesPanel
        classes={overdue.map((c) => ({
          id: c.id,
          startAt: c.startAt.toISOString(),
          studentName: c.student?.name ?? "Aluno",
        }))}
        blockThreshold={OVERDUE_BLOCK_THRESHOLD}
        showBackToHub
      />
    </main>
  );
}
