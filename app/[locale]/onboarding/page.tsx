import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { OnboardingFlow } from "./_components/OnboardingFlow";
import { TeacherOnboardingFlow } from "./_components/TeacherOnboardingFlow";

export default async function OnboardingPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/signin");
    }

    // Permitir apenas alunos e professores no onboarding
    if (user.role !== "student" && user.role !== "teacher") {
        redirect("/hub");
    }

    if (user.onboarded) {
        redirect("/hub");
    }

    return (
        <main className="w-full h-full min-h-screen">
            {user.role === "teacher" ? (
                <TeacherOnboardingFlow user={user} />
            ) : (
                <OnboardingFlow user={user} />
            )}
        </main>
    );
}
