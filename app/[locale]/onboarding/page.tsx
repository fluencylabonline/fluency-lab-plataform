import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { OnboardingFlow } from "./_components/OnboardingFlow";
import { TeacherOnboardingFlow } from "./_components/TeacherOnboardingFlow";
import { contractService } from "@/modules/contract/contract.service";
import { userService } from "@/modules/user/user.service";

export default async function OnboardingPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/signin");
    }

    if (user.role !== "student" && user.role !== "teacher") {
        redirect("/hub");
    }

    if (user.onboarded) {
        redirect("/hub");
    }

    const schoolSettings = await contractService.getSchoolSettings();

    // Dados que aparecem no corpo do contrato. O preview precisa mostrar
    // exatamente o que será assinado.
    const schoolInfo = await contractService.getContractSchoolInfo();

    // PII descriptografada e endereço achatado — o usuário cru mostraria
    // ciphertext nos campos de quem volta uma etapa.
    const profile = await userService.getOnboardingProfile(user.id);

    return (
        <main className="w-full h-full min-h-screen">
            {user.role === "teacher" ? (
                <TeacherOnboardingFlow user={user} schoolInfo={schoolInfo} />
            ) : (
                <OnboardingFlow
                    user={user}
                    initialProfile={profile ?? user}
                    schoolSettings={schoolSettings || null}
                    schoolInfo={schoolInfo}
                />
            )}
        </main>
    );
}
