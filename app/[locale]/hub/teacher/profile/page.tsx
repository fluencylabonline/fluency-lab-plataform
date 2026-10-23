import { getCurrentUser } from "@/lib/auth-server";
import { ProfileCard } from "@/modules/user/_components/ProfileCard";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { payoutService } from "@/modules/payout/payout.service";
import { contractService } from "@/modules/contract/contract.service";
import {
    schedulingService,
    OVERDUE_WARNING_THRESHOLD,
    OVERDUE_BLOCK_THRESHOLD,
} from "@/modules/scheduling/scheduling.service";
import { OverdueClassesPanel } from "@/modules/scheduling/_components/OverdueClassesPanel";
import { PayoutSummary } from "./_components/PayoutSummary";
import { ContractBadge } from "./_components/ContractBadge";
import { DailyLessonsSummary } from "./_components/DailyLessonsSummary";
import { userService } from "@/modules/user/user.service";

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) redirect("/signin");
    if (!user.onboarded) redirect("/onboarding");

    // Parallel data fetching for performance
    const [payoutHistory, projections, activeContract, dailySummary, overdueClasses] = await Promise.all([
        payoutService.getTeacherPayoutHistory(user.id),
        payoutService.getEarningsProjections(user.id),
        contractService.getTeacherActiveContract(user.id),
        schedulingService.getTeacherDailySummary(user.id),
        schedulingService.getTeacherOverdueSlots(user.id),
    ]);

    // Muitas aulas atrasadas: o perfil mostra só o aviso até regularizar.
    if (overdueClasses.length >= OVERDUE_WARNING_THRESHOLD) {
        return (
            <div>
                <Header title="Perfil" className="contents" user={userService.toSessionDTO(user)} showSubHeader={false} />
                <main className="container min-h-[calc(100dvh-8rem)] flex items-center justify-center py-8 pb-24 md:pb-8">
                    <OverdueClassesPanel
                        classes={overdueClasses.map((c) => ({
                            id: c.id,
                            startAt: c.startAt.toISOString(),
                            studentName: c.student?.name ?? "Aluno",
                        }))}
                        blockThreshold={OVERDUE_BLOCK_THRESHOLD}
                    />
                </main>
            </div>
        );
    }

    return (
        <div>
            <Header title="Perfil" className="contents" user={userService.toSessionDTO(user)} showSubHeader={false} />
            <main className="container pt-8 pb-24 md:pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Basic Info & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <ProfileCard user={userService.toSessionDTO(user)} />
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