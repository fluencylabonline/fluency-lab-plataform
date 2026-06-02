import { getCurrentUser } from "@/lib/auth-server";
import { ProfileCard } from "@/modules/user/_components/ProfileCard";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { payoutService } from "@/modules/payout/payout.service";
import { contractService } from "@/modules/contract/contract.service";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { PayoutSummary } from "./_components/PayoutSummary";
import { ContractBadge } from "./_components/ContractBadge";
import { DailyLessonsSummary } from "./_components/DailyLessonsSummary";

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) redirect("/signin");
    if (!user.onboarded) redirect("/onboarding");

    // Parallel data fetching for performance
    const [payoutHistory, projections, activeContract, dailySummary] = await Promise.all([
        payoutService.getTeacherPayoutHistory(user.id),
        payoutService.getEarningsProjections(user.id),
        contractService.getTeacherActiveContract(user.id),
        schedulingService.getTeacherDailySummary(user.id),
    ]);

    return (
        <div>
            <header>
                <Header title="Perfil" user={user} showSubHeader={false} />
            </header>
            <main className="container py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Basic Info & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <ProfileCard user={user} />
                        <ContractBadge contract={activeContract} />
                        <DailyLessonsSummary lessons={dailySummary} />
                    </div>

                    {/* Right Column: Financial History */}
                    <div className="lg:col-span-2">
                        <PayoutSummary
                            history={payoutHistory}
                            projections={projections}
                            teacherId={user.id}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}