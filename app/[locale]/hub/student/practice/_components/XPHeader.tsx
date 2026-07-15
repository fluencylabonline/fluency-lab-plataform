"use client";

import { useTransition } from "react";
import { Flame, Trophy, Bell, BellOff, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toggleNotificationAction } from "@/modules/user/user.actions";
import { saveSubscriptionAction } from "@/modules/notification/notification.actions";
import { notify } from "@/components/ui/toaster";
import { env } from "@/env";

interface XPHeaderProps {
  user: {
    name: string;
    photoUrl?: string | null;
    currentXP: number;
    streakCount: number;
    pushNotificationsEnabled: boolean;
  };
}

export function XPHeader({ user }: XPHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleNotifications = () => {
    startTransition(async () => {
      const nextState = !user.pushNotificationsEnabled;

      // 1. If enabling, try to subscribe in browser first
      if (nextState) {
        try {
          if (!("Notification" in window)) {
            notify.error("Seu navegador não suporta notificações");
            return;
          }

          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            notify.error("Você precisa permitir notificações no navegador");
            return;
          }

          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });

          await saveSubscriptionAction({ subscription });
        } catch (error) {
          console.error("[Push] Subscription error:", error);
          notify.error("Erro ao configurar notificações no navegador");
          return;
        }
      }

      // 2. Update preference in DB
      const result = await toggleNotificationAction({
        type: "push",
        enabled: nextState,
      });

      if (result?.data) {
        notify.success(
          nextState 
            ? "Notificações ativadas com sucesso!"
            : "Notificações desativadas"
        );
      } else {
        notify.error("Erro ao atualizar preferências");
      }
    });
  };

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-4 border-background shadow-sm">
            <AvatarImage src={user.photoUrl || undefined} />
            <AvatarFallback name={user.name} className="bg-primary text-primary-foreground font-black text-xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-black text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">Estudante FluencyLab</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full h-10 w-10 relative"
          onClick={handleToggleNotifications}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : user.pushNotificationsEnabled ? (
            <Bell className="w-5 h-5 text-primary fill-primary/10" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 bg-orange-500/10 p-4 rounded-md border border-orange-500/20">
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <span className="block text-2xl font-black text-orange-600 leading-none">
              {user.streakCount}
            </span>
            <span className="text-[10px] font-bold uppercase text-orange-600/70 tracking-wider">
              Dias de Ofensiva
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-primary/10 p-4 rounded-md border border-primary/20">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="block text-2xl font-black text-primary leading-none">
              {user.currentXP}
            </span>
            <span className="text-[10px] font-bold uppercase text-primary/70 tracking-wider">
              Pontos de XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
