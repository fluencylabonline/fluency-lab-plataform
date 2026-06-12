"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";
import { useNotifications } from "@/hooks/notification/use-notifications";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  clearNotificationsAction,
} from "../notification.actions";
import { notify } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";

export function NotificationList() {
  const { locale } = useParams();
  const dateLocale = locale === "pt" ? ptBR : enUS;
  const { notifications, isLoading, mutate } = useNotifications();

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsReadAction({ id });
    if (result?.data?.success) {
      mutate();
      notify.success("Notificação marcada como lida");
    } else {
      notify.error("Erro ao marcar como lida");
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsReadAction();
    if (result?.data?.success) {
      mutate();
      notify.success("Todas as notificações foram marcadas como lidas");
    } else {
      notify.error("Erro ao marcar todas como lidas");
    }
  };

  const handleClearAll = async () => {
    const result = await clearNotificationsAction();
    if (result?.data?.success) {
      mutate();
      notify.success("Todas as notificações foram limpas");
    } else {
      notify.error("Erro ao limpar notificações");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-primary">
        <Spinner />
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação encontrada</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-2 pb-2 border-b border-border text-xs">
        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="text-muted-foreground hover:text-primary transition-colors text-[10px] font-black uppercase tracking-wider disabled:opacity-40 disabled:hover:text-muted-foreground"
        >
          Marcar como lidas
        </button>
        <button
          onClick={handleClearAll}
          className="text-muted-foreground hover:text-destructive transition-colors text-[10px] font-black uppercase tracking-wider"
        >
          Limpar todas
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "flex flex-col items-start gap-1 p-4 cursor-pointer hover:bg-accent transition-colors rounded-lg mb-1",
              !notification.isRead && "bg-primary/5"
            )}
            onClick={() => handleMarkAsRead(notification.id)}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <span className={cn("text-sm font-medium", !notification.isRead && "text-primary")}>
                {notification.title}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {notification.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
