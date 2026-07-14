import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { communicationService } from "@/modules/communication/communication.service";
import { notificationService } from "@/modules/notification/notification.service";
import { CommunicationDashboard } from "./_components/CommunicationDashboard";

export default async function AdminCommunicationPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/signin");
  }

  const [templates, history, emails] = await Promise.all([
    communicationService.getWhatsAppTemplates(),
    notificationService.getGlobalHistory(),
    communicationService.getEmails(),
  ]);

  return (
    <CommunicationDashboard
      initialTemplates={templates}
      initialHistory={history}
      initialEmails={emails}
      user={user}
    />
  );
}