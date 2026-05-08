import { getCurrentUser } from "@/lib/auth-server";
import { contractService } from "@/modules/contract/contract.service";
import { ContractDetails } from "./_components/ContractDetails";
import { redirect } from "next/navigation";
import type { ContractWithTemplate } from "@/modules/contract/contract.types";

export default async function ContractPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const latestContract = await contractService.getLatestContract(user.id);

  return <ContractDetails contract={latestContract as ContractWithTemplate} />;
}
