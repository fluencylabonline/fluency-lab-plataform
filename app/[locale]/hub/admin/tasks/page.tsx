import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-server";
import { taskService } from "@/modules/task/task.service";
import { TasksPageClient } from "@/modules/task/components/TasksPageClient";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.tasks" });
  return {
    title: t("title"),
  };
}

export default async function AdminTasksPage() {
  await getCurrentUser();
  const projects = await taskService.getProjects();
  const tasks = await taskService.getTasksByProject(null);
  const inboxStatuses = await taskService.getStatuses(null);

  return (
    <TasksPageClient
      initialProjects={projects}
      initialTasks={tasks}
      initialInboxStatuses={inboxStatuses}
    />
  );
}
