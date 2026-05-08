"use client";

import { useTransition } from "react";
import { updateNotificationPrefsAction } from "@/modules/user/user.actions";
import { notify } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";
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
    <div className="card p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{tc("notifications")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("notificationsDesc")}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-orange-500" />
              {t("notifications.streak")}
            </div>
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
            <div className="flex items-center gap-2 font-bold">
              <MapIcon className="w-4 h-4 text-green-500" />
              {t("notifications.roadmap")}
            </div>
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
            <div className="flex items-center gap-2 font-bold">
              <Calendar className="w-4 h-4 text-blue-500" />
              {t("notifications.classes")}
            </div>
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
            <div className="flex items-center gap-2 font-bold">
              <Megaphone className="w-4 h-4 text-purple-500" />
              {t("notifications.marketing")}
            </div>
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
      </div>
    </div>
  );
}
