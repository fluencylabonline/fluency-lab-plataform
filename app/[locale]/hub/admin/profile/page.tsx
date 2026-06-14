import { getCurrentUser } from "@/lib/auth-server";
import { ProfileCard } from "@/modules/user/_components/ProfileCard";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";

export default async function ProfilePage() {
    const user = await getCurrentUser();
    const locale = await getLocale();

    if (!user) redirect(`/${locale}/signin`);

    return (
        <div>
            <header>
                <Header title="Perfil" user={user} showSubHeader={false} className="contents" />
            </header>
            <main className="container">
                <ProfileCard user={user} />
            </main>
        </div>
    );
}