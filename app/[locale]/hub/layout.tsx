import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { Sidebar } from "@/components/layout/sidebar";
import { getSidebarItemsByRole } from "@/components/layout/navigations";
import { Metadata } from "next";
import { UserStoreInitializer } from "@/modules/user/_components/UserStoreInitializer";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata.hub" });
    return {
        title: t("title"),
    };
}

interface HubLayoutProps {
    children: React.ReactNode;
}

export default async function HubLayout({ children }: HubLayoutProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect(`/signin`);
    }

    if (!user.isActive) {
        redirect(`/suspended`);
    }

    if (user.cancellationPending) {
        redirect(`/pending-cancellation`);
    }

    if (user.role === "student" && !user.onboarded) {
        redirect(`/onboarding`);
    }

    const menuItems = getSidebarItemsByRole(user);

    return (
        <div className="flex h-dvh w-full overflow-hidden">
            <UserStoreInitializer user={user} />
            <Sidebar items={menuItems} />
            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden lg:p-2 md:p-0 p-0">
                <div className="content-layout rounded-none lg:rounded-xl w-full h-full overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}