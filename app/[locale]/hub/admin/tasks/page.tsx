import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-server";
import { taskService } from "@/modules/task/task.service";
import { TasksPageClient } from "@/modules/task/components/TasksPageClient";


export const metadata: Metadata = {
  title: "Tarefas | FluencyLab",
};

export default async function AdminTasksPage() {
  await getCurrentUser();
  const projects = await taskService.getProjects();
  const tasks = await taskService.getTasksByProject(null); // Default to inbox
  const inboxStatuses = await taskService.getStatuses(null);

  return (
    <TasksPageClient
      initialProjects={projects}
      initialTasks={tasks}
      initialInboxStatuses={inboxStatuses}
    />
  );
}
