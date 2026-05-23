import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { WhatsAppChat } from "@/modules/communication/_components/WhatsAppChat";

export default async function AdminConversasPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/signin");
  }

  return <WhatsAppChat />;
}
