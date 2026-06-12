import { getPlacementDashboardAction } from "@/modules/placement/placement.actions";
import { PlacementDashboard } from "./_components/PlacementDashboard";
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
        <PlacementDashboard initialData={data} user={user} />
    );
}
