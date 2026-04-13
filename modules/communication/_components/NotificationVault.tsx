"use client";

import { Bell, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultTrigger,
    VaultBody
} from "@/components/ui/vault";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useTransition } from "react";
import { getMyNotificationsAction, markNotificationAsReadAction } from "../communication.actions";
import { Announcement } from "../communication.schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationVault() {
    const [notifications, setNotifications] = useState<(Announcement & { isRead: boolean })[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [, startTransition] = useTransition();

    useEffect(() => {
        const fetchNotifications = async () => {
            const result = await getMyNotificationsAction();
            if (!result.serverError && result.data) {
                setNotifications(result.data.data.notifications);
                setUnreadCount(result.data.data.unreadCount);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        const target = notifications.find(n => n.id === id);
        if (!target || target.isRead) return;

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        startTransition(async () => {
            await markNotificationAsReadAction({ id });
        });
    };

    return (
        <Vault>
            <VaultTrigger asChild>
                <button className="relative p-2.5 rounded-2xl hover:bg-muted/80 active:scale-95 transition-all outline-none group">
                    <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute top-1.5 right-1.5"
                            >
                                <Badge className="px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground border-2 border-background text-[10px] font-bold rounded-full">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </VaultTrigger>
            <VaultContent className="sm:max-w-md">
                <VaultHeader className="px-1">
                    <div className="flex items-center justify-between w-full">
                        <VaultTitle className="text-left">Notificações</VaultTitle>
                        {unreadCount > 0 && (
                            <button
                                className="text-xs text-primary font-medium hover:underline"
                                onClick={() => {
                                    // Marcar todas como lidas poderia vir aqui futuramente
                                }}
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>
                </VaultHeader>
                <VaultBody className="mt-4">
                    <div className="max-h-[65vh] overflow-y-auto no-scrollbar pb-6 px-1">
                        {notifications.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                    <Bell className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <h3 className="font-bold text-xl">Tudo em dia!</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-[240px]">
                                    Você não tem notificações pendentes agora.
                                    Aparecerão aqui novidades e alertas importantes.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {notifications.map((notif, index) => (
                                    <NotificationItem
                                        key={notif.id}
                                        notification={notif}
                                        index={index}
                                        onRead={() => handleMarkAsRead(notif.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </VaultBody>
            </VaultContent>
        </Vault>
    );
}

function NotificationItem({ notification, index, onRead }: { notification: Announcement & { isRead: boolean }, index: number, onRead: () => void }) {
    const icons = {
        info: <Info className="w-5 h-5 text-blue-500" />,
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        error: <XCircle className="w-5 h-5 text-destructive" />,
    };

    const bgColors = {
        info: "bg-blue-500/10",
        success: "bg-emerald-500/10",
        warning: "bg-amber-500/10",
        error: "bg-destructive/10",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
        >
            <Link
                href={notification.link || "#"}
                onClick={() => onRead()}
                className={cn(
                    "group flex gap-4 p-4 rounded-3xl transition-all relative overflow-hidden active:scale-[0.98]",
                    "hover:bg-muted/80",
                    !notification.isRead ? "bg-primary/5 dark:bg-primary/10" : "bg-transparent opacity-80"
                )}
            >
                {!notification.isRead && (
                    <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-primary" />
                )}

                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6",
                    bgColors[notification.type]
                )}>
                    {icons[notification.type]}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                            "text-[15px] font-bold truncate leading-none",
                            !notification.isRead ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {notification.title}
                        </h4>
                        <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap pt-0.5">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: false, locale: ptBR })}
                        </span>
                    </div>
                    <p className={cn(
                        "text-sm leading-relaxed mt-1.5 line-clamp-2",
                        !notification.isRead ? "text-foreground/80 font-medium" : "text-muted-foreground/80"
                    )}>
                        {notification.message}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}
