import { getPlacementDashboardAction } from "@/modules/placement/placement.actions";
import { PlacementDashboard } from "./_components/PlacementDashboard";
import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function PlacementPage() {
    const user = await getCurrentUser();
    const result = await getPlacementDashboardAction();
    const data = result?.data || { 
        history: [], 
        activeTests: [], 
        availableLanguages: [],
        eligibility: {
            isEligible: true,
            nextEligibleDate: null,
            lastTestDate: null
        }
    };

    if (!user) redirect(`/signin`);

    return (
        <div className="flex flex-col flex-1">
            <Header
                title="Placement Test"
                subtitle="Evaluate your level and track your progress"
                user={user}
            />
            <main className="flex-1 p-4 md:p-8">
                <PlacementDashboard initialData={data} />
            </main>
        </div>
    );
}
