import { requireRole } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";
import { billingService } from "@/modules/billing/billing.service";
import { PaymentOverdueBanner } from "./_components/PaymentOverdueBanner";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(UserRoles.STUDENT);
  const paymentStatus = await billingService.getStudentPaymentStatus(user.id);
  const currentInstallment = paymentStatus?.currentInstallment;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isOverdue =
    currentInstallment?.status === "overdue" ||
    (currentInstallment?.status === "pending" &&
      new Date(currentInstallment.dueDate) < todayStart);

  return (
    <div className="flex flex-col min-h-full w-full">
      {isOverdue && <PaymentOverdueBanner />}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}
