"use client";

import { Header } from "@/components/layout/header";
import { NotificationSettings } from "./NotificationSettings";
import { AppearanceSettings } from "@/modules/appearance/_components/AppearanceSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Bell, User, Shield } from "lucide-react";
import type { NotificationPrefs } from "@/modules/user/user.schema";

interface SettingsPageContentProps {
  initialNotificationPrefs: NotificationPrefs;
}

export function SettingsPageContent({ initialNotificationPrefs }: SettingsPageContentProps) {
  return (
    <div>
      <Header
        title="Configurações"
        subtitle="Gerencie sua conta e preferências"
        className="contents"
      />

      <div className="container">
        <Tabs defaultValue="appearance" className="w-full">
          <div className="overflow-x-auto pb-2 mb-4 scrollbar-none">
            <TabsList className="w-full justify-start md:w-fit bg-transparent gap-2 p-0 h-auto">
              <TabsTrigger 
                value="profile" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-xl border-none transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-xl border-none transition-all flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Aparência
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-xl border-none transition-all flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-active:bg-secondary/50 data-active:text-primary py-2 px-4 rounded-xl border-none transition-all flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Segurança
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="mt-0">
             <div className="p-12 border-2 border-dashed border-secondary rounded-3xl flex flex-col items-center justify-center text-center opacity-50 bg-secondary/10">
                <User className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="font-bold text-lg">Perfil Público</p>
                <p className="text-sm">Em breve você poderá editar sua bio, links e foto de perfil aqui.</p>
             </div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <AppearanceSettings />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <NotificationSettings initialPrefs={initialNotificationPrefs} />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
             <div className="p-12 border-2 border-dashed border-secondary rounded-3xl flex flex-col items-center justify-center text-center opacity-50 bg-secondary/10">
                <Shield className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="font-bold text-lg">Segurança & Privacidade</p>
                <p className="text-sm">Troca de senha, autenticação de dois fatores e sessões ativas.</p>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
