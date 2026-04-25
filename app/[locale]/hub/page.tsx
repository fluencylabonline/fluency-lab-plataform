import { getCurrentUser } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default async function HubPage() {
    const user = await getCurrentUser();
    const roleRoutes = {
        [UserRoles.ADMIN]: "admin",
        [UserRoles.TEACHER]: "teacher",
        [UserRoles.STUDENT]: "student",
        [UserRoles.MANAGER]: "manager",
    };

    if (!user) {
        redirect(`/signin`);
    }

    // Redirecionar para onboarding se não tiver finalizado
    if (!user.onboarded && (user.role === UserRoles.STUDENT || user.role === UserRoles.TEACHER)) {
        redirect(`/onboarding`);
    }

    const route = roleRoutes[user.role];

    if (route) {
        redirect(`/hub/${route}/profile`);
    }

    redirect(`/hub/student/profile`);

    return <LoadingSpinner />;
}