import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { Sidebar } from "@/components/layout/sidebar";
import { getSidebarItemsByRole } from "@/components/layout/navigations";

interface HubLayoutProps {
    children: React.ReactNode;
}

export default async function HubLayout({ children }: HubLayoutProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect(`/signin`);
    }

    if (!user.isActive) {
        redirect(`/signin?error=suspended`); // TODO: Implementar página de suspensão
    }

    const menuItems = getSidebarItemsByRole(user);

    return (
        <div className="flex h-dvh w-full overflow-hidden">
            <Sidebar items={menuItems} />
            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden lg:p-2 md:p-0 p-0">
                <div className="content-layout rounded-none lg:rounded-xl w-full h-full overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}