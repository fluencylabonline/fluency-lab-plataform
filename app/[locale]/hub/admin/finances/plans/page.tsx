import { billingRepository } from "@/modules/billing/billing.repository";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { PlansPageClient } from "./_components/PlansPageClient";

export default async function AdminPlansPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/signin");
  }

  const [plans, languages] = await Promise.all([
    billingRepository.listAllPlans(),
    curriculumService.findAllLanguages(),
  ]);

  return (
    <PlansPageClient
      initialPlans={plans}
      languages={languages}
      user={{
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role
      }}
    />
  );
}
