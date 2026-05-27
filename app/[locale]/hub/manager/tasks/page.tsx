import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-server";
import { taskService } from "@/modules/task/task.service";
import { TasksPageClient } from "@/modules/task/components/TasksPageClient";
import { userService } from "@/modules/user/user.service";
import { redirect } from "next/navigation";

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

export default async function ManagerTasksPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }

  const projects = await taskService.getProjects();
  const tasks = await taskService.getTasksByProject(null); 
  const inboxStatuses = await taskService.getStatuses(null);
  const sanitizedUser = userService.sanitizeUserForSettings(user);

  return (
    <TasksPageClient 
      initialProjects={projects} 
      initialTasks={tasks} 
      initialInboxStatuses={inboxStatuses}
      currentUser={sanitizedUser}
    />
  );
}
