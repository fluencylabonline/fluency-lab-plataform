import React from "react";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/lib/auth-server";
import { billingService } from "@/modules/billing/billing.service";
import { PaymentHistory, type PaymentRecord } from "./_components/PaymentHistory";
import { redirect } from "next/navigation";

export default async function PaymentsPage() {
  const t = await getTranslations("Hub.Payments");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const payments = await billingService.getStudentPayments(user.id);

  return (
    <div>
      <Header title={t("title")} user={user} showSubHeader={false} backHref="/hub/student/profile" />

      <main className="container">
        <PaymentHistory initialData={payments as PaymentRecord[]} />
      </main>
    </div>
  );
}
