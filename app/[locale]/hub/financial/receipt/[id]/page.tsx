import { getCurrentUser } from "@/lib/auth-server";
import { billingService } from "@/modules/billing/billing.service";
import { ReceiptView, type Receipt } from "./_components/ReceiptView";
import { redirect, notFound } from "next/navigation";
import { pageTitle } from "@/lib/page-metadata";

export const generateMetadata = pageTitle("receipt");

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const paymentDetails = await billingService.getPaymentDetailsForReceipt(id);

  if (!paymentDetails) {
    notFound();
  }

  if (user.role !== "admin" && paymentDetails.studentEmail !== user.email) {
    redirect("/hub/student/profile");
  }

  return (
    <ReceiptView payment={paymentDetails as Receipt} />
  );
}
