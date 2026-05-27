import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { WhatsAppChat } from "@/modules/communication/_components/WhatsAppChat";
import { userService } from "@/modules/user/user.service";

export default async function ManagerConversasPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") {
    redirect("/signin");
  }

  const sanitizedUser = userService.sanitizeUserForSettings(user);

  return <WhatsAppChat currentUser={sanitizedUser} />;
}
