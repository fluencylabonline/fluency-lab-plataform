"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";
import { useNotifications } from "@/hooks/notification/use-notifications";
import { markNotificationAsReadAction } from "../notification.actions";
import { notify } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";

export function NotificationList() {
  const { locale } = useParams();
  const dateLocale = locale === "pt" ? ptBR : enUS;
  const { notifications, isLoading, mutate } = useNotifications();

  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsReadAction({ id });
    if (result?.data?.success) {
      mutate();
    } else {
      notify.error("Erro ao marcar como lida");
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
  );
}
