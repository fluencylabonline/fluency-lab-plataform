import { ContractsDashboard } from "./_components/ContractsDashboard";
import { contractService } from "@/modules/contract/contract.service";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function AdminContractsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/signin");
  }

  const [templates, instances, schoolSettings] = await Promise.all([
    contractService.getAllTemplates(),
    contractService.getAllInstances(),
    contractService.getSchoolSettings(),
  ]);

  return (
    <ContractsDashboard
      user={user}
      initialTemplates={templates}
      initialInstances={instances}
      initialSchoolSettings={schoolSettings || null}
    />
  );
}
