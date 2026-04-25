import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { OnboardingWizard } from "./_components/OnboardingWizard";

export default async function OnboardingPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/signin");
    }

    if (user.role !== "student") {
        redirect("/hub");
    }

    if (user.onboarded) {
        redirect("/hub");
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
            <OnboardingWizard user={user} />
        </div>
    );
}
