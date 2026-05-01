"use client";

import { useTransition } from "react";
import { updateNotificationPrefsAction } from "@/modules/user/user.actions";
import { notify } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Zap, Map as MapIcon, Calendar, Megaphone } from "lucide-react";
import type { NotificationPrefs } from "@/modules/user/user.schema";

interface NotificationSettingsProps {
  initialPrefs: NotificationPrefs;
}

export function NotificationSettings({ initialPrefs }: NotificationSettingsProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (key: keyof typeof initialPrefs, value: boolean) => {
    startTransition(async () => {
      const newPrefs = { ...initialPrefs, [key]: value };
      const result = await updateNotificationPrefsAction(newPrefs);
      
      if (result?.data?.success) {
        notify.success("Configurações atualizadas!");
      } else {
        notify.error("Erro ao atualizar configurações.");
      }
    });
  };

  return (
    <Card className="border-none bg-secondary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notificações
        </CardTitle>
        <CardDescription>
          Escolha quais lembretes e alertas você deseja receber.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label className="flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-orange-500" />
              Lembretes de Streak
            </Label>
            <span className="text-sm text-muted-foreground">
              Avisar quando sua ofensiva estiver em risco (após as 20h).
            </span>
          </div>
          <Switch
            checked={initialPrefs.streak}
            onCheckedChange={(val) => handleToggle("streak", val)}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label className="flex items-center gap-2 font-bold">
              <MapIcon className="w-4 h-4 text-green-500" />
              Alertas de Roadmap
            </Label>
            <span className="text-sm text-muted-foreground">
              Avisar quando houver novas lições disponíveis ou atrasadas.
            </span>
          </div>
          <Switch
            checked={initialPrefs.roadmap}
            onCheckedChange={(val) => handleToggle("roadmap", val)}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label className="flex items-center gap-2 font-bold">
              <Calendar className="w-4 h-4 text-blue-500" />
              Aulas e Agendamentos
            </Label>
            <span className="text-sm text-muted-foreground">
              Lembretes de aulas marcadas e confirmações.
            </span>
          </div>
          <Switch
            checked={initialPrefs.classes}
            onCheckedChange={(val) => handleToggle("classes", val)}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label className="flex items-center gap-2 font-bold">
              <Megaphone className="w-4 h-4 text-purple-500" />
              Novidades e Promoções
            </Label>
            <span className="text-sm text-muted-foreground">
              Fique por dentro de novos recursos e ofertas especiais.
            </span>
          </div>
          <Switch
            checked={initialPrefs.marketing}
            onCheckedChange={(val) => handleToggle("marketing", val)}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
