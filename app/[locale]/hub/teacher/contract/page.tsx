import { getCurrentUser } from "@/lib/auth-server";
import { contractService } from "@/modules/contract/contract.service";
import { ContractDetails } from "@/modules/contract/ContractDetails";
import { redirect } from "next/navigation";
import type { ContractWithTemplate } from "@/modules/contract/contract.types";
import { decrypt } from "@/lib/cryptography";

export default async function ContractPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  let latestContract = await contractService.getLatestContract(user.id);

  if (!latestContract) {
    try {
      await contractService.prepareOnboardingContract(user.id);
      latestContract = await contractService.getLatestContract(user.id);
    } catch (error) {
      console.error("[ContractPage] Error preparing onboarding contract:", error);
    }
  }

  const decryptedUser = {
    ...user,
    taxId: user.taxId && user.taxId.includes(":") ? decrypt(user.taxId) : user.taxId,
    businessTaxId: user.businessTaxId && user.businessTaxId.includes(":") ? decrypt(user.businessTaxId) : user.businessTaxId,
    pixKey: user.pixKey && user.pixKey.includes(":") ? decrypt(user.pixKey) : user.pixKey,
  };

  return (
    <ContractDetails contract={latestContract as ContractWithTemplate} user={decryptedUser} />
  );
}
