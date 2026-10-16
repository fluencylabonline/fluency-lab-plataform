"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useParams, useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/notification/use-notifications";
import { notify } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";
import { type Notification } from "@/modules/notification/notification.schema";
import { NotificationDetail } from "./NotificationDetail";

export function NotificationList() {
  const { locale } = useParams();
  const dateLocale = locale === "pt" ? ptBR : enUS;
  const { notifications, isLoading, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const router = useRouter();

  const [selected, setSelected] = useState<Notification | null>(null);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleMarkAsRead = async (id: string) => {
    if (!(await markAsRead(id))) {
      notify.error("Erro ao marcar como lida");
    }
  };

  const handleSelectNotification = (notification: Notification) => {
    setSelected(notification);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleNavigate = (url: string) => {
    router.push(url);
  };

  const handleMarkAllAsRead = async () => {
    if (await markAllAsRead()) {
      notify.success("Todas as notificações foram marcadas como lidas");
    } else {
      notify.error("Erro ao marcar todas como lidas");
    }
  };

  const handleClearAll = async () => {
    if (await clearAll()) {
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
    <div className="overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
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
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col gap-3"
          >
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
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
