"use client";

import { useTransition } from "react";
import { updateNotificationPrefsAction } from "@/modules/user/user.actions";
import { notify } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Zap, Map as MapIcon, Calendar, Megaphone } from "lucide-react";
import type { NotificationPrefs } from "@/modules/user/user.schema";
import { useTranslations } from "next-intl";

interface NotificationSettingsProps {
  initialPrefs: NotificationPrefs;
}

export function NotificationSettings({ initialPrefs }: NotificationSettingsProps) {
  const t = useTranslations("Settings");
  const tc = useTranslations("Common");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (key: keyof typeof initialPrefs, value: boolean) => {
    startTransition(async () => {
      const newPrefs = { ...initialPrefs, [key]: value };
      const result = await updateNotificationPrefsAction(newPrefs);
      
      if (result?.data?.success) {
        notify.success(tc("success"));
      } else {
        notify.error(tc("error"));
      }
    });
  };

  return (
    <Card className="border-none bg-secondary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          {tc("notifications")}
        </CardTitle>
        <CardDescription>
          {t("notificationsDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label className="flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-orange-500" />
              {t("notifications.streak")}
            </Label>
            <span className="text-sm text-muted-foreground">
              {t("notifications.streakDesc")}
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
              {t("notifications.roadmap")}
            </Label>
            <span className="text-sm text-muted-foreground">
              {t("notifications.roadmapDesc")}
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
              {t("notifications.classes")}
            </Label>
            <span className="text-sm text-muted-foreground">
              {t("notifications.classesDesc")}
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
              {t("notifications.marketing")}
            </Label>
            <span className="text-sm text-muted-foreground">
              {t("notifications.marketingDesc")}
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
