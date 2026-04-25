import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { OnboardingFlow } from "./_components/OnboardingFlow";

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
        <main className="w-full h-full min-h-screen">
            <OnboardingFlow user={user} />
        </main>
    );
}
