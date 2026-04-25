import { billingRepository } from "@/modules/billing/billing.repository";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { PlansPageClient } from "./_components/PlansPageClient";

export default async function AdminPlansPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/signin");
  }

  const plans = await billingRepository.listAllPlans();

  return (
    <PlansPageClient
      initialPlans={plans}
      user={{
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role
      }}
    />
  );
}
