import { getPlacementDashboardAction } from "@/modules/placement/placement.actions";
import { PlacementDashboard } from "./_components/PlacementDashboard";
import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

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

    const t = await getTranslations("Placement");

    return (
        <div className="flex flex-col flex-1">
            <Header
                title={t("title")}
                subtitle={t("subtitle")}
                user={user}
                backHref="/hub/student/profile"
            />
            <main className="flex-1 p-4 md:p-8">
                <PlacementDashboard initialData={data} />
            </main>
        </div>
    );
}
