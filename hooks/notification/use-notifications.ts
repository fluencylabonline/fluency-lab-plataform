"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { ref as dbRef, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase-rtdb";
import { useUserStore } from "@/modules/user/user.store";
import {
  getMyNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  clearNotificationsAction,
} from "@/modules/notification/notification.actions";
import { type Notification } from "@/modules/notification/notification.schema";

type ActionResult = { data?: { success?: boolean } } | undefined;

export function useNotifications() {
  const userId = useUserStore((s) => s.user?.id);

  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    "my-notifications",
    async () => {
      const result = await getMyNotificationsAction();
      return (result?.data as Notification[]) || [];
    },
    {
      // O sinal do RTDB abaixo traz as novas na hora; o intervalo e o foco na
      // aba são só rede de segurança (antes: a cada 30s, em toda aba aberta,
      // ocupando a fila de Server Actions).
      refreshInterval: 120000,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (!userId) return;
    let isInitialSnapshot = true;
    const unsubscribe = onValue(
      dbRef(rtdb, `notification_sync_signal/${userId}`),
      () => {
        // O primeiro evento é só o valor atual, não uma notificação nova.
        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          return;
        }
        mutate();
      },
      // Sem permissão (regras ainda não publicadas): fica no polling.
      () => {}
    );
    return () => unsubscribe();
  }, [userId, mutate]);

  /**
   * Atualização otimista: a lista muda na hora e a action roda em seguida.
   * Se a action falhar, o SWR devolve a lista anterior (rollbackOnError) e
   * retornamos `false` para o componente avisar com notify.error.
   */
  const runOptimistic = async (
    update: (list: Notification[]) => Notification[],
    action: () => Promise<ActionResult>
  ) => {
    try {
      await mutate(
        async (current) => {
          const result = await action();
          if (!result?.data?.success) throw new Error("NOTIFICATION_ACTION_FAILED");
          return update(current ?? []);
        },
        {
          optimisticData: (current) => update(current ?? []),
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );
      return true;
    } catch {
      return false;
    }
  };

  return {
    notifications: data,
    isLoading,
    isError: error,
    mutate,
    markAsRead: (id: string) =>
      runOptimistic(
        (list) => list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        () => markNotificationAsReadAction({ id })
      ),
    markAllAsRead: () =>
      runOptimistic(
        (list) => list.map((n) => ({ ...n, isRead: true })),
        () => markAllNotificationsAsReadAction()
      ),
    clearAll: () => runOptimistic(() => [], () => clearNotificationsAction()),
  };
}
