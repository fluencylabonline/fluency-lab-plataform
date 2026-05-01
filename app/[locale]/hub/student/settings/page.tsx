import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "@/modules/user/user.service";
import { redirect } from "next/navigation";
import { NotificationSettings } from "@/modules/user/_components/NotificationSettings";
import { Header } from "@/components/layout/header";
import type { NotificationPrefs } from "@/modules/user/user.schema";

export default async function SettingsPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await userService.getUser(sessionUser.id);
  if (!user) return <div>Usuário não encontrado</div>;

  // Cast because jsonb might return unknown
  const prefs = (user.notificationPrefs as NotificationPrefs) || {
    streak: true,
    roadmap: true,
    classes: true,
    marketing: false,
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto">
      <Header 
        title="Configurações" 
        subtitle="Gerencie sua conta e preferências"
      />
      
      <div className="space-y-8">
        <NotificationSettings initialPrefs={prefs} />
        
        {/* Placeholder for other settings */}
        <div className="p-8 border-2 border-dashed border-secondary rounded-3xl flex flex-col items-center justify-center text-center opacity-50">
          <p className="font-bold">Mais configurações em breve</p>
          <p className="text-sm">Segurança, Idioma e Perfil Público</p>
        </div>
      </div>
    </div>
  );
}
