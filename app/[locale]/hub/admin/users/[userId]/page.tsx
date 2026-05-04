import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "@/modules/user/user.service";
import { contractService } from "@/modules/contract/contract.service";
import { billingService } from "@/modules/billing/billing.service";
import { callService } from "@/modules/call/call.service";
import { notFound } from "next/navigation";
import { UserDetailsClient } from "@/modules/user/_components/UserDetailsClient";
import { startOfMonth, endOfMonth } from "date-fns";
import { schedulingService } from "@/modules/scheduling/scheduling.service";

interface UserDetailsPageProps {
  params: Promise<{
    userId: string;
    locale: string;
  }>;
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  const { userId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return notFound();
  }

  const targetUser = await userService.getUserById(userId);
  if (!targetUser) {
    return notFound();
  }

  const [contracts, subscriptions, teacherClasses, callHistory] = await Promise.all([
    contractService.getMyContracts(userId),
    billingService.getSubscriptionsByStudent(userId),
    targetUser.role === "teacher"
      ? schedulingService.getTeacherCompletedClasses(userId, startOfMonth(new Date()), endOfMonth(new Date()))
      : Promise.resolve([]),
    callService.getStudentCallHistory(userId),
  ]);

  const activeSub = subscriptions.find(s => s.status === "active" || s.status === "pending_fee");
  const installments = activeSub
    ? await billingService.getInstallmentsBySubscriptionId(activeSub.id)
    : [];

  return (
    <UserDetailsClient
      user={targetUser}
      currentUser={user}
      contracts={contracts}
      subscriptions={subscriptions}
      activeSubscription={activeSub}
      installments={installments}
      teacherClasses={teacherClasses}
      callHistory={callHistory}
      basePath="/hub/admin/users"
      isAdmin={true}
    />
  );
}
