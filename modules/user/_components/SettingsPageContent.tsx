"use client";

import { Header } from "@/components/layout/header";
import { NotificationSettings } from "./NotificationSettings";
import { SecuritySettings } from "./SecuritySettings";
import { AccountSettings } from "./AccountSettings";
import { AppearanceSettings } from "@/modules/appearance/_components/AppearanceSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Bell, User, Shield, Smartphone } from "lucide-react";
import { AppSettings } from "./AppSettings";
import type { NotificationPrefs, User as UserType } from "@/modules/user/user.schema";
import { useTranslations } from "next-intl";

interface SettingsPageContentProps {
  initialData: {
    user: UserType;
    emailVerified: boolean;
    initialNotificationPrefs: NotificationPrefs;
    hasPassword: boolean;
  };
}

export function SettingsPageContent({ initialData }: SettingsPageContentProps) {
  const t = useTranslations("Settings");
  const tc = useTranslations("Common");

  return (
    <div>
      <Header
        title={tc("settings")}
        subtitle={t("subtitle")}
        className="contents"
      />

      <div className="container">
        <Tabs defaultValue="account" className="w-full">
          <div className="overflow-x-auto pb-2 mb-4 scrollbar-none">
            <TabsList className="w-full justify-start md:w-fit bg-transparent gap-2 p-0 h-auto">
              <TabsTrigger 
                value="account" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-md border-none transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {tc("account")}
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-md border-none transition-all flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                {tc("appearance")}
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-md border-none transition-all flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {tc("notifications")}
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-md border-none transition-all flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {t("security")}
              </TabsTrigger>
              <TabsTrigger 
                value="app" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-md border-none transition-all flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                {t("app")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="account" className="mt-0">
             <AccountSettings 
                initialData={{
                  user: initialData.user,
                  emailVerified: initialData.emailVerified
                }} 
             />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <AppearanceSettings />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <NotificationSettings initialPrefs={initialData.initialNotificationPrefs} />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
             <SecuritySettings hasPassword={initialData.hasPassword} />
          </TabsContent>

          <TabsContent value="app" className="mt-0">
            <AppSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
