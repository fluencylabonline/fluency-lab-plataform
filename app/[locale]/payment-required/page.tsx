import { getCurrentUser } from "@/lib/auth-server";
import { billingService } from "@/modules/billing/billing.service";
import { redirect } from "next/navigation";
import { PaymentRequiredContent } from "./_components/PaymentRequiredContent";
import { PaymentInfoUnavailable } from "./_components/PaymentInfoUnavailable";

// Aluno bloqueado por inadimplência só enxerga esta página (o redirect vem do
// layout do hub). Fica fora de /hub, sem sidebar nem navegação.
export default async function PaymentRequiredPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "student") redirect("/hub");

  let info: Awaited<ReturnType<typeof billingService.getBlockedPaymentInfo>>;
  try {
    info = await billingService.getBlockedPaymentInfo(user.id);
  } catch (error) {
    // Falha ao consultar/gerar a cobrança não pode derrubar a página inteira.
    console.error("[PaymentRequiredPage] getBlockedPaymentInfo failed:", error);
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <PaymentInfoUnavailable />
      </main>
    );
  }
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
