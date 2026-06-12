"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/notification/use-notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  clearNotificationsAction,
} from "../notification.actions";
import { notify } from "@/components/ui/toaster";

export function NotificationBell() {
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

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await markAllNotificationsAsReadAction();
    if (result?.data?.success) {
      mutate();
      notify.success("Todas as notificações foram marcadas como lidas");
    } else {
      notify.error("Erro ao marcar todas como lidas");
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await clearNotificationsAction();
    if (result?.data?.success) {
      mutate();
      notify.success("Todas as notificações foram limpas");
    } else {
      notify.error("Erro ao limpar notificações");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex flex-col gap-1.5 pb-2">
          <div className="flex items-center justify-between">
            <span className="font-bold">Notificações</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {unreadCount} novas
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 text-xs font-normal mt-1">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="text-muted-foreground hover:text-primary transition-colors text-[10px] font-black uppercase tracking-wider disabled:opacity-40 disabled:hover:text-muted-foreground"
            >
              Lidas
            </button>
            <button
              onClick={handleClearAll}
              disabled={!notifications || notifications.length === 0}
              className="text-muted-foreground hover:text-destructive transition-colors text-[10px] font-black uppercase tracking-wider disabled:opacity-40 disabled:hover:text-muted-foreground"
            >
              Limpar todas
            </button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação encontrada</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-accent",
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
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
