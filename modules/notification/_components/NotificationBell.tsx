"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/notification/use-notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useParams, useRouter } from "next/navigation";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  clearNotificationsAction,
} from "../notification.actions";
import { notify } from "@/components/ui/toaster";
import { type Notification } from "@/modules/notification/notification.schema";
import { NotificationDetail } from "./NotificationDetail";

export function NotificationBell() {
  const { locale } = useParams();
  const dateLocale = locale === "pt" ? ptBR : enUS;
  const { notifications, isLoading, mutate } = useNotifications();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Reset to the list view after the close animation finishes
      setTimeout(() => setSelected(null), 200);
    }
  };

  const handleSelectNotification = (notification: Notification) => {
    setSelected(notification);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleNavigate = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsReadAction({ id });
    if (result?.data?.success) {
      mutate();
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
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" data-tour="chrome.notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {selected ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <NotificationDetail
                notification={selected}
                dateLocale={dateLocale}
                onBack={() => setSelected(null)}
                onNavigate={handleNavigate}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
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
                    <div
                      key={notification.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "flex flex-col items-start gap-1 p-4 cursor-pointer hover:bg-accent transition-colors",
                        !notification.isRead && "bg-primary/5"
                      )}
                      onClick={() => handleSelectNotification(notification)}
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
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
