import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { communicationService } from "@/modules/communication/communication.service";
import { notificationService } from "@/modules/notification/notification.service";
import { CommunicationDashboard } from "./_components/CommunicationDashboard";
import { Header } from "@/components/layout/header";

export default async function AdminCommunicationPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/signin");
  }

  // Busca dados iniciais para hidratação (Sanduíche: Server Read)
  const [templates, history] = await Promise.all([
    communicationService.getWhatsAppTemplates(),
    notificationService.getGlobalHistory(),
  ]);

  return (
    <div>
      <Header
        title="Comunicação"
        subtitle="Gerencie notificações e templates do WhatsApp"
        user={user}
        className="contents"
      />
      <main className="container">
        <CommunicationDashboard
          initialTemplates={templates}
          initialHistory={history}
        />
      </main>
    </div>
  );
}