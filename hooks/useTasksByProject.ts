"use client";

import useSWR from "swr";
import { getTasksByProjectAction } from "@/modules/task/task.actions";

export function useTasksByProject(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    projectId ? ["tasks", projectId] : "tasks-inbox",
    async () => {
      const result = await getTasksByProjectAction({ projectId });
      return result;
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}
