import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/lib/auth-server";
import { contractService } from "@/modules/contract/contract.service";
import { ContractDetails } from "./_components/ContractDetails";
import { redirect } from "next/navigation";
import type { ContractWithTemplate } from "@/modules/contract/contract.types";

export default async function ContractPage() {
  const t = await getTranslations("Hub.Contract");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const latestContract = await contractService.getLatestContract(user.id);

  return (
    <div>
      <Header title={t("title")} user={user} showSubHeader={false} backHref="/hub/student/profile" />

      <main className="container">
        <ContractDetails contract={latestContract as ContractWithTemplate} />
      </main>
    </div>
  );
}
