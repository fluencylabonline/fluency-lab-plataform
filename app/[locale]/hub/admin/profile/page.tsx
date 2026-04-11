import { getCurrentUser } from "@/lib/auth-server";
import { ProfileCard } from "@/modules/user/_components/ProfileCard";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function ProfilePage() {
    const user = await getCurrentUser();
    const locale = await getLocale();

    if (!user) redirect(`/${locale}/signin`);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <ProfileCard user={user} />
        </div>
    );
}