import { getCurrentUser } from "@/lib/auth-server";
import { billingService } from "@/modules/billing/billing.service";
import { redirect } from "next/navigation";
import { PaymentRequiredContent } from "./_components/PaymentRequiredContent";

// Aluno bloqueado por inadimplência só enxerga esta página (o redirect vem do
// layout do hub). Fica fora de /hub, sem sidebar nem navegação.
export default async function PaymentRequiredPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "student") redirect("/hub");

  const info = await billingService.getBlockedPaymentInfo(user.id);
  if (!info) redirect("/hub");

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <PaymentRequiredContent
        info={{
          ...info,
          dueDate: new Date(info.dueDate).toISOString(),
          paymentExpiresAt: info.paymentExpiresAt ? new Date(info.paymentExpiresAt).toISOString() : null,
        }}
      />
    </main>
  );
}
