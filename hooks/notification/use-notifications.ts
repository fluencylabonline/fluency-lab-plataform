"use client";

import useSWR from "swr";
import { getMyNotificationsAction } from "@/modules/notification/notification.actions";
import { type Notification } from "@/modules/notification/notification.schema";

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    "my-notifications",
    async () => {
      const result = await getMyNotificationsAction();
      return (result?.data as Notification[]) || [];
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    notifications: data,
    isLoading,
    isError: error,
    mutate,
  };
}
