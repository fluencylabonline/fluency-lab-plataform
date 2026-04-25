import { getCurrentUser } from "@/lib/auth-server";
import { ProfileCard } from "@/modules/user/_components/ProfileCard";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) redirect("/signin");
    if (!user.onboarded) redirect("/onboarding");

    return (
        <div>
            <header>
                <Header title="Perfil" user={user} showSubHeader={false} />
            </header>
            <main className="container">
                <ProfileCard user={user} />
            </main>
        </div>
    );
}